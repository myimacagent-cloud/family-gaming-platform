import type { GameDefinition } from '../types';
import {
  GAME_ID,
  createInitialState,
  createRestartState,
  validateMove,
  applyMove,
  checkGameEnd,
} from './logic';
import type { TicTacToe3PieceState, TicTacToe3PieceMove } from './logic';
import { TicTacToe3PieceBoard } from './board';

export const ticTacToe3PieceGame: GameDefinition<TicTacToe3PieceState, TicTacToe3PieceMove> = {
  id: GAME_ID,
  displayName: '❌ Tic-Tac-Toe (3-Piece)',
  description: 'Each player can keep only 3 marks; the oldest mark is removed on the 4th move.',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  createRestartState,
  renderBoard: TicTacToe3PieceBoard,
  validateMove,
  applyMove,
  checkGameEnd,
};
