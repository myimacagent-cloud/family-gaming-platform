import type { BaseGameState } from '../types';

export interface AirHockeyState extends BaseGameState {
  gameType: 'airhockey';
  rows: number;
  cols: number;
  puckRow: number;
  puckCol: number;
  holder: string | null; // player symbol that currently controls the puck
  goalieRows: Record<string, number>; // preferred defensive row for each player
  scores: Record<string, number>;
  targetScore: number;
  round: number;
}

export interface AirHockeyMove {
  shotRow: number;
  guardRow: number;
}
