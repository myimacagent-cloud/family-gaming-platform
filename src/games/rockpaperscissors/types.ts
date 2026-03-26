import type { BaseGameState } from '../types';

export type RpsChoice = 'rock' | 'paper' | 'scissors';

export interface RpsState extends BaseGameState {
  gameType: 'rockpaperscissors';
  // Symbol -> choice for current round
  picks: Record<string, RpsChoice | null>;
  // Reveal choices after round ends
  reveal: boolean;
}

export interface RpsMove {
  choice: RpsChoice;
}

export function determineWinner(a: RpsChoice, b: RpsChoice): 0 | 1 | -1 {
  if (a === b) return 0;

  const beats: Record<RpsChoice, RpsChoice> = {
    rock: 'scissors',
    paper: 'rock',
    scissors: 'paper',
  };

  return beats[a] === b ? 1 : -1;
}
