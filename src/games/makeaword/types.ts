import type { BaseGameState } from '../types';

export type MakeAWordPhase = 'choose_letters' | 'make_words';

export interface MakeAWordState extends BaseGameState {
  gameType: 'makeaword';
  phase: MakeAWordPhase;
  letters: {
    first: string | null; // player 1 letter
    last: string | null;  // player 2 letter
  };
  attempts: Array<{ symbol: string; word: string; valid: boolean }>;
  winningWord: string | null;
  lastAction: string;
}

export interface MakeAWordMove {
  type: 'choose_letter' | 'submit_word';
  letter?: string;
  word?: string;
}
