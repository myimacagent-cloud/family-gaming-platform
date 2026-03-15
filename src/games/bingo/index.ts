import type { GameDefinition } from '../types';
import type { BingoState, BingoMove } from './types';
import { BingoBoard } from './Board';

const GAME_ID = 'bingo';

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function makeBoardNumbers(): number[] {
  // 1..75 classic pool, simplified random 25 unique board
  const nums = shuffle(Array.from({ length: 75 }, (_, i) => i + 1)).slice(0, 25);
  return nums;
}

function makeMarked(): boolean[] {
  const m = Array.from({ length: 25 }, () => false);
  m[12] = true; // free center
  return m;
}

function ensurePrepared(state: BingoState): BingoState {
  if (state.players.length < 2) return state;
  const p1 = state.players[0].symbol;
  const p2 = state.players[1].symbol;
  if ((state.boards[p1]?.length ?? 0) > 0 || (state.boards[p2]?.length ?? 0) > 0) return state;

  const boards = { [p1]: makeBoardNumbers(), [p2]: makeBoardNumbers() };
  const marked = { [p1]: makeMarked(), [p2]: makeMarked() };

  return {
    ...state,
    boards,
    marked,
    calledNumbers: [],
    lastCalled: null,
    pendingCall: true,
    currentPlayerIndex: 0,
    lastAction: 'New Bingo round started. Caller: Player 1',
  };
}

function hasBingo(marked: boolean[]): boolean {
  const lines: number[][] = [];

  for (let r = 0; r < 5; r++) lines.push([r * 5, r * 5 + 1, r * 5 + 2, r * 5 + 3, r * 5 + 4]);
  for (let c = 0; c < 5; c++) lines.push([c, c + 5, c + 10, c + 15, c + 20]);
  lines.push([0, 6, 12, 18, 24]);
  lines.push([4, 8, 12, 16, 20]);

  return lines.some((line) => line.every((i) => marked[i]));
}

function createInitialState(_roomCode: string): BingoState {
  const p1 = 'X';
  const p2 = 'O';
  return {
    gameType: GAME_ID,
    players: [],
    status: 'waiting',
    winner: null,
    currentPlayerIndex: 0,
    boards: { [p1]: makeBoardNumbers(), [p2]: makeBoardNumbers() },
    marked: { [p1]: makeMarked(), [p2]: makeMarked() },
    calledNumbers: [],
    lastCalled: null,
    pendingCall: true,
    lastAction: 'Call a number, then each player marks if they have it.',
  };
}

function createRestartState(currentState: BingoState): BingoState {
  const p1 = currentState.players[0]?.symbol || 'X';
  const p2 = currentState.players[1]?.symbol || 'O';

  return {
    ...currentState,
    status: 'active',
    winner: null,
    currentPlayerIndex: 0,
    boards: { [p1]: makeBoardNumbers(), [p2]: makeBoardNumbers() },
    marked: { [p1]: makeMarked(), [p2]: makeMarked() },
    calledNumbers: [],
    lastCalled: null,
    pendingCall: true,
    lastAction: 'New Bingo round started!',
  };
}

function validateMove(inputState: BingoState, move: BingoMove, playerSymbol: string) {
  const state = ensurePrepared(inputState);
  if (state.status !== 'active') return { valid: false, error: 'Game is not active' };

  if (!move || (move.type !== 'call' && move.type !== 'mark')) {
    return { valid: false, error: 'Invalid move' };
  }

  const current = state.players[state.currentPlayerIndex]?.symbol;

  if (move.type === 'call') {
    if (current !== playerSymbol) return { valid: false, error: 'Only current caller can call number' };
    if (!state.pendingCall) return { valid: false, error: 'Call already made, players must mark' };
    return { valid: true };
  }

  // mark
  if (typeof move.index !== 'number' || move.index < 0 || move.index > 24) {
    return { valid: false, error: 'Invalid board index' };
  }
  if (state.pendingCall) return { valid: false, error: 'Need a called number first' };

  const board = state.boards[playerSymbol] || [];
  const called = state.lastCalled;
  if (called === null) return { valid: false, error: 'No number called' };
  if (board[move.index] !== called) return { valid: false, error: 'You can only mark the called number' };

  return { valid: true };
}

function applyMove(inputState: BingoState, move: BingoMove, playerSymbol: string): BingoState {
  const state = ensurePrepared(inputState);

  if (move.type === 'call') {
    const pool = Array.from({ length: 75 }, (_, i) => i + 1).filter((n) => !state.calledNumbers.includes(n));
    if (pool.length === 0) {
      return { ...state, status: 'draw', winner: null, lastAction: 'No more numbers. Draw game.' };
    }

    const called = pool[Math.floor(Math.random() * pool.length)];
    return {
      ...state,
      calledNumbers: [...state.calledNumbers, called],
      lastCalled: called,
      pendingCall: false,
      lastAction: `${state.players.find((p) => p.symbol === playerSymbol)?.displayName || 'Caller'} called ${called}. Mark if you have it!`,
    };
  }

  const marked = { ...state.marked, [playerSymbol]: [...(state.marked[playerSymbol] || makeMarked())] };
  if (typeof move.index === 'number') marked[playerSymbol][move.index] = true;

  if (hasBingo(marked[playerSymbol])) {
    return {
      ...state,
      marked,
      status: 'finished',
      winner: playerSymbol,
      lastAction: `${state.players.find((p) => p.symbol === playerSymbol)?.displayName || 'Player'} got BINGO!`,
    };
  }

  // once marker acts, pass turn to other player and require new call
  return {
    ...state,
    marked,
    pendingCall: true,
    currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
    lastAction: `${state.players.find((p) => p.symbol === playerSymbol)?.displayName || 'Player'} marked ${state.lastCalled}. Next caller turn.`,
  };
}

function checkGameEnd(state: BingoState) {
  if (state.status === 'finished') return { ended: true, winner: state.winner, draw: false };
  if (state.status === 'draw') return { ended: true, winner: null, draw: true };
  return { ended: false, winner: null, draw: false };
}

export const bingoGame: GameDefinition<BingoState, BingoMove> = {
  id: GAME_ID,
  displayName: '🎯 Bingo',
  description: 'Call numbers and mark your board. First line wins BINGO!',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  createRestartState,
  renderBoard: BingoBoard,
  validateMove,
  applyMove,
  checkGameEnd,
};
