import type { BaseGameState, MoveValidation } from '../types';
import { getRandomWord } from './words';

export const GAME_ID = 'hangman' as const;

export interface HangmanState extends BaseGameState {
  gameType: typeof GAME_ID;
  word: string;
  guessedLetters: string[];
  wrongGuesses: number;
  maxWrong: number;
  winner: 'players' | 'system' | null;
}

export interface HangmanMove {
  type: 'guess_letter';
  userId?: string;
  letter: string;
}

function normalizeLetter(letter: string): string {
  return (letter || '').trim().toUpperCase();
}

function isSingleAlpha(letter: string): boolean {
  return /^[A-Z]$/.test(letter);
}

function isWordFullyRevealed(word: string, guessedLetters: string[]): boolean {
  const guessed = new Set(guessedLetters);
  return [...new Set(word.split(''))].every((char) => guessed.has(char));
}

export function createInitialState(_roomCode: string): HangmanState {
  return {
    gameType: GAME_ID,
    players: [],
    status: 'waiting',
    winner: null,
    currentPlayerIndex: 0,
    word: getRandomWord(),
    guessedLetters: [],
    wrongGuesses: 0,
    maxWrong: 6,
  };
}

export function createRestartState(currentState: HangmanState): HangmanState {
  return {
    ...currentState,
    word: getRandomWord(),
    guessedLetters: [],
    wrongGuesses: 0,
    maxWrong: 6,
    status: 'active',
    winner: null,
    currentPlayerIndex: 0,
  };
}

export function validateMove(
  state: HangmanState,
  move: HangmanMove,
  playerSymbol: string,
): MoveValidation {
  if (state.status !== 'active') {
    return { valid: false, error: 'Game is not active' };
  }

  const currentPlayer = state.players[state.currentPlayerIndex];
  if (currentPlayer?.symbol !== playerSymbol) {
    return { valid: false, error: 'Not your turn' };
  }

  if (!move || move.type !== 'guess_letter') {
    return { valid: false, error: 'Invalid move type' };
  }

  const letter = normalizeLetter(move.letter);
  if (!isSingleAlpha(letter)) {
    return { valid: false, error: 'Please guess a single letter (A-Z)' };
  }

  if (state.guessedLetters.includes(letter)) {
    return { valid: false, error: 'Letter already guessed' };
  }

  return { valid: true };
}

export function applyMove(
  state: HangmanState,
  move: HangmanMove,
  _playerSymbol: string,
): HangmanState {
  const letter = normalizeLetter(move.letter);
  const guessedLetters = [...state.guessedLetters, letter];
  const isWrong = !state.word.includes(letter);
  const wrongGuesses = state.wrongGuesses + (isWrong ? 1 : 0);

  const didPlayersWin = isWordFullyRevealed(state.word, guessedLetters);
  const didSystemWin = wrongGuesses >= state.maxWrong;

  if (didPlayersWin) {
    return {
      ...state,
      guessedLetters,
      wrongGuesses,
      status: 'finished',
      winner: 'players',
    };
  }

  if (didSystemWin) {
    return {
      ...state,
      guessedLetters,
      wrongGuesses,
      status: 'finished',
      winner: 'system',
    };
  }

  return {
    ...state,
    guessedLetters,
    wrongGuesses,
    status: 'active',
    winner: null,
    currentPlayerIndex: (state.currentPlayerIndex + 1) % Math.max(state.players.length, 1),
  };
}

export function checkGameEnd(state: HangmanState): { ended: boolean; winner: string | null; draw: boolean } {
  if (state.status === 'finished') {
    return { ended: true, winner: state.winner, draw: false };
  }
  return { ended: false, winner: null, draw: false };
}
