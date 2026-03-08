import type { GameDefinition, MoveValidation } from '../types';
import type { GridChipsState, GridChipsMove } from './types';
import { GridChipsBoard } from './Board';

const GAME_ID = 'gridchips';
const ROWS = 7;
const COLS = 7;

// Match the reference screenshot layout
const START_A = 1 * COLS + 1; // row 2, col 2
const START_B = 2 * COLS + 3; // row 3, col 4

function createInitialState(_roomCode: string): GridChipsState {
  return {
    gameType: GAME_ID,
    players: [],
    status: 'waiting',
    winner: null,
    currentPlayerIndex: 0,
    rows: ROWS,
    cols: COLS,
    positions: {},
    startPositions: {},
    moveCount: 0,
  };
}

function ensurePositions(state: GridChipsState): GridChipsState {
  if (state.players.length < 2) return state;
  if (Object.keys(state.positions).length > 0) return state;

  const first = state.players[0]?.symbol;
  const second = state.players[1]?.symbol;

  if (!first || !second) return state;

  return {
    ...state,
    positions: {
      [first]: START_A,
      [second]: START_B,
    },
    startPositions: {
      [first]: START_A,
      [second]: START_B,
    },
  };
}

function createRestartState(currentState: GridChipsState): GridChipsState {
  const symbols = currentState.players.map((p) => p.symbol);
  const [first = 'X', second = 'O'] = symbols;

  return {
    ...currentState,
    status: 'active',
    winner: null,
    currentPlayerIndex: 0,
    moveCount: 0,
    positions: {
      [first]: START_A,
      [second]: START_B,
    },
    startPositions: {
      [first]: START_A,
      [second]: START_B,
    },
  };
}

function neighbors(index: number): number[] {
  const r = Math.floor(index / COLS);
  const c = index % COLS;
  const out: number[] = [];
  if (r > 0) out.push((r - 1) * COLS + c);
  if (r < ROWS - 1) out.push((r + 1) * COLS + c);
  if (c > 0) out.push(r * COLS + (c - 1));
  if (c < COLS - 1) out.push(r * COLS + (c + 1));
  return out;
}

function validateMove(inputState: GridChipsState, move: GridChipsMove, playerSymbol: string): MoveValidation {
  const state = ensurePositions(inputState);

  if (state.status !== 'active') return { valid: false, error: 'Game is not active' };

  const currentPlayer = state.players[state.currentPlayerIndex];
  if (currentPlayer?.symbol !== playerSymbol) return { valid: false, error: 'Not your turn' };

  if (!move || typeof move.to !== 'number') return { valid: false, error: 'Invalid move' };

  const total = state.rows * state.cols;
  if (move.to < 0 || move.to >= total) return { valid: false, error: 'Out of bounds' };

  const from = state.positions[playerSymbol];
  if (typeof from !== 'number') return { valid: false, error: 'Player position missing' };

  if (!neighbors(from).includes(move.to)) return { valid: false, error: 'Move must be 1 square orthogonally' };

  return { valid: true };
}

function applyMove(inputState: GridChipsState, move: GridChipsMove, playerSymbol: string): GridChipsState {
  const state = ensurePositions(inputState);

  const positions = { ...state.positions, [playerSymbol]: move.to };
  const opponent = state.players.find((p) => p.symbol !== playerSymbol)?.symbol;

  // Win if you capture opponent or reach opponent's start tile
  const captured = opponent ? positions[opponent] === move.to : false;
  const reachedStart = opponent ? state.startPositions[opponent] === move.to : false;

  if (captured || reachedStart) {
    return {
      ...state,
      positions,
      moveCount: state.moveCount + 1,
      status: 'finished',
      winner: playerSymbol,
    };
  }

  // Safety draw fallback
  if (state.moveCount + 1 >= 60) {
    return {
      ...state,
      positions,
      moveCount: state.moveCount + 1,
      status: 'draw',
      winner: null,
    };
  }

  return {
    ...state,
    positions,
    moveCount: state.moveCount + 1,
    currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
  };
}

function checkGameEnd(state: GridChipsState): { ended: boolean; winner: string | null; draw: boolean } {
  if (state.status === 'finished') return { ended: true, winner: state.winner, draw: false };
  if (state.status === 'draw') return { ended: true, winner: null, draw: true };
  return { ended: false, winner: null, draw: false };
}

export const gridChipsGame: GameDefinition<GridChipsState, GridChipsMove> = {
  id: GAME_ID,
  displayName: '🔵🔴 Grid Chips',
  description: 'Move one square per turn. Reach the opponent start tile or capture them to win.',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  createRestartState,
  renderBoard: GridChipsBoard,
  validateMove,
  applyMove,
  checkGameEnd,
};
