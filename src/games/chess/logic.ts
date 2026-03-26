import { Chess } from 'chess.js';
import type { BaseGameState, MoveValidation } from '../types';

export const GAME_ID = 'chess' as const;

type ChessWinner = 'white' | 'black' | 'draw' | null;

export interface ChessState extends BaseGameState {
  gameType: typeof GAME_ID;
  fen: string;
  status: 'waiting' | 'active' | 'finished';
  winner: ChessWinner;
}

export interface ChessMove {
  from: string;
  to: string;
  promotion?: 'q' | 'r' | 'b' | 'n';
}

const SQUARE_RE = /^[a-h][1-8]$/;

function playerColorFromSymbol(state: ChessState, playerSymbol: string): 'w' | 'b' | null {
  const idx = state.players.findIndex((p) => p.symbol === playerSymbol);
  if (idx === 0) return 'w';
  if (idx === 1) return 'b';
  return null;
}

function normalizeMove(move: ChessMove): ChessMove {
  return {
    from: move.from.toLowerCase(),
    to: move.to.toLowerCase(),
    ...(move.promotion ? { promotion: move.promotion.toLowerCase() as ChessMove['promotion'] } : {}),
  };
}

function isValidMoveShape(move: ChessMove): boolean {
  return SQUARE_RE.test(move.from) && SQUARE_RE.test(move.to);
}

function deriveStatusFromEngine(chess: Chess): { status: ChessState['status']; winner: ChessWinner } {
  if (chess.isCheckmate()) {
    const winner = chess.turn() === 'w' ? 'black' : 'white';
    return { status: 'finished', winner };
  }

  if (chess.isStalemate() || chess.isDraw()) {
    return { status: 'finished', winner: 'draw' };
  }

  return { status: 'active', winner: null };
}

export function createInitialState(_roomCode: string): ChessState {
  const chess = new Chess();

  return {
    gameType: GAME_ID,
    players: [],
    status: 'waiting',
    winner: null,
    currentPlayerIndex: 0,
    fen: chess.fen(),
  };
}

export function createRestartState(currentState: ChessState): ChessState {
  const chess = new Chess();

  return {
    ...currentState,
    fen: chess.fen(),
    status: 'active',
    winner: null,
    currentPlayerIndex: 0,
  };
}

export function validateMove(
  state: ChessState,
  move: ChessMove,
  playerSymbol: string,
): MoveValidation {
  if (state.status !== 'active') {
    return { valid: false, error: 'Game is not active' };
  }

  const currentPlayer = state.players[state.currentPlayerIndex];
  if (currentPlayer?.symbol !== playerSymbol) {
    return { valid: false, error: 'Not your turn' };
  }

  if (!move || typeof move !== 'object') {
    return { valid: false, error: 'Invalid move format' };
  }

  const normalized = normalizeMove(move);
  if (!isValidMoveShape(normalized)) {
    return { valid: false, error: 'Invalid square format' };
  }

  const playerColor = playerColorFromSymbol(state, playerSymbol);
  if (!playerColor) {
    return { valid: false, error: 'Unable to map player color' };
  }

  let chess: Chess;
  try {
    chess = new Chess(state.fen);
  } catch {
    return { valid: false, error: 'Invalid game state' };
  }

  if (chess.turn() !== playerColor) {
    return { valid: false, error: 'Not your turn' };
  }

  const result = chess.move(normalized);
  if (!result) {
    return { valid: false, error: 'Illegal move' };
  }

  return { valid: true };
}

export function applyMove(
  state: ChessState,
  move: ChessMove,
  _playerSymbol: string,
): ChessState {
  const normalized = normalizeMove(move);
  const chess = new Chess(state.fen);
  const result = chess.move(normalized);

  if (!result) {
    return state;
  }

  const next = deriveStatusFromEngine(chess);

  return {
    ...state,
    fen: chess.fen(),
    status: next.status,
    winner: next.winner,
    currentPlayerIndex: chess.turn() === 'w' ? 0 : 1,
  };
}

export function checkGameEnd(state: ChessState): { ended: boolean; winner: string | null; draw: boolean } {
  if (state.status !== 'finished') {
    return { ended: false, winner: null, draw: false };
  }

  if (state.winner === 'draw') {
    return { ended: true, winner: null, draw: true };
  }

  return { ended: true, winner: state.winner, draw: false };
}
