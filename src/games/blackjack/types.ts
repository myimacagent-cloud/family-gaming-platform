import type { BaseGameState } from '../types';

export interface BlackjackState extends BaseGameState {
  gameType: 'blackjack';
  deck: number[]; // 1..13 where 1=Ace, 11/12/13 face cards
  hands: Record<string, number[]>;
  stood: Record<string, boolean>;
  busted: Record<string, boolean>;
  totals: Record<string, number>;
  reveal: boolean;
  lastAction: string;
}

export interface BlackjackMove {
  type: 'hit' | 'stand';
}
