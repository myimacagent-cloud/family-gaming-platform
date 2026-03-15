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

function nextQuestion(state: TriviaDuelState): TriviaQuestion {
  const category = state.categoriesOrder[state.categoryIndex];
  return pickQuestion(category, state.round, state.usedQuestionIds);
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
    roundPoints: {},
    usedQuestionIds: [],
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
    roundPoints: Object.fromEntries(players.map((p) => [p.symbol, 0])),
    usedQuestionIds: [],
    lastAction: 'Round 1 starts! Sports, Food, General, Media, Geography — let’s go.',
    answerLog: [],
  };

  if (firstSymbol) {
    const q = nextQuestion(base);
    base.currentQuestion = q;
    base.usedQuestionIds = [q.id];
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

  if (!Number.isInteger(move.choiceIndex) || move.choiceIndex < 0 || move.choiceIndex >= state.currentQuestion.options.length) {
    return { valid: false, error: 'Pick a valid answer choice' };
  }

  return { valid: true };
}

function finishRoundOrGame(state: TriviaDuelState): TriviaDuelState {
  const p1 = state.players[0];
  const p2 = state.players[1];
  if (!p1 || !p2) return state;

  const p1Correct = state.currentRoundCorrect[p1.symbol] || 0;
  const p2Correct = state.currentRoundCorrect[p2.symbol] || 0;
  const roundPoints = { ...state.roundPoints };
  let summary = `Round ${state.round} finished: ${p1.displayName} ${p1Correct} - ${p2Correct} ${p2.displayName}. `;

  if (p1Correct > p2Correct) {
    roundPoints[p1.symbol] = (roundPoints[p1.symbol] || 0) + 1;
    summary += `${p1.displayName} gets the round point.`;
  } else if (p2Correct > p1Correct) {
    roundPoints[p2.symbol] = (roundPoints[p2.symbol] || 0) + 1;
    summary += `${p2.displayName} gets the round point.`;
  } else {
    summary += 'Round tied — no point awarded.';
  }

  if (state.round === 3) {
    const p1Points = roundPoints[p1.symbol] || 0;
    const p2Points = roundPoints[p2.symbol] || 0;

    if (p1Points === p2Points) {
      return { ...state, roundPoints, status: 'draw', winner: null, lastAction: `${summary} Final score tied ${p1Points}-${p2Points}.` };
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
  const categoriesOrder = shuffle(CATEGORIES);
  const firstSymbol = p1.symbol;

  const nextState: TriviaDuelState = {
    ...state,
    roundPoints,
    round: nextRound,
    categoryIndex: 0,
    categoriesOrder,
    currentPlayerIndex: 0,
    currentQuestionForSymbol: firstSymbol,
    currentRoundCorrect: { [p1.symbol]: 0, [p2.symbol]: 0 },
    currentQuestion: null,
    lastAction: `${summary} Round ${nextRound} starts — questions are harder now!`,
  };

  const q = nextQuestion(nextState);
  return {
    ...nextState,
    currentQuestion: q,
    usedQuestionIds: [...nextState.usedQuestionIds, q.id],
  };
}

function applyMove(state: TriviaDuelState, move: TriviaDuelMove, playerSymbol: string): TriviaDuelState {
  const question = state.currentQuestion;
  if (!question) return state;

  const correct = move.choiceIndex === question.correctIndex;
  const currentRoundCorrect = { ...state.currentRoundCorrect };
  if (correct) {
    currentRoundCorrect[playerSymbol] = (currentRoundCorrect[playerSymbol] || 0) + 1;
  }

  const answerLog = [
    ...state.answerLog,
    {
      round: state.round,
      category: question.category,
      symbol: playerSymbol,
      choiceIndex: move.choiceIndex,
      correct,
    },
  ];

  const currentPlayer = state.players[state.currentPlayerIndex];
  const playerName = currentPlayer?.displayName || 'Player';
  const resultText = correct ? 'correct ✅' : `wrong ❌ (answer: ${question.options[question.correctIndex]})`;

  const baseState: TriviaDuelState = {
    ...state,
    currentRoundCorrect,
    answerLog,
    lastAction: `${playerName} answered ${resultText}`,
  };

  // switch to second player for same category
  if (state.currentPlayerIndex === 0) {
    const nextSymbol = state.players[1]?.symbol;
    if (!nextSymbol) return baseState;

    const q = nextQuestion(baseState);
    return {
      ...baseState,
      currentPlayerIndex: 1,
      currentQuestionForSymbol: nextSymbol,
      currentQuestion: q,
      usedQuestionIds: [...baseState.usedQuestionIds, q.id],
    };
  }

  // both players answered this category
  const nextCategoryIndex = state.categoryIndex + 1;
  if (nextCategoryIndex >= CATEGORIES.length) {
    return finishRoundOrGame(baseState);
  }

  const nextSymbol = state.players[0]?.symbol;
  if (!nextSymbol) return baseState;

  const interim: TriviaDuelState = {
    ...baseState,
    categoryIndex: nextCategoryIndex,
    currentPlayerIndex: 0,
    currentQuestionForSymbol: nextSymbol,
    currentQuestion: null,
  };

  const q = nextQuestion(interim);

  return {
    ...interim,
    currentQuestion: q,
    usedQuestionIds: [...interim.usedQuestionIds, q.id],
  };
}

function checkGameEnd(state: TriviaDuelState): { ended: boolean; winner: string | null; draw: boolean } {
  if (state.status === 'finished') return { ended: true, winner: state.winner, draw: false };
  if (state.status === 'draw') return { ended: true, winner: null, draw: true };
  return { ended: false, winner: null, draw: false };
}

export const triviaDuelGame: GameDefinition<TriviaDuelState, TriviaDuelMove> = {
  id: GAME_ID,
  displayName: '🧠 Trivia Duel',
  description: '3 rounds, 5 categories, increasing difficulty. Most round points wins.',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  createRestartState,
  renderBoard: TriviaDuelBoard,
  validateMove,
  applyMove,
  checkGameEnd,
};
