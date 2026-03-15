import type { GameDefinition, MoveValidation } from '../types';
import type { TriviaDuelState, TriviaDuelMove, TriviaCategory, TriviaQuestion } from './types';
import { TriviaDuelBoard } from './Board';
import { TRIVIA_QUESTIONS } from './questions';

const GAME_ID = 'triviaduel';
const CATEGORIES: TriviaCategory[] = ['sports', 'food', 'general', 'media', 'geography'];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickQuestion(category: TriviaCategory, difficulty: 1 | 2 | 3, usedIds: string[]): TriviaQuestion {
  const filtered = TRIVIA_QUESTIONS.filter((q) => q.category === category && q.difficulty === difficulty && !usedIds.includes(q.id));
  if (filtered.length > 0) return filtered[Math.floor(Math.random() * filtered.length)];
  const fallback = TRIVIA_QUESTIONS.filter((q) => q.category === category);
  return fallback[Math.floor(Math.random() * fallback.length)];
}

function pickCurrentQuestion(state: TriviaDuelState): TriviaQuestion {
  const category = state.suddenDeath
    ? CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]
    : state.categoriesOrder[state.categoryIndex];
  const difficulty = state.suddenDeath ? 3 : state.round;
  return pickQuestion(category, difficulty, state.usedQuestionIds);
}

function withRoundIntro(state: TriviaDuelState, text: string): TriviaDuelState {
  const now = Date.now();
  const q = pickCurrentQuestion(state);
  return {
    ...state,
    currentQuestion: q,
    usedQuestionIds: [...state.usedQuestionIds, q.id],
    questionStartedAt: now + 2000,
    roundIntroUntil: now + 2000,
    roundIntroText: text,
  };
}

function createInitialState(_roomCode: string): TriviaDuelState {
  return {
    gameType: GAME_ID,
    players: [],
    status: 'waiting',
    winner: null,
    currentPlayerIndex: 0,
    round: 1,
    categoryIndex: 0,
    categoriesOrder: CATEGORIES,
    currentQuestion: null,
    currentRoundCorrect: {},
    roundPoints: {},
    streaks: {},
    cooldownUntil: {},
    usedQuestionIds: [],
    questionStartedAt: null,
    questionTimeLimitSec: 15,
    roundIntroUntil: 0,
    roundIntroText: '',
    suddenDeath: false,
    suddenDeathPair: 0,
    suddenDeathResults: {},
    lastAction: 'Trivia Duel starting...',
  };
}

function createRestartState(currentState: TriviaDuelState): TriviaDuelState {
  const players = currentState.players;
  const base: TriviaDuelState = {
    ...currentState,
    status: 'active',
    winner: null,
    round: 1,
    categoryIndex: 0,
    categoriesOrder: shuffle(CATEGORIES),
    currentQuestion: null,
    currentRoundCorrect: Object.fromEntries(players.map((p) => [p.symbol, 0])),
    roundPoints: Object.fromEntries(players.map((p) => [p.symbol, 0])),
    streaks: Object.fromEntries(players.map((p) => [p.symbol, 0])),
    cooldownUntil: Object.fromEntries(players.map((p) => [p.symbol, 0])),
    usedQuestionIds: [],
    questionStartedAt: null,
    questionTimeLimitSec: 15,
    roundIntroUntil: 0,
    roundIntroText: '',
    suddenDeath: false,
    suddenDeathPair: 0,
    suddenDeathResults: Object.fromEntries(players.map((p) => [p.symbol, null])),
    lastAction: 'Round 1 begins!',
  };
  return withRoundIntro(base, 'ROUND 1\nEveryone answers the same question. Fastest correct gets the category point.');
}

function canAnswer(state: TriviaDuelState, symbol: string): MoveValidation {
  if (state.status !== 'active') return { valid: false, error: 'Game is not active' };
  if (!state.currentQuestion) return { valid: false, error: 'No question active' };
  const now = Date.now();
  if (state.roundIntroUntil > now) return { valid: false, error: 'Round intro in progress' };
  if (state.questionStartedAt && now < state.questionStartedAt) return { valid: false, error: 'Question not started yet' };
  if ((state.cooldownUntil[symbol] || 0) > now) return { valid: false, error: 'Cooldown active' };
  return { valid: true };
}

function validateMove(state: TriviaDuelState, move: TriviaDuelMove, playerSymbol: string): MoveValidation {
  if (!move || (move.type !== 'submit_answer' && move.type !== 'timeout_tick')) return { valid: false, error: 'Invalid move' };

  if (move.type === 'timeout_tick') {
    if (!state.questionStartedAt || Date.now() < state.questionStartedAt + state.questionTimeLimitSec * 1000) {
      return { valid: false, error: 'Question not timed out yet' };
    }
    return { valid: true };
  }

  const base = canAnswer(state, playerSymbol);
  if (!base.valid) return base;

  if (!Number.isInteger(move.choiceIndex)) return { valid: false, error: 'Invalid answer choice' };
  if ((move.choiceIndex as number) < 0 || (move.choiceIndex as number) >= (state.currentQuestion?.options.length || 0)) {
    return { valid: false, error: 'Invalid answer choice' };
  }
  return { valid: true };
}

