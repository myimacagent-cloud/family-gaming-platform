import type { GameDefinition, MoveValidation } from '../types';
import type { ColorWarsState, ColorWarsMove, ColorWarsCell } from './types';
import { ColorWarsBoard } from './Board';

const GAME_ID = 'colorwars';
const ROWS = 7;
const COLS = 7;
const CRITICAL_DOTS = 4;

function newBoard(rows: number, cols: number): ColorWarsCell[] {
  return Array.from({ length: rows * cols }, () => ({ owner: null, dots: 0 }));
}

function createInitialState(_roomCode: string): ColorWarsState {
  return {
    gameType: GAME_ID,
    players: [],
    status: 'waiting',
    winner: null,
    currentPlayerIndex: 0,
    rows: ROWS,
    cols: COLS,
    board: newBoard(ROWS, COLS),
    scores: {},
    moveCount: 0,
    started: {},
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
    board: newBoard(currentState.rows, currentState.cols),
    scores,
    moveCount: 0,
    started: {},
  };
}

function validateMove(state: ColorWarsState, move: ColorWarsMove, playerSymbol: string): MoveValidation {
  if (state.status !== 'active') return { valid: false, error: 'Game is not active' };

  const currentPlayer = state.players[state.currentPlayerIndex];
  if (currentPlayer?.symbol !== playerSymbol) return { valid: false, error: 'Not your turn' };

  if (!move || typeof move.index !== 'number') return { valid: false, error: 'Invalid move' };
  if (move.index < 0 || move.index >= state.board.length) return { valid: false, error: 'Invalid cell' };

  const cell = state.board[move.index];
  const hasStarted = !!state.started?.[playerSymbol];

  if (!hasStarted) {
    if (cell.owner !== null) return { valid: false, error: 'Your first move must be on an empty cell' };
    return { valid: true };
  }

  if (cell.owner !== playerSymbol) {
    return { valid: false, error: 'After your first move, you can only play on your own color' };
  }

  return { valid: true };
}

function neighbors(index: number, rows: number, cols: number): number[] {
  const r = Math.floor(index / cols);
  const c = index % cols;
  const out: number[] = [];
  if (r > 0) out.push((r - 1) * cols + c);
  if (r < rows - 1) out.push((r + 1) * cols + c);
  if (c > 0) out.push(r * cols + (c - 1));
  if (c < cols - 1) out.push(r * cols + (c + 1));
  return out;
}

function applyMove(state: ColorWarsState, move: ColorWarsMove, playerSymbol: string): ColorWarsState {
  const board = state.board.map((c) => ({ ...c }));
  const started: Record<string, boolean> = { ...(state.started || {}) };
  const isFirstMoveForPlayer = !started[playerSymbol];

  if (isFirstMoveForPlayer) {
    // First tile starts at 3 dots.
    const firstCell = board[move.index];
    firstCell.owner = playerSymbol;
    firstCell.dots = Math.max(firstCell.dots, 3);
    started[playerSymbol] = true;
  } else {
    const queue: number[] = [move.index];
    while (queue.length > 0) {
      const idx = queue.shift()!;
      const cell = board[idx];
      cell.owner = playerSymbol;
      cell.dots += 1;

      if (cell.dots >= CRITICAL_DOTS) {
        cell.owner = null;
        cell.dots = 0;
        for (const n of neighbors(idx, state.rows, state.cols)) {
          const neighbor = board[n];
          neighbor.owner = playerSymbol;
          neighbor.dots += 1;
          if (neighbor.dots >= CRITICAL_DOTS) queue.push(n);
        }
      }
    }
  }

  const scores: Record<string, number> = { ...(state.scores || {}) };
  for (const p of state.players) {
    scores[p.symbol] = board.filter((c) => c.owner === p.symbol).length;
  }

  const nextMoveCount = (state.moveCount || 0) + 1;
  const startedPlayers = state.players.filter((p) => started[p.symbol]);
  const playersWithZero = startedPlayers.filter((p) => (scores[p.symbol] ?? 0) === 0);

  if (startedPlayers.length >= 2 && playersWithZero.length > 0) {
    const loser = playersWithZero[0];
    const winner = state.players.find((p) => p.symbol !== loser.symbol)?.symbol ?? null;
    return {
      ...state,
      board,
      scores,
      started,
      moveCount: nextMoveCount,
      status: 'finished',
      winner,
    };
  }

  return {
    ...state,
    board,
    scores,
    started,
    moveCount: nextMoveCount,
    currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
  };
}

function checkGameEnd(state: ColorWarsState): { ended: boolean; winner: string | null; draw: boolean } {
  if (state.status === 'finished') return { ended: true, winner: state.winner, draw: false };
  if (state.status === 'draw') return { ended: true, winner: null, draw: true };
  return { ended: false, winner: null, draw: false };
}

export const colorWarsGame: GameDefinition<ColorWarsState, ColorWarsMove> = {
  id: GAME_ID,
  displayName: 'Color Wars',
  description: 'First tap starts at 3 dots. After that, play only on your color. At 4 dots, tiles burst to neighbors!',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  createRestartState,
  renderBoard: ColorWarsBoard,
  validateMove,
  applyMove,
  checkGameEnd,
};
