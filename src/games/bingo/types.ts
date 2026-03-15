import type { BaseGameState } from '../types';

export interface BingoState extends BaseGameState {
  gameType: 'bingo';
  boards: Record<string, number[]>; // symbol -> 25 numbers
  marked: Record<string, boolean[]>; // symbol -> 25 flags
  calledNumbers: number[];
  lastCalled: number | null;
  pendingCall: boolean;
  lastAction: string;
}

export interface BingoMove {
  type: 'call' | 'mark';
  index?: number;
}
