import type { GameDefinition } from '../types';
import type { RpsState, RpsMove } from './types';
import { determineWinner } from './types';
import { RpsBoard } from './Board';

const GAME_ID = 'rockpaperscissors';

function createInitialState(_roomCode: string): RpsState {
  return {
    gameType: GAME_ID,
    players: [],
    status: 'waiting',
    winner: null,
    currentPlayerIndex: 0,
    picks: {},
    reveal: false,
  };
}

function createRestartState(currentState: RpsState): RpsState {
  return {
    ...currentState,
    status: 'active',
    winner: null,
    picks: {},
    reveal: false,
    currentPlayerIndex: 0,
  };
}

function validateMove(state: RpsState, move: RpsMove, playerSymbol: string) {
  if (state.status !== 'active') {
    return { valid: false, error: 'Game is not active' };
  }

  if (!move || !['rock', 'paper', 'scissors'].includes(move.choice)) {
    return { valid: false, error: 'Invalid choice' };
  }

  if (state.picks?.[playerSymbol]) {
    return { valid: false, error: 'You already picked this round' };
  }

  return { valid: true };
}

function applyMove(state: RpsState, move: RpsMove, playerSymbol: string): RpsState {
  const picks = {
    ...(state.picks || {}),
    [playerSymbol]: move.choice,
  } as RpsState['picks'];

  const symbols = state.players.map((p) => p.symbol);
  const chosenCount = symbols.filter((sym) => !!picks[sym]).length;

  // Wait until both players choose.
  if (chosenCount < 2) {
    return {
      ...state,
      picks,
      reveal: false,
    };
  }

  const [symA, symB] = symbols;
  const pickA = picks[symA]!;
  const pickB = picks[symB]!;
  const result = determineWinner(pickA, pickB);

  if (result === 0) {
    return {
      ...state,
      picks,
      reveal: true,
      status: 'draw',
      winner: null,
    };
  }

  return {
    ...state,
    picks,
    reveal: true,
    status: 'finished',
    winner: result === 1 ? symA : symB,
  };
}

function checkGameEnd(state: RpsState): { ended: boolean; winner: string | null; draw: boolean } {
  if (state.status === 'finished') {
    return { ended: true, winner: state.winner, draw: false };
  }
  if (state.status === 'draw') {
    return { ended: true, winner: null, draw: true };
  }
  return { ended: false, winner: null, draw: false };
}

export const rockPaperScissorsGame: GameDefinition<RpsState, RpsMove> = {
  id: GAME_ID,
  displayName: '✊ Rock Paper Scissors',
  description: 'Pick your move. Both reveals happen when everyone locks in.',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  createRestartState,
  renderBoard: RpsBoard,
  validateMove,
  applyMove,
  checkGameEnd,
};
