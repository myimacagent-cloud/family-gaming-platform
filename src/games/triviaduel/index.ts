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
  const preferred = TRIVIA_QUESTIONS.filter((q) => q.category === category && q.difficulty === difficulty && !usedIds.includes(q.id));
  if (preferred.length > 0) return preferred[Math.floor(Math.random() * preferred.length)];

  const fallback = TRIVIA_QUESTIONS.filter((q) => q.category === category && !usedIds.includes(q.id));
  if (fallback.length > 0) return fallback[Math.floor(Math.random() * fallback.length)];

  const any = TRIVIA_QUESTIONS.filter((q) => q.category === category);
  return any[Math.floor(Math.random() * any.length)];
}

function getQuestionForState(state: TriviaDuelState): TriviaQuestion {
  const category = state.suddenDeath
    ? CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]
    : state.categoriesOrder[state.categoryIndex];
  const difficulty = state.suddenDeath ? 3 : state.round;
  return pickQuestion(category, difficulty, state.usedQuestionIds);
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
    currentQuestionForSymbol: null,
    currentRoundCorrect: {},
    currentRoundBonus: {},
    roundPoints: {},
    streaks: {},
    usedQuestionIds: [],
    questionStartedAt: null,
    questionTimeLimitSec: 15,
    suddenDeath: false,
    suddenDeathPair: 0,
    suddenDeathResults: {},
    lastAction: 'Trivia Duel: 3 rounds, 5 categories each round. Most correct in a round gets 1 point!',
    answerLog: [],
  };
}

function createRestartState(currentState: TriviaDuelState): TriviaDuelState {
  const categoriesOrder = shuffle(CATEGORIES);
  const players = currentState.players;
  const firstSymbol = players[0]?.symbol || null;

  const base: TriviaDuelState = {
    ...currentState,
    status: 'active',
    winner: null,
    currentPlayerIndex: 0,
    round: 1,
    categoryIndex: 0,
    categoriesOrder,
    currentQuestion: null,
    currentQuestionForSymbol: firstSymbol,
    currentRoundCorrect: Object.fromEntries(players.map((p) => [p.symbol, 0])),
    currentRoundBonus: Object.fromEntries(players.map((p) => [p.symbol, 0])),
    roundPoints: Object.fromEntries(players.map((p) => [p.symbol, 0])),
    streaks: Object.fromEntries(players.map((p) => [p.symbol, 0])),
    usedQuestionIds: [],
    questionStartedAt: null,
    questionTimeLimitSec: 15,
    suddenDeath: false,
    suddenDeathPair: 0,
    suddenDeathResults: Object.fromEntries(players.map((p) => [p.symbol, null])),
    lastAction: 'Round 1 starts! Sports, Food, General, TV/Movies/Anime, Geography — let’s go.',
    answerLog: [],
  };

  if (firstSymbol) {
    const q = getQuestionForState(base);
    base.currentQuestion = q;
    base.usedQuestionIds = [q.id];
    base.questionStartedAt = Date.now();
  }

  return base;
}

function validateMove(state: TriviaDuelState, move: TriviaDuelMove, playerSymbol: string): MoveValidation {
  if (state.status !== 'active') return { valid: false, error: 'Game is not active' };
  if (!move || move.type !== 'submit_answer') return { valid: false, error: 'Invalid move' };

  const current = state.players[state.currentPlayerIndex];
  if (current?.symbol !== playerSymbol) return { valid: false, error: 'Not your turn' };
  if (state.currentQuestionForSymbol !== playerSymbol) return { valid: false, error: 'Wait for your question' };
  if (!state.currentQuestion) return { valid: false, error: 'Question not ready' };

  const elapsedMs = state.questionStartedAt ? Date.now() - state.questionStartedAt : 0;
  const timedOut = elapsedMs > state.questionTimeLimitSec * 1000;

  if (timedOut && move.choiceIndex !== -1) {
    return { valid: false, error: 'Time is up for this question' };
  }

  if (!Number.isInteger(move.choiceIndex)) return { valid: false, error: 'Pick a valid answer choice' };
  if (move.choiceIndex === -1) return { valid: true };

  if (move.choiceIndex < 0 || move.choiceIndex >= state.currentQuestion.options.length) {
    return { valid: false, error: 'Pick a valid answer choice' };
  }

  return { valid: true };
}

