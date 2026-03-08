import type { BaseGameState } from '../types';

export interface GridChipsState extends BaseGameState {
  gameType: 'gridchips';
  rows: number;
  cols: number;
  positions: Record<string, number>; // symbol -> board index
  startPositions: Record<string, number>; // symbol -> board index
  moveCount: number;
}

export interface GridChipsMove {
  to: number;
}
