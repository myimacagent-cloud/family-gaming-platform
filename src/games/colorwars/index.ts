import type { GameDefinition, MoveValidation } from '../types';
import type { ColorWarsState, ColorWarsMove } from './types';
import { ColorWarsBoard } from './Board';

const GAME_ID = 'colorwars';
const ROWS = 7;
const COLS = 7;

function createInitialState(_roomCode: string): ColorWarsState {
  return {
    gameType: GAME_ID,
    players: [],
    status: 'waiting',
    winner: null,
    currentPlayerIndex: 0,
    rows: ROWS,
    cols: COLS,
    board: Array(ROWS * COLS).fill(null),
    scores: {},
  };
}

function createRestartState(currentState: ColorWarsState): ColorWarsState {
  const scores: Record<string, number> = {};
  for (const p of currentState.players) scores[p.symbol] = 0;
  return {
    ...currentState,
    status: 'active',
    winner: null,
    currentPlayerIndex: 0,
    board: Array(currentState.rows * currentState.cols).fill(null),
    scores,
  };
}

function validateMove(state: ColorWarsState, move: ColorWarsMove, playerSymbol: string): MoveValidation {
  if (state.status !== 'active') return { valid: false, error: 'Game is not active' };

  const currentPlayer = state.players[state.currentPlayerIndex];
  if (currentPlayer?.symbol !== playerSymbol) return { valid: false, error: 'Not your turn' };

  if (!move || typeof move.index !== 'number') return { valid: false, error: 'Invalid move' };
  if (move.index < 0 || move.index >= state.board.length) return { valid: false, error: 'Invalid cell' };
  if (state.board[move.index] !== null) return { valid: false, error: 'Cell already taken' };

  return { valid: true };
}

function applyMove(state: ColorWarsState, move: ColorWarsMove, playerSymbol: string): ColorWarsState {
  const board = [...state.board];
  board[move.index] = playerSymbol;

  const scores: Record<string, number> = { ...(state.scores || {}) };
  for (const p of state.players) {
    scores[p.symbol] = board.filter((c) => c === p.symbol).length;
  }

  const filled = board.every((c) => c !== null);
  if (!filled) {
    return { ...state, board, scores, currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length };
  }

  const [p1, p2] = state.players;
  const s1 = p1 ? scores[p1.symbol] ?? 0 : 0;
  const s2 = p2 ? scores[p2.symbol] ?? 0 : 0;
  if (s1 === s2) {
    return { ...state, board, scores, status: 'draw', winner: null };
  }
  return { ...state, board, scores, status: 'finished', winner: s1 > s2 ? p1.symbol : (p2?.symbol ?? null) };
}

function checkGameEnd(state: ColorWarsState): { ended: boolean; winner: string | null; draw: boolean } {
  if (state.status === 'finished') return { ended: true, winner: state.winner, draw: false };
  if (state.status === 'draw') return { ended: true, winner: null, draw: true };
  return { ended: false, winner: null, draw: false };
}

export const colorWarsGame: GameDefinition<ColorWarsState, ColorWarsMove> = {
  id: GAME_ID,
  displayName: 'Color Wars',
  description: 'Take turns claiming squares. Most color tiles wins!',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  createRestartState,
  renderBoard: ColorWarsBoard,
  validateMove,
  applyMove,
  checkGameEnd,
};
