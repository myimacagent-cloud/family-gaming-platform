import type { GameDefinition } from '../types';
import { HangmanBoard } from './board';
import {
  GAME_ID,
  createInitialState,
  createRestartState,
  validateMove,
  applyMove,
  checkGameEnd,
} from './logic';
import type { HangmanState, HangmanMove } from './logic';

export const hangmanGame: GameDefinition<HangmanState, HangmanMove> = {
  id: GAME_ID,
  displayName: '🎯 Hangman',
  description: 'Co-op turn-based letter guessing with up to 6 wrong attempts.',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  createRestartState,
  renderBoard: HangmanBoard,
  validateMove,
  applyMove,
  checkGameEnd,
};
