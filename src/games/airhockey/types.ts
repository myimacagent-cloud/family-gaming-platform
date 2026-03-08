import type { BaseGameState } from '../types';

export type AirHockeyOutcome = 'save' | 'goal';

export interface AirHockeyLastPlay {
  shooter: string;
  defender: string;
  shotRow: number;
  shooterGuardRow: number;
  defenderGuardRow: number;
  outcome: AirHockeyOutcome;
  round: number;
}

export interface AirHockeyState extends BaseGameState {
  gameType: 'airhockey';
  rows: number;
  cols: number;
  puckRow: number;
  puckCol: number;
  holder: string | null;
  goalieRows: Record<string, number>;
  shotRows: Record<string, number | null>;
  scores: Record<string, number>;
  targetScore: number;
  round: number;
  lastPlay: AirHockeyLastPlay | null;
}

export interface AirHockeyMove {
  shotRow: number;
  guardRow: number;
}