function startNextCategory(state: TriviaDuelState): TriviaDuelState {
  if (state.suddenDeath) {
    const next = {
      ...state,
      suddenDeathPair: state.suddenDeathPair + 1,
      suddenDeathResults: Object.fromEntries(state.players.map((p) => [p.symbol, null])),
    };
    return withRoundIntro(next, `SUDDEN DEATH ${next.suddenDeathPair}\nFirst unique correct wins!`);
  }

  const nextCategory = state.categoryIndex + 1;
  if (nextCategory < CATEGORIES.length) {
    const next = { ...state, categoryIndex: nextCategory };
    return withRoundIntro(next, `Category ${nextCategory + 1}/5\n${next.categoriesOrder[nextCategory]}`);
  }

  return finishRound(state);
}

function finishRound(state: TriviaDuelState): TriviaDuelState {
  const [p1, p2] = state.players;
  if (!p1 || !p2) return state;

  const s1 = state.currentRoundCorrect[p1.symbol] || 0;
  const s2 = state.currentRoundCorrect[p2.symbol] || 0;
  const roundPoints = { ...state.roundPoints };

  let roundWinnerText = 'Round tied.';
  if (s1 > s2) {
    roundPoints[p1.symbol] = (roundPoints[p1.symbol] || 0) + 1;
    roundWinnerText = `${p1.displayName} won this round.`;
  } else if (s2 > s1) {
    roundPoints[p2.symbol] = (roundPoints[p2.symbol] || 0) + 1;
    roundWinnerText = `${p2.displayName} won this round.`;
  }

  if (state.round === 3) {
    const rp1 = roundPoints[p1.symbol] || 0;
    const rp2 = roundPoints[p2.symbol] || 0;
    if (rp1 === rp2) {
      const tied = {
        ...state,
        roundPoints,
        suddenDeath: true,
        suddenDeathPair: 1,
        suddenDeathResults: { [p1.symbol]: null, [p2.symbol]: null },
        lastAction: `Game tied ${rp1}-${rp2}. Sudden death!`,
      };
      return withRoundIntro(tied, `SUDDEN DEATH\n${roundWinnerText}`);
    }
    const winner = rp1 > rp2 ? p1.symbol : p2.symbol;
    return {
      ...state,
      roundPoints,
      status: 'finished',
      winner,
      lastAction: `${roundWinnerText} Game over.`,
    };
  }

  const nextRound = (state.round + 1) as 1 | 2 | 3;
  const difficultyText = nextRound === 2 ? 'On to MEDIUM round' : 'On to HARD round';
  const next = {
    ...state,
    roundPoints,
    round: nextRound,
    categoryIndex: 0,
    categoriesOrder: shuffle(CATEGORIES),
    currentRoundCorrect: { [p1.symbol]: 0, [p2.symbol]: 0 },
    streaks: { [p1.symbol]: 0, [p2.symbol]: 0 },
    cooldownUntil: { [p1.symbol]: 0, [p2.symbol]: 0 },
    lastAction: `${roundWinnerText} ${difficultyText}.`,
  };

  return withRoundIntro(next, `ROUND ${nextRound}\n${roundWinnerText} ${difficultyText}`);
}

function applyMove(state: TriviaDuelState, move: TriviaDuelMove, playerSymbol: string): TriviaDuelState {
  // timeout path
  if (move.type === 'timeout_tick') {
    return startNextCategory({ ...state, streaks: Object.fromEntries(state.players.map((p) => [p.symbol, 0])) });
  }

  const question = state.currentQuestion;
  if (!question) return state;

  const now = Date.now();
  const isCorrect = (move.choiceIndex as number) === question.correctIndex;

  if (!isCorrect) {
    return {
      ...state,
      cooldownUntil: { ...state.cooldownUntil, [playerSymbol]: now + 2000 },
      streaks: { ...state.streaks, [playerSymbol]: 0 },
      lastAction: `${state.players.find((p) => p.symbol === playerSymbol)?.displayName || 'Player'} missed — 2s cooldown.`,
    };
  }

  // correct answer wins category immediately (fastest correct because first processed)
  const updated: TriviaDuelState = {
    ...state,
    currentRoundCorrect: {
      ...state.currentRoundCorrect,
      [playerSymbol]: (state.currentRoundCorrect[playerSymbol] || 0) + 1,
    },
    streaks: {
      ...state.streaks,
      [playerSymbol]: (state.streaks[playerSymbol] || 0) + 1,
    },
    lastAction: `${state.players.find((p) => p.symbol === playerSymbol)?.displayName || 'Player'} answered first and won this category point!`,
  };

  if (state.suddenDeath) {
    const results = { ...updated.suddenDeathResults, [playerSymbol]: true };
    return {
      ...updated,
      status: 'finished',
      winner: playerSymbol,
      suddenDeathResults: results,
      lastAction: `${state.players.find((p) => p.symbol === playerSymbol)?.displayName || 'Player'} won sudden death!`,
    };
  }

  return startNextCategory(updated);
}

function checkGameEnd(state: TriviaDuelState): { ended: boolean; winner: string | null; draw: boolean } {
  if (state.status === 'finished') return { ended: true, winner: state.winner, draw: false };
  if (state.status === 'draw') return { ended: true, winner: null, draw: true };
  return { ended: false, winner: null, draw: false };
}

export const triviaDuelGame: GameDefinition<TriviaDuelState, TriviaDuelMove> = {
  id: GAME_ID,
  displayName: '🧠 Trivia Duel',
  description: 'Simultaneous answers, cooldowns, round intros, and sudden death tie-breaker.',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  createRestartState,
  renderBoard: TriviaDuelBoard,
  validateMove,
  applyMove,
  checkGameEnd,
};
