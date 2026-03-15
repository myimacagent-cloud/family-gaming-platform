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
  roundPoints: Record<string, number>;
  usedQuestionIds: string[];
  lastAction: string;
  answerLog: Array<{
    round: number;
    category: TriviaCategory;
    symbol: string;
    choiceIndex: number;
    correct: boolean;
  }>;
}

export interface TriviaDuelMove {
  type: 'submit_answer';
  choiceIndex: number;
}
