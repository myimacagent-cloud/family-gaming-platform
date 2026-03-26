import type { BaseGameState } from '../types';

export interface UnoLightState extends BaseGameState {
  gameType: 'unolight';
  deck: string[];
  hands: Record<string, string[]>;
  topCard: string | null;
  activeColor: 'R' | 'G' | 'B' | 'Y' | null;
  pendingDraw: number;
  direction: 1 | -1;
  lastAction: string;
}

export interface UnoLightMove {
  type: 'play' | 'draw';
  card?: string;
  chooseColor?: 'R' | 'G' | 'B' | 'Y';
}
