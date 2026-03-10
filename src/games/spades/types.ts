import type { BaseGameState } from '../types';

export interface SpadesState extends BaseGameState {
  gameType: 'spades';
  deck: string[];
  hands: Record<string, string[]>;
  bids: Record<string, number | null>;
  tricksWon: Record<string, number>;
  currentTrick: Array<{ symbol: string; card: string }>;
  leadSuit: 'S' | 'H' | 'D' | 'C' | null;
  spadesBroken: boolean;
  trickNumber: number;
  lastAction: string;
}

export interface SpadesMove {
  type: 'bid' | 'play';
  bid?: number;
  card?: string;
}
