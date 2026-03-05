import type { GameDefinition, MoveValidation } from '../types';
import type { BattleshipState, BattleshipMove } from './types';
import { BattleshipBoard } from './Board';

const GAME_ID = 'battleship';
const GRID_SIZE = 5;

const SHIP_CONFIGS: { type: string; length: number }[] = [
  { type: 'battleship', length: 3 },
  { type: 'cruiser', length: 2 },
  { type: 'submarine', length: 2 },
];

function createEmptyGrid() {
  return {
    cells: Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill('empty')),
    ships: [] as any[],
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

function validateMove(state: BattleshipState, move: BattleshipMove, playerSymbol: string): MoveValidation {
  if (state.status !== 'active') return { valid: false, error: 'Game is not active' };
  
  if (state.phase === 'setup') {
    if (move.action !== 'place_ship') return { valid: false, error: 'Must place ships' };
    if (!move.shipType) return { valid: false, error: 'Must specify ship' };
    
    const grid = state.grids[playerSymbol];
    if (!grid) return { valid: false, error: 'Grid not found' };
    
    const shipConfig = SHIP_CONFIGS.find(s => s.type === move.shipType);
    if (!shipConfig) return { valid: false, error: 'Invalid ship' };
    
    const existingShip = grid.ships.find(s => s.type === move.shipType);
    if (existingShip) return { valid: false, error: 'Ship already placed' };
    
    // Check bounds
    const row = move.row || 0;
    const col = move.col || 0;
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) {
      return { valid: false, error: 'Out of bounds' };
    }
  } else if (state.phase === 'battle') {
    if (state.currentAttacker !== playerSymbol) return { valid: false, error: 'Not your turn' };
    if (move.action !== 'attack') return { valid: false, error: 'Must attack' };
    const row = move.row || 0;
    const col = move.col || 0;
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) {
      return { valid: false, error: 'Invalid position' };
    }
  }
  
  return { valid: true };
}

function placeShip(grid: ReturnType<typeof createEmptyGrid>, row: number, col: number, shipType: string, length: number, orientation: 'horizontal' | 'vertical') {
  const positions: { row: number; col: number }[] = [];
  
  if (orientation === 'horizontal') {
    if (col + length > GRID_SIZE) return false;
    for (let i = 0; i < length; i++) {
      if (grid.cells[row][col + i] !== 'empty') return false;
    }
    for (let i = 0; i < length; i++) {
      grid.cells[row][col + i] = 'ship';
      positions.push({ row, col: col + i });
    }
  } else {
    if (row + length > GRID_SIZE) return false;
    for (let i = 0; i < length; i++) {
      if (grid.cells[row + i][col] !== 'empty') return false;
    }
    for (let i = 0; i < length; i++) {
      grid.cells[row + i][col] = 'ship';
      positions.push({ row: row + i, col });
    }
  }
  
  grid.ships.push({ type: shipType, length, positions, hits: 0, isSunk: false });
  return true;
}

function applyMove(state: BattleshipState, move: BattleshipMove, playerSymbol: string): BattleshipState {
  if (state.phase === 'setup' && move.action === 'place_ship' && move.shipType) {
    const grid = state.grids[playerSymbol];
    const shipConfig = SHIP_CONFIGS.find(s => s.type === move.shipType)!;
    
    placeShip(grid, move.row || 0, move.col || 0, move.shipType, shipConfig.length, move.orientation || 'horizontal');
    
    const allShipsPlaced = state.players.every(p => state.grids[p.symbol]?.ships.length === SHIP_CONFIGS.length);
    
    if (allShipsPlaced) {
      return { ...state, phase: 'battle', currentAttacker: state.players[0].symbol };
    }
    return { ...state };
  }
  
  if (state.phase === 'battle' && move.action === 'attack' && move.row !== undefined && move.col !== undefined) {
    const opponent = state.players.find(p => p.symbol !== playerSymbol)!;
    const opponentGrid = state.grids[opponent.symbol];
    const row = move.row; const col = move.col;
    
    const newCells = opponentGrid.cells.map((r: any) => [...r]);
    const isHit = newCells[row][col] === 'ship';
    newCells[row][col] = isHit ? 'hit' : 'miss';
    
    const newShips = opponentGrid.ships.map((ship: any) => {
      if (ship.positions.some((pos: any) => pos.row === row && pos.col === col)) {
        const newHits = ship.hits + 1;
        return { ...ship, hits: newHits, isSunk: newHits >= ship.length };
      }
      return ship;
    });
    
    const shipsRemaining = newShips.filter((s: any) => !s.isSunk).length;
    
    const newGrids = { ...state.grids };
    newGrids[opponent.symbol] = { ...opponentGrid, cells: newCells, ships: newShips, shipsRemaining };
    
    if (shipsRemaining === 0) {
      return { ...state, grids: newGrids, status: 'finished', winner: playerSymbol };
    }
    
    const nextPlayerIndex = state.players.findIndex(p => p.symbol !== playerSymbol);
    
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
  displayName: 'Battleship 5x5',
  description: 'Strategic naval warfare! Sink all enemy ships!',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  createRestartState,
  renderBoard: BattleshipBoard,
  validateMove,
  applyMove,
  checkGameEnd,
};
