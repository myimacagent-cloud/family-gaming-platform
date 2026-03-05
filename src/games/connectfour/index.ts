import type { GameDefinition, MoveValidation } from '../types';
import type { ConnectFourState, ConnectFourMove } from './types';
import { ConnectFourBoard } from './Board';

const GAME_ID = 'connectfour';
const ROWS = 6;
const COLS = 7;

function createInitialState(_roomCode: string): ConnectFourState {
  return {
    gameType: GAME_ID,
    players: [],
    status: 'waiting',
    winner: null,
    currentPlayerIndex: 0,
    board: Array(ROWS).fill(null).map(() => Array(COLS).fill(null)),
    rows: ROWS,
    cols: COLS,
    lastMove: null,
  };
}

function createRestartState(currentState: ConnectFourState): ConnectFourState {
  return {
    ...currentState,
    status: 'active',
    winner: null,
    currentPlayerIndex: 0,
    board: Array(ROWS).fill(null).map(() => Array(COLS).fill(null)),
    lastMove: null,
  };
}

function validateMove(state: ConnectFourState, move: ConnectFourMove, playerSymbol: string): MoveValidation {
  if (state.status !== 'active') return { valid: false, error: 'Game is not active' };

  const currentPlayer = state.players[state.currentPlayerIndex];
  if (currentPlayer?.symbol !== playerSymbol) return { valid: false, error: 'Not your turn' };

  if (typeof move.col !== 'number' || move.col < 0 || move.col >= COLS) {
    return { valid: false, error: 'Invalid column' };
  }

  // Check if column is full
  if (state.board[0][move.col] !== null) {
    return { valid: false, error: 'Column is full' };
  }

  return { valid: true };
}

// Find the lowest empty row in a column
function findDropRow(board: (string | null)[][], col: number): number {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][col] === null) return row;
  }
  return -1;
}

// Check if someone won
function checkWin(board: (string | null)[][], row: number, col: number, symbol: string): boolean {
  const directions = [
    [0, 1],   // horizontal
    [1, 0],   // vertical
    [1, 1],   // diagonal down-right
    [1, -1],  // diagonal down-left
  ];

  for (const [dr, dc] of directions) {
    let count = 1;

    // Check positive direction
    for (let i = 1; i < 4; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r][c] !== symbol) break;
      count++;
    }

    // Check negative direction
    for (let i = 1; i < 4; i++) {
      const r = row - dr * i;
      const c = col - dc * i;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r][c] !== symbol) break;
      count++;
    }

    if (count >= 4) return true;
  }

  return false;
}

function applyMove(state: ConnectFourState, move: ConnectFourMove, playerSymbol: string): ConnectFourState {
  const row = findDropRow(state.board, move.col);
  if (row === -1) return state;

  const newBoard = state.board.map(r => [...r]);
  newBoard[row][move.col] = playerSymbol;

  const hasWon = checkWin(newBoard, row, move.col, playerSymbol);

  if (hasWon) {
    return {
      ...state,
      board: newBoard,
      lastMove: { row, col: move.col },
      status: 'finished',
      winner: playerSymbol,
    };
  }

  // Check for draw
  const isDraw = newBoard.every(r => r.every(c => c !== null));
  if (isDraw) {
    return {
      ...state,
      board: newBoard,
      lastMove: { row, col: move.col },
      status: 'draw',
      winner: null,
    };
  }

  return {
    ...state,
    board: newBoard,
    lastMove: { row, col: move.col },
    currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
  };
}

function checkGameEnd(state: ConnectFourState): { ended: boolean; winner: string | null; draw: boolean } {
  if (state.status === 'finished') return { ended: true, winner: state.winner, draw: false };
  if (state.status === 'draw') return { ended: true, winner: null, draw: true };
  return { ended: false, winner: null, draw: false };
}

export const connectFourGame: GameDefinition<ConnectFourState, ConnectFourMove> = {
  id: GAME_ID,
  displayName: 'Connect Four',
  description: 'Drop your discs to connect four in a row!',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  createRestartState,
  renderBoard: ConnectFourBoard,
  validateMove,
  applyMove,
  checkGameEnd,
};
