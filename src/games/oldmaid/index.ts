import type { GameDefinition, MoveValidation } from '../types';
import type { OldMaidState, OldMaidMove } from './types';
import { OldMaidBoard } from './Board';

const GAME_ID = 'oldmaid';
const OLD_MAID = 99;

function makeDeck(): number[] {
  const deck: number[] = [];
  for (let rank = 1; rank <= 13; rank++) {
    if (rank === 12) continue; // remove one queen to create Old Maid
    for (let i = 0; i < 4; i++) deck.push(rank);
  }
  deck.push(OLD_MAID);

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function removePairs(hand: number[]): number[] {
  const counts: Record<number, number> = {};
  for (const c of hand) counts[c] = (counts[c] || 0) + 1;

  const out: number[] = [];
  for (const c of hand) {
    if (c === OLD_MAID) {
      out.push(c);
      continue;
    }
    if ((counts[c] || 0) % 2 === 1) {
      out.push(c);
      counts[c] = 0;
    }
  }
  return out;
}

function firstNonEmpty(state: OldMaidState): string | null {
  for (const p of state.players) {
    if ((state.hands[p.symbol] || []).length > 0) return p.symbol;
  }
  return null;
}

function pickTarget(state: OldMaidState, picker: string): string | null {
  const other = state.players.find((p) => p.symbol !== picker)?.symbol;
  if (!other) return null;
  return (state.hands[other] || []).length > 0 ? other : null;
}

function ensurePrepared(state: OldMaidState): OldMaidState {
  if (state.players.length < 2) return state;
  const a = state.players[0].symbol;
  const b = state.players[1].symbol;
  if ((state.hands[a]?.length ?? 0) > 0 || (state.hands[b]?.length ?? 0) > 0) return state;

  const deck = makeDeck();
  const hands: Record<string, number[]> = { [a]: [], [b]: [] };
  let turn = 0;
  while (deck.length) {
    hands[turn % 2 === 0 ? a : b].push(deck.shift()!);
    turn++;
  }

  hands[a] = removePairs(hands[a]);
  hands[b] = removePairs(hands[b]);

  const picker = firstNonEmpty({ ...state, hands });
  const target = picker ? pickTarget({ ...state, hands }, picker) : null;

  return {
    ...state,
    deck: [],
    hands,
    maidHolder:
      hands[a].includes(OLD_MAID) ? a : hands[b].includes(OLD_MAID) ? b : null,
    currentPicker: picker,
    currentTarget: target,
    currentPlayerIndex: Math.max(0, state.players.findIndex((p) => p.symbol === picker)),
    lastAction: 'Draw a random card from your opponent.',
  };
}

function resolveEnd(state: OldMaidState): OldMaidState {
  const alive = state.players.filter((p) => (state.hands[p.symbol] || []).length > 0);
  if (alive.length > 1) return state;

  const loser = state.players.find((p) => (state.hands[p.symbol] || []).includes(OLD_MAID))?.symbol || alive[0]?.symbol || null;
  const winner = state.players.find((p) => p.symbol !== loser)?.symbol || null;

  return {
    ...state,
    status: winner ? 'finished' : 'draw',
    winner,
    lastAction: winner ? `${state.players.find((p) => p.symbol === winner)?.displayName || 'Player'} wins!` : 'Draw.',
  };
}

function createInitialState(_roomCode: string): OldMaidState {
  return {
    gameType: GAME_ID,
    players: [],
    status: 'waiting',
    winner: null,
    currentPlayerIndex: 0,
    deck: [],
    hands: {},
    maidHolder: null,
    currentPicker: null,
    currentTarget: null,
    lastAction: 'Match pairs and avoid the Old Maid!',
  };
}

function createRestartState(currentState: OldMaidState): OldMaidState {
  const a = currentState.players[0]?.symbol || 'X';
  const b = currentState.players[1]?.symbol || 'O';
  return ensurePrepared({
    ...currentState,
    status: 'active',
    winner: null,
    currentPlayerIndex: 0,
    deck: [],
    hands: { [a]: [], [b]: [] },
    maidHolder: null,
    currentPicker: null,
    currentTarget: null,
    lastAction: 'New game started.',
  });
}

function validateMove(inputState: OldMaidState, move: OldMaidMove, playerSymbol: string): MoveValidation {
  const state = ensurePrepared(inputState);
  if (state.status !== 'active') return { valid: false, error: 'Game is not active' };
  if (state.currentPicker !== playerSymbol) return { valid: false, error: 'Not your turn' };
  if (!state.currentTarget) return { valid: false, error: 'No valid target' };
  if (!move || move.type !== 'draw_from_opponent' || typeof move.index !== 'number') {
    return { valid: false, error: 'Invalid move' };
  }
  const targetHand = state.hands[state.currentTarget] || [];
  if (move.index < 0 || move.index >= targetHand.length) return { valid: false, error: 'Invalid card index' };
  return { valid: true };
}

function applyMove(inputState: OldMaidState, move: OldMaidMove, playerSymbol: string): OldMaidState {
  let state = ensurePrepared(inputState);
  const target = state.currentTarget;
  if (!target) return state;

  const hands = {
    ...state.hands,
    [playerSymbol]: [...(state.hands[playerSymbol] || [])],
    [target]: [...(state.hands[target] || [])],
  };

  const [drawn] = hands[target].splice(move.index, 1);
  if (typeof drawn !== 'number') return state;
  hands[playerSymbol].push(drawn);

  hands[playerSymbol] = removePairs(hands[playerSymbol]);
  hands[target] = removePairs(hands[target]);

  const maidHolder =
    hands[playerSymbol].includes(OLD_MAID) ? playerSymbol :
    hands[target].includes(OLD_MAID) ? target :
    null;

  const nextPickerCandidate = target;
  const nextPicker = (hands[nextPickerCandidate] || []).length > 0 ? nextPickerCandidate : playerSymbol;
  const nextTarget = pickTarget({ ...state, hands }, nextPicker);

  state = {
    ...state,
    hands,
    maidHolder,
    currentPicker: nextPicker,
    currentTarget: nextTarget,
    currentPlayerIndex: Math.max(0, state.players.findIndex((p) => p.symbol === nextPicker)),
    lastAction: `${state.players.find((p) => p.symbol === playerSymbol)?.displayName || 'Player'} drew a card.`,
  };

  return resolveEnd(state);
}

function checkGameEnd(state: OldMaidState): { ended: boolean; winner: string | null; draw: boolean } {
  if (state.status === 'finished') return { ended: true, winner: state.winner, draw: false };
  if (state.status === 'draw') return { ended: true, winner: null, draw: true };
  return { ended: false, winner: null, draw: false };
}

export const oldMaidGame: GameDefinition<OldMaidState, OldMaidMove> = {
  id: GAME_ID,
  displayName: '🃏 Old Maid',
  description: 'Draw from opponent, make pairs, and avoid ending with the Old Maid card!',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  createRestartState,
  renderBoard: OldMaidBoard,
  validateMove,
  applyMove,
  checkGameEnd,
};
