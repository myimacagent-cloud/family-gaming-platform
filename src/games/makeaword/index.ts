import type { GameDefinition, MoveValidation } from '../types';
import type { MakeAWordState, MakeAWordMove } from './types';
import { MakeAWordBoard } from './Board';

const GAME_ID = 'makeaword';

function normalizeLetter(input: string): string {
  return input.trim().toUpperCase().slice(0, 1);
}

function normalizeWord(input: string): string {
  return input.trim().toLowerCase();
}

function isValidWordPattern(word: string, first: string, last: string): boolean {
  if (!/^[a-z]+$/.test(word)) return false;
  if (word.length < 3) return false;
  return word.startsWith(first.toLowerCase()) && word.endsWith(last.toLowerCase());
}

function createInitialState(_roomCode: string): MakeAWordState {
  return {
    gameType: GAME_ID,
    players: [],
    status: 'waiting',
    winner: null,
    currentPlayerIndex: 0,
    phase: 'choose_letters',
    letters: { first: null, last: null },
    attempts: [],
    winningWord: null,
    lastAction: 'Player 1 picks first letter, Player 2 picks last letter.',
  };
}

function createRestartState(currentState: MakeAWordState): MakeAWordState {
  return {
    ...currentState,
    status: 'active',
    winner: null,
    currentPlayerIndex: 0,
    phase: 'choose_letters',
    letters: { first: null, last: null },
    attempts: [],
    winningWord: null,
    lastAction: 'New round started. Pick letters first.',
  };
}

function validateMove(state: MakeAWordState, move: MakeAWordMove, playerSymbol: string): MoveValidation {
  if (state.status !== 'active') return { valid: false, error: 'Game is not active' };

  const current = state.players[state.currentPlayerIndex];
  if (current?.symbol !== playerSymbol) return { valid: false, error: 'Not your turn' };

  if (!move || (move.type !== 'choose_letter' && move.type !== 'submit_word')) {
    return { valid: false, error: 'Invalid move' };
  }

  if (state.phase === 'choose_letters') {
    if (move.type !== 'choose_letter' || !move.letter) return { valid: false, error: 'Choose one letter' };
    const l = normalizeLetter(move.letter);
    if (!/^[A-Z]$/.test(l)) return { valid: false, error: 'Letter must be A-Z' };
    return { valid: true };
  }

  if (move.type !== 'submit_word' || !move.word) return { valid: false, error: 'Submit a word' };
  const first = state.letters.first;
  const last = state.letters.last;
  if (!first || !last) return { valid: false, error: 'Letters not set yet' };

  const word = normalizeWord(move.word);
  if (!isValidWordPattern(word, first, last)) {
    return { valid: false, error: `Word must start with ${first} and end with ${last}` };
  }

  return { valid: true };
}

function applyMove(state: MakeAWordState, move: MakeAWordMove, playerSymbol: string): MakeAWordState {
  if (state.phase === 'choose_letters') {
    const letter = normalizeLetter(move.letter || '');

    // player 1 sets first letter, player 2 sets last letter
    if (state.currentPlayerIndex === 0) {
      return {
        ...state,
        letters: { ...state.letters, first: letter },
        currentPlayerIndex: 1,
        lastAction: `${state.players[0]?.displayName || 'Player 1'} chose first letter: ${letter}`,
      };
    }

    // player 2 letter completes setup; switch to make_words phase with player 1 first try
    return {
      ...state,
      letters: { ...state.letters, last: letter },
      phase: 'make_words',
      currentPlayerIndex: 0,
      lastAction: `${state.players[1]?.displayName || 'Player 2'} chose last letter: ${letter}. Make words now!`,
    };
  }

  const word = normalizeWord(move.word || '');
  const attempts = [...state.attempts, { symbol: playerSymbol, word, valid: true }];

  return {
    ...state,
    attempts,
    status: 'finished',
    winner: playerSymbol,
    winningWord: word,
    lastAction: `${state.players.find((p) => p.symbol === playerSymbol)?.displayName || 'Player'} wins with "${word}"!`,
  };
}

function checkGameEnd(state: MakeAWordState): { ended: boolean; winner: string | null; draw: boolean } {
  if (state.status === 'finished') return { ended: true, winner: state.winner, draw: false };
  if (state.status === 'draw') return { ended: true, winner: null, draw: true };
  return { ended: false, winner: null, draw: false };
}

export const makeAWordGame: GameDefinition<MakeAWordState, MakeAWordMove> = {
  id: GAME_ID,
  displayName: '🔤 Make a Word',
  description: 'P1 picks first letter, P2 picks last letter. First valid word wins.',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  createRestartState,
  renderBoard: MakeAWordBoard,
  validateMove,
  applyMove,
  checkGameEnd,
};
