import type { BaseGameState } from '../types';

export interface GoFishState extends BaseGameState {
  gameType: 'gofish';
  deck: number[];
  hands: Record<string, number[]>; // symbol -> ranks in hand
  books: Record<string, number>; // completed sets of 4
  lastAction: string;
}

export interface GoFishMove {
  type: 'ask_rank';
  rank: number;
}
