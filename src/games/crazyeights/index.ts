import type { GameDefinition, MoveValidation } from '../types';
import type { CrazyEightsState, CrazyEightsMove } from './types';
import { CrazyEightsBoard } from './Board';

const GAME_ID = 'crazyeights';

function makeDeck(): string[] {
  const suits: Array<'S' | 'H' | 'D' | 'C'> = ['S', 'H', 'D', 'C'];
  const cards: string[] = [];
  for (let r = 2; r <= 14; r++) {
    for (const s of suits) cards.push(`${r}-${s}`);
  }
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

function parseCard(card: string): { rank: number; suit: 'S' | 'H' | 'D' | 'C' } {
  const [r, s] = card.split('-');
  return { rank: Number(r), suit: s as 'S' | 'H' | 'D' | 'C' };
}

function cardLabel(card: string): string {
  const { rank, suit } = parseCard(card);
  const r = rank === 11 ? 'J' : rank === 12 ? 'Q' : rank === 13 ? 'K' : rank === 14 ? 'A' : String(rank);
  const s = suit === 'S' ? '♠' : suit === 'H' ? '♥' : suit === 'D' ? '♦' : '♣';
  return `${r}${s}`;
}

function ensurePrepared(state: CrazyEightsState): CrazyEightsState {
  if (state.players.length < 2) return state;
  const p1 = state.players[0].symbol;
  const p2 = state.players[1].symbol;

  if ((state.hands[p1]?.length ?? 0) > 0 || (state.hands[p2]?.length ?? 0) > 0) return state;

  const deck = makeDeck();
  const p1Hand = deck.splice(0, 7);
  const p2Hand = deck.splice(0, 7);
  const topCard = deck.shift() || null;

  let activeSuit: 'S' | 'H' | 'D' | 'C' | null = null;
  if (topCard) {
    const parsed = parseCard(topCard);
    activeSuit = parsed.suit;
  }

  return {
    ...state,
    deck,
    hands: {
      [p1]: p1Hand,
      [p2]: p2Hand,
    },
    topCard,
    activeSuit,
    drawStack: 0,
    currentPlayerIndex: 0,
    lastAction: `${state.players[0].displayName} starts. Top card: ${topCard ? cardLabel(topCard) : '—'}`,
  };
}

function canPlayCard(card: string, topCard: string | null, activeSuit: 'S' | 'H' | 'D' | 'C' | null): boolean {
  if (!topCard || !activeSuit) return true;
  const c = parseCard(card);
  const top = parseCard(topCard);
  if (c.rank === 8) return true;
  return c.rank === top.rank || c.suit === activeSuit;
}

function drawOne(state: CrazyEightsState): { state: CrazyEightsState; drawn?: string } {
  if (state.deck.length > 0) {
    const deck = [...state.deck];
    const drawn = deck.shift();
    return { state: { ...state, deck }, drawn };
  }

  // No discard pile tracking yet, so when deck empty: no draw
  return { state, drawn: undefined };
}

function createInitialState(_roomCode: string): CrazyEightsState {
  return {
    gameType: GAME_ID,
    players: [],
    status: 'waiting',
    winner: null,
    currentPlayerIndex: 0,
    deck: [],
    hands: {},
    topCard: null,
    activeSuit: null,
    drawStack: 0,
    lastAction: 'Play a matching rank/suit, or play an 8 to change suit.',
  };
}

function createRestartState(currentState: CrazyEightsState): CrazyEightsState {
  const p1 = currentState.players[0]?.symbol || 'X';
  const p2 = currentState.players[1]?.symbol || 'O';
  return ensurePrepared({
    ...currentState,
    status: 'active',
    winner: null,
    currentPlayerIndex: 0,
    deck: [],
    hands: { [p1]: [], [p2]: [] },
    topCard: null,
    activeSuit: null,
    drawStack: 0,
    lastAction: 'New round started.',
  });
}

function validateMove(inputState: CrazyEightsState, move: CrazyEightsMove, playerSymbol: string): MoveValidation {
  const state = ensurePrepared(inputState);
  if (state.status !== 'active') return { valid: false, error: 'Game is not active' };

  const current = state.players[state.currentPlayerIndex];
  if (current?.symbol !== playerSymbol) return { valid: false, error: 'Not your turn' };

  if (!move || (move.type !== 'play' && move.type !== 'draw')) return { valid: false, error: 'Invalid move' };

  if (move.type === 'draw') return { valid: true };

  if (!move.card) return { valid: false, error: 'No card selected' };
  const hand = state.hands[playerSymbol] || [];
  if (!hand.includes(move.card)) return { valid: false, error: 'Card not in hand' };

  const parsed = parseCard(move.card);
  if (parsed.rank === 8 && !move.chooseSuit) {
    return { valid: false, error: 'Choose a suit when playing an 8' };
  }

  if (!canPlayCard(move.card, state.topCard, state.activeSuit)) {
    return { valid: false, error: 'Card must match rank/suit, or be an 8' };
  }

  return { valid: true };
}

function applyMove(inputState: CrazyEightsState, move: CrazyEightsMove, playerSymbol: string): CrazyEightsState {
  let state = ensurePrepared(inputState);
  const opponent = state.players.find((p) => p.symbol !== playerSymbol)?.symbol;
  if (!opponent) return state;

  if (move.type === 'draw') {
    const res = drawOne(state);
    state = res.state;
    const hands = { ...state.hands, [playerSymbol]: [...(state.hands[playerSymbol] || [])] };

    if (res.drawn) {
      hands[playerSymbol].push(res.drawn);
      return {
        ...state,
        hands,
        currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
        lastAction: `${state.players.find(p => p.symbol === playerSymbol)?.displayName || 'Player'} drew a card.`,
      };
    }

    return {
      ...state,
      currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
      lastAction: 'Deck empty — turn passed.',
    };
  }

  const hands = {
    ...state.hands,
    [playerSymbol]: [...(state.hands[playerSymbol] || [])],
  };

  hands[playerSymbol] = hands[playerSymbol].filter((c) => c !== move.card);

  const played = move.card!;
  const parsed = parseCard(played);
  const activeSuit = parsed.rank === 8 ? (move.chooseSuit || parsed.suit) : parsed.suit;

  if (hands[playerSymbol].length === 0) {
    return {
      ...state,
      hands,
      topCard: played,
      activeSuit,
      status: 'finished',
      winner: playerSymbol,
      lastAction: `${state.players.find(p => p.symbol === playerSymbol)?.displayName || 'Player'} played ${cardLabel(played)} and won!`,
    };
  }

  return {
    ...state,
    hands,
    topCard: played,
    activeSuit,
    currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
    lastAction: `${state.players.find(p => p.symbol === playerSymbol)?.displayName || 'Player'} played ${cardLabel(played)}${parsed.rank === 8 ? ` and chose ${activeSuit}` : ''}.`,
  };
}

function checkGameEnd(state: CrazyEightsState): { ended: boolean; winner: string | null; draw: boolean } {
  if (state.status === 'finished') return { ended: true, winner: state.winner, draw: false };
  if (state.status === 'draw') return { ended: true, winner: null, draw: true };
  return { ended: false, winner: null, draw: false };
}

export const crazyEightsGame: GameDefinition<CrazyEightsState, CrazyEightsMove> = {
  id: GAME_ID,
  displayName: '8️⃣ Crazy Eights',
  description: 'Match rank or suit. Eights are wild and let you choose the suit!',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  createRestartState,
  renderBoard: CrazyEightsBoard,
  validateMove,
  applyMove,
  checkGameEnd,
};
