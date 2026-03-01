import type { GameDefinition, MoveValidation } from '../types';
import type { TicTacToeState, TicTacToeMove } from './types';
import { checkWin } from './types';
import { TicTacToeBoard } from './Board';

const GAME_ID = 'tictactoe';

function createInitialState(_roomCode: string): TicTacToeState {
  return {
    gameType: GAME_ID,
    players: [],
    status: 'waiting',
    winner: null,
    currentPlayerIndex: 0,
    board: Array(9).fill(null),
    winningCells: null,
  };
}

function createRestartState(currentState: TicTacToeState): TicTacToeState {
  return {
    ...currentState,
    board: Array(9).fill(null),
    status: 'active',
    winner: null,
    winningCells: null,
    currentPlayerIndex: 0,
  };
}

function validateMove(
  state: TicTacToeState,
  move: TicTacToeMove,
  playerSymbol: string
): MoveValidation {
  if (state.status !== 'active') {
    return { valid: false, error: 'Game is not active' };
  }
  
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (currentPlayer?.symbol !== playerSymbol) {
    return { valid: false, error: "Not your turn" };
  }
  
  if (move.index < 0 || move.index >= 9) {
    return { valid: false, error: 'Invalid cell index' };
  }
  
  if (state.board[move.index] !== null) {
    return { valid: false, error: 'Cell already occupied' };
  }
  
  return { valid: true };
}

function applyMove(
  state: TicTacToeState,
  move: TicTacToeMove,
  playerSymbol: string
): TicTacToeState {
  const newBoard = [...state.board];
  newBoard[move.index] = playerSymbol as 'X' | 'O';
  
  // Check for win
  const winCombo = checkWin(newBoard, playerSymbol);
  if (winCombo) {
    return {
      ...state,
      board: newBoard,
      status: 'finished',
      winner: playerSymbol,
      winningCells: winCombo,
    };
  }
  
  // Check for draw
  if (newBoard.every(cell => cell !== null)) {
    return {
      ...state,
      board: newBoard,
      status: 'draw',
      winner: null,
      winningCells: null,
    };
  }
  
  // Continue game
  return {
    ...state,
    board: newBoard,
    currentPlayerIndex: 1 - state.currentPlayerIndex,
    winningCells: null,
  };
}

function checkGameEnd(state: TicTacToeState): { ended: boolean; winner: string | null; draw: boolean } {
  if (state.status === 'finished') {
    return { ended: true, winner: state.winner, draw: false };
  }
  if (state.status === 'draw') {
    return { ended: true, winner: null, draw: true };
  }
  return { ended: false, winner: null, draw: false };
}

export const ticTacToeGame: GameDefinition<TicTacToeState, TicTacToeMove> = {
  id: GAME_ID,
  displayName: 'Tic-Tac-Toe',
  description: 'Classic 3-in-a-row game for 2 players',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  createRestartState,
  renderBoard: TicTacToeBoard,
  validateMove,
  applyMove,
  checkGameEnd,
};
