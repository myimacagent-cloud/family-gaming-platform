import type { BaseGameState } from '../types';

export interface DanceBattlesState extends BaseGameState {
  gameType: 'dancebattles';
  round: number;
  maxRounds: number;
  moves: Record<string, string | null>; // player symbol -> move text
  scores: Record<string, number>;
  lastAction: string;
}

export interface DanceBattlesMove {
  type: 'submit_move';
  move: string;
}
