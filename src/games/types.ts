import type { ReactNode } from 'react';

// Generic player reference
export interface GamePlayer {
  userId: string;
  displayName: string;
  symbol: string;
  connected: boolean;
}

// Base game state interface
export interface BaseGameState {
  gameType: string;
  players: GamePlayer[];
  status: 'waiting' | 'active' | 'finished' | 'draw';
  winner: string | null;
  currentPlayerIndex: number;
}

// Props for rendering a game board
export interface GameBoardProps<TState extends BaseGameState> {
  state: TState;
  myPlayerId: string;
  mySymbol: string;
  onMove: (move: unknown) => void;
  disabled: boolean;
}

// Move validation result
export interface MoveValidation {
  valid: boolean;
  error?: string;
}

// Game definition interface - this is what each game must export
export interface GameDefinition<TState extends BaseGameState = BaseGameState, TMove = unknown> {
  id: string;
  displayName: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  
  // Create initial state for a new game
  createInitialState(roomCode: string): TState;
  
  // Create initial state for a restarted game (preserves game type, room code)
  createRestartState(currentState: TState): TState;
  
  // Render the game board
  renderBoard(props: GameBoardProps<TState>): ReactNode;
  
  // Validate a move
  validateMove(state: TState, move: TMove, playerSymbol: string): MoveValidation;
  
  // Apply a move and return the new state
  applyMove(state: TState, move: TMove, playerSymbol: string): TState;
  
  // Check if the game has ended
  checkGameEnd(state: TState): { ended: boolean; winner: string | null; draw: boolean };
}

// Registry of all available games
export type GameRegistry = Record<string, GameDefinition>;
