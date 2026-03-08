import type { GameDefinition, MoveValidation } from '../types';
import type { GridChipsState, GridChipsMove, GridChipsCell } from './types';
import { GridChipsBoard } from './Board';

const GAME_ID = 'gridchips';
const ROWS = 7;
const COLS = 7;
const BURST_THRESHOLD = 4;

function createEmptyBoard(): GridChipsCell[] {
  return Array.from({ length: ROWS * COLS }, () => ({ owner: null, dots: 0 }));
}

function createInitialState(_roomCode: string): GridChipsState {
  return {
    gameType: GAME_ID,
    players: [],
    status: 'waiting',
    winner: null,
    currentPlayerIndex: 0,
    rows: ROWS,
    cols: COLS,
    board: createEmptyBoard(),
    moveCounts: {},
    totalMoves: 0,
  };
}

function createRestartState(currentState: GridChipsState): GridChipsState {
  const moveCounts: Record<string, number> = {};
  for (const p of currentState.players) moveCounts[p.symbol] = 0;

  return {
    ...currentState,
    status: 'active',
    winner: null,
    currentPlayerIndex: 0,
    board: createEmptyBoard(),
    moveCounts,
    totalMoves: 0,
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

function cloneBoard(board: GridChipsCell[]): GridChipsCell[] {
  return board.map((cell) => ({ ...cell }));
}

function countOwned(board: GridChipsCell[], symbol: string): number {
  let count = 0;
  for (const cell of board) {
    if (cell.owner === symbol) count += 1;
  }
  return count;
}

function validateMove(state: GridChipsState, move: GridChipsMove, playerSymbol: string): MoveValidation {
  if (state.status !== 'active') return { valid: false, error: 'Game is not active' };

  const currentPlayer = state.players[state.currentPlayerIndex];
  if (currentPlayer?.symbol !== playerSymbol) return { valid: false, error: 'Not your turn' };

  if (!move || typeof move.index !== 'number') return { valid: false, error: 'Invalid move' };
  if (move.index < 0 || move.index >= state.board.length) return { valid: false, error: 'Out of bounds' };

  const cell = state.board[move.index];
  const hasPlayed = (state.moveCounts[playerSymbol] || 0) > 0;

  // First move: must pick a white tile and it starts with 3 dots.
  if (!hasPlayed) {
    if (cell.owner !== null) return { valid: false, error: 'First move must be on a white tile' };
    return { valid: true };
  }

  // After first move: can only play own color, never white or opponent tiles.
  if (cell.owner !== playerSymbol) {
    return { valid: false, error: 'After your first move, you can only play your own color' };
  }

  return { valid: true };
}

function applyMove(state: GridChipsState, move: GridChipsMove, playerSymbol: string): GridChipsState {
  const board = cloneBoard(state.board);
  const moveCounts = { ...state.moveCounts };
  const hasPlayed = (moveCounts[playerSymbol] || 0) > 0;

  if (!hasPlayed) {
    board[move.index].owner = playerSymbol;
    board[move.index].dots = 3;
  } else {
    board[move.index].owner = playerSymbol;
    board[move.index].dots += 1;
  }

  const queue: number[] = [move.index];

  while (queue.length > 0) {
    const idx = queue.shift()!;
    const cell = board[idx];

    if (cell.owner !== playerSymbol) continue;
    if (cell.dots < BURST_THRESHOLD) continue;

    cell.dots -= BURST_THRESHOLD;
    if (cell.dots <= 0) {
      cell.dots = 0;
      cell.owner = null;
    }

    for (const n of neighbors(idx)) {
      board[n].owner = playerSymbol;
      board[n].dots += 1;
      if (board[n].dots >= BURST_THRESHOLD) queue.push(n);
    }
  }

  moveCounts[playerSymbol] = (moveCounts[playerSymbol] || 0) + 1;
  const totalMoves = state.totalMoves + 1;

  const opponent = state.players.find((p) => p.symbol !== playerSymbol)?.symbol;

  // Elimination rule: once both players have made at least one move,
  // first player to have 0 owned tiles loses.
  if (opponent && (moveCounts[playerSymbol] || 0) > 0 && (moveCounts[opponent] || 0) > 0) {
    const currentOwned = countOwned(board, playerSymbol);
    const opponentOwned = countOwned(board, opponent);

    if (currentOwned === 0 && opponentOwned > 0) {
      return {
        ...state,
        board,
        moveCounts,
        totalMoves,
        status: 'finished',
        winner: opponent,
      };
    }

    if (opponentOwned === 0 && currentOwned > 0) {
      return {
        ...state,
        board,
        moveCounts,
        totalMoves,
        status: 'finished',
        winner: playerSymbol,
      };
    }
  }

  return {
    ...state,
    board,
    moveCounts,
    totalMoves,
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
  description: 'First tap starts at 3 dots. Then play only your own color. Burst and eliminate to win.',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  createRestartState,
  renderBoard: GridChipsBoard,
  validateMove,
  applyMove,
  checkGameEnd,
};
