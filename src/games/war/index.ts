import type { GameDefinition, MoveValidation } from '../types';
import type { WarState, WarMove } from './types';
import { WarBoard } from './Board';

const GAME_ID = 'war';
const MAX_ROUNDS = 26;

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

function ensurePrepared(state: WarState): WarState {
  if (state.players.length < 2) return state;
  const p1 = state.players[0].symbol;
  const p2 = state.players[1].symbol;

  if (state.decks[p1]?.length || state.decks[p2]?.length) return state;

  const deck = shuffledDeck();
  const p1Deck = deck.filter((_, i) => i % 2 === 0);
  const p2Deck = deck.filter((_, i) => i % 2 === 1);

  return {
    ...state,
    decks: { [p1]: p1Deck, [p2]: p2Deck },
    tableCards: { [p1]: null, [p2]: null },
    tricksWon: { [p1]: 0, [p2]: 0 },
    currentPlayerIndex: 0,
  };
}

function createInitialState(_roomCode: string): WarState {
  return {
    gameType: GAME_ID,
    players: [],
    status: 'waiting',
    winner: null,
    currentPlayerIndex: 0,
    decks: {},
    tableCards: {},
    tricksWon: {},
    round: 1,
    maxRounds: MAX_ROUNDS,
  };
}

function createRestartState(currentState: WarState): WarState {
  const p1 = currentState.players[0]?.symbol || 'X';
  const p2 = currentState.players[1]?.symbol || 'O';
  return ensurePrepared({
    ...currentState,
    status: 'active',
    winner: null,
    currentPlayerIndex: 0,
    decks: { [p1]: [], [p2]: [] },
    tableCards: { [p1]: null, [p2]: null },
    tricksWon: { [p1]: 0, [p2]: 0 },
    round: 1,
  });
}

function validateMove(inputState: WarState, move: WarMove, playerSymbol: string): MoveValidation {
  const state = ensurePrepared(inputState);
  if (state.status !== 'active') return { valid: false, error: 'Game is not active' };

  const current = state.players[state.currentPlayerIndex];
  if (current?.symbol !== playerSymbol) return { valid: false, error: 'Not your turn' };

  if (!move || move.action !== 'play_card') return { valid: false, error: 'Invalid move' };

  if ((state.tableCards[playerSymbol] ?? null) !== null) {
    return { valid: false, error: 'You already played this round' };
  }

  const deck = state.decks[playerSymbol] || [];
  if (deck.length === 0) return { valid: false, error: 'No cards left' };

  return { valid: true };
}

function applyMove(inputState: WarState, _move: WarMove, playerSymbol: string): WarState {
  let state = ensurePrepared(inputState);
  const opponent = state.players.find((p) => p.symbol !== playerSymbol)?.symbol;
  if (!opponent) return state;

  const decks = { ...state.decks };
  const tableCards = { ...state.tableCards };
  const tricksWon = { ...state.tricksWon };

  const myDeck = [...(decks[playerSymbol] || [])];
  const card = myDeck.shift();
  if (typeof card !== 'number') return state;

  decks[playerSymbol] = myDeck;
  tableCards[playerSymbol] = card;

  const oppCard = tableCards[opponent];
  const bothPlayed = typeof oppCard === 'number';

  if (!bothPlayed) {
    return {
      ...state,
      decks,
      tableCards,
      currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
    };
  }

  // Resolve trick
  if (card > oppCard) tricksWon[playerSymbol] = (tricksWon[playerSymbol] || 0) + 1;
  else if (oppCard > card) tricksWon[opponent] = (tricksWon[opponent] || 0) + 1;

  tableCards[playerSymbol] = null;
  tableCards[opponent] = null;

  const nextRound = state.round + 1;
  const p1 = state.players[0]?.symbol;
  const p2 = state.players[1]?.symbol;
  const done = (decks[p1 || '']?.length ?? 0) === 0 && (decks[p2 || '']?.length ?? 0) === 0;

  if (done) {
    const p1Score = tricksWon[p1 || ''] || 0;
    const p2Score = tricksWon[p2 || ''] || 0;
    const winner = p1Score === p2Score ? null : p1Score > p2Score ? p1 || null : p2 || null;
    return {
      ...state,
      decks,
      tableCards,
      tricksWon,
      round: nextRound,
      status: winner ? 'finished' : 'draw',
      winner,
      currentPlayerIndex: 0,
    };
  }

  return {
    ...state,
    decks,
    tableCards,
    tricksWon,
    round: nextRound,
    currentPlayerIndex: 0,
  };
}

function checkGameEnd(state: WarState): { ended: boolean; winner: string | null; draw: boolean } {
  if (state.status === 'finished') return { ended: true, winner: state.winner, draw: false };
  if (state.status === 'draw') return { ended: true, winner: null, draw: true };
  return { ended: false, winner: null, draw: false };
}

export const warGame: GameDefinition<WarState, WarMove> = {
  id: GAME_ID,
  displayName: '🃏 War',
  description: 'Each player flips a card. Higher rank wins the trick. Most tricks wins!',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  createRestartState,
  renderBoard: WarBoard,
  validateMove,
  applyMove,
  checkGameEnd,
};
