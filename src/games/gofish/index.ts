import type { GameDefinition, MoveValidation } from '../types';
import type { GoFishState, GoFishMove } from './types';
import { GoFishBoard } from './Board';

const GAME_ID = 'gofish';

function shuffledDeck(): number[] {
  const deck: number[] = [];
  for (let r = 2; r <= 14; r++) {
    for (let i = 0; i < 4; i++) deck.push(r);
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function rankLabel(rank: number): string {
  if (rank === 11) return 'J';
  if (rank === 12) return 'Q';
  if (rank === 13) return 'K';
  if (rank === 14) return 'A';
  return String(rank);
}

function drawCards(deck: number[], count: number): number[] {
  const drawn: number[] = [];
  for (let i = 0; i < count; i++) {
    const c = deck.shift();
    if (typeof c === 'number') drawn.push(c);
  }
  return drawn;
}

function removeBooks(hand: number[]): { hand: number[]; booksMade: number } {
  const counts: Record<number, number> = {};
  for (const r of hand) counts[r] = (counts[r] || 0) + 1;

  let booksMade = 0;
  const next = [...hand];
  for (const [rankText, count] of Object.entries(counts)) {
    if (count >= 4) {
      const rank = Number(rankText);
      let removed = 0;
      for (let i = next.length - 1; i >= 0 && removed < 4; i--) {
        if (next[i] === rank) {
          next.splice(i, 1);
          removed++;
        }
      }
      booksMade += 1;
    }
  }

  return { hand: next, booksMade };
}

function ensurePrepared(state: GoFishState): GoFishState {
  if (state.players.length < 2) return state;
  const p1 = state.players[0].symbol;
  const p2 = state.players[1].symbol;
  if ((state.hands[p1]?.length ?? 0) > 0 || (state.hands[p2]?.length ?? 0) > 0) return state;

  const deck = shuffledDeck();
  const p1Hand = drawCards(deck, 7);
  const p2Hand = drawCards(deck, 7);

  const p1Books = removeBooks(p1Hand);
  const p2Books = removeBooks(p2Hand);

  return {
    ...state,
    deck,
    hands: {
      [p1]: p1Books.hand,
      [p2]: p2Books.hand,
    },
    books: {
      [p1]: p1Books.booksMade,
      [p2]: p2Books.booksMade,
    },
    currentPlayerIndex: 0,
    lastAction: `${state.players[0].displayName} starts!`,
  };
}

function refillIfEmpty(hand: number[], deck: number[]): number[] {
  if (hand.length > 0) return hand;
  const c = deck.shift();
  return typeof c === 'number' ? [c] : hand;
}

function createInitialState(_roomCode: string): GoFishState {
  return {
    gameType: GAME_ID,
    players: [],
    status: 'waiting',
    winner: null,
    currentPlayerIndex: 0,
    deck: [],
    hands: {},
    books: {},
    lastAction: 'Start by asking for a rank in your hand.',
  };
}

function createRestartState(currentState: GoFishState): GoFishState {
  const p1 = currentState.players[0]?.symbol || 'X';
  const p2 = currentState.players[1]?.symbol || 'O';
  return ensurePrepared({
    ...currentState,
    status: 'active',
    winner: null,
    currentPlayerIndex: 0,
    deck: [],
    hands: { [p1]: [], [p2]: [] },
    books: { [p1]: 0, [p2]: 0 },
    lastAction: 'New game started!',
  });
}

function validateMove(inputState: GoFishState, move: GoFishMove, playerSymbol: string): MoveValidation {
  const state = ensurePrepared(inputState);
  if (state.status !== 'active') return { valid: false, error: 'Game is not active' };

  const current = state.players[state.currentPlayerIndex];
  if (current?.symbol !== playerSymbol) return { valid: false, error: 'Not your turn' };

  if (!move || move.type !== 'ask_rank' || typeof move.rank !== 'number') {
    return { valid: false, error: 'Invalid move' };
  }

  if (!state.hands[playerSymbol]?.includes(move.rank)) {
    return { valid: false, error: 'You can only ask for a rank you have' };
  }

  return { valid: true };
}

function applyMove(inputState: GoFishState, move: GoFishMove, playerSymbol: string): GoFishState {
  const state = ensurePrepared(inputState);
  const opponent = state.players.find((p) => p.symbol !== playerSymbol)?.symbol;
  if (!opponent) return state;

  const hands = {
    ...state.hands,
    [playerSymbol]: [...(state.hands[playerSymbol] || [])],
    [opponent]: [...(state.hands[opponent] || [])],
  };
  const books = { ...state.books };
  const deck = [...state.deck];

  const requested = move.rank;
  const taken = hands[opponent].filter((r) => r === requested);
  hands[opponent] = hands[opponent].filter((r) => r !== requested);

  let keepTurn = false;
  let lastAction = '';

  if (taken.length > 0) {
    hands[playerSymbol].push(...taken);
    keepTurn = true;
    lastAction = `${state.players.find(p => p.symbol === playerSymbol)?.displayName || 'Player'} took ${taken.length} ${rankLabel(requested)}(s)!`;
  } else {
    const drawn = deck.shift();
    if (typeof drawn === 'number') {
      hands[playerSymbol].push(drawn);
      const lucky = drawn === requested;
      keepTurn = lucky;
      lastAction = lucky
        ? `Go Fish! Drew ${rankLabel(drawn)} — lucky! Go again.`
        : `Go Fish! Drew ${rankLabel(drawn)}.`;
    } else {
      keepTurn = false;
      lastAction = 'Go Fish! Deck is empty.';
    }
  }

  // Book completion check
  for (const symbol of [playerSymbol, opponent]) {
    const res = removeBooks(hands[symbol]);
    hands[symbol] = res.hand;
    books[symbol] = (books[symbol] || 0) + res.booksMade;
  }

  hands[playerSymbol] = refillIfEmpty(hands[playerSymbol], deck);
  hands[opponent] = refillIfEmpty(hands[opponent], deck);

  const totalBooks = (books[playerSymbol] || 0) + (books[opponent] || 0);
  const noCardsLeft = deck.length === 0 && hands[playerSymbol].length === 0 && hands[opponent].length === 0;

  if (totalBooks >= 13 || noCardsLeft) {
    const myBooks = books[playerSymbol] || 0;
    const opBooks = books[opponent] || 0;
    const winner = myBooks === opBooks ? null : myBooks > opBooks ? playerSymbol : opponent;
    return {
      ...state,
      deck,
      hands,
      books,
      status: winner ? 'finished' : 'draw',
      winner,
      lastAction,
    };
  }

  return {
    ...state,
    deck,
    hands,
    books,
    currentPlayerIndex: keepTurn ? state.currentPlayerIndex : (state.currentPlayerIndex + 1) % state.players.length,
    lastAction,
  };
}

function checkGameEnd(state: GoFishState): { ended: boolean; winner: string | null; draw: boolean } {
  if (state.status === 'finished') return { ended: true, winner: state.winner, draw: false };
  if (state.status === 'draw') return { ended: true, winner: null, draw: true };
  return { ended: false, winner: null, draw: false };
}

export const goFishGame: GameDefinition<GoFishState, GoFishMove> = {
  id: GAME_ID,
  displayName: '🐟 Go Fish',
  description: 'Ask for ranks in your hand, make books of 4, and win the most books!',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  createRestartState,
  renderBoard: GoFishBoard,
  validateMove,
  applyMove,
  checkGameEnd,
};
