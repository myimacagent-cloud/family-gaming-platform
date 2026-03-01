import type { ClientMessage, ServerMessage, PublicPlayer, InternalPlayer, RoomState } from './types/messages';
import { GRACE_PERIOD_MS } from './types/messages';
import { getGame } from './games/registry';
import type { GameDefinition, BaseGameState } from './games/types';

interface InternalRoomState {
  roomCode: string;
  gameType: string;
  players: InternalPlayer[];
  status: 'waiting' | 'active' | 'finished' | 'draw';
  winner: string | null;
  currentPlayerIndex: number;
  gameData: unknown;
  createdAt: number;
  lastActivityTs: number;
}

export class GameRoom {
  private state: DurableObjectState;
  private roomState: InternalRoomState;
  private connections: Map<string, WebSocket> = new Map();

  constructor(state: DurableObjectState, _env: unknown) {
    this.state = state;
    // Note: In actual DO, storage is async. For now, sync init with empty state
    // The real state will be loaded on first request via getPublicState
    this.roomState = {
      roomCode: '',
      gameType: '',
      players: [],
      status: 'waiting',
      winner: null,
      currentPlayerIndex: 0,
      gameData: null,
      createdAt: Date.now(),
      lastActivityTs: Date.now(),
    };
  }

  async initializeFromStorage(): Promise<void> {
    const stored = await this.state.storage.get<InternalRoomState>('roomState');
    if (stored) {
      this.roomState = stored;
    }
  }

  getGameDefinition(): GameDefinition | null {
    if (!this.roomState.gameType) return null;
    return getGame(this.roomState.gameType) || null;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/websocket') {
      return this.handleWebSocketUpgrade(request, url);
    }
    if (url.pathname === '/api/status') {
      return new Response(JSON.stringify(this.getPublicState()), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response('Not Found', { status: 404 });
  }

  private async handleWebSocketUpgrade(request: Request, url: URL): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', { status: 400 });
    }
    const roomCode = url.searchParams.get('room');
    if (!roomCode) {
      return new Response('Room code required', { status: 400 });
    }
    
