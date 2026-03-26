import type { GameDefinition, MoveValidation } from '../types';
import type { SpadesState, SpadesMove } from './types';
import { SpadesBoard } from './Board';

const GAME_ID = 'spades';

type Suit = 'S' | 'H' | 'D' | 'C';

function makeDeck(): string[] {
  const suits: Suit[] = ['S', 'H', 'D', 'C'];
  const deck: string[] = [];
  for (const s of suits) {
    for (let r = 2; r <= 14; r++) deck.push(`${r}-${s}`);
  }
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

function cardLabel(card: string): string {
  const { rank, suit } = parseCard(card);
  const r = rank === 11 ? 'J' : rank === 12 ? 'Q' : rank === 13 ? 'K' : rank === 14 ? 'A' : String(rank);
  const su = suit === 'S' ? '♠' : suit === 'H' ? '♥' : suit === 'D' ? '♦' : '♣';
  return `${r}${su}`;
}


function dealForSymbols(a: string, b: string): Pick<SpadesState, 'deck' | 'hands' | 'bids' | 'tricksWon' | 'currentTrick' | 'leadSuit' | 'spadesBroken' | 'trickNumber' | 'lastAction'> {
  const deck = makeDeck();
  const aHand = deck.splice(0, 13);
  const bHand = deck.splice(0, 13);
  return {
    deck,
    hands: { [a]: aHand, [b]: bHand },
    bids: { [a]: null, [b]: null },
    tricksWon: { [a]: 0, [b]: 0 },
    currentTrick: [],
    leadSuit: null,
    spadesBroken: false,
    trickNumber: 1,
    lastAction: 'Place your bids (0-13), then play tricks.',
  };
}

function ensurePrepared(state: SpadesState): SpadesState {
  if (state.players.length < 2) return state;
  const a = state.players[0].symbol;
  const b = state.players[1].symbol;
  if ((state.hands[a]?.length ?? 0) > 0 || (state.hands[b]?.length ?? 0) > 0) return state;

  const dealt = dealForSymbols(a, b);
  return {
    ...state,
    ...dealt,
    currentPlayerIndex: 0,
  };
}

function bothBidsPlaced(state: SpadesState): boolean {
  return state.players.every((p) => state.bids[p.symbol] !== null);
}

function winnerOfTrick(trick: Array<{ symbol: string; card: string }>, leadSuit: Suit): string {
  let best = trick[0];
  for (const t of trick.slice(1)) {
    const b = parseCard(best.card);
    const c = parseCard(t.card);

    const bestIsSpade = b.suit === 'S';
    const cIsSpade = c.suit === 'S';

    if (cIsSpade && !bestIsSpade) {
      best = t;
      continue;
    }

    if (cIsSpade && bestIsSpade && c.rank > b.rank) {
      best = t;
      continue;
    }

    if (!cIsSpade && !bestIsSpade) {
      const bestFollowsLead = b.suit === leadSuit;
      const cFollowsLead = c.suit === leadSuit;
      if (cFollowsLead && !bestFollowsLead) {
        best = t;
        continue;
      }
      if (cFollowsLead && bestFollowsLead && c.rank > b.rank) {
        best = t;
      }
    }
  }
  return best.symbol;
}

function createInitialState(_roomCode: string): SpadesState {
  const dealt = dealForSymbols('X', 'O');
  return {
    gameType: GAME_ID,
    players: [],
    status: 'waiting',
    winner: null,
    currentPlayerIndex: 0,
    ...dealt,
    lastAction: 'Bid and play trick-taking Spades.',
  };
}

function createRestartState(currentState: SpadesState): SpadesState {
  const a = currentState.players[0]?.symbol || 'X';
  const b = currentState.players[1]?.symbol || 'O';
  const dealt = dealForSymbols(a, b);
  return {
    ...currentState,
    status: 'active',
    winner: null,
    currentPlayerIndex: 0,
    ...dealt,
    lastAction: 'New round started. Place bids.',
  };
}

function validateMove(inputState: SpadesState, move: SpadesMove, playerSymbol: string): MoveValidation {
  const state = ensurePrepared(inputState);
  if (state.status !== 'active') return { valid: false, error: 'Game is not active' };
  if (state.players[state.currentPlayerIndex]?.symbol !== playerSymbol) return { valid: false, error: 'Not your turn' };
  if (!move || (move.type !== 'bid' && move.type !== 'play')) return { valid: false, error: 'Invalid move' };

  if (move.type === 'bid') {
    if (bothBidsPlaced(state)) return { valid: false, error: 'Bidding already complete' };
    if (typeof move.bid !== 'number' || move.bid < 0 || move.bid > 13) return { valid: false, error: 'Bid must be 0-13' };
    return { valid: true };
  }

  if (!bothBidsPlaced(state)) return { valid: false, error: 'Bids must be placed first' };
  if (!move.card) return { valid: false, error: 'No card selected' };

  const hand = state.hands[playerSymbol] || [];
  if (!hand.includes(move.card)) return { valid: false, error: 'Card not in hand' };

  const card = parseCard(move.card);

  // follow suit
  if (state.currentTrick.length > 0 && state.leadSuit) {
    const hasLeadSuit = hand.some((c) => parseCard(c).suit === state.leadSuit);
    if (hasLeadSuit && card.suit !== state.leadSuit) return { valid: false, error: 'Must follow lead suit' };
  }

  // no leading spades until broken unless only spades
  if (state.currentTrick.length === 0 && card.suit === 'S' && !state.spadesBroken) {
    const hasNonSpade = hand.some((c) => parseCard(c).suit !== 'S');
    if (hasNonSpade) return { valid: false, error: 'Spades not broken yet' };
  }

  return { valid: true };
}

function applyMove(inputState: SpadesState, move: SpadesMove, playerSymbol: string): SpadesState {
  let state = ensurePrepared(inputState);

  if (move.type === 'bid') {
    const bids = { ...state.bids, [playerSymbol]: move.bid ?? 0 };
    const next = {
      ...state,
      bids,
      currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
      lastAction: `${state.players.find((p) => p.symbol === playerSymbol)?.displayName || 'Player'} bid ${move.bid}.`,
    };

    if (bothBidsPlaced(next)) {
      return {
        ...next,
        currentPlayerIndex: 0,
        lastAction: 'Bidding complete. Play first trick.',
      };
    }

    return next;
  }

  const hands = { ...state.hands, [playerSymbol]: [...(state.hands[playerSymbol] || [])] };
  const idx = hands[playerSymbol].indexOf(move.card!);
  if (idx >= 0) hands[playerSymbol].splice(idx, 1);

  const played = parseCard(move.card!);
  const leadSuit = state.currentTrick.length === 0 ? played.suit : state.leadSuit;
  const currentTrick = [...state.currentTrick, { symbol: playerSymbol, card: move.card! }];
  const spadesBroken = state.spadesBroken || played.suit === 'S';

  if (currentTrick.length < state.players.length) {
    return {
      ...state,
      hands,
      currentTrick,
      leadSuit,
      spadesBroken,
      currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
      lastAction: `${state.players.find((p) => p.symbol === playerSymbol)?.displayName || 'Player'} played ${cardLabel(move.card!)}.`,
    };
  }

  const winner = winnerOfTrick(currentTrick, leadSuit as Suit);
  const tricksWon = { ...state.tricksWon, [winner]: (state.tricksWon[winner] || 0) + 1 };

  const remaining = state.players.reduce((sum, p) => sum + (hands[p.symbol]?.length || 0), 0);
  if (remaining === 0) {
    const [p1, p2] = state.players;
    const s1 = Math.abs((tricksWon[p1.symbol] || 0) - (state.bids[p1.symbol] || 0));
    const s2 = Math.abs((tricksWon[p2.symbol] || 0) - (state.bids[p2.symbol] || 0));
    let finalWinner: string | null = null;
    if (s1 < s2) finalWinner = p1.symbol;
    else if (s2 < s1) finalWinner = p2.symbol;

    return {
      ...state,
      hands,
      tricksWon,
      currentTrick: [],
      leadSuit: null,
      spadesBroken,
      status: finalWinner ? 'finished' : 'draw',
      winner: finalWinner,
      lastAction: finalWinner
        ? `${state.players.find((p) => p.symbol === finalWinner)?.displayName || 'Player'} wins by best bid accuracy!`
        : 'Round draw on bid accuracy.',
    };
  }

  return {
    ...state,
    hands,
    tricksWon,
    currentTrick: [],
    leadSuit: null,
    spadesBroken,
    trickNumber: state.trickNumber + 1,
    currentPlayerIndex: Math.max(0, state.players.findIndex((p) => p.symbol === winner)),
    lastAction: `${state.players.find((p) => p.symbol === winner)?.displayName || 'Player'} won the trick.`,
  };
}

function checkGameEnd(state: SpadesState): { ended: boolean; winner: string | null; draw: boolean } {
  if (state.status === 'finished') return { ended: true, winner: state.winner, draw: false };
  if (state.status === 'draw') return { ended: true, winner: null, draw: true };
  return { ended: false, winner: null, draw: false };
}

export const spadesGame: GameDefinition<SpadesState, SpadesMove> = {
  id: GAME_ID,
  displayName: '♠️ Spades',
  description: 'Bid tricks, follow suit, and use spades as trump.',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  createRestartState,
  renderBoard: SpadesBoard,
  validateMove,
  applyMove,
  checkGameEnd,
};
