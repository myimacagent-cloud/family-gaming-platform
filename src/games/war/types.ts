import type { BaseGameState } from '../types';

export interface WarState extends BaseGameState {
  gameType: 'war';
  decks: Record<string, number[]>; // player symbol -> remaining cards (rank 2..14)
  tableCards: Record<string, number | null>; // current face-up card
  tricksWon: Record<string, number>;
  round: number;
  maxRounds: number;
}

export interface WarMove {
  action: 'play_card';
}
