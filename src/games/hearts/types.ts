import type { BaseGameState } from '../types';

export interface HeartsState extends BaseGameState {
  gameType: 'hearts';
  deck: string[];
  hands: Record<string, string[]>;
  currentTrick: Array<{ symbol: string; card: string }>;
  leadSuit: 'S' | 'H' | 'D' | 'C' | null;
  heartsBroken: boolean;
  trickNumber: number;
  points: Record<string, number>;
  lastAction: string;
}

export interface HeartsMove {
  type: 'play';
  card: string;
}
