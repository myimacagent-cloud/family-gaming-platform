import type { ClientMessage, ServerMessage, PublicPlayer, InternalPlayer, RoomState } from './types/messages';
import { GRACE_PERIOD_MS } from './types/messages';
import { gameRegistry, getGame } from './games/registry';
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
  private heartbeatTimer: number | null = null;

  constructor(state: DurableObjectState, _env: unknown) {
    this.state = state;
    const existing = this.state.storage.get<InternalRoomState>('roomState');
    this.roomState = existing || {
      roomCode: '', gameType: '', players: [], status: 'waiting', winner: null,
      currentPlayerIndex: 0, gameData: null, createdAt: Date.now(), lastActivityTs: Date.now(),
    };
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

  private async handleJoinRoom(
    wsId: string,
    ws: WebSocket,
    { userId, displayName, roomCode, gameType }: { userId: string; displayName: string; roomCode: string; gameType?: string }
  ): Promise<void> {
    const existingPlayer = this.roomState.players.find(p => p.userId === userId);

    if (existingPlayer) {
      existingPlayer.connected = true;
      existingPlayer.ws = ws;
      existingPlayer.wsId = wsId;
      existingPlayer.disconnectedAt = null;
      this.connections.set(wsId, ws);
      this.sendToClient(ws, { type: 'joined', success: true, symbol: existingPlayer.symbol, roomCode });
      this.broadcastStateSync();
      return;
    }

    const activePlayers = this.roomState.players.filter(p =>
      p.connected || (p.disconnectedAt && Date.now() - p.disconnectedAt < GRACE_PERIOD_MS)
    );

    const gameDef = this.getGameDefinition();
    const maxPlayers = gameDef?.maxPlayers || 2;

    if (activePlayers.length >= maxPlayers) {
      this.sendToClient(ws, { type: 'room_full', message: 'Room is full' });
      return;
    }

    if (!this.roomState.gameType && gameType) {
      if (!getGame(gameType)) {
        this.sendToClient(ws, { type: 'error', code: 'INVALID_GAME', message: 'Unknown game type' });
        return;
      }
      this.roomState.gameType = gameType;
      const def = getGame(gameType)!;
      this.roomState.gameData = def.createInitialState();
    }

    const playerIndex = this.roomState.players.length;
    const symbol = String.fromCharCode(65 + playerIndex); // A, B, C...

    const newPlayer: InternalPlayer = {
      userId, displayName, symbol, connected: true,
      ws, wsId, disconnectedAt: null,
    };
    this.roomState.players.push(newPlayer);
    this.connections.set(wsId, ws);

    const currentGameDef = this.getGameDefinition();
    const minPlayers = currentGameDef?.minPlayers || 2;

    if (this.roomState.players.filter(p => p.connected).length >= minPlayers && this.roomState.status === 'waiting') {
      this.roomState.status = 'active';
    }

    this.sendToClient(ws, { type: 'joined', success: true, symbol, roomCode, gameType: this.roomState.gameType });
    this.broadcastStateSync();
    await this.persistState();
  }

  private async handleMove(wsId: string, { userId, move }: { userId: string; move: unknown }): Promise<void> {
    const player = this.roomState.players.find(p => p.userId === userId);
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

  private async handleRestart(wsId: string, { userId }: { userId: string }): Promise<void> {
    const player = this.roomState.players.find(p => p.userId === userId);
    if (!player || player.wsId !== wsId) return;

    const gameDef = this.getGameDefinition();
    if (!gameDef) return;

    this.roomState.gameData = gameDef.createRestartState(this.roomState.gameData as BaseGameState);
    this.roomState.status = 'active';
    this.roomState.winner = null;
    this.roomState.currentPlayerIndex = 0;

    this.broadcastStateSync();
  }
}
