// ============================================
// Unified Message Types for Game Platform
// ============================================

// Grace period for WebSocket reconnection (30 seconds)
export const GRACE_PERIOD_MS = 30000;

// ============================================
// Player Types
// ============================================

export interface PublicPlayer {
  userId: string;
  displayName: string;
  symbol: string;
  connected: boolean;
}

// Internal player state (includes WebSocket refs)
export interface InternalPlayer extends PublicPlayer {
  ws: WebSocket | null;
  wsId: string | null;
  disconnectedAt: number | null;
}

// ============================================
// Generic Room State
// ============================================

export type GameStatus = 'waiting' | 'active' | 'finished' | 'draw';

export interface RoomState {
  gameType: string;
  roomCode: string;
  players: PublicPlayer[];
  status: GameStatus;
  winner: string | null;
  currentPlayerIndex: number;
  roundNumber: number;
  restartVotes?: string[];
  // Game-specific state is stored in the `gameData` field
  gameData: unknown;
}

// ============================================
// Client -> Server Messages
// ============================================

export type ClientMessage =
  | { type: 'ping' }
  | { 
      type: 'join_room'; 
      userId: string; 
      displayName: string; 
      roomCode: string;
      gameType?: string; // Optional - used for room creation
    }
  | { type: 'make_move'; userId: string; move: unknown }
  | { type: 'restart_game'; userId: string }
  | { type: 'restart_vote'; userId: string }
  | { type: 'request_state' }
  // Admin/lobby messages
  | { type: 'create_room'; userId: string; displayName: string; gameType: string }
  | { type: 'join_room_code'; userId: string; displayName: string; roomCode: string };

// ============================================
// Server -> Client Messages
// ============================================

export type ServerMessage =
  | { type: 'pong' }
  | { type: 'joined'; success: boolean; symbol: string; roomCode: string; gameType?: string }
  | { type: 'room_full'; message: string }
  | { type: 'error'; code: string; message: string }
  | { type: 'state_sync'; state: RoomState }
  | { type: 'move_applied'; state: RoomState }
  | { type: 'player_update'; players: PublicPlayer[] }
  // Room creation response
  | { type: 'room_created'; success: boolean; roomCode: string; gameType: string }
  | { type: 'joined_room'; success: boolean; roomCode: string; state: RoomState }
  // Game-specific events
  | { type: 'game_started' }
  | { type: 'game_finished'; winner: string | null; draw: boolean };
