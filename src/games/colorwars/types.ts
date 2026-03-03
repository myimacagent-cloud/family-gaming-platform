import type { BaseGameState } from '../types';

export interface ColorWarsCell {
  owner: string | null;
  dots: number;
}

export interface ColorWarsState extends BaseGameState {
  gameType: 'colorwars';
  rows: number;
  cols: number;
  board: ColorWarsCell[];
  scores: Record<string, number>;
  moveCount: number;
  started: Record<string, boolean>;
}

export interface ColorWarsMove {
  index: number;
}
