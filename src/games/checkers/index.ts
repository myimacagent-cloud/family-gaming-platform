import type { GameDefinition, MoveValidation } from '../types';
import { CheckersBoard } from './Board';
import type { CheckersMove, CheckersPiece, CheckersState } from './types';

const GAME_ID = 'checkers';
const SIZE = 8;

function rowOf(i: number) {
  return Math.floor(i / SIZE);
}

function colOf(i: number) {
  return i % SIZE;
}

function idx(row: number, col: number) {
  return row * SIZE + col;
}

function inBounds(row: number, col: number) {
  return row >= 0 && row < SIZE && col >= 0 && col < SIZE;
}

function isDarkSquare(row: number, col: number) {
  return (row + col) % 2 === 1;
}

function createInitialBoard(players: CheckersState['players']): CheckersState['board'] {
  const board: (CheckersPiece | null)[] = Array(64).fill(null);
  const p1 = players[0]?.symbol ?? 'X';
  const p2 = players[1]?.symbol ?? 'O';

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (isDarkSquare(r, c)) board[idx(r, c)] = { owner: p2, king: false };
    }
  }
  for (let r = 5; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (isDarkSquare(r, c)) board[idx(r, c)] = { owner: p1, king: false };
    }
  }

  return board;
}

function createInitialState(_roomCode: string): CheckersState {
  return {
    gameType: GAME_ID,
    players: [],
    status: 'waiting',
    winner: null,
    currentPlayerIndex: 0,
    board: createInitialBoard([]),
  };
}

function createRestartState(currentState: CheckersState): CheckersState {
  return {
    ...currentState,
    status: 'active',
    winner: null,
    currentPlayerIndex: 0,
    board: createInitialBoard(currentState.players),
  };
}

function directionForSymbol(state: CheckersState, symbol: string): number {
  return state.players[0]?.symbol === symbol ? -1 : 1;
}

function legalMove(state: CheckersState, move: CheckersMove, playerSymbol: string): { ok: boolean; capture?: number; error?: string } {
  if (move.from < 0 || move.from >= 64 || move.to < 0 || move.to >= 64) return { ok: false, error: 'Invalid square' };
  const piece = state.board[move.from];
  if (!piece) return { ok: false, error: 'No piece there' };
  if (piece.owner !== playerSymbol) return { ok: false, error: 'That is not your piece' };
  if (state.board[move.to] !== null) return { ok: false, error: 'Target must be empty' };

  const fr = rowOf(move.from);
  const fc = colOf(move.from);
  const tr = rowOf(move.to);
  const tc = colOf(move.to);
  const dr = tr - fr;
  const dc = tc - fc;

  if (Math.abs(dc) !== Math.abs(dr) || Math.abs(dc) === 0 || Math.abs(dc) > 2) {
    return { ok: false, error: 'Move must be diagonal' };
  }

  const forward = directionForSymbol(state, playerSymbol);

  if (Math.abs(dr) === 1) {
    if (!piece.king && dr !== forward) return { ok: false, error: 'Non-kings move forward only' };
    return { ok: true };
  }

  // jump capture
  if (Math.abs(dr) === 2) {
    if (!piece.king && dr !== forward * 2) return { ok: false, error: 'Non-kings jump forward only' };

    const mr = fr + dr / 2;
    const mc = fc + dc / 2;
    const middle = state.board[idx(mr, mc)];
    if (!middle || middle.owner === playerSymbol) return { ok: false, error: 'Jump must capture enemy piece' };
    return { ok: true, capture: idx(mr, mc) };
  }

  return { ok: false, error: 'Illegal move' };
}

function hasAnyLegalMove(state: CheckersState, playerSymbol: string): boolean {
  for (let from = 0; from < state.board.length; from++) {
    const piece = state.board[from];
    if (!piece || piece.owner !== playerSymbol) continue;

    const r = rowOf(from);
    const c = colOf(from);
    const dirs = piece.king
      ? [-1, 1]
      : [directionForSymbol(state, playerSymbol)];

    for (const d of dirs) {
      for (const side of [-1, 1]) {
        const r1 = r + d;
        const c1 = c + side;
        if (inBounds(r1, c1) && state.board[idx(r1, c1)] === null) return true;

        const r2 = r + d * 2;
        const c2 = c + side * 2;
        const mr = r + d;
        const mc = c + side;
        if (!inBounds(r2, c2)) continue;
        const mid = state.board[idx(mr, mc)];
        if (state.board[idx(r2, c2)] === null && mid && mid.owner !== playerSymbol) return true;
      }
    }
  }
  return false;
}

function countPieces(state: CheckersState, symbol: string): number {
  return state.board.filter((p) => p?.owner === symbol).length;
}

function validateMove(state: CheckersState, move: CheckersMove, playerSymbol: string): MoveValidation {
  if (state.status !== 'active') return { valid: false, error: 'Game is not active' };
  const current = state.players[state.currentPlayerIndex];
  if (current?.symbol !== playerSymbol) return { valid: false, error: 'Not your turn' };
  if (!move || typeof move.from !== 'number' || typeof move.to !== 'number') return { valid: false, error: 'Invalid move' };

  const check = legalMove(state, move, playerSymbol);
  if (!check.ok) return { valid: false, error: check.error };

  return { valid: true };
}

function applyMove(state: CheckersState, move: CheckersMove, playerSymbol: string): CheckersState {
  const check = legalMove(state, move, playerSymbol);
  if (!check.ok) return state;

  const board = [...state.board];
  const piece = board[move.from];
  if (!piece) return state;

  board[move.from] = null;
  if (typeof check.capture === 'number') board[check.capture] = null;

  const targetRow = rowOf(move.to);
  const promoteRow = state.players[0]?.symbol === playerSymbol ? 0 : SIZE - 1;
  const promoted = piece.king || targetRow === promoteRow;

  board[move.to] = { owner: playerSymbol, king: promoted };

  const opponent = state.players.find((p) => p.symbol !== playerSymbol)?.symbol;
  if (!opponent) return { ...state, board };

  const oppCount = board.filter((p) => p?.owner === opponent).length;
  if (oppCount === 0) return { ...state, board, status: 'finished', winner: playerSymbol };

  const temp: CheckersState = { ...state, board };
  if (!hasAnyLegalMove(temp, opponent)) return { ...state, board, status: 'finished', winner: playerSymbol };

  return {
    ...state,
    board,
    currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
  };
}

function checkGameEnd(state: CheckersState): { ended: boolean; winner: string | null; draw: boolean } {
  if (state.status === 'finished') return { ended: true, winner: state.winner, draw: false };

  const p1 = state.players[0]?.symbol;
  const p2 = state.players[1]?.symbol;
  if (p1 && p2) {
    const p1Count = countPieces(state, p1);
    const p2Count = countPieces(state, p2);
    if (p1Count === 0) return { ended: true, winner: p2, draw: false };
    if (p2Count === 0) return { ended: true, winner: p1, draw: false };
  }

  return { ended: false, winner: null, draw: false };
}

export const checkersGame: GameDefinition<CheckersState, CheckersMove> = {
  id: GAME_ID,
  displayName: '🔴⚫ Checkers',
  description: 'Classic checkers. Move diagonally, capture, and crown kings.',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  createRestartState,
  renderBoard: CheckersBoard,
  validateMove,
  applyMove,
  checkGameEnd,
};