function launchQuestion(state: TriviaDuelState, forSymbol: string, currentPlayerIndex: number): TriviaDuelState {
  const q = getQuestionForState(state);
  return {
    ...state,
    currentPlayerIndex,
    currentQuestionForSymbol: forSymbol,
    currentQuestion: q,
    usedQuestionIds: [...state.usedQuestionIds, q.id],
    questionStartedAt: Date.now(),
  };
}

function finishRoundOrGame(state: TriviaDuelState): TriviaDuelState {
  const p1 = state.players[0];
  const p2 = state.players[1];
  if (!p1 || !p2) return state;

  const p1Score = (state.currentRoundCorrect[p1.symbol] || 0) + (state.currentRoundBonus[p1.symbol] || 0);
  const p2Score = (state.currentRoundCorrect[p2.symbol] || 0) + (state.currentRoundBonus[p2.symbol] || 0);
  const roundPoints = { ...state.roundPoints };

  let summary = `Round ${state.round} finished: ${p1.displayName} ${p1Score} - ${p2Score} ${p2.displayName}. `;

  if (p1Score > p2Score) {
    roundPoints[p1.symbol] = (roundPoints[p1.symbol] || 0) + 1;
    summary += `${p1.displayName} gets the round point.`;
  } else if (p2Score > p1Score) {
    roundPoints[p2.symbol] = (roundPoints[p2.symbol] || 0) + 1;
    summary += `${p2.displayName} gets the round point.`;
  } else {
    summary += 'Round tied — no point awarded.';
  }

  if (state.round === 3) {
    const p1Points = roundPoints[p1.symbol] || 0;
    const p2Points = roundPoints[p2.symbol] || 0;

    if (p1Points === p2Points) {
      const tieState: TriviaDuelState = {
        ...state,
        roundPoints,
        suddenDeath: true,
        suddenDeathPair: 1,
        suddenDeathResults: { [p1.symbol]: null, [p2.symbol]: null },
        lastAction: `${summary} Final score tied ${p1Points}-${p2Points}. Sudden death starts!`,
      };
      return launchQuestion(tieState, p1.symbol, 0);
    }

    const winner = p1Points > p2Points ? p1.symbol : p2.symbol;
    const winnerName = winner === p1.symbol ? p1.displayName : p2.displayName;

    return {
      ...state,
      roundPoints,
      status: 'finished',
      winner,
      lastAction: `${summary} ${winnerName} wins Trivia Duel ${Math.max(p1Points, p2Points)}-${Math.min(p1Points, p2Points)}!`,
    };
  }

  const nextRound = (state.round + 1) as 1 | 2 | 3;
  const nextState: TriviaDuelState = {
    ...state,
    roundPoints,
    round: nextRound,
    categoryIndex: 0,
    categoriesOrder: shuffle(CATEGORIES),
    currentRoundCorrect: { [p1.symbol]: 0, [p2.symbol]: 0 },
    currentRoundBonus: { [p1.symbol]: 0, [p2.symbol]: 0 },
    streaks: { [p1.symbol]: 0, [p2.symbol]: 0 },
    lastAction: `${summary} Round ${nextRound} starts — questions are harder now!`,
  };

  return launchQuestion(nextState, p1.symbol, 0);
}

function applySuddenDeathProgress(state: TriviaDuelState): TriviaDuelState {
  const p1 = state.players[0];
  const p2 = state.players[1];
  if (!p1 || !p2) return state;

  const r1 = state.suddenDeathResults[p1.symbol];
  const r2 = state.suddenDeathResults[p2.symbol];

  if (r1 === null) {
    return launchQuestion(state, p2.symbol, 1);
  }

  if (r2 === null) {
    return launchQuestion(state, p2.symbol, 1);
  }

  if (r1 && !r2) {
    return { ...state, status: 'finished', winner: p1.symbol, lastAction: `${p1.displayName} wins in sudden death!` };
  }
  if (r2 && !r1) {
    return { ...state, status: 'finished', winner: p2.symbol, lastAction: `${p2.displayName} wins in sudden death!` };
  }

  const nextPair = state.suddenDeathPair + 1;
  const resetState: TriviaDuelState = {
    ...state,
    suddenDeathPair: nextPair,
    suddenDeathResults: { [p1.symbol]: null, [p2.symbol]: null },
    lastAction: `Sudden death ${nextPair}: both matched again. Next question pair!`,
  };

  return launchQuestion(resetState, p1.symbol, 0);
}

