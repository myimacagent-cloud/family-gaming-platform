import type { GameDefinition } from '../types';
import type { MarblesEvenOddMove, MarblesEvenOddState } from './types';
import { MarblesEvenOddBoard } from './Board';

const GAME_ID = 'marblesevenodd';

function parityOf(total: number): 'even' | 'odd' {
  return total % 2 === 0 ? 'even' : 'odd';
}

function createInitialState(_roomCode: string): MarblesEvenOddState {
  return {
    gameType: GAME_ID,
    players: [],
    status: 'waiting',
    winner: null,
    currentPlayerIndex: 0,
    picks: {},
    reveal: false,
    totalMarbles: null,
    winningParity: null,
  };
}

function createRestartState(currentState: MarblesEvenOddState): MarblesEvenOddState {
  return {
    ...currentState,
    status: 'active',
    winner: null,
    currentPlayerIndex: 0,
    picks: {},
    reveal: false,
    totalMarbles: null,
    winningParity: null,
  };
}

function validateMove(state: MarblesEvenOddState, move: MarblesEvenOddMove, playerSymbol: string) {
  if (state.status !== 'active') return { valid: false, error: 'Game is not active' };

  if (!move || !Number.isInteger(move.marbles) || move.marbles < 1 || move.marbles > 5) {
    return { valid: false, error: 'Pick 1 to 5 marbles' };
  }

  if (move.guess !== 'even' && move.guess !== 'odd') {
    return { valid: false, error: 'Guess must be even or odd' };
  }

  if (state.picks?.[playerSymbol]) {
    return { valid: false, error: 'You already locked your pick' };
  }

  return { valid: true };
}

function applyMove(state: MarblesEvenOddState, move: MarblesEvenOddMove, playerSymbol: string): MarblesEvenOddState {
  const picks = {
    ...(state.picks || {}),
    [playerSymbol]: { marbles: move.marbles, guess: move.guess },
  } as MarblesEvenOddState['picks'];

  const symbols = state.players.map((p) => p.symbol);
  const ready = symbols.filter((sym) => !!picks[sym]).length;
  if (ready < 2) {
    return {
      ...state,
      picks,
      reveal: false,
    };
  }

  const [symA, symB] = symbols;
  const pickA = picks[symA]!;
  const pickB = picks[symB]!;
  const totalMarbles = pickA.marbles + pickB.marbles;
  const winningParity = parityOf(totalMarbles);

  const aCorrect = pickA.guess === winningParity;
  const bCorrect = pickB.guess === winningParity;

  if (aCorrect === bCorrect) {
    return {
      ...state,
      picks,
      reveal: true,
      totalMarbles,
      winningParity,
      status: 'draw',
      winner: null,
    };
  }

  return {
    ...state,
    picks,
    reveal: true,
    totalMarbles,
    winningParity,
    status: 'finished',
    winner: aCorrect ? symA : symB,
  };
}

function checkGameEnd(state: MarblesEvenOddState): { ended: boolean; winner: string | null; draw: boolean } {
  if (state.status === 'finished') return { ended: true, winner: state.winner, draw: false };
  if (state.status === 'draw') return { ended: true, winner: null, draw: true };
  return { ended: false, winner: null, draw: false };
}

export const marblesEvenOddGame: GameDefinition<MarblesEvenOddState, MarblesEvenOddMove> = {
  id: GAME_ID,
  displayName: '⚪ Marbles: Even or Odd',
  description: 'Pick 1-5 marbles and guess if the total will be even or odd.',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  createRestartState,
  renderBoard: MarblesEvenOddBoard,
  validateMove,
  applyMove,
  checkGameEnd,
};
