import type { BaseGameState } from '../types';

export const BATTLESHIP_GRID_SIZE = 10;

export const SHIP_DEFINITIONS = [
  { type: 'carrier', length: 5, label: 'Carrier' },
  { type: 'battleship', length: 4, label: 'Battleship' },
  { type: 'cruiser', length: 3, label: 'Cruiser' },
  { type: 'submarine', length: 3, label: 'Submarine' },
  { type: 'destroyer', length: 2, label: 'Destroyer' },
] as const;

export type ShipType = (typeof SHIP_DEFINITIONS)[number]['type'];
export type ShipOrientation = 'horizontal' | 'vertical';
export type AttackResult = 'hit' | 'miss' | 'sunk';

export interface Coordinate {
  row: number;
  col: number;
}

export interface Ship {
  id: string;
  type: ShipType;
  length: number;
  positions: Coordinate[];
  hits: number;
  sunk: boolean;
}

export interface PlayerBoard {
  ships: Ship[];
  shipCells: boolean[][];
  hits: boolean[][];
  misses: boolean[][];
  placedShips: ShipType[];
}

export interface LastAttack {
  attacker: string;
  defender: string;
  row: number;
  col: number;
  result: AttackResult;
  sunkShipType?: ShipType;
}

export interface BattleshipState extends BaseGameState {
  gameType: 'battleship';
  phase: 'setup' | 'battle' | 'finished';
  boards: Record<string, PlayerBoard>;
  currentAttacker: string | null;
  lastAttack: LastAttack | null;
}

export interface BattleshipMove {
  action: 'place_ship' | 'attack';
  row: number;
  col: number;
  shipType?: ShipType;
  orientation?: ShipOrientation;
}
