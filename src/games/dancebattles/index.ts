import type { GameDefinition, MoveValidation } from '../types';
import type { DanceBattlesState, DanceBattlesMove } from './types';
import { DanceBattlesBoard } from './Board';

const GAME_ID = 'dancebattles';

const MOVE_POWER: Record<string, number> = {
  wave: 2,
  spin: 3,
  slide: 2,
  moonwalk: 4,
  poplock: 3,
  freeze: 5,
  shuffle: 2,
  flare: 5,
};

function normalizeMove(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, '');
}

function power(move: string): number {
  return MOVE_POWER[normalizeMove(move)] ?? 2;
}

function createInitialState(_roomCode: string): DanceBattlesState {
  return {
    gameType: GAME_ID,
    players: [],
    status: 'waiting',
    winner: null,
    currentPlayerIndex: 0,
    round: 1,
    maxRounds: 5,
    moves: {},
    scores: {},
    lastAction: 'Pick your dance move and battle!',
  };
}

function createRestartState(currentState: DanceBattlesState): DanceBattlesState {
  const scores: Record<string, number> = {};
  const moves: Record<string, string | null> = {};
  for (const p of currentState.players) {
    scores[p.symbol] = 0;
    moves[p.symbol] = null;
  }
  return {
    ...currentState,
    status: 'active',
    winner: null,
    currentPlayerIndex: 0,
    round: 1,
    maxRounds: 5,
    scores,
    moves,
    lastAction: 'Round 1 — submit your move!',
  };
}

function validateMove(state: DanceBattlesState, move: DanceBattlesMove, playerSymbol: string): MoveValidation {
  if (state.status !== 'active') return { valid: false, error: 'Game is not active' };
  if (state.players[state.currentPlayerIndex]?.symbol !== playerSymbol) return { valid: false, error: 'Not your turn' };
  if (!move || move.type !== 'submit_move' || !move.move?.trim()) return { valid: false, error: 'Enter a dance move' };
  return { valid: true };
}

function applyMove(state: DanceBattlesState, move: DanceBattlesMove, playerSymbol: string): DanceBattlesState {
  const moves = { ...state.moves, [playerSymbol]: move.move };
  const players = state.players;
  const nextIndex = (state.currentPlayerIndex + 1) % players.length;

  // wait until both players submit for this round
  const allSubmitted = players.every((p) => !!moves[p.symbol]);
  if (!allSubmitted) {
    return {
      ...state,
      moves,
      currentPlayerIndex: nextIndex,
      lastAction: `${players.find((p) => p.symbol === playerSymbol)?.displayName || 'Player'} locked in a move!`,
    };
  }

  const [p1, p2] = players;
  const m1 = moves[p1.symbol] || '';
  const m2 = moves[p2.symbol] || '';
  const s1 = power(m1) + Math.floor(Math.random() * 3);
  const s2 = power(m2) + Math.floor(Math.random() * 3);

  const scores = { ...state.scores };
  if (s1 > s2) scores[p1.symbol] = (scores[p1.symbol] || 0) + 1;
  else if (s2 > s1) scores[p2.symbol] = (scores[p2.symbol] || 0) + 1;

  const nextRound = state.round + 1;
  if (nextRound > state.maxRounds) {
    const p1Score = scores[p1.symbol] || 0;
    const p2Score = scores[p2.symbol] || 0;
    const winner = p1Score === p2Score ? null : p1Score > p2Score ? p1.symbol : p2.symbol;
    return {
      ...state,
      scores,
      moves: { [p1.symbol]: null, [p2.symbol]: null },
      status: winner ? 'finished' : 'draw',
      winner,
      lastAction: winner
        ? `${players.find((p) => p.symbol === winner)?.displayName || 'Player'} wins the dance battle!`
        : 'Dance battle ended in a tie!',
    };
  }

  return {
    ...state,
    scores,
    moves: { [p1.symbol]: null, [p2.symbol]: null },
    round: nextRound,
    currentPlayerIndex: 0,
    lastAction: `Round ${state.round}: ${m1} vs ${m2}. Next round!`,
  };
}

function checkGameEnd(state: DanceBattlesState): { ended: boolean; winner: string | null; draw: boolean } {
  if (state.status === 'finished') return { ended: true, winner: state.winner, draw: false };
  if (state.status === 'draw') return { ended: true, winner: null, draw: true };
  return { ended: false, winner: null, draw: false };
}

export const danceBattlesGame: GameDefinition<DanceBattlesState, DanceBattlesMove> = {
  id: GAME_ID,
  displayName: '🕺 Dance Battles',
  description: 'Submit dance moves, win rounds, and take the crown!',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  createRestartState,
  renderBoard: DanceBattlesBoard,
  validateMove,
  applyMove,
  checkGameEnd,
};
