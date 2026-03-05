import type { GameDefinition, MoveValidation } from '../types';
import type { BattleshipState, BattleshipMove, Ship } from './types';
import { BattleshipBoard } from './Board';

const GAME_ID = 'battleship';
const GRID_SIZE = 10;

const SHIP_CONFIGS: { type: Ship['type']; length: number }[] = [
  { type: 'carrier', length: 5 },
  { type: 'battleship', length: 4 },
  { type: 'cruiser', length: 3 },
  { type: 'submarine', length: 3 },
  { type: 'destroyer', length: 2 },
];

function createEmptyGrid() {
  return {
    cells: Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill('empty')),
    ships: [] as Ship[],
    shipsRemaining: SHIP_CONFIGS.length,
  };
}

function createInitialState(_roomCode: string): BattleshipState {
  return {
    gameType: GAME_ID,
    players: [],
    status: 'waiting',
    winner: null,
    currentPlayerIndex: 0,
    phase: 'setup',
    grids: {},
    currentAttacker: null,
    lastAttack: null,
  };
}

function createRestartState(currentState: BattleshipState): BattleshipState {
  const newGrids: Record<string, ReturnType<typeof createEmptyGrid>> = {};
  for (const player of currentState.players) {
    newGrids[player.symbol] = createEmptyGrid();
  }
  
  return {
    ...currentState,
    status: 'active',
    winner: null,
    currentPlayerIndex: 0,
    phase: 'setup',
    grids: newGrids,
    currentAttacker: null,
    lastAttack: null,
  };
}

function canPlaceShip(grid: ReturnType<typeof createEmptyGrid>, row: number, col: number, length: number, orientation: 'horizontal' | 'vertical'): boolean {
  if (orientation === 'horizontal') {
    if (col + length > GRID_SIZE) return false;
    for (let i = 0; i < length; i++) {
      if (grid.cells[row][col + i] !== 'empty') return false;
    }
  } else {
    if (row + length > GRID_SIZE) return false;
    for (let i = 0; i < length; i++) {
      if (grid.cells[row + i][col] !== 'empty') return false;
    }
  }
  return true;
}

function placeShip(grid: ReturnType<typeof createEmptyGrid>, row: number, col: number, shipType: Ship['type'], length: number, orientation: 'horizontal' | 'vertical') {
  if (!canPlaceShip(grid, row, col, length, orientation)) return false;
  
  const positions: { row: number; col: number }[] = [];
  
  if (orientation === 'horizontal') {
    for (let i = 0; i < length; i++) {
      grid.cells[row][col + i] = 'ship';
      positions.push({ row, col: col + i });
    }
  } else {
    for (let i = 0; i < length; i++) {
      grid.cells[row + i][col] = 'ship';
      positions.push({ row: row + i, col });
    }
  }
  
  grid.ships.push({
    type: shipType,
    length,
    positions,
    hits: 0,
    isSunk: false,
  });
  
  return true;
}

function validateMove(state: BattleshipState, move: BattleshipMove, playerSymbol: string): MoveValidation {
  if (state.status !== 'active') return { valid: false, error: 'Game is not active' };
  
  if (state.phase === 'setup') {
    if (move.action !== 'place_ship') return { valid: false, error: 'Must place ships' };
    if (typeof move.row !== 'number' || typeof move.col !== 'number') return { valid: false, error: 'Invalid position' };
    if (!move.shipType) return { valid: false, error: 'Must specify ship' };
    
    const grid = state.grids[playerSymbol];
    if (!grid) return { valid: false, error: 'Grid not found' };
    
    const shipConfig = SHIP_CONFIGS.find(s => s.type === move.shipType);
    if (!shipConfig) return { valid: false, error: 'Invalid ship' };
    
    const existingShip = grid.ships.find(s => s.type === move.shipType);
    if (existingShip) return { valid: false, error: 'Ship already placed' };
  } else if (state.phase === 'battle') {
    if (state.currentAttacker !== playerSymbol) return { valid: false, error: 'Not your turn' };
    if (move.action !== 'attack') return { valid: false, error: 'Must attack' };
    if (typeof move.row !== 'number' || typeof move.col !== 'number') return { valid: false, error: 'Invalid position' };
    
    const opponent = state.players.find(p => p.symbol !== playerSymbol);
    if (!opponent) return { valid: false, error: 'Opponent not found' };
    
    const opponentGrid = state.grids[opponent.symbol];
    const cell = opponentGrid.cells[move.row][move.col];
    if (cell === 'hit' || cell === 'miss') return { valid: false, error: 'Already attacked' };
  }
  
  return { valid: true };
}

function applyMove(state: BattleshipState, move: BattleshipMove, playerSymbol: string): BattleshipState {
  if (state.phase === 'setup' && move.action === 'place_ship' && move.shipType && move.orientation) {
    const grid = state.grids[playerSymbol];
    const shipConfig = SHIP_CONFIGS.find(s => s.type === move.shipType)!;
    
    placeShip(grid, move.row!, move.col!, move.shipType, shipConfig.length, move.orientation);
    
    const allShipsPlaced = state.players.every(p => state.grids[p.symbol]?.ships.length === SHIP_CONFIGS.length);
    
    if (allShipsPlaced) {
      return { ...state, phase: 'battle', currentAttacker: state.players[0].symbol };
    }
    return { ...state };
  }
  
  if (state.phase === 'battle' && move.action === 'attack') {
    const opponent = state.players.find(p => p.symbol !== playerSymbol)!;
    const opponentGrid = state.grids[opponent.symbol];
    
    const newCells = opponentGrid.cells.map(row => [...row]);
    const isHit = newCells[move.row!][move.col!] === 'ship';
    newCells[move.row!][move.col!] = isHit ? 'hit' : 'miss';
    
    const newShips = opponentGrid.ships.map(ship => {
      if (ship.positions.some(pos => pos.row === move.row && pos.col === move.col)) {
        const newHits = ship.hits + 1;
        return { ...ship, hits: newHits, isSunk: newHits >= ship.length };
      }
      return ship;
    });
    
    const shipsRemaining = newShips.filter(s => !s.isSunk).length;
    
    const newGrids = { ...state.grids };
    newGrids[opponent.symbol] = { ...opponentGrid, cells: newCells, ships: newShips, shipsRemaining };
    
    if (shipsRemaining === 0) {
      return { ...state, grids: newGrids, status: 'finished', winner: playerSymbol };
    }
    
    const currentPlayerIndex = state.players.findIndex(p => p.symbol === playerSymbol);
    const nextPlayerIndex = (currentPlayerIndex + 1) % state.players.length;
    
    return {
      ...state,
      grids: newGrids,
      currentPlayerIndex: nextPlayerIndex,
      currentAttacker: state.players[nextPlayerIndex].symbol,
    };
  }
  
  return state;
}

function checkGameEnd(state: BattleshipState): { ended: boolean; winner: string | null; draw: boolean } {
  if (state.status === 'finished') return { ended: true, winner: state.winner, draw: false };
  return { ended: false, winner: null, draw: false };
}

export const battleshipGame: GameDefinition<BattleshipState, BattleshipMove> = {
  id: GAME_ID,
  displayName: 'Battleship',
  description: 'Sink your opponent\'s fleet before they sink yours!',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  createRestartState,
  renderBoard: BattleshipBoard,
  validateMove,
  applyMove,
  checkGameEnd,
};
