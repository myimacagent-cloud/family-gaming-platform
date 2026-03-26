import { createElement } from 'react';
import type { GameDefinition } from '../types';
import { ChessBoard } from './board';
import {
  GAME_ID,
  createInitialState,
  createRestartState,
  validateMove,
  applyMove,
  checkGameEnd,
} from './logic';
import type { ChessState, ChessMove } from './logic';

export const chessGameDefinition: GameDefinition<ChessState, ChessMove> = {
  id: GAME_ID,
  displayName: '♟️ Chess',
  description: 'Classic chess powered by chess.js for full legal move validation.',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  createRestartState,
  renderBoard: (props) => createElement(ChessBoard, props),
  validateMove,
  applyMove,
  checkGameEnd,
};
