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
  categoryIndex: number; // 0..4
  categoriesOrder: TriviaCategory[];
  currentQuestion: TriviaQuestion | null;
  currentQuestionForSymbol: string | null;
  currentRoundCorrect: Record<string, number>;
  currentRoundBonus: Record<string, number>;
  roundPoints: Record<string, number>;
  streaks: Record<string, number>;
  usedQuestionIds: string[];
  questionStartedAt: number | null;
  questionTimeLimitSec: number;
  suddenDeath: boolean;
  suddenDeathPair: number;
  suddenDeathResults: Record<string, boolean | null>;
  lastAction: string;
  answerLog: Array<{
    round: number;
    category: TriviaCategory;
    symbol: string;
    choiceIndex: number;
    correct: boolean;
    timedOut?: boolean;
  }>;
}

export interface TriviaDuelMove {
  type: 'submit_answer';
  // 0..3 normal answer, -1 means timed-out auto submit
  choiceIndex: number;
}
