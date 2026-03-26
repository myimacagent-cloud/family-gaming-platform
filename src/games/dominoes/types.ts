import type { BaseGameState } from '../types';

export interface DominoesState extends BaseGameState {
  gameType: 'dominoes';
  boneyard: string[];
  hands: Record<string, string[]>;
  leftEnd: number | null;
  rightEnd: number | null;
  chain: string[];
  lastAction: string;
}

export interface DominoesMove {
  type: 'play' | 'draw';
  tile?: string;
  side?: 'left' | 'right';
}
