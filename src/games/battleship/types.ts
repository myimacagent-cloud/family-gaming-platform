import type { BaseGameState } from '../types';

export const GRID_SIZE = 10;

export const SHIPS = [
  { type: 'carrier', label: 'Carrier', length: 5 },
  { type: 'battleship', label: 'Battleship', length: 4 },
  { type: 'cruiser', label: 'Cruiser', length: 3 },
  { type: 'submarine', label: 'Submarine', length: 3 },
  { type: 'destroyer', label: 'Destroyer', length: 2 },
] as const;

export type ShipType = (typeof SHIPS)[number]['type'];
export type Orientation = 'horizontal' | 'vertical';
export type AttackResult = 'hit' | 'miss' | 'sunk';

export interface Coord {
  row: number;
  col: number;
}

export interface ShipState {
  id: string;
  type: ShipType;
  length: number;
  cells: Coord[];
  hits: number;
  sunk: boolean;
}

export interface PlayerBoard {
  ships: ShipState[];
  shipCells: boolean[][];
  hits: boolean[][];
  misses: boolean[][];
  placed: ShipType[];
}

export interface LastAttack {
  attacker: string;
  defender: string;
  row: number;
  col: number;
  result: AttackResult;
  sunkShip?: ShipType;
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
  orientation?: Orientation;
}
