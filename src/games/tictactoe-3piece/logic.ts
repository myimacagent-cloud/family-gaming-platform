import type { BaseGameState, MoveValidation } from '../types';

export const GAME_ID = 'tictactoe-3piece' as const;

export type ThreePieceSymbol = 'X' | 'O';
export type ThreePieceCell = ThreePieceSymbol | null;

export type PlayerState = {
  userId: string;
  symbol: ThreePieceSymbol;
  moves: number[]; // ordered move history (oldest -> newest)
};

export interface TicTacToe3PieceState extends BaseGameState {
  gameType: typeof GAME_ID;
  board: ThreePieceCell[];
  winningCells: number[] | null;
  playerStates: PlayerState[];
}

export interface TicTacToe3PieceMove {
  index: number;
}

const WIN_LINES: number[][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export function checkWin(board: ThreePieceCell[], symbol: ThreePieceSymbol): number[] | null {
  for (const combo of WIN_LINES) {
    if (combo.every(i => board[i] === symbol)) {
      return combo;
    }
  }
  return null;
}

function normalizePlayerStates(state: TicTacToe3PieceState): PlayerState[] {
  return state.players
    .filter((p): p is typeof p & { symbol: ThreePieceSymbol } => p.symbol === 'X' || p.symbol === 'O')
    .map((p) => {
      const existing = state.playerStates.find(ps => ps.userId === p.userId || ps.symbol === p.symbol);
      const moves = (existing?.moves || [])
        .filter((idx) => Number.isInteger(idx) && idx >= 0 && idx < 9)
        .filter((idx) => state.board[idx] === p.symbol)
        .slice(-3);

      return {
        userId: p.userId,
        symbol: p.symbol,
        moves,
      };
    });
}

export function createInitialState(_roomCode: string): TicTacToe3PieceState {
  return {
    gameType: GAME_ID,
    players: [],
    status: 'waiting',
    winner: null,
    currentPlayerIndex: 0,
    board: Array(9).fill(null),
    winningCells: null,
    playerStates: [],
  };
}

export function createRestartState(currentState: TicTacToe3PieceState): TicTacToe3PieceState {
  return {
    ...currentState,
    board: Array(9).fill(null),
    status: 'active',
    winner: null,
    winningCells: null,
    currentPlayerIndex: 0,
    playerStates: normalizePlayerStates(currentState).map((p) => ({ ...p, moves: [] })),
  };
}

export function validateMove(
  state: TicTacToe3PieceState,
  move: TicTacToe3PieceMove,
  playerSymbol: string
): MoveValidation {
  if (state.status !== 'active') {
    return { valid: false, error: 'Game is not active' };
  }

  const currentPlayer = state.players[state.currentPlayerIndex];
  if (currentPlayer?.symbol !== playerSymbol) {
    return { valid: false, error: 'Not your turn' };
  }

  if (!Number.isInteger(move.index) || move.index < 0 || move.index >= 9) {
    return { valid: false, error: 'Invalid cell index' };
  }

  if (state.board[move.index] !== null) {
    return { valid: false, error: 'Cell already occupied' };
  }

  return { valid: true };
}

export function applyMove(
  state: TicTacToe3PieceState,
  move: TicTacToe3PieceMove,
  playerSymbol: string
): TicTacToe3PieceState {
  if (playerSymbol !== 'X' && playerSymbol !== 'O') {
    return state;
  }

  const newBoard = [...state.board];
  const playerStates = normalizePlayerStates(state).map((p) => ({ ...p, moves: [...p.moves] }));

  let playerState = playerStates.find((p) => p.symbol === playerSymbol);
  if (!playerState) {
    const currentPlayer = state.players[state.currentPlayerIndex];
    playerState = {
      userId: currentPlayer?.userId || '',
      symbol: playerSymbol,
      moves: [],
    };
    playerStates.push(playerState);
  }

  if (playerState.moves.length === 3) {
    const oldestIndex = playerState.moves.shift();
    if (typeof oldestIndex === 'number') {
      newBoard[oldestIndex] = null;
    }
  }

  newBoard[move.index] = playerSymbol;
  playerState.moves.push(move.index);

  const winCombo = checkWin(newBoard, playerSymbol);
  if (winCombo) {
    return {
      ...state,
      board: newBoard,
      playerStates,
      status: 'finished',
      winner: playerSymbol,
      winningCells: winCombo,
    };
  }

  return {
    ...state,
    board: newBoard,
    playerStates,
    currentPlayerIndex: 1 - state.currentPlayerIndex,
    winningCells: null,
  };
}

export function checkGameEnd(state: TicTacToe3PieceState): { ended: boolean; winner: string | null; draw: boolean } {
  if (state.status === 'finished') {
    return { ended: true, winner: state.winner, draw: false };
  }
  if (state.status === 'draw') {
    return { ended: true, winner: null, draw: true };
  }
  return { ended: false, winner: null, draw: false };
}
