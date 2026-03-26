import type { GameDefinition, MoveValidation } from '../types';
import type { HeartsState, HeartsMove } from './types';
import { HeartsBoard } from './Board';

const GAME_ID = 'hearts';
type Suit = 'S' | 'H' | 'D' | 'C';

function makeDeck(): string[] {
  const suits: Suit[] = ['S', 'H', 'D', 'C'];
  const deck: string[] = [];
  for (const s of suits) for (let r = 2; r <= 14; r++) deck.push(`${r}-${s}`);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function parseCard(card: string): { rank: number; suit: Suit } {
  const [r, s] = card.split('-');
  return { rank: Number(r), suit: s as Suit };
}

function label(card: string): string {
  const { rank, suit } = parseCard(card);
  const r = rank === 11 ? 'J' : rank === 12 ? 'Q' : rank === 13 ? 'K' : rank === 14 ? 'A' : String(rank);
  const su = suit === 'S' ? '♠' : suit === 'H' ? '♥' : suit === 'D' ? '♦' : '♣';
  return `${r}${su}`;
}

function ensurePrepared(state: HeartsState): HeartsState {
  if (state.players.length < 2) return state;
  const a = state.players[0].symbol;
  const b = state.players[1].symbol;
  if ((state.hands[a]?.length ?? 0) > 0 || (state.hands[b]?.length ?? 0) > 0) return state;

  const deck = makeDeck();
  return {
    ...state,
    deck: deck.slice(26),
    hands: { [a]: deck.slice(0, 13), [b]: deck.slice(13, 26) },
    points: { [a]: 0, [b]: 0 },
    currentTrick: [],
    leadSuit: null,
    heartsBroken: false,
    trickNumber: 1,
    currentPlayerIndex: 0,
    lastAction: 'Play tricks and avoid hearts points.',
  };
}

function trickWinner(trick: Array<{ symbol: string; card: string }>, leadSuit: Suit): string {
  let best = trick[0];
  for (const t of trick.slice(1)) {
    const b = parseCard(best.card);
    const c = parseCard(t.card);
    if (c.suit === leadSuit && b.suit === leadSuit && c.rank > b.rank) best = t;
    else if (c.suit === leadSuit && b.suit !== leadSuit) best = t;
  }
  return best.symbol;
}

function trickPoints(cards: string[]): number {
  let pts = 0;
  for (const card of cards) {
    const { rank, suit } = parseCard(card);
    if (suit === 'H') pts += 1;
    if (suit === 'S' && rank === 12) pts += 13; // Q♠
  }
  return pts;
}

function createInitialState(_roomCode: string): HeartsState {
  const deck = makeDeck();
  return {
    gameType: GAME_ID,
    players: [],
    status: 'waiting',
    winner: null,
    currentPlayerIndex: 0,
    deck: deck.slice(26),
    hands: { X: deck.slice(0, 13), O: deck.slice(13, 26) },
    currentTrick: [],
    leadSuit: null,
    heartsBroken: false,
    trickNumber: 1,
    points: { X: 0, O: 0 },
    lastAction: 'Play tricks and avoid hearts points.',
  };
}

function createRestartState(currentState: HeartsState): HeartsState {
  const a = currentState.players[0]?.symbol || 'X';
  const b = currentState.players[1]?.symbol || 'O';
  const deck = makeDeck();
  return {
    ...currentState,
    status: 'active',
    winner: null,
    currentPlayerIndex: 0,
    deck: deck.slice(26),
    hands: { [a]: deck.slice(0, 13), [b]: deck.slice(13, 26) },
    currentTrick: [],
    leadSuit: null,
    heartsBroken: false,
    trickNumber: 1,
    points: { [a]: 0, [b]: 0 },
    lastAction: 'New Hearts round started.',
  };
}

function validateMove(inputState: HeartsState, move: HeartsMove, playerSymbol: string): MoveValidation {
  const state = ensurePrepared(inputState);
  if (state.status !== 'active') return { valid: false, error: 'Game is not active' };
  if (state.players[state.currentPlayerIndex]?.symbol !== playerSymbol) return { valid: false, error: 'Not your turn' };
  if (!move || move.type !== 'play' || !move.card) return { valid: false, error: 'Invalid move' };

  const hand = state.hands[playerSymbol] || [];
  if (!hand.includes(move.card)) return { valid: false, error: 'Card not in hand' };

  const card = parseCard(move.card);

  if (state.currentTrick.length > 0 && state.leadSuit) {
    const hasLead = hand.some((c) => parseCard(c).suit === state.leadSuit);
    if (hasLead && card.suit !== state.leadSuit) return { valid: false, error: 'Must follow suit' };
  }

  if (state.currentTrick.length === 0 && card.suit === 'H' && !state.heartsBroken) {
    const hasNonHearts = hand.some((c) => parseCard(c).suit !== 'H');
    if (hasNonHearts) return { valid: false, error: 'Hearts not broken yet' };
  }

  return { valid: true };
}

function applyMove(inputState: HeartsState, move: HeartsMove, playerSymbol: string): HeartsState {
  const state = ensurePrepared(inputState);
  const hands = { ...state.hands, [playerSymbol]: [...(state.hands[playerSymbol] || [])] };
  const points = { ...state.points };

  const idx = hands[playerSymbol].indexOf(move.card);
  if (idx >= 0) hands[playerSymbol].splice(idx, 1);

  const played = parseCard(move.card);
  const leadSuit = state.currentTrick.length === 0 ? played.suit : state.leadSuit;
  const currentTrick = [...state.currentTrick, { symbol: playerSymbol, card: move.card }];
  const heartsBroken = state.heartsBroken || played.suit === 'H';

  if (currentTrick.length < state.players.length) {
    return {
      ...state,
      hands,
      currentTrick,
      leadSuit,
      heartsBroken,
      currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
      lastAction: `${state.players.find((p) => p.symbol === playerSymbol)?.displayName || 'Player'} played ${label(move.card)}.`,
    };
  }

  const winner = trickWinner(currentTrick, leadSuit as Suit);
  points[winner] = (points[winner] || 0) + trickPoints(currentTrick.map((t) => t.card));

  const remaining = state.players.reduce((sum, p) => sum + (hands[p.symbol]?.length || 0), 0);
  if (remaining === 0) {
    const [p1, p2] = state.players;
    const p1Pts = points[p1.symbol] || 0;
    const p2Pts = points[p2.symbol] || 0;
    let winnerSymbol: string | null = null;
    if (p1Pts < p2Pts) winnerSymbol = p1.symbol;
    else if (p2Pts < p1Pts) winnerSymbol = p2.symbol;

    return {
      ...state,
      hands,
      points,
      currentTrick: [],
      leadSuit: null,
      heartsBroken,
      status: winnerSymbol ? 'finished' : 'draw',
      winner: winnerSymbol,
      lastAction: winnerSymbol
        ? `${state.players.find((p) => p.symbol === winnerSymbol)?.displayName || 'Player'} wins with fewer points!`
        : 'Hearts round draw.',
    };
  }

  return {
    ...state,
    hands,
    points,
    currentTrick: [],
    leadSuit: null,
    heartsBroken,
    trickNumber: state.trickNumber + 1,
    currentPlayerIndex: Math.max(0, state.players.findIndex((p) => p.symbol === winner)),
    lastAction: `${state.players.find((p) => p.symbol === winner)?.displayName || 'Player'} took the trick.`,
  };
}

function checkGameEnd(state: HeartsState): { ended: boolean; winner: string | null; draw: boolean } {
  if (state.status === 'finished') return { ended: true, winner: state.winner, draw: false };
  if (state.status === 'draw') return { ended: true, winner: null, draw: true };
  return { ended: false, winner: null, draw: false };
}

export const heartsGame: GameDefinition<HeartsState, HeartsMove> = {
  id: GAME_ID,
  displayName: '♥️ Hearts',
  description: 'Avoid hearts and the Queen of Spades. Lowest points wins.',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  createRestartState,
  renderBoard: HeartsBoard,
  validateMove,
  applyMove,
  checkGameEnd,
};
