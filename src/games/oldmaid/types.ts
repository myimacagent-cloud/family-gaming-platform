import type { BaseGameState } from '../types';

export interface OldMaidState extends BaseGameState {
  gameType: 'oldmaid';
  deck: number[];
  hands: Record<string, number[]>;
  pairs: Record<string, number>;
  maidHolder: string | null;
  currentPicker: string | null;
  currentTarget: string | null;
  lastAction: string;
}

export interface OldMaidMove {
  type: 'draw_from_opponent';
  index: number;
}
