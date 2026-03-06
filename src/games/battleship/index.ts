import type { GameDefinition, MoveValidation } from '../types';
import { BattleshipBoard } from './Board';
import type { BattleshipMove, BattleshipState, PlayerBoard } from './types';
import { SHIPS, type ShipType } from './types';
import { alreadyTargeted, allShipsPlaced, attack, canPlace, createBoard, inBounds, place, shipsRemaining } from './logic';

const GAME_ID = 'battleship';

function withBoards(state: BattleshipState): Record<string, PlayerBoard> {
  const boards = { ...state.boards };
  for (const player of state.players) {
    if (!boards[player.symbol]) boards[player.symbol] = createBoard();
  }
  return boards;
}

function createInitialState(_roomCode: string): BattleshipState {
  return {
    gameType: GAME_ID,
    players: [],
    status: 'waiting',
    winner: null,
    currentPlayerIndex: 0,
    phase: 'setup',
    boards: {},
    currentAttacker: null,
    lastAttack: null,
  };
}

function createRestartState(currentState: BattleshipState): BattleshipState {
  const boards: Record<string, PlayerBoard> = {};
  for (const p of currentState.players) boards[p.symbol] = createBoard();

  return {
    ...currentState,
    status: 'active',
    winner: null,
    currentPlayerIndex: 0,
    phase: 'setup',
    boards,
    currentAttacker: null,
    lastAttack: null,
  };
}

function validateMove(state: BattleshipState, move: BattleshipMove, playerSymbol: string): MoveValidation {
  if (state.status !== 'active') return { valid: false, error: 'Game is not active' };
  if (!inBounds(move.row, move.col)) return { valid: false, error: 'Coordinate out of bounds' };

  const boards = withBoards(state);
  const myBoard = boards[playerSymbol];
  if (!myBoard) return { valid: false, error: 'Player board missing' };

  if (state.phase === 'setup') {
    if (move.action !== 'place_ship') return { valid: false, error: 'Place ships first' };
    if (!move.shipType) return { valid: false, error: 'Ship type required' };

    const validShip = SHIPS.some((s) => s.type === move.shipType);
    if (!validShip) return { valid: false, error: 'Unknown ship' };

    if (!canPlace(myBoard, move.shipType as ShipType, move.row, move.col, move.orientation || 'horizontal')) {
      return { valid: false, error: 'Invalid ship placement' };
    }
    return { valid: true };
  }

  if (state.phase === 'battle') {
    if (move.action !== 'attack') return { valid: false, error: 'Attack required' };
    if (state.currentAttacker !== playerSymbol) return { valid: false, error: 'Not your turn' };

    const defender = state.players.find((p) => p.symbol !== playerSymbol);
    if (!defender) return { valid: false, error: 'Opponent missing' };

    const defenderBoard = boards[defender.symbol];
    if (!defenderBoard) return { valid: false, error: 'Opponent board missing' };

    if (alreadyTargeted(defenderBoard, move.row, move.col)) {
      return { valid: false, error: 'Coordinate already guessed' };
    }

    return { valid: true };
  }

  return { valid: false, error: 'Game already finished' };
}

function applyMove(state: BattleshipState, move: BattleshipMove, playerSymbol: string): BattleshipState {
  const boards = withBoards(state);

  if (state.phase === 'setup' && move.action === 'place_ship' && move.shipType) {
    const myBoard = boards[playerSymbol];
    if (!myBoard) return { ...state, boards };

    const nextBoards = {
      ...boards,
      [playerSymbol]: place(myBoard, move.shipType, move.row, move.col, move.orientation || 'horizontal'),
    };

    const everyoneReady = state.players.every((p) => {
      const board = nextBoards[p.symbol];
      return board ? allShipsPlaced(board) : false;
    });

    if (!everyoneReady) {
      return { ...state, boards: nextBoards };
    }

    return {
      ...state,
      boards: nextBoards,
      phase: 'battle',
      currentAttacker: state.players[0]?.symbol || null,
      currentPlayerIndex: 0,
      lastAttack: null,
    };
  }

  if (state.phase === 'battle' && move.action === 'attack') {
    const defender = state.players.find((p) => p.symbol !== playerSymbol);
    if (!defender) return { ...state, boards };

    const defenderBoard = boards[defender.symbol];
    if (!defenderBoard) return { ...state, boards };

    const outcome = attack(defenderBoard, move.row, move.col);
    const nextBoards = {
      ...boards,
      [defender.symbol]: outcome.board,
    };

    if (shipsRemaining(outcome.board) === 0) {
      return {
        ...state,
        boards: nextBoards,
        phase: 'finished',
        status: 'finished',
        winner: playerSymbol,
        lastAttack: {
          attacker: playerSymbol,
          defender: defender.symbol,
          row: move.row,
          col: move.col,
          result: outcome.result,
          sunkShip: outcome.sunkShip,
        },
      };
    }

    const nextPlayerIndex = state.players.findIndex((p) => p.symbol === defender.symbol);
    return {
      ...state,
      boards: nextBoards,
      currentAttacker: defender.symbol,
      currentPlayerIndex: nextPlayerIndex >= 0 ? nextPlayerIndex : 0,
      lastAttack: {
        attacker: playerSymbol,
        defender: defender.symbol,
        row: move.row,
        col: move.col,
        result: outcome.result,
        sunkShip: outcome.sunkShip,
      },
    };
  }

  return { ...state, boards };
}

function checkGameEnd(state: BattleshipState): { ended: boolean; winner: string | null; draw: boolean } {
  if (state.status === 'finished' || state.phase === 'finished') {
    return { ended: true, winner: state.winner, draw: false };
  }
  return { ended: false, winner: null, draw: false };
}

export const battleshipGame: GameDefinition<BattleshipState, BattleshipMove> = {
  id: GAME_ID,
  displayName: '🚢 Battleship',
  description: 'Classic 10x10 fleet battle. Sink all enemy ships!',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  createRestartState,
  renderBoard: BattleshipBoard,
  validateMove,
  applyMove,
  checkGameEnd,
};
