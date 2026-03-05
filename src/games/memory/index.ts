import type { GameDefinition, MoveValidation } from '../types';
import type { MemoryState, MemoryMove, Card } from './types';
import { MemoryBoard } from './Board';

const GAME_ID = 'memory';

// Emoji pairs for the memory game
const EMOJI_PAIRS = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
  '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔'
];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function createCards(pairCount: number): Card[] {
  const selectedEmojis = EMOJI_PAIRS.slice(0, pairCount);
  const pairs = [...selectedEmojis, ...selectedEmojis];
  const shuffled = shuffleArray(pairs);
  
  return shuffled.map((emoji, index) => ({
    id: index,
    emoji,
    isFlipped: false,
    isMatched: false,
  }));
}

function createInitialState(_roomCode: string): MemoryState {
  const totalPairs = 8; // 16 cards total
  return {
    gameType: GAME_ID,
    players: [],
    status: 'waiting',
    winner: null,
    currentPlayerIndex: 0,
    cards: createCards(totalPairs),
    flippedIndices: [],
    matchedPairs: 0,
    totalPairs,
    attempts: 0,
    lastFlipTime: null,
  };
}

function createRestartState(currentState: MemoryState): MemoryState {
  return {
    ...currentState,
    status: 'active',
    winner: null,
    currentPlayerIndex: 0,
    cards: createCards(currentState.totalPairs),
    flippedIndices: [],
    matchedPairs: 0,
    attempts: 0,
    lastFlipTime: null,
  };
}

function validateMove(state: MemoryState, move: MemoryMove, _playerSymbol: string): MoveValidation {
  if (state.status !== 'active') return { valid: false, error: 'Game is not active' };

  if (typeof move.index !== 'number' || move.index < 0 || move.index >= state.cards.length) {
    return { valid: false, error: 'Invalid card index' };
  }

  const card = state.cards[move.index];
  if (card.isFlipped || card.isMatched) {
    return { valid: false, error: 'Card already revealed' };
  }

  // Prevent flipping more than 2 cards
  if (state.flippedIndices.length >= 2) {
    return { valid: false, error: 'Wait for cards to flip back' };
  }

  return { valid: true };
}

function applyMove(state: MemoryState, move: MemoryMove, playerSymbol: string): MemoryState {
  const newCards = [...state.cards];
  const newFlippedIndices = [...state.flippedIndices, move.index];
  
  newCards[move.index] = { ...newCards[move.index], isFlipped: true };

  // If 2 cards are flipped, check for match
  if (newFlippedIndices.length === 2) {
    const [idx1, idx2] = newFlippedIndices;
    const card1 = newCards[idx1];
    const card2 = newCards[idx2];

    if (card1.emoji === card2.emoji) {
      // Match found!
      newCards[idx1] = { ...card1, isMatched: true };
      newCards[idx2] = { ...card2, isMatched: true };
      
      const newMatchedPairs = state.matchedPairs + 1;
      const isFinished = newMatchedPairs >= state.totalPairs;
      
      if (isFinished) {
        return {
          ...state,
          cards: newCards,
          flippedIndices: [],
          matchedPairs: newMatchedPairs,
          attempts: state.attempts + 1,
          lastFlipTime: Date.now(),
          status: 'finished',
          winner: playerSymbol,
        };
      }
      
      return {
        ...state,
        cards: newCards,
        flippedIndices: [],
        matchedPairs: newMatchedPairs,
        attempts: state.attempts + 1,
        lastFlipTime: Date.now(),
      };
    } else {
      // No match - cards will be flipped back by the board component after delay
      return {
        ...state,
        cards: newCards,
        flippedIndices: newFlippedIndices,
        attempts: state.attempts + 1,
        lastFlipTime: Date.now(),
      };
    }
  }

  // Only 1 card flipped
  return {
    ...state,
    cards: newCards,
    flippedIndices: newFlippedIndices,
    lastFlipTime: Date.now(),
  };
}

function checkGameEnd(state: MemoryState): { ended: boolean; winner: string | null; draw: boolean } {
  const ended = state.matchedPairs >= state.totalPairs;
  return { ended, winner: state.winner, draw: false };
}

export const memoryGame: GameDefinition<MemoryState, MemoryMove> = {
  id: GAME_ID,
  displayName: 'Memory',
  description: 'Flip cards to find matching pairs!',
  minPlayers: 1,
  maxPlayers: 4,
  createInitialState,
  createRestartState,
  renderBoard: MemoryBoard,
  validateMove,
  applyMove,
  checkGameEnd,
};
