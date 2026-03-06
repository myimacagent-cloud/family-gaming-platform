import { GRID_SIZE, SHIPS, type Orientation, type PlayerBoard, type ShipState, type ShipType } from './types';

const cloneGrid = (grid: boolean[][]) => grid.map((r) => [...r]);

export function makeGrid(value = false): boolean[][] {
  return Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, () => value));
}

export function createBoard(): PlayerBoard {
  return {
    ships: [],
    shipCells: makeGrid(false),
    hits: makeGrid(false),
    misses: makeGrid(false),
    placed: [],
  };
}

export function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE;
}

export function getShip(type: ShipType) {
  return SHIPS.find((s) => s.type === type);
}

export function shipCells(row: number, col: number, length: number, orientation: Orientation) {
  return Array.from({ length }, (_, i) => ({
    row: orientation === 'vertical' ? row + i : row,
    col: orientation === 'horizontal' ? col + i : col,
  }));
}

export function canPlace(board: PlayerBoard, type: ShipType, row: number, col: number, orientation: Orientation): boolean {
  if (board.placed.includes(type)) return false;
  const ship = getShip(type);
  if (!ship) return false;

  const cells = shipCells(row, col, ship.length, orientation);
  for (const cell of cells) {
    if (!inBounds(cell.row, cell.col)) return false;
    if (board.shipCells[cell.row][cell.col]) return false;
  }

  return true;
}

export function place(board: PlayerBoard, type: ShipType, row: number, col: number, orientation: Orientation): PlayerBoard {
  const ship = getShip(type);
  if (!ship) return board;

  const cells = shipCells(row, col, ship.length, orientation);
  const nextShipCells = cloneGrid(board.shipCells);
  cells.forEach((c) => {
    nextShipCells[c.row][c.col] = true;
  });

  const newShip: ShipState = {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    length: ship.length,
    cells,
    hits: 0,
    sunk: false,
  };

  return {
    ...board,
    shipCells: nextShipCells,
    ships: [...board.ships, newShip],
    placed: [...board.placed, type],
  };
}

export function allShipsPlaced(board: PlayerBoard): boolean {
  return SHIPS.every((s) => board.placed.includes(s.type));
}

export function alreadyTargeted(board: PlayerBoard, row: number, col: number): boolean {
  return board.hits[row][col] || board.misses[row][col];
}

export function attack(board: PlayerBoard, row: number, col: number): {
  board: PlayerBoard;
  result: 'hit' | 'miss' | 'sunk';
  sunkShip?: ShipType;
} {
  const nextHits = cloneGrid(board.hits);
  const nextMisses = cloneGrid(board.misses);

  if (!board.shipCells[row][col]) {
    nextMisses[row][col] = true;
    return {
      board: { ...board, hits: nextHits, misses: nextMisses },
      result: 'miss',
    };
  }

  nextHits[row][col] = true;
  let sunkShip: ShipType | undefined;
  const nextShips = board.ships.map((ship) => {
    const touched = ship.cells.some((c) => c.row === row && c.col === col);
    if (!touched || ship.sunk) return ship;

    const hits = ship.hits + 1;
    const sunk = hits >= ship.length;
    if (sunk) sunkShip = ship.type;

    return { ...ship, hits, sunk };
  });

  return {
    board: { ...board, hits: nextHits, misses: nextMisses, ships: nextShips },
    result: sunkShip ? 'sunk' : 'hit',
    sunkShip,
  };
}

export function shipsRemaining(board: PlayerBoard): number {
  return board.ships.filter((s) => !s.sunk).length;
}
