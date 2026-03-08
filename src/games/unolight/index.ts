import type { GameDefinition, MoveValidation } from '../types';
import type { UnoLightState, UnoLightMove } from './types';
import { UnoLightBoard } from './Board';

const GAME_ID = 'unolight';

type Color = 'R' | 'G' | 'B' | 'Y';

function makeDeck(): string[] {
  const colors: Color[] = ['R', 'G', 'B', 'Y'];
  const deck: string[] = [];

  for (const c of colors) {
    deck.push(`${c}-0`);
    for (let n = 1; n <= 9; n++) {
      deck.push(`${c}-${n}`);
      deck.push(`${c}-${n}`);
    }
    deck.push(`${c}-SKIP`, `${c}-SKIP`);
    deck.push(`${c}-REV`, `${c}-REV`);
    deck.push(`${c}-D2`, `${c}-D2`);
  }

  for (let i = 0; i < 4; i++) {
    deck.push(`W-WILD`);
    deck.push(`W-D4`);
  }

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function parseCard(card: string): { color: 'R' | 'G' | 'B' | 'Y' | 'W'; value: string } {
  const [color, value] = card.split('-');
  return { color: color as 'R' | 'G' | 'B' | 'Y' | 'W', value };
}

function labelCard(card: string): string {
  const { color, value } = parseCard(card);
  return `${color}-${value}`;
}

function draw(deck: string[], n: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const c = deck.shift();
    if (c) out.push(c);
  }
  return out;
}

function nextIndex(state: UnoLightState, step = 1): number {
  const total = state.players.length;
  return (state.currentPlayerIndex + step + total * 10) % total;
}

function ensurePrepared(state: UnoLightState): UnoLightState {
  if (state.players.length < 2) return state;
  const p1 = state.players[0].symbol;
  const p2 = state.players[1].symbol;
  if ((state.hands[p1]?.length ?? 0) > 0 || (state.hands[p2]?.length ?? 0) > 0) return state;

  const deck = makeDeck();
  const p1Hand = draw(deck, 7);
  const p2Hand = draw(deck, 7);
  let topCard = deck.shift() || null;

  // avoid starting on wild
  while (topCard && parseCard(topCard).color === 'W') {
    deck.push(topCard);
    topCard = deck.shift() || null;
  }

  const activeColor = topCard ? (parseCard(topCard).color as Color) : 'R';

  return {
    ...state,
    deck,
    hands: { [p1]: p1Hand, [p2]: p2Hand },
    topCard,
    activeColor,
    pendingDraw: 0,
    direction: 1,
    currentPlayerIndex: 0,
    lastAction: `${state.players[0].displayName} starts.`,
  };
}

function canPlay(card: string, topCard: string | null, activeColor: Color | null): boolean {
  if (!topCard || !activeColor) return true;
  const c = parseCard(card);
  const top = parseCard(topCard);
  if (c.color === 'W') return true;
  return c.color === activeColor || c.value === top.value;
}

function createInitialState(_roomCode: string): UnoLightState {
  return {
    gameType: GAME_ID,
    players: [],
    status: 'waiting',
    winner: null,
    currentPlayerIndex: 0,
    deck: [],
    hands: {},
    topCard: null,
    activeColor: null,
    pendingDraw: 0,
    direction: 1,
    lastAction: 'Play a matching color/value card. Wild lets you pick color.',
  };
}

function createRestartState(currentState: UnoLightState): UnoLightState {
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
    activeColor: null,
    pendingDraw: 0,
    direction: 1,
    lastAction: 'New round started.',
  });
}

function validateMove(inputState: UnoLightState, move: UnoLightMove, playerSymbol: string): MoveValidation {
  const state = ensurePrepared(inputState);
  if (state.status !== 'active') return { valid: false, error: 'Game is not active' };
  const current = state.players[state.currentPlayerIndex];
  if (current?.symbol !== playerSymbol) return { valid: false, error: 'Not your turn' };

  if (!move || (move.type !== 'play' && move.type !== 'draw')) {
    return { valid: false, error: 'Invalid move' };
  }

  if (move.type === 'draw') return { valid: true };

  if (!move.card) return { valid: false, error: 'Select a card' };
  const hand = state.hands[playerSymbol] || [];
  if (!hand.includes(move.card)) return { valid: false, error: 'Card not in hand' };
  if (!canPlay(move.card, state.topCard, state.activeColor)) return { valid: false, error: 'Card not playable' };

  const parsed = parseCard(move.card);
  if (parsed.color === 'W' && !move.chooseColor) {
    return { valid: false, error: 'Choose a color for wild card' };
  }

  return { valid: true };
}

function applyMove(inputState: UnoLightState, move: UnoLightMove, playerSymbol: string): UnoLightState {
  let state = ensurePrepared(inputState);
  const players = state.players;
  if (players.length < 2) return state;

  const hands = Object.fromEntries(Object.entries(state.hands).map(([k, v]) => [k, [...v]])) as Record<string, string[]>;
  const deck = [...state.deck];

  const curPlayer = players[state.currentPlayerIndex];
  const nextPlayerIndex = nextIndex(state, state.direction);

  if (move.type === 'draw') {
    const drawCount = state.pendingDraw > 0 ? state.pendingDraw : 1;
    const drew = draw(deck, drawCount);
    hands[playerSymbol].push(...drew);

    return {
      ...state,
      deck,
      hands,
      pendingDraw: 0,
      currentPlayerIndex: nextPlayerIndex,
      lastAction: `${curPlayer.displayName} drew ${drew.length} card(s).`,
    };
  }

  const card = move.card!;
  const parsed = parseCard(card);
  const idx = hands[playerSymbol].indexOf(card);
  if (idx >= 0) hands[playerSymbol].splice(idx, 1);

  let activeColor: Color = parsed.color === 'W' ? (move.chooseColor as Color) : (parsed.color as Color);
  let pendingDraw = 0;
  let direction = state.direction;
  let skip = 0;

  if (parsed.value === 'D2') pendingDraw += 2;
  if (parsed.value === 'D4') pendingDraw += 4;
  if (parsed.value === 'SKIP') skip = 1;
  if (parsed.value === 'REV') direction = (direction * -1) as 1 | -1;

  if (hands[playerSymbol].length === 0) {
    return {
      ...state,
      deck,
      hands,
      topCard: card,
      activeColor,
      pendingDraw,
      direction,
      status: 'finished',
      winner: playerSymbol,
      lastAction: `${curPlayer.displayName} played ${labelCard(card)} and won!`,
    };
  }

  const firstNext = (state.currentPlayerIndex + direction + players.length * 10) % players.length;
  const finalNext = (firstNext + (skip ? direction : 0) + players.length * 10) % players.length;

  return {
    ...state,
    deck,
    hands,
    topCard: card,
    activeColor,
    pendingDraw,
    direction,
    currentPlayerIndex: finalNext,
    lastAction: `${curPlayer.displayName} played ${labelCard(card)}.`,
  };
}

function checkGameEnd(state: UnoLightState): { ended: boolean; winner: string | null; draw: boolean } {
  if (state.status === 'finished') return { ended: true, winner: state.winner, draw: false };
  if (state.status === 'draw') return { ended: true, winner: null, draw: true };
  return { ended: false, winner: null, draw: false };
}

export const unoLightGame: GameDefinition<UnoLightState, UnoLightMove> = {
  id: GAME_ID,
  displayName: '🎴 Color Clash (Uno-Style)',
  description: 'Match color/value, use action cards, and empty your hand to win!',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  createRestartState,
  renderBoard: UnoLightBoard,
  validateMove,
  applyMove,
  checkGameEnd,
};
