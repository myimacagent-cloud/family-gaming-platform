import type { GameDefinition, MoveValidation } from '../types';
import type { AirHockeyState, AirHockeyMove } from './types';
import { AirHockeyBoard } from './Board';

const GAME_ID = 'airhockey';
const ROWS = 5;
const COLS = 9;
const CENTER_ROW = Math.floor(ROWS / 2);
const CENTER_COL = Math.floor(COLS / 2);

function createInitialState(_roomCode: string): AirHockeyState {
  return {
    gameType: GAME_ID,
    players: [],
    status: 'waiting',
    winner: null,
    currentPlayerIndex: 0,
    rows: ROWS,
    cols: COLS,
    puckRow: CENTER_ROW,
    puckCol: CENTER_COL,
    holder: null,
    goalieRows: {},
    scores: {},
    targetScore: 3,
    round: 1,
  };
}

function hydrateState(state: AirHockeyState): AirHockeyState {
  const players = state.players;
  if (players.length < 2) return state;

  const [p1, p2] = players;
  const goalieRows = { ...state.goalieRows };
  if (typeof goalieRows[p1.symbol] !== 'number') goalieRows[p1.symbol] = CENTER_ROW;
  if (typeof goalieRows[p2.symbol] !== 'number') goalieRows[p2.symbol] = CENTER_ROW;

  const scores = { ...state.scores };
  if (typeof scores[p1.symbol] !== 'number') scores[p1.symbol] = 0;
  if (typeof scores[p2.symbol] !== 'number') scores[p2.symbol] = 0;

  const holder = state.holder || p1.symbol;
  const currentPlayerIndex = players.findIndex((p) => p.symbol === holder);

  return {
    ...state,
    goalieRows,
    scores,
    holder,
    currentPlayerIndex: currentPlayerIndex >= 0 ? currentPlayerIndex : 0,
  };
}

function createRestartState(currentState: AirHockeyState): AirHockeyState {
  const base = hydrateState(currentState);
  const p1 = base.players[0]?.symbol || 'X';
  const p2 = base.players[1]?.symbol || 'O';

  return {
    ...base,
    status: 'active',
    winner: null,
    currentPlayerIndex: 0,
    puckRow: CENTER_ROW,
    puckCol: CENTER_COL,
    holder: p1,
    goalieRows: {
      [p1]: CENTER_ROW,
      [p2]: CENTER_ROW,
    },
    scores: {
      [p1]: 0,
      [p2]: 0,
    },
    round: 1,
  };
}

function validateMove(inputState: AirHockeyState, move: AirHockeyMove, playerSymbol: string): MoveValidation {
  const state = hydrateState(inputState);
  if (state.status !== 'active') return { valid: false, error: 'Game is not active' };

  if (state.holder !== playerSymbol) return { valid: false, error: 'You can only shoot when you control the puck' };

  if (!move || typeof move.shotRow !== 'number' || typeof move.guardRow !== 'number') {
    return { valid: false, error: 'Invalid move' };
  }

  if (move.shotRow < 0 || move.shotRow >= state.rows || move.guardRow < 0 || move.guardRow >= state.rows) {
    return { valid: false, error: 'Shot/guard row out of bounds' };
  }

  return { valid: true };
}

function applyMove(inputState: AirHockeyState, move: AirHockeyMove, playerSymbol: string): AirHockeyState {
  const state = hydrateState(inputState);
  const opponent = state.players.find((p) => p.symbol !== playerSymbol)?.symbol;
  if (!opponent) return state;

  const goalieRows = { ...state.goalieRows, [playerSymbol]: move.guardRow };
  const scores = { ...state.scores };

  const isSaved = goalieRows[opponent] === move.shotRow;

  if (isSaved) {
    return {
      ...state,
      goalieRows,
      holder: opponent,
      currentPlayerIndex: state.players.findIndex((p) => p.symbol === opponent),
      puckRow: move.shotRow,
      puckCol: CENTER_COL,
      round: state.round + 1,
    };
  }

  scores[playerSymbol] = (scores[playerSymbol] || 0) + 1;
  const reachedTarget = scores[playerSymbol] >= state.targetScore;

  return {
    ...state,
    goalieRows,
    scores,
    status: reachedTarget ? 'finished' : 'active',
    winner: reachedTarget ? playerSymbol : null,
    holder: opponent,
    currentPlayerIndex: state.players.findIndex((p) => p.symbol === opponent),
    puckRow: CENTER_ROW,
    puckCol: CENTER_COL,
    round: state.round + 1,
  };
}

function checkGameEnd(state: AirHockeyState): { ended: boolean; winner: string | null; draw: boolean } {
  if (state.status === 'finished') return { ended: true, winner: state.winner, draw: false };
  if (state.status === 'draw') return { ended: true, winner: null, draw: true };
  return { ended: false, winner: null, draw: false };
}

export const airHockeyGame: GameDefinition<AirHockeyState, AirHockeyMove> = {
  id: GAME_ID,
  displayName: '🏒 Air Hockey',
  description: 'Take shots by row, set your guard row, and race to 3 goals.',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  createRestartState,
  renderBoard: AirHockeyBoard,
  validateMove,
  applyMove,
  checkGameEnd,
};
