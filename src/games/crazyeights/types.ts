import type { BaseGameState } from '../types';

export interface CrazyEightsState extends BaseGameState {
  gameType: 'crazyeights';
  deck: string[]; // card id format: "R-S" where R in 2..14, S in S/H/D/C
  hands: Record<string, string[]>; // symbol -> cards
  topCard: string | null;
  activeSuit: 'S' | 'H' | 'D' | 'C' | null;
  drawStack: number;
  lastAction: string;
}

export interface CrazyEightsMove {
  type: 'play' | 'draw';
  card?: string;
  chooseSuit?: 'S' | 'H' | 'D' | 'C';
}
