import type { BaseGameState } from '../types';

export type CellState = 'empty' | 'ship' | 'hit' | 'miss';
export type ShipType = 'carrier' | 'battleship' | 'cruiser' | 'submarine' | 'destroyer';

export interface Ship {
  type: ShipType;
  length: number;
  positions: { row: number; col: number }[];
  hits: number;
  isSunk: boolean;
}

export interface Grid {
  cells: CellState[][];
  ships: Ship[];
  shipsRemaining: number;
}

export interface BattleshipState extends BaseGameState {
  gameType: 'battleship';
  phase: 'setup' | 'battle' | 'finished';
  grids: Record<string, Grid>; // player symbol -> grid
  currentAttacker: string | null;
  lastAttack: { row: number; col: number; result: 'hit' | 'miss' | null } | null;
}

export interface BattleshipMove {
  action: 'place_ship' | 'attack';
  row?: number;
  col?: number;
  shipType?: ShipType;
  orientation?: 'horizontal' | 'vertical';
}
