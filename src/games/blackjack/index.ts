import type { GameDefinition, MoveValidation } from '../types';
import type { BlackjackState, BlackjackMove } from './types';
import { BlackjackBoard } from './Board';

const GAME_ID = 'blackjack';

function makeDeck(): number[] {
  const deck: number[] = [];
  for (let s = 0; s < 4; s++) {
    for (let r = 1; r <= 13; r++) deck.push(r);
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function cardValue(rank: number): number {
  if (rank === 1) return 11;
  if (rank >= 10) return 10;
  return rank;
}

function handTotal(cards: number[]): number {
  let total = cards.reduce((sum, c) => sum + cardValue(c), 0);
  let aces = cards.filter((c) => c === 1).length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return total;
}

function dealForSymbols(a: string, b: string): Pick<BlackjackState, 'deck' | 'hands' | 'stood' | 'busted' | 'totals' | 'reveal' | 'lastAction'> {
  const deck = makeDeck();
  const hands: Record<string, number[]> = { [a]: [deck.shift()!, deck.shift()!], [b]: [deck.shift()!, deck.shift()!] };
  const totals = { [a]: handTotal(hands[a]), [b]: handTotal(hands[b]) };
  const busted = { [a]: totals[a] > 21, [b]: totals[b] > 21 };
  return {
    deck,
    hands,
    stood: { [a]: false, [b]: false },
    busted,
    totals,
    reveal: false,
    lastAction: 'Cards dealt. Hit or Stand.',
  };
}

function ensurePrepared(state: BlackjackState): BlackjackState {
  if (state.players.length < 2) return state;
  const a = state.players[0].symbol;
  const b = state.players[1].symbol;
  if ((state.hands[a]?.length ?? 0) > 0 || (state.hands[b]?.length ?? 0) > 0) return state;
  const dealt = dealForSymbols(a, b);
  return { ...state, ...dealt, currentPlayerIndex: 0 };
}

function resolveIfDone(state: BlackjackState): BlackjackState {
  const [p1, p2] = state.players;
  if (!p1 || !p2) return state;
  const a = p1.symbol;
  const b = p2.symbol;

  const aDone = state.stood[a] || state.busted[a];
  const bDone = state.stood[b] || state.busted[b];
  if (!aDone || !bDone) return state;

  const ta = state.totals[a];
  const tb = state.totals[b];
  const aValid = ta <= 21;
  const bValid = tb <= 21;

  let winner: string | null = null;
  let status: 'finished' | 'draw' = 'draw';

  if (aValid && !bValid) winner = a;
  else if (!aValid && bValid) winner = b;
  else if (aValid && bValid) {
    if (ta > tb) winner = a;
    else if (tb > ta) winner = b;
  }

  if (winner) status = 'finished';

  return {
    ...state,
    status,
    winner,
    reveal: true,
    lastAction: winner ? `${state.players.find((p) => p.symbol === winner)?.displayName || 'Player'} wins!` : 'Push (draw).',
  };
}

function createInitialState(_roomCode: string): BlackjackState {
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

function createRestartState(currentState: BlackjackState): BlackjackState {
  const a = currentState.players[0]?.symbol || 'X';
  const b = currentState.players[1]?.symbol || 'O';
  const dealt = dealForSymbols(a, b);
  return {
    ...currentState,
    status: 'active',
    winner: null,
    currentPlayerIndex: 0,
    ...dealt,
  };
}

function validateMove(inputState: BlackjackState, move: BlackjackMove, playerSymbol: string): MoveValidation {
  const state = ensurePrepared(inputState);
  if (state.status !== 'active') return { valid: false, error: 'Game is not active' };
  if (state.players[state.currentPlayerIndex]?.symbol !== playerSymbol) return { valid: false, error: 'Not your turn' };
  if (!move || (move.type !== 'hit' && move.type !== 'stand')) return { valid: false, error: 'Invalid move' };
  if (state.stood[playerSymbol] || state.busted[playerSymbol]) return { valid: false, error: 'You are already done' };
  return { valid: true };
}

function applyMove(inputState: BlackjackState, move: BlackjackMove, playerSymbol: string): BlackjackState {
  let state = ensurePrepared(inputState);
  const hands = { ...state.hands, [playerSymbol]: [...(state.hands[playerSymbol] || [])] };
  const stood = { ...state.stood };
  const busted = { ...state.busted };
  const totals = { ...state.totals };
  const deck = [...state.deck];

  if (move.type === 'hit') {
    const c = deck.shift();
    if (typeof c === 'number') hands[playerSymbol].push(c);
    totals[playerSymbol] = handTotal(hands[playerSymbol]);
    busted[playerSymbol] = totals[playerSymbol] > 21;
    if (busted[playerSymbol]) stood[playerSymbol] = true;
    state = {
      ...state,
      deck,
      hands,
      totals,
      busted,
      stood,
      currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
      lastAction: busted[playerSymbol] ? `${state.players.find((p) => p.symbol === playerSymbol)?.displayName || 'Player'} busted.` : `${state.players.find((p) => p.symbol === playerSymbol)?.displayName || 'Player'} hits.`,
    };
    return resolveIfDone(state);
  }

  stood[playerSymbol] = true;
  state = {
    ...state,
    stood,
    currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
    lastAction: `${state.players.find((p) => p.symbol === playerSymbol)?.displayName || 'Player'} stands.`,
  };
  return resolveIfDone(state);
}

function checkGameEnd(state: BlackjackState): { ended: boolean; winner: string | null; draw: boolean } {
  if (state.status === 'finished') return { ended: true, winner: state.winner, draw: false };
  if (state.status === 'draw') return { ended: true, winner: null, draw: true };
  return { ended: false, winner: null, draw: false };
}

export const blackjackGame: GameDefinition<BlackjackState, BlackjackMove> = {
  id: GAME_ID,
  displayName: '🂡 Blackjack',
  description: 'Hit or stand against your opponent. Closest to 21 without busting wins.',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  createRestartState,
  renderBoard: BlackjackBoard,
  validateMove,
  applyMove,
  checkGameEnd,
};
