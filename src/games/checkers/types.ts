import type { BaseGameState } from '../types';

export interface CheckersPiece {
  owner: string;
  king: boolean;
}

export interface CheckersState extends BaseGameState {
  gameType: 'checkers';
  board: (CheckersPiece | null)[];
}

export interface CheckersMove {
  from: number;
  to: number;
}
