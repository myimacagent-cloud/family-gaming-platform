import type { GameDefinition, MoveValidation } from '../types';
import type { DominoesState, DominoesMove } from './types';
import { DominoesBoard } from './Board';

const GAME_ID = 'dominoes';

function makeSet(): string[] {
  const dominoes: string[] = [];
  for (let a = 0; a <= 6; a++) {
    for (let b = a; b <= 6; b++) dominoes.push(`${a}-${b}`);
  }
  for (let i = dominoes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [dominoes[i], dominoes[j]] = [dominoes[j], dominoes[i]];
  }
  return dominoes;
}

function parseDomino(t: string): [number, number] {
  const [a, b] = t.split('-').map(Number);
  return [a, b];
}

function pipSum(hand: string[]): number {
  return hand.reduce((s, t) => {
    const [a, b] = parseDomino(t);
    return s + a + b;
  }, 0);
}

function canPlayDomino(t: string, left: number | null, right: number | null): boolean {
  if (left === null || right === null) return true;
  const [a, b] = parseDomino(t);
  return a === left || b === left || a === right || b === right;
}

function canAnyPlay(hand: string[], left: number | null, right: number | null): boolean {
  return hand.some((t) => canPlayDomino(t, left, right));
}

function dealForSymbols(p1: string, p2: string): Pick<DominoesState, 'boneyard' | 'hands' | 'leftEnd' | 'rightEnd' | 'chain' | 'lastAction'> {
  const set = makeSet();
  const h1 = set.splice(0, 7);
  const h2 = set.splice(0, 7);

  return {
    boneyard: set,
    hands: { [p1]: h1, [p2]: h2 },
    leftEnd: null,
    rightEnd: null,
    chain: [],
    lastAction: 'Play any domino to start the chain.',
  };
}

function ensurePrepared(state: DominoesState): DominoesState {
  if (state.players.length < 2) return state;
  const p1 = state.players[0].symbol;
  const p2 = state.players[1].symbol;
  if ((state.hands[p1]?.length ?? 0) > 0 || (state.hands[p2]?.length ?? 0) > 0) return state;

  const dealt = dealForSymbols(p1, p2);

  return {
    ...state,
    ...dealt,
    currentPlayerIndex: 0,
  };
}

function resolveBlocked(state: DominoesState): DominoesState {
  if (state.boneyard.length > 0) return state;
  const p1 = state.players[0]?.symbol;
  const p2 = state.players[1]?.symbol;
  if (!p1 || !p2) return state;

  const p1Can = canAnyPlay(state.hands[p1] || [], state.leftEnd, state.rightEnd);
  const p2Can = canAnyPlay(state.hands[p2] || [], state.leftEnd, state.rightEnd);
  if (p1Can || p2Can) return state;

  const s1 = pipSum(state.hands[p1] || []);
  const s2 = pipSum(state.hands[p2] || []);
  if (s1 === s2) return { ...state, status: 'draw', winner: null, lastAction: 'Blocked board. Draw.' };
  const winner = s1 < s2 ? p1 : p2;
  return { ...state, status: 'finished', winner, lastAction: 'Blocked board. Lowest pip sum wins.' };
}

function createInitialState(_roomCode: string): DominoesState {
  const dealt = dealForSymbols('X', 'O');
  return {
    gameType: GAME_ID,
    players: [],
    status: 'waiting',
    winner: null,
    currentPlayerIndex: 0,
    ...dealt,
  };
}

function createRestartState(currentState: DominoesState): DominoesState {
  const p1 = currentState.players[0]?.symbol || 'X';
  const p2 = currentState.players[1]?.symbol || 'O';
  const dealt = dealForSymbols(p1, p2);
  return {
    ...currentState,
    status: 'active',
    winner: null,
    currentPlayerIndex: 0,
    ...dealt,
    lastAction: 'New round started. Dominoes dealt.',
  };
}

function validateMove(inputState: DominoesState, move: DominoesMove, playerSymbol: string): MoveValidation {
  const state = ensurePrepared(inputState);
  if (state.status !== 'active') return { valid: false, error: 'Game is not active' };
  if (state.players[state.currentPlayerIndex]?.symbol !== playerSymbol) return { valid: false, error: 'Not your turn' };
  if (!move || (move.type !== 'play' && move.type !== 'draw')) return { valid: false, error: 'Invalid move' };

  if (move.type === 'draw') {
    if (state.boneyard.length === 0) return { valid: false, error: 'Boneyard empty' };
    return { valid: true };
  }

  if (!move.tile) return { valid: false, error: 'No domino selected' };
  const hand = state.hands[playerSymbol] || [];
  if (!hand.includes(move.tile)) return { valid: false, error: 'Domino not in hand' };
  if (!canPlayDomino(move.tile, state.leftEnd, state.rightEnd)) return { valid: false, error: 'Domino does not match chain ends' };
  if (state.leftEnd !== null && state.rightEnd !== null && !move.side) return { valid: false, error: 'Choose left or right side' };

  return { valid: true };
}

function applyMove(inputState: DominoesState, move: DominoesMove, playerSymbol: string): DominoesState {
  let state = ensurePrepared(inputState);
  const hands = { ...state.hands, [playerSymbol]: [...(state.hands[playerSymbol] || [])] };

  if (move.type === 'draw') {
    const boneyard = [...state.boneyard];
    const domino = boneyard.shift();
    if (domino) hands[playerSymbol].push(domino);
    state = {
      ...state,
      boneyard,
      hands,
      currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
      lastAction: `${state.players.find((p) => p.symbol === playerSymbol)?.displayName || 'Player'} drew from boneyard.`,
    };
    return resolveBlocked(state);
  }

  const domino = move.tile!;
  const [a, b] = parseDomino(domino);

  const idx = hands[playerSymbol].indexOf(domino);
  if (idx >= 0) hands[playerSymbol].splice(idx, 1);

  let left = state.leftEnd;
  let right = state.rightEnd;
  const chain = [...state.chain];

  if (left === null || right === null) {
    left = a;
    right = b;
    chain.push(domino);
  } else if (move.side === 'left') {
    if (a === left) left = b;
    else if (b === left) left = a;
    chain.unshift(domino);
  } else {
    if (a === right) right = b;
    else if (b === right) right = a;
    chain.push(domino);
  }

  if (hands[playerSymbol].length === 0) {
    return {
      ...state,
      hands,
      leftEnd: left,
      rightEnd: right,
      chain,
      status: 'finished',
      winner: playerSymbol,
      lastAction: `${state.players.find((p) => p.symbol === playerSymbol)?.displayName || 'Player'} played all dominoes and won!`,
    };
  }

  state = {
    ...state,
    hands,
    leftEnd: left,
    rightEnd: right,
    chain,
    currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
    lastAction: `${state.players.find((p) => p.symbol === playerSymbol)?.displayName || 'Player'} played ${domino}.`,
  };

  return resolveBlocked(state);
}

function checkGameEnd(state: DominoesState): { ended: boolean; winner: string | null; draw: boolean } {
  if (state.status === 'finished') return { ended: true, winner: state.winner, draw: false };
  if (state.status === 'draw') return { ended: true, winner: null, draw: true };
  return { ended: false, winner: null, draw: false };
}

export const dominoesGame: GameDefinition<DominoesState, DominoesMove> = {
  id: GAME_ID,
  displayName: '🁢 Dominoes',
  description: 'Match ends, draw when blocked, and play all dominoes to win.',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  createRestartState,
  renderBoard: DominoesBoard,
  validateMove,
  applyMove,
  checkGameEnd,
};
