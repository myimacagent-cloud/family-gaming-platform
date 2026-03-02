import type { GameDefinition, MoveValidation } from '../types';
import type { DotsAndBoxesState, DotsAndBoxesMove } from './types';
import { DotsAndBoxesBoard } from './Board';
import { horizontalEdgeIndex, verticalEdgeIndex, boxIndex } from './types';

const GAME_ID = 'dotsandboxes-v81';
const DOT_ROWS = 10; // 10 dots = 9x9 boxes
const DOT_COLS = 10;

function createInitialState(_roomCode: string): DotsAndBoxesState {
  return {
    gameType: GAME_ID,
    players: [],
    status: 'waiting',
    winner: null,
    currentPlayerIndex: 0,
    rows: DOT_ROWS,
    cols: DOT_COLS,
    horizontalEdges: Array(DOT_ROWS * (DOT_COLS - 1)).fill(false),
    verticalEdges: Array((DOT_ROWS - 1) * DOT_COLS).fill(false),
    boxes: Array((DOT_ROWS - 1) * (DOT_COLS - 1)).fill(null),
    scores: {},
  };
}

function createRestartState(currentState: DotsAndBoxesState): DotsAndBoxesState {
  const scores: Record<string, number> = {};
  for (const p of currentState.players) scores[p.symbol] = 0;
  return {
    ...currentState,
    status: 'active',
    winner: null,
    currentPlayerIndex: 0,
    horizontalEdges: Array(currentState.rows * (currentState.cols - 1)).fill(false),
    verticalEdges: Array((currentState.rows - 1) * currentState.cols).fill(false),
    boxes: Array((currentState.rows - 1) * (currentState.cols - 1)).fill(null),
    scores,
  };
}

function validateMove(state: DotsAndBoxesState, move: DotsAndBoxesMove, playerSymbol: string): MoveValidation {
  if (state.status !== 'active') {
    return { valid: false, error: 'Game is not active' };
  }
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (currentPlayer?.symbol !== playerSymbol) {
    return { valid: false, error: 'Not your turn' };
  }
  if (!move || (move.orientation !== 'h' && move.orientation !== 'v')) {
    return { valid: false, error: 'Invalid move orientation' };
  }
  if (move.orientation === 'h') {
    if (move.index < 0 || move.index >= state.horizontalEdges.length) {
      return { valid: false, error: 'Invalid horizontal edge' };
    }
    if (state.horizontalEdges[move.index]) {
      return { valid: false, error: 'Edge already taken' };
    }
  } else {
    if (move.index < 0 || move.index >= state.verticalEdges.length) {
      return { valid: false, error: 'Invalid vertical edge' };
    }
    if (state.verticalEdges[move.index]) {
      return { valid: false, error: 'Edge already taken' };
    }
  }
  return { valid: true };
}

function isBoxCompleted(
  horizontalEdges: boolean[],
  verticalEdges: boolean[],
  rows: number,
  cols: number,
  boxR: number,
  boxC: number
): boolean {
  const top = horizontalEdges[horizontalEdgeIndex(rows, cols, boxR, boxC)];
  const bottom = horizontalEdges[horizontalEdgeIndex(rows, cols, boxR + 1, boxC)];
  const left = verticalEdges[verticalEdgeIndex(rows, cols, boxR, boxC)];
  const right = verticalEdges[verticalEdgeIndex(rows, cols, boxR, boxC + 1)];
  return !!(top && bottom && left && right);
}

function applyMove(state: DotsAndBoxesState, move: DotsAndBoxesMove, playerSymbol: string): DotsAndBoxesState {
  const horizontalEdges = [...state.horizontalEdges];
  const verticalEdges = [...state.verticalEdges];
  const boxes = [...state.boxes];
  const scores: Record<string, number> = { ...(state.scores || {}) };
  for (const p of state.players) {
    if (typeof scores[p.symbol] !== 'number') scores[p.symbol] = 0;
  }

  let touchedBoxes: Array<{ r: number; c: number }> = [];
  if (move.orientation === 'h') {
    horizontalEdges[move.index] = true;
    const r = Math.floor(move.index / (state.cols - 1));
    const c = move.index % (state.cols - 1);
    if (r > 0) touchedBoxes.push({ r: r - 1, c });
    if (r < state.rows - 1) touchedBoxes.push({ r, c });
  } else {
    verticalEdges[move.index] = true;
    const r = Math.floor(move.index / state.cols);
    const c = move.index % state.cols;
    if (c > 0) touchedBoxes.push({ r, c: c - 1 });
    if (c < state.cols - 1) touchedBoxes.push({ r, c });
  }

  let claimed = 0;
  for (const b of touchedBoxes) {
    const bIdx = boxIndex(state.cols, b.r, b.c);
    if (boxes[bIdx]) continue;
    if (isBoxCompleted(horizontalEdges, verticalEdges, state.rows, state.cols, b.r, b.c)) {
      boxes[bIdx] = playerSymbol;
      scores[playerSymbol] = (scores[playerSymbol] ?? 0) + 1;
      claimed += 1;
    }
  }

  const totalBoxes = (state.rows - 1) * (state.cols - 1);
  const claimedBoxes = boxes.filter(Boolean).length;
  const gameFinished = claimedBoxes === totalBoxes;

  let nextPlayerIndex = state.currentPlayerIndex;
  if (!gameFinished && claimed === 0) {
    nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
  }

  if (!gameFinished) {
    return {
      ...state,
      horizontalEdges,
      verticalEdges,
      boxes,
      scores,
      currentPlayerIndex: nextPlayerIndex,
      winner: null,
      status: 'active',
    };
  }

  const [p1, p2] = state.players;
  const s1 = p1 ? (scores[p1.symbol] ?? 0) : 0;
  const s2 = p2 ? (scores[p2.symbol] ?? 0) : 0;
  if (s1 === s2) {
    return { ...state, horizontalEdges, verticalEdges, boxes, scores, currentPlayerIndex: nextPlayerIndex, winner: null, status: 'draw' };
  }
  return { ...state, horizontalEdges, verticalEdges, boxes, scores, currentPlayerIndex: nextPlayerIndex, winner: s1 > s2 ? p1.symbol : (p2?.symbol ?? null), status: 'finished' };
}

function checkGameEnd(state: DotsAndBoxesState): { ended: boolean; winner: string | null; draw: boolean } {
  if (state.status === 'finished') return { ended: true, winner: state.winner, draw: false };
  if (state.status === 'draw') return { ended: true, winner: null, draw: true };
  return { ended: false, winner: null, draw: false };
}

export const dotsAndBoxesGame: GameDefinition<DotsAndBoxesState, DotsAndBoxesMove> = {
  id: GAME_ID,
  displayName: 'Dots and Boxes (9×9)',
  description: 'Connect dots to complete 9×9 boxes. Play online with family!',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  createRestartState,
  renderBoard: DotsAndBoxesBoard,
  validateMove,
  applyMove,
  checkGameEnd,
};
