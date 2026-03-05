import type { BaseGameState } from '../types';

export interface HungryHippoState extends BaseGameState {
  gameType: 'hungryhippo';
  marbles: Marble[];
  hippos: Hippo[];
  phase: 'waiting' | 'dropping' | 'chomping' | 'scoring';
  roundNumber: number;
  playerReady: Record<string, boolean>;
}

export interface Marble {
  id: string;
  x: number;
  y: number;
  color: 'gold' | 'blue' | 'green' | 'red';
  collectedBy: string | null;
}

export interface Hippo {
  playerId: string;
  symbol: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  marblesEaten: number;
  isChomping: boolean;
  color: string;
}

export interface HungryHippoMove {
  action: 'chomp' | 'ready';
  targetMarbleId?: string;
}
