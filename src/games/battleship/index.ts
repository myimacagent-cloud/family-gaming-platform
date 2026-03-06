import type { GameDefinition, MoveValidation } from '../types';
import { BattleshipBoard } from './Board';
import type { BattleshipMove, BattleshipState, ShipType } from './types';
import {
  BATTLESHIP_GRID_SIZE,
  SHIP_DEFINITIONS,
} from './types';
import {
  applyAttack,
  boardIsReady,
  canPlaceShip,
  createEmptyBoard,
  hasAlreadyAttacked,
  isWithinBounds,
  placeShipOnBoard,
  remainingShips,
} from './logic';

const GAME_ID = 'battleship';

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

function ensureBoards(state: BattleshipState): Record<string, ReturnType<typeof createEmptyBoard>> {
  const boards = { ...state.boards };
  for (const player of state.players) {
    if (!boards[player.symbol]) {
      boards[player.symbol] = createEmptyBoard();
    }
  }
  return boards;
}

function createRestartState(currentState: BattleshipState): BattleshipState {
  const nextBoards: Record<string, ReturnType<typeof createEmptyBoard>> = {};
  for (const player of currentState.players) {
    nextBoards[player.symbol] = createEmptyBoard();
  }

  return {
    ...currentState,
    status: 'active',
    winner: null,
    currentPlayerIndex: 0,
    phase: 'setup',
    boards: nextBoards,
    currentAttacker: null,
    lastAttack: null,
  };
}

function validateMove(state: BattleshipState, move: BattleshipMove, playerSymbol: string): MoveValidation {
  if (state.status !== 'active') return { valid: false, error: 'Game is not active' };
  if (!isWithinBounds(move.row, move.col)) {
    return { valid: false, error: `Coordinates must be inside ${BATTLESHIP_GRID_SIZE}x${BATTLESHIP_GRID_SIZE}` };
  }

  const boards = ensureBoards(state);
  const myBoard = boards[playerSymbol];
  if (!myBoard) return { valid: false, error: 'Board not initialized' };

  if (state.phase === 'setup') {
    if (move.action !== 'place_ship') return { valid: false, error: 'Place ships first' };
    if (!move.shipType) return { valid: false, error: 'Select a ship to place' };

    const allowedShip = SHIP_DEFINITIONS.some((ship) => ship.type === move.shipType);
    if (!allowedShip) return { valid: false, error: 'Unknown ship type' };

    if (!canPlaceShip(myBoard, move.shipType as ShipType, move.row, move.col, move.orientation || 'horizontal')) {
      return { valid: false, error: 'Invalid placement (overlap or out of bounds)' };
    }

    return { valid: true };
  }

  if (state.phase === 'battle') {
    if (move.action !== 'attack') return { valid: false, error: 'Use attack moves during battle phase' };
    if (state.currentAttacker !== playerSymbol) return { valid: false, error: 'Not your turn' };

    const opponent = state.players.find((p) => p.symbol !== playerSymbol);
    if (!opponent) return { valid: false, error: 'Waiting for opponent' };

    const opponentBoard = boards[opponent.symbol];
    if (!opponentBoard) return { valid: false, error: 'Opponent board not ready' };

    if (hasAlreadyAttacked(opponentBoard, move.row, move.col)) {
      return { valid: false, error: 'Coordinate already guessed' };
    }

    return { valid: true };
  }

  return { valid: false, error: 'Invalid game phase' };
}

function applyMove(state: BattleshipState, move: BattleshipMove, playerSymbol: string): BattleshipState {
  const boards = ensureBoards(state);

  if (state.phase === 'setup' && move.action === 'place_ship' && move.shipType) {
    const myBoard = boards[playerSymbol];
    const nextMyBoard = placeShipOnBoard(myBoard, move.shipType, move.row, move.col, move.orientation || 'horizontal');
    const nextBoards = {
      ...boards,
      [playerSymbol]: nextMyBoard,
    };

    const playersReady = boardIsReady(nextBoards, state.players.map((p) => p.symbol));
    if (playersReady) {
      return {
        ...state,
        boards: nextBoards,
        phase: 'battle',
        currentAttacker: state.players[0]?.symbol || null,
        currentPlayerIndex: 0,
      };
    }

    return {
      ...state,
      boards: nextBoards,
    };
  }

  if (state.phase === 'battle' && move.action === 'attack') {
    const defender = state.players.find((p) => p.symbol !== playerSymbol);
    if (!defender) return state;

    const defenderBoard = boards[defender.symbol];
    if (!defenderBoard) return state;

    const attack = applyAttack(defenderBoard, move.row, move.col);
    const nextBoards = {
      ...boards,
      [defender.symbol]: attack.board,
    };

    const defenderShipsRemaining = remainingShips(attack.board);
    if (defenderShipsRemaining === 0) {
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
          result: attack.result,
          sunkShipType: attack.sunkShipType,
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
        result: attack.result,
        sunkShipType: attack.sunkShipType,
      },
    };
  }

  return {
    ...state,
    boards,
  };
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
  description: 'Classic 10x10 naval combat with full fleet setup.',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  createRestartState,
  renderBoard: BattleshipBoard,
  validateMove,
  applyMove,
  checkGameEnd,
};
