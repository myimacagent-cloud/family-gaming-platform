import type { BaseGameState } from '../types';

export interface SnakesLaddersState extends BaseGameState {
  gameType: 'snakesladders';
  positions: Record<string, number>;
  lastRoll: number;
  lastAction: string;
}

export interface SnakesLaddersMove {
  type: 'roll';
}
