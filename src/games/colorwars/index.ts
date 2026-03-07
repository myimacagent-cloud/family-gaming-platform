import type { GameDefinition, MoveValidation } from '../types';
import type { ColorWarsState, ColorWarsMove, ColorWarsCell } from './types';
import { ColorWarsBoard } from './Board';

const GAME_ID = 'colorwars';
const ROWS = 7;
const COLS = 7;
const BURST_THRESHOLD = 4;

function createEmptyBoard(): ColorWarsCell[] {
  return Array.from({ length: ROWS * COLS }, () => ({ owner: null, dots: 0 }));
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
    board: createEmptyBoard(),
    scores: {},
    totalMoves: 0,
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
    board: createEmptyBoard(),
    scores,
    totalMoves: 0,
  };
}

function getNeighbors(index: number, cols: number, rows: number): number[] {
  const r = Math.floor(index / cols);
  const c = index % cols;
  const out: number[] = [];
  if (r > 0) out.push((r - 1) * cols + c);
  if (r < rows - 1) out.push((r + 1) * cols + c);
  if (c > 0) out.push(r * cols + (c - 1));
  if (c < cols - 1) out.push(r * cols + (c + 1));
  return out;
}

function cloneBoard(board: ColorWarsCell[]): ColorWarsCell[] {
  return board.map((cell) => ({ ...cell }));
}

function recalcScores(board: ColorWarsCell[], playerSymbols: string[]): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const s of playerSymbols) scores[s] = 0;

  for (const cell of board) {
    if (cell.owner) scores[cell.owner] = (scores[cell.owner] || 0) + 1;
  }

  return scores;
}

function validateMove(state: ColorWarsState, move: ColorWarsMove, playerSymbol: string): MoveValidation {
  if (state.status !== 'active') return { valid: false, error: 'Game is not active' };

  const currentPlayer = state.players[state.currentPlayerIndex];
  if (currentPlayer?.symbol !== playerSymbol) return { valid: false, error: 'Not your turn' };

  if (!move || typeof move.index !== 'number') return { valid: false, error: 'Invalid move' };
  if (move.index < 0 || move.index >= state.board.length) return { valid: false, error: 'Invalid cell' };

  const cell = state.board[move.index];
  if (cell.owner !== null && cell.owner !== playerSymbol) {
    return { valid: false, error: 'You can only tap empty cells or your own color' };
  }

  return { valid: true };
}

function applyMove(state: ColorWarsState, move: ColorWarsMove, playerSymbol: string): ColorWarsState {
  const board = cloneBoard(state.board);

  // Add one dot on tapped tile and claim it.
  board[move.index].owner = playerSymbol;
  board[move.index].dots += 1;

  // Chain bursts.
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

    const neighbors = getNeighbors(idx, state.cols, state.rows);
    for (const n of neighbors) {
      board[n].owner = playerSymbol;
      board[n].dots += 1;
      if (board[n].dots >= BURST_THRESHOLD) queue.push(n);
    }
  }

  const symbols = state.players.map((p) => p.symbol);
  const scores = recalcScores(board, symbols);
  const totalMoves = state.totalMoves + 1;

  // Win condition: once everyone has had at least one turn,
  // if only one player still controls tiles, they win.
  const playersWithTiles = symbols.filter((s) => (scores[s] || 0) > 0);
  const everyonePlayedAtLeastOnce = totalMoves >= state.players.length;

  if (everyonePlayedAtLeastOnce && playersWithTiles.length === 1) {
    return {
      ...state,
      board,
      scores,
      totalMoves,
      status: 'finished',
      winner: playersWithTiles[0],
    };
  }

  return {
    ...state,
    board,
    scores,
    totalMoves,
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
  displayName: '🎨 Color Wars',
  description: 'Tap to add dots. At 4 dots, tiles burst and chain across the board!',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  createRestartState,
  renderBoard: ColorWarsBoard,
  validateMove,
  applyMove,
  checkGameEnd,
};
