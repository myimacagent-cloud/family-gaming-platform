import type { BaseGameState } from '../types';

export interface GridChipsCell {
  owner: string | null;
  dots: number;
}

export interface GridChipsState extends BaseGameState {
  gameType: 'gridchips';
  rows: number;
  cols: number;
  board: GridChipsCell[];
  moveCounts: Record<string, number>; // symbol -> turns taken
  totalMoves: number;
}

export interface GridChipsMove {
  index: number;
}
