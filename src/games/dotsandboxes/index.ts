import type { GameDefinition, MoveValidation } from '../types';
import { DotsAndBoxesBoard } from './board';

const GAME_ID = 'dots-and-boxes';
const BOX_SIZE = 9; // 9x9 boxes => 10x10 dots
const DOT_GRID = BOX_SIZE + 1;

type EdgeOrientation = 'h' | 'v';

export interface DotsAndBoxesMove {
  o: EdgeOrientation;
  r: number;
  c: number;
}

export interface DotsAndBoxesState {
  gameType: string;
  players: Array<{ userId: string; displayName: string; symbol: string; connected: boolean }>;
  status: 'waiting' | 'active' | 'finished' | 'draw';
  winner: string | null;
  currentPlayerIndex: number;
  boxSize: number;
  hEdges: (string | null)[][]; // [row:0..9][col:0..8]
  vEdges: (string | null)[][]; // [row:0..8][col:0..9]
  boxOwners: (string | null)[][]; // [row:0..8][col:0..8]
  scores: Record<string, number>;
}

function makeMatrix<T>(rows: number, cols: number, value: T): T[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(value));
}

function createInitialState(_roomCode: string): DotsAndBoxesState {
  return {
    gameType: GAME_ID,
    players: [],
    status: 'waiting',
    winner: null,
    currentPlayerIndex: 0,
    boxSize: BOX_SIZE,
    hEdges: makeMatrix(DOT_GRID, BOX_SIZE, null),
    vEdges: makeMatrix(BOX_SIZE, DOT_GRID, null),
    boxOwners: makeMatrix(BOX_SIZE, BOX_SIZE, null),
    scores: {},
  };
}

function createRestartState(currentState: DotsAndBoxesState): DotsAndBoxesState {
  const boxSize = currentState.boxSize || BOX_SIZE;
  const dotGrid = boxSize + 1;
  const scores: Record<string, number> = {};
  for (const p of currentState.players) scores[p.symbol] = 0;

  return {
    ...currentState,
    status: 'active',
    winner: null,
    currentPlayerIndex: 0,
    hEdges: makeMatrix(dotGrid, boxSize, null),
    vEdges: makeMatrix(boxSize, dotGrid, null),
    boxOwners: makeMatrix(boxSize, boxSize, null),
    scores,
  };
}

function isValidMoveBounds(state: DotsAndBoxesState, move: DotsAndBoxesMove): boolean {
  const n = state.boxSize;
  if (move.o === 'h') {
    return move.r >= 0 && move.r <= n && move.c >= 0 && move.c < n;
  }
  return move.r >= 0 && move.r < n && move.c >= 0 && move.c <= n;
}

function validateMove(state: DotsAndBoxesState, move: DotsAndBoxesMove, playerSymbol: string): MoveValidation {
  if (state.status !== 'active') return { valid: false, error: 'Game is not active' };

  const currentPlayer = state.players[state.currentPlayerIndex];
  if (currentPlayer?.symbol !== playerSymbol) return { valid: false, error: 'Not your turn' };

  if (!move || (move.o !== 'h' && move.o !== 'v')) return { valid: false, error: 'Invalid move' };
  if (!isValidMoveBounds(state, move)) return { valid: false, error: 'Move out of bounds' };

  const already = move.o === 'h' ? state.hEdges[move.r][move.c] : state.vEdges[move.r][move.c];
  if (already) return { valid: false, error: 'Edge already selected' };

  return { valid: true };
}

function isBoxClosed(state: DotsAndBoxesState, row: number, col: number): boolean {
  return Boolean(
    state.hEdges[row][col] &&
    state.hEdges[row + 1][col] &&
    state.vEdges[row][col] &&
    state.vEdges[row][col + 1]
  );
}

function applyMove(state: DotsAndBoxesState, move: DotsAndBoxesMove, playerSymbol: string): DotsAndBoxesState {
  const hEdges = state.hEdges.map((r) => [...r]);
  const vEdges = state.vEdges.map((r) => [...r]);
  const boxOwners = state.boxOwners.map((r) => [...r]);
  const scores = { ...state.scores };

  if (scores[playerSymbol] == null) scores[playerSymbol] = 0;

  if (move.o === 'h') hEdges[move.r][move.c] = playerSymbol;
  else vEdges[move.r][move.c] = playerSymbol;

  let completed = 0;
  const candidates: Array<[number, number]> = [];

  if (move.o === 'h') {
    if (move.r > 0) candidates.push([move.r - 1, move.c]);
    if (move.r < state.boxSize) candidates.push([move.r, move.c]);
  } else {
    if (move.c > 0) candidates.push([move.r, move.c - 1]);
    if (move.c < state.boxSize) candidates.push([move.r, move.c]);
  }

  for (const [br, bc] of candidates) {
    if (br < 0 || bc < 0 || br >= state.boxSize || bc >= state.boxSize) continue;
    if (boxOwners[br][bc] !== null) continue;

    const probeState = { ...state, hEdges, vEdges };
    if (isBoxClosed(probeState as DotsAndBoxesState, br, bc)) {
      boxOwners[br][bc] = playerSymbol;
      completed += 1;
    }
  }

  if (completed > 0) scores[playerSymbol] = (scores[playerSymbol] || 0) + completed;

  const totalClaimed = boxOwners.flat().filter(Boolean).length;
  const totalBoxes = state.boxSize * state.boxSize;

  let status: DotsAndBoxesState['status'] = 'active';
  let winner: string | null = null;
  let currentPlayerIndex = state.currentPlayerIndex;

  if (totalClaimed === totalBoxes) {
    const entries = Object.entries(scores);
    const sorted = [...entries].sort((a, b) => b[1] - a[1]);
    if (sorted.length >= 2 && sorted[0][1] === sorted[1][1]) {
      status = 'draw';
      winner = null;
    } else {
      status = 'finished';
      winner = sorted[0]?.[0] ?? null;
    }
  } else if (completed === 0) {
    currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
  }

  return {
    ...state,
    hEdges,
    vEdges,
    boxOwners,
    scores,
    status,
    winner,
    currentPlayerIndex,
  };
}

function checkGameEnd(state: DotsAndBoxesState): { ended: boolean; winner: string | null; draw: boolean } {
  if (state.status === 'finished') return { ended: true, winner: state.winner, draw: false };
  if (state.status === 'draw') return { ended: true, winner: null, draw: true };
  return { ended: false, winner: null, draw: false };
}

export const dotsAndBoxesGame: GameDefinition<DotsAndBoxesState, DotsAndBoxesMove> = {
  id: GAME_ID,
  displayName: 'Dots & Boxes (9×9)',
  description: 'Claim boxes by drawing edges. Complete a box to take another turn.',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  createRestartState,
  renderBoard: DotsAndBoxesBoard,
  validateMove,
  applyMove,
  checkGameEnd,
};
