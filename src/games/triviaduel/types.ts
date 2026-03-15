import type { BaseGameState } from '../types';

export type TriviaCategory = 'sports' | 'food' | 'general' | 'media' | 'geography';
export type TriviaDifficulty = 1 | 2 | 3;

export interface TriviaQuestion {
  id: string;
  category: TriviaCategory;
  difficulty: TriviaDifficulty;
  prompt: string;
  options: string[];
  correctIndex: number;
}

export interface TriviaDuelState extends BaseGameState {
  gameType: 'triviaduel';
  round: 1 | 2 | 3;
  categoryIndex: number;
  categoriesOrder: TriviaCategory[];
  currentQuestion: TriviaQuestion | null;
  currentRoundCorrect: Record<string, number>; // category points this round
  roundPoints: Record<string, number>; // round wins
  streaks: Record<string, number>;
  cooldownUntil: Record<string, number>;
  usedQuestionIds: string[];
  questionStartedAt: number | null;
  questionTimeLimitSec: number;
  roundIntroUntil: number;
  roundIntroText: string;
  suddenDeath: boolean;
  suddenDeathPair: number;
  suddenDeathResults: Record<string, boolean | null>;
  lastAction: string;
}

export interface TriviaDuelMove {
  type: 'submit_answer' | 'timeout_tick';
  choiceIndex?: number;
}
