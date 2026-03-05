import type { BaseGameState } from '../types';

export interface ConnectFourState extends BaseGameState {
  gameType: 'connectfour';
  board: (string | null)[][]; // 6 rows x 7 columns
  rows: number;
  cols: number;
  lastMove: { row: number; col: number } | null;
}

export interface ConnectFourMove {
  col: number; // Which column to drop into
}