    const [client, server] = Object.values(new WebSocketPair());
    const wsId = crypto.randomUUID();
    await this.handleWebSocket(server, wsId);
    return new Response(null, { status: 101, webSocket: client });
  }

  private async handleWebSocket(ws: WebSocket, wsId: string): Promise<void> {
    ws.accept();
    this.connections.set(wsId, ws);
    
    ws.addEventListener('message', async (event) => {
      try {
        const message = JSON.parse(event.data as string) as ClientMessage;
        await this.handleMessage(wsId, ws, message);
      } catch (_err) {
        this.sendToClient(ws, { type: 'error', code: 'PARSE_ERROR', message: 'Invalid message format' });
      }
    });
    
    ws.addEventListener('close', () => this.handleDisconnect(wsId));
    ws.addEventListener('error', () => this.handleDisconnect(wsId));
  }

  private async handleMessage(wsId: string, ws: WebSocket, message: ClientMessage): Promise<void> {
    this.roomState.lastActivityTs = Date.now();
    
    switch (message.type) {
      case 'join_room':
        await this.handleJoinRoom(wsId, ws, message);
        break;
      case 'make_move':
        await this.handleMove(wsId, message);
        break;
      case 'restart_game':
        await this.handleRestart(wsId, message);
        break;
      case 'request_state':
        this.sendToClient(ws, { type: 'state_sync', state: this.getPublicState() });
        break;
      case 'ping':
        this.sendToClient(ws, { type: 'pong' });
        break;
    }
  }

  private getPublicState(): RoomState {
    // Merge gameData properties into the state for direct access
    // Destructure to exclude conflicting properties (players, gameType, etc.)
    const gameData = (this.roomState.gameData as Record<string, unknown>) || {};
    const { players: _players, gameType: _gameType, status: _status, winner: _winner, currentPlayerIndex: _currentPlayerIndex, ...gameSpecificData } = gameData;

    return {
      roomCode: this.roomState.roomCode,
      gameType: this.roomState.gameType,
      players: this.roomState.players.map(p => ({
        userId: p.userId,
        displayName: p.displayName,
        symbol: p.symbol,
        connected: p.connected,
      })),
      status: this.roomState.status,
      winner: this.roomState.winner,
      currentPlayerIndex: this.roomState.currentPlayerIndex,
      gameData: this.roomState.gameData,
      // Spread game-specific properties for direct access (excluding room-level properties)
      ...gameSpecificData,
    } as RoomState;
  }

  private sendToClient(ws: WebSocket, message: ServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private broadcastMessage(message: ServerMessage): void {
    const json = JSON.stringify(message);
    for (const [_, ws] of this.connections) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(json);
      }
    }
  }

  private broadcastStateSync(): void {
    this.broadcastMessage({ type: 'state_sync', state: this.getPublicState() });
  }

  private async persistState(): Promise<void> {
    await this.state.storage.put('roomState', this.roomState);
  }

  private async handleJoinRoom(
    wsId: string,
    ws: WebSocket,
    { userId, displayName, roomCode, gameType }: 
    { userId: string; displayName: string; roomCode: string; gameType?: string }
  ): Promise<void> {
    // Check if player already exists (reconnecting)
    const existingPlayer = this.roomState.players.find(p => p.userId === userId);
    if (existingPlayer) {
      existingPlayer.connected = true;
      existingPlayer.ws = ws;
      existingPlayer.wsId = wsId;
      existingPlayer.disconnectedAt = null;
      this.connections.set(wsId, ws);
      
      this.sendToClient(ws, {
        type: 'joined',
        success: true,
        symbol: existingPlayer.symbol,
        roomCode
      });
      this.broadcastStateSync();
      return;
    }

    // Check room capacity
    const activePlayers = this.roomState.players.filter(p => 
      p.connected || (p.disconnectedAt && Date.now() - p.disconnectedAt < GRACE_PERIOD_MS)
    );
    
    const gameDef = this.getGameDefinition();
    const maxPlayers = gameDef?.maxPlayers || 2;
    
    if (activePlayers.length >= maxPlayers) {
      this.sendToClient(ws, { type: 'room_full', message: 'Room is full' });
      return;
    }

    // Initialize game type if this is the first player creating the room
    if (!this.roomState.gameType && gameType) {
      const def = getGame(gameType);
      if (!def) {
        this.sendToClient(ws, { type: 'error', code: 'INVALID_GAME', message: 'Unknown game type' });
        return;
      }
      this.roomState.gameType = gameType;
      this.roomState.gameData = def.createInitialState(roomCode);
    }

    // Assign room code if not set
    if (!this.roomState.roomCode) {
      this.roomState.roomCode = roomCode;
    }

    // Assign symbol to new player
    const symbols = ['X', 'O', 'A', 'B', 'C'];
    const playerIndex = this.roomState.players.length;
    const symbol = symbols[playerIndex] || String.fromCharCode(65 + playerIndex);
    
    const newPlayer: InternalPlayer = {
      userId,
      displayName,
      symbol,
      connected: true,
      ws,
      wsId,
      disconnectedAt: null,
    };
    
    this.roomState.players.push(newPlayer);
    this.connections.set(wsId, ws);

    // Start game if we have enough players
    const currentGameDef = this.getGameDefinition();
    const minPlayers = currentGameDef?.minPlayers || 2;
    const connectedCount = this.roomState.players.filter(p => p.connected).length;
    
    if (connectedCount >= minPlayers && this.roomState.status === 'waiting') {
      this.roomState.status = 'active';
    }

    this.sendToClient(ws, {
      type: 'joined',
      success: true,
      symbol,
      roomCode,
      gameType: this.roomState.gameType
    });
    
    this.broadcastStateSync();
    await this.persistState();
  }

  private async handleMove(
    _wsId: string,
    { userId, move }: { userId: string; move: unknown }
  ): Promise<void> {    const player = this.roomState.players.find(p => p.userId === userId);
    if (!player?.ws) return;

    const gameDef = this.getGameDefinition();
    if (!gameDef) {
      this.sendToClient(player.ws, { type: 'error', code: 'NO_GAME', message: 'No game initialized' });
      return;
    }

    const validation = gameDef.validateMove(
      this.roomState.gameData as BaseGameState,
      move,
      player.symbol
    );

    if (!validation.valid) {
      this.sendToClient(player.ws, { type: 'error', code: 'INVALID_MOVE', message: validation.error || 'Invalid move' });
      return;
    }

    const newGameData = gameDef.applyMove(
      this.roomState.gameData as BaseGameState,
      move,
      player.symbol
    );

    this.roomState.gameData = newGameData;
    this.roomState.currentPlayerIndex = (this.roomState.currentPlayerIndex + 1) % this.roomState.players.length;

    const gameEnd = gameDef.checkGameEnd(newGameData);
    if (gameEnd.ended) {
      this.roomState.status = gameEnd.draw ? 'draw' : 'finished';
      this.roomState.winner = gameEnd.winner;
    }

    this.broadcastMessage({ type: 'move_applied', state: this.getPublicState() });
    await this.persistState();
  }

  private async handleRestart(_wsId: string, { userId }: { userId: string }): Promise<void> {
    const player = this.roomState.players.find(p => p.userId === userId);
    if (!player) return;

    const gameDef = this.getGameDefinition();
    if (!gameDef) return;

    this.roomState.gameData = gameDef.createRestartState(this.roomState.gameData as BaseGameState);
    this.roomState.status = 'active';
    this.roomState.winner = null;
    this.roomState.currentPlayerIndex = 0;

    this.broadcastStateSync();
    await this.persistState();
  }

  private handleDisconnect(wsId: string): void {
    const player = this.roomState.players.find(p => p.wsId === wsId);
    if (player) {
      player.connected = false;
      player.disconnectedAt = Date.now();
      player.ws = null;
      player.wsId = null;
    }
    this.connections.delete(wsId);
    this.broadcastStateSync();
  }
}
