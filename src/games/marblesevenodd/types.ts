import type { BaseGameState } from '../types';

export type ParityGuess = 'even' | 'odd';

export interface RoundPick {
  marbles: number;
  guess: ParityGuess;
}

export interface MarblesEvenOddState extends BaseGameState {
  gameType: 'marblesevenodd';
  picks: Record<string, RoundPick | null>;
  reveal: boolean;
  totalMarbles: number | null;
  winningParity: ParityGuess | null;
}

export interface MarblesEvenOddMove {
  marbles: number;
  guess: ParityGuess;
}
