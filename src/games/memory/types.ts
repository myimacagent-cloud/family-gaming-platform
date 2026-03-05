import type { BaseGameState } from '../types';

export interface MemoryState extends BaseGameState {
  gameType: 'memory';
  cards: Card[];
  flippedIndices: number[];
  matchedPairs: number;
  totalPairs: number;
  attempts: number;
  lastFlipTime: number | null;
}

export interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface MemoryMove {
  index: number;
}
