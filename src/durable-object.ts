import type {
  PlayerSymbol,
  CellValue,
  GameStatus,
  ClientMessage,
  ServerMessage,
  InternalPlayer,
} from './types/messages';

interface RoomState {
  roomCode: string;
  players: InternalPlayer[];
  board: CellValue[];
  turn: PlayerSymbol;
  status: GameStatus;
  winner: PlayerSymbol | null;
  winningCells: number[] | null;
  createdAt: number;
  lastActivityTs: number;
}

export class GameRoom {
  private state: DurableObjectState;
  private roomState!: RoomState;
  private connections = new Map<string, WebSocket>();
  private initialized = false;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  // =============================
  // Initialization
  // =============================
  private async ensureInitialized(roomCodeFromUrl?: string) {
    if (this.initialized) return;

    const stored = await this.state.storage.get<RoomState>('roomState');

    if (stored) {
      this.roomState = stored;
    } else {
      this.roomState = {
        roomCode: roomCodeFromUrl ?? 'default',
        players: [],
        board: Array(9).fill(null),
        turn: 'X',
        status: 'waiting',
        winner: null,
        winningCells: null,
        createdAt: Date.now(),
        lastActivityTs: Date.now(),
      };

      await this.persistState();
    }

    this.initialized = true;
  }

  // =============================
  // Entry
  // =============================
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/websocket') {
      const roomCode = url.searchParams.get('room');
      await this.ensureInitialized(roomCode ?? undefined);
      return this.handleWebSocketUpgrade(request, roomCode);
    }

    if (url.pathname === '/api/status') {
      await this.ensureInitialized();
      return new Response(
        JSON.stringify({
          roomCode: this.roomState.roomCode,
          playerCount: this.roomState.players.filter(p => p.connected).length,
          status: this.roomState.status,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response('Not Found', { status: 404 });
  }

  // =============================
  // WebSocket
  // =============================
  private async handleWebSocketUpgrade(
    request: Request,
    roomCode: string | null
  ): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', { status: 400 });
    }

    if (!roomCode) {
      return new Response('Invalid room', { status: 400 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    const wsId = crypto.randomUUID();

    server.accept();
    this.connections.set(wsId, server);

    server.addEventListener('message', async (event) => {
      try {
        const msg = JSON.parse(event.data as string) as ClientMessage;
        await this.handleMessage(wsId, server, msg);
      } catch {
        this.send(server, { type: 'error', message: 'Invalid message' } as any);
      }
    });

    server.addEventListener('close', () => this.handleDisconnect(wsId));
    server.addEventListener('error', () => this.handleDisconnect(wsId));

    return new Response(null, { status: 101, webSocket: client });
  }

  // =============================
  // Message Router
  // =============================
  private async handleMessage(wsId: string, ws: WebSocket, msg: ClientMessage) {
    this.roomState.lastActivityTs = Date.now();

    switch (msg.type) {
      case 'join_room':
        await this.handleJoin(wsId, ws, msg.userId, msg.displayName);
        break;

      case 'make_move':
        await this.handleMove(wsId, msg.index);
        break;

      case 'restart_game':
        await this.handleRestart();
        break;

      case 'ping':
        this.send(ws, { type: 'pong' } as any);
        break;
    }
  }

  // =============================
  // Join
  // =============================
  private async handleJoin(
    wsId: string,
    ws: WebSocket,
    userId: string,
    displayName: string
  ) {
    let player = this.roomState.players.find(p => p.userId === userId);

    if (player) {
      // Reconnect
      player.connected = true;
      player.wsId = wsId;
    } else {
      if (this.roomState.players.length >= 2) {
        this.send(ws, { type: 'room_full' } as any);
        return;
      }

      const symbol: PlayerSymbol =
        this.roomState.players.length === 0 ? 'X' : 'O';

      player = {
        userId,
        displayName,
        symbol,
        connected: true,
        wsId,
        disconnectedAt: null,
      } as InternalPlayer;

      this.roomState.players.push(player);
    }

    if (this.roomState.players.filter(p => p.connected).length === 2) {
      this.roomState.status = 'active';
    }

    await this.persistState();
    this.broadcastState();
  }

  // =============================
  // Move
  // =============================
  private async handleMove(wsId: string, index: number) {
    const player = this.roomState.players.find(p => p.wsId === wsId);
    if (!player) return;

    if (this.roomState.status !== 'active') return;
    if (player.symbol !== this.roomState.turn) return;
    if (this.roomState.board[index] !== null) return;

    this.roomState.board[index] = player.symbol;
    this.roomState.turn = player.symbol === 'X' ? 'O' : 'X';

    const win = this.checkWin(player.symbol);

    if (win) {
      this.roomState.status = 'finished';
      this.roomState.winner = player.symbol;
      this.roomState.winningCells = win;
    } else if (this.roomState.board.every(c => c !== null)) {
      this.roomState.status = 'draw';
    }

    await this.persistState();
    this.broadcastState();
  }

  private async handleRestart() {
    this.roomState.board = Array(9).fill(null);
    this.roomState.turn = 'X';
    this.roomState.status = 'active';
    this.roomState.winner = null;
    this.roomState.winningCells = null;

    await this.persistState();
    this.broadcastState();
  }

  // =============================
  // Utilities
  // =============================
  private checkWin(symbol: PlayerSymbol): number[] | null {
    const wins = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6]
    ];

    for (const combo of wins) {
      if (combo.every(i => this.roomState.board[i] === symbol)) {
        return combo;
      }
    }

    return null;
  }

  private handleDisconnect(wsId: string) {
    const player = this.roomState.players.find(p => p.wsId === wsId);
    if (player) {
      player.connected = false;
      player.wsId = '';
    }

    this.connections.delete(wsId);
  }

  private async persistState() {
    await this.state.storage.put('roomState', this.roomState);
  }

  private send(ws: WebSocket, msg: ServerMessage) {
    try {
      ws.send(JSON.stringify(msg));
    } catch {}
  }

  private broadcastState() {
    const publicState = {
      board: this.roomState.board,
      turn: this.roomState.turn,
      status: this.roomState.status,
      winner: this.roomState.winner,
      winningCells: this.roomState.winningCells,
      players: this.roomState.players.map(p => ({
        userId: p.userId,
        displayName: p.displayName,
        symbol: p.symbol,
        connected: p.connected,
      })),
    };

    for (const ws of this.connections.values()) {
      this.send(ws, { type: 'state_sync', state: publicState } as any);
    }
  }
}