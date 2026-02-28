// Client -> Server messages
export type ClientMessage =
  | { type: 'join_room'; userId: string; displayName: string; roomCode: string }
  | { type: 'make_move'; userId: string; index: number }
  | { type: 'restart_game'; userId: string }
  | { type: 'request_state'}
  | { type: 'ping' };

// Server -> Client messages
export type ServerMessage =
  | { type: 'state_sync'; state: RoomState }
  | { type: 'joined'; success: boolean; symbol: 'X' | 'O' }
  | { type: 'player_update'; players: PublicPlayer[] }
  | { type: 'move_applied'; board: (PlayerSymbol | null)[]; turn: PlayerSymbol; status: GameStatus; winner: PlayerSymbol | null; winningCells: number[] | null }
  | { type: 'error'; code: string; message: string }
  | { type: 'room_full'; message: string }
  | { type: 'ping' }
  | { type: 'pong' };

export type PlayerSymbol = 'X' | 'O';
export type CellValue = PlayerSymbol | null;
export type GameStatus = 'waiting' | 'active' | 'finished' | 'draw';

// Grace period for WebSocket reconnection (30 seconds)
export const GRACE_PERIOD_MS = 30000;

export interface PublicPlayer {
  userId: string;
  displayName: string;
  symbol: PlayerSymbol;
  connected: boolean;
}

export interface RoomState {
  roomCode: string;
  players: PublicPlayer[];
  board: (PlayerSymbol | null)[];
  turn: PlayerSymbol;
  status: GameStatus;
  winner: PlayerSymbol | null;
  winningCells: number[] | null;
}

// Internal player state (includes WebSocket refs)
export interface InternalPlayer extends PublicPlayer {
  ws: WebSocket | null;
  wsId: string | null;
  disconnectedAt: number | null;
}
