import type { GameDefinition, MoveValidation } from '../types';
import type { SnakesLaddersState, SnakesLaddersMove } from './types';
import { SnakesLaddersBoard } from './Board';

const GAME_ID = 'snakesladders';

const WARP: Record<number, number> = {
  // ladders
  3: 22,
  8: 30,
  28: 84,
  58: 77,
  75: 86,
  80: 99,
  // snakes
  17: 4,
  52: 29,
  57: 40,
  62: 22,
  88: 18,
  95: 51,
  97: 79,
};

function createInitialState(_roomCode: string): SnakesLaddersState {
  return {
    gameType: GAME_ID,
    players: [],
    status: 'waiting',
    winner: null,
    currentPlayerIndex: 0,
    positions: {},
    lastRoll: 0,
    lastAction: 'Roll to begin!',
  };
}

function ensurePositions(state: SnakesLaddersState): SnakesLaddersState {
  if (state.players.length < 2) return state;
  if (Object.keys(state.positions).length > 0) return state;
  const out: Record<string, number> = {};
  for (const p of state.players) out[p.symbol] = 1;
  return { ...state, positions: out };
}

function createRestartState(currentState: SnakesLaddersState): SnakesLaddersState {
  const base = ensurePositions(currentState);
  const positions: Record<string, number> = {};
  for (const p of base.players) positions[p.symbol] = 1;

  return {
    ...base,
    status: 'active',
    winner: null,
    currentPlayerIndex: 0,
    positions,
    lastRoll: 0,
    lastAction: 'New game! Roll the die.',
  };
}

function validateMove(inputState: SnakesLaddersState, move: SnakesLaddersMove, playerSymbol: string): MoveValidation {
  const state = ensurePositions(inputState);
  if (state.status !== 'active') return { valid: false, error: 'Game is not active' };
  if (state.players[state.currentPlayerIndex]?.symbol !== playerSymbol) return { valid: false, error: 'Not your turn' };
  if (!move || move.type !== 'roll') return { valid: false, error: 'Invalid move' };
  return { valid: true };
}

function applyMove(inputState: SnakesLaddersState, _move: SnakesLaddersMove, playerSymbol: string): SnakesLaddersState {
  const state = ensurePositions(inputState);
  const positions = { ...state.positions };
  const roll = Math.floor(Math.random() * 6) + 1;

  const start = positions[playerSymbol] ?? 1;
  let next = start + roll;
  if (next > 100) next = 100;

  let action = `${state.players.find((p) => p.symbol === playerSymbol)?.displayName || 'Player'} rolled ${roll}.`;

  if (WARP[next]) {
    const warped = WARP[next];
    action += warped > next ? ` Ladder! ${next} → ${warped}.` : ` Snake! ${next} → ${warped}.`;
    next = warped;
  }

  positions[playerSymbol] = next;

  if (next >= 100) {
    return {
      ...state,
      positions,
      lastRoll: roll,
      status: 'finished',
      winner: playerSymbol,
      lastAction: `${action} Reached 100 and won!`,
    };
  }

  return {
    ...state,
    positions,
    lastRoll: roll,
    currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
    lastAction: action,
  };
}

function checkGameEnd(state: SnakesLaddersState): { ended: boolean; winner: string | null; draw: boolean } {
  if (state.status === 'finished') return { ended: true, winner: state.winner, draw: false };
  if (state.status === 'draw') return { ended: true, winner: null, draw: true };
  return { ended: false, winner: null, draw: false };
}

export const snakesLaddersGame: GameDefinition<SnakesLaddersState, SnakesLaddersMove> = {
  id: GAME_ID,
  displayName: '🐍🪜 Snakes & Ladders',
  description: 'Roll the die, climb ladders, avoid snakes. First to 100 wins!',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  createRestartState,
  renderBoard: SnakesLaddersBoard,
  validateMove,
  applyMove,
  checkGameEnd,
};