function applyMove(state: TriviaDuelState, move: TriviaDuelMove, playerSymbol: string): TriviaDuelState {
  const question = state.currentQuestion;
  if (!question) return state;

  const timedOut = move.choiceIndex === -1;
  const correct = !timedOut && move.choiceIndex === question.correctIndex;

  const currentRoundCorrect = { ...state.currentRoundCorrect };
  const currentRoundBonus = { ...state.currentRoundBonus };
  const streaks = { ...state.streaks };

  if (correct) {
    currentRoundCorrect[playerSymbol] = (currentRoundCorrect[playerSymbol] || 0) + 1;
    streaks[playerSymbol] = (streaks[playerSymbol] || 0) + 1;

    // streak bonus: every consecutive correct answer after first grants +1 bonus
    if ((streaks[playerSymbol] || 0) >= 2) {
      currentRoundBonus[playerSymbol] = (currentRoundBonus[playerSymbol] || 0) + 1;
    }
  } else {
    streaks[playerSymbol] = 0;
  }

  const answerLog = [
    ...state.answerLog,
    {
      round: state.round,
      category: question.category,
      symbol: playerSymbol,
      choiceIndex: move.choiceIndex,
      correct,
      timedOut,
    },
  ];

  const currentPlayer = state.players[state.currentPlayerIndex];
  const playerName = currentPlayer?.displayName || 'Player';
  const resultText = timedOut
    ? 'timed out ⏱️'
    : correct
      ? 'correct ✅'
      : `wrong ❌ (answer: ${question.options[question.correctIndex]})`;

  let baseState: TriviaDuelState = {
    ...state,
    currentRoundCorrect,
    currentRoundBonus,
    streaks,
    answerLog,
    questionStartedAt: null,
    lastAction: `${playerName} answered ${resultText}`,
  };

  if (state.suddenDeath) {
    const suddenDeathResults = { ...baseState.suddenDeathResults, [playerSymbol]: correct };
    baseState = { ...baseState, suddenDeathResults };

    if (state.currentPlayerIndex === 0) {
      return launchQuestion(baseState, state.players[1].symbol, 1);
    }

    return applySuddenDeathProgress(baseState);
  }

  // normal mode: switch to second player for same category
  if (state.currentPlayerIndex === 0) {
    const nextSymbol = state.players[1]?.symbol;
    if (!nextSymbol) return baseState;
    return launchQuestion(baseState, nextSymbol, 1);
  }

  // both players answered this category
  const nextCategoryIndex = state.categoryIndex + 1;
  if (nextCategoryIndex >= CATEGORIES.length) {
    return finishRoundOrGame(baseState);
  }

  const interim: TriviaDuelState = {
    ...baseState,
    categoryIndex: nextCategoryIndex,
    lastAction: `${baseState.lastAction} Next category up!`,
  };

  return launchQuestion(interim, state.players[0].symbol, 0);
}

function checkGameEnd(state: TriviaDuelState): { ended: boolean; winner: string | null; draw: boolean } {
  if (state.status === 'finished') return { ended: true, winner: state.winner, draw: false };
  if (state.status === 'draw') return { ended: true, winner: null, draw: true };
  return { ended: false, winner: null, draw: false };
}

export const triviaDuelGame: GameDefinition<TriviaDuelState, TriviaDuelMove> = {
  id: GAME_ID,
  displayName: '🧠 Trivia Duel',
  description: '3 rounds, 5 categories, timer + streak bonus + sudden death tie-breaker.',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  createRestartState,
  renderBoard: TriviaDuelBoard,
  validateMove,
  applyMove,
  checkGameEnd,
};
