import type { BaseGameState } from '../types';

export interface ColorWarsState extends BaseGameState {
  gameType: 'colorwars';
  rows: number;
  cols: number;
  board: (string | null)[];
  scores: Record<string, number>;
}

export interface ColorWarsMove {
  index: number;
}
