import {
  BATTLESHIP_GRID_SIZE,
  SHIP_DEFINITIONS,
  type PlayerBoard,
  type Ship,
  type ShipOrientation,
  type ShipType,
} from './types';

function createGrid(defaultValue = false): boolean[][] {
  return Array.from({ length: BATTLESHIP_GRID_SIZE }, () =>
    Array.from({ length: BATTLESHIP_GRID_SIZE }, () => defaultValue)
  );
}

export function createEmptyBoard(): PlayerBoard {
  return {
    ships: [],
    shipCells: createGrid(false),
    hits: createGrid(false),
    misses: createGrid(false),
    placedShips: [],
  };
}

export function getShipDefinition(type: ShipType) {
  return SHIP_DEFINITIONS.find((s) => s.type === type);
}

export function isWithinBounds(row: number, col: number): boolean {
  return row >= 0 && row < BATTLESHIP_GRID_SIZE && col >= 0 && col < BATTLESHIP_GRID_SIZE;
}

export function getShipPositions(row: number, col: number, length: number, orientation: ShipOrientation) {
  const positions: { row: number; col: number }[] = [];
  for (let i = 0; i < length; i++) {
    const nextRow = orientation === 'vertical' ? row + i : row;
    const nextCol = orientation === 'horizontal' ? col + i : col;
    positions.push({ row: nextRow, col: nextCol });
  }
  return positions;
}

export function canPlaceShip(board: PlayerBoard, shipType: ShipType, row: number, col: number, orientation: ShipOrientation): boolean {
  const shipDef = getShipDefinition(shipType);
  if (!shipDef) return false;
  if (board.placedShips.includes(shipType)) return false;

  const positions = getShipPositions(row, col, shipDef.length, orientation);
  for (const pos of positions) {
    if (!isWithinBounds(pos.row, pos.col)) return false;
    if (board.shipCells[pos.row][pos.col]) return false;
  }

  return true;
}

export function placeShipOnBoard(board: PlayerBoard, shipType: ShipType, row: number, col: number, orientation: ShipOrientation): PlayerBoard {
  const shipDef = getShipDefinition(shipType);
  if (!shipDef) return board;

  const positions = getShipPositions(row, col, shipDef.length, orientation);
  const nextShipCells = board.shipCells.map((line) => [...line]);

  for (const pos of positions) {
    nextShipCells[pos.row][pos.col] = true;
  }

  const nextShip: Ship = {
    id: `${shipType}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: shipType,
    length: shipDef.length,
    positions,
    hits: 0,
    sunk: false,
  };

  return {
    ...board,
    shipCells: nextShipCells,
    ships: [...board.ships, nextShip],
    placedShips: [...board.placedShips, shipType],
  };
}

export function allShipsPlaced(board: PlayerBoard): boolean {
  return SHIP_DEFINITIONS.every((s) => board.placedShips.includes(s.type));
}

export function boardIsReady(boards: Record<string, PlayerBoard>, symbols: string[]): boolean {
  return symbols.every((symbol) => {
    const board = boards[symbol];
    return board ? allShipsPlaced(board) : false;
  });
}

export function hasAlreadyAttacked(board: PlayerBoard, row: number, col: number): boolean {
  return board.hits[row][col] || board.misses[row][col];
}

export function applyAttack(board: PlayerBoard, row: number, col: number): {
  board: PlayerBoard;
  result: 'hit' | 'miss' | 'sunk';
  sunkShipType?: ShipType;
} {
  const nextHits = board.hits.map((line) => [...line]);
  const nextMisses = board.misses.map((line) => [...line]);

  if (board.shipCells[row][col]) {
    nextHits[row][col] = true;

    let sunkShipType: ShipType | undefined;
    const nextShips = board.ships.map((ship) => {
      const isPartOfShip = ship.positions.some((pos) => pos.row === row && pos.col === col);
      if (!isPartOfShip || ship.sunk) return ship;

      const nextHitsCount = ship.hits + 1;
      const nextSunk = nextHitsCount >= ship.length;
      if (nextSunk) sunkShipType = ship.type;

      return {
        ...ship,
        hits: nextHitsCount,
        sunk: nextSunk,
      };
    });

    return {
      board: {
        ...board,
        hits: nextHits,
        misses: nextMisses,
        ships: nextShips,
      },
      result: sunkShipType ? 'sunk' : 'hit',
      sunkShipType,
    };
  }

  nextMisses[row][col] = true;
  return {
    board: {
      ...board,
      hits: nextHits,
      misses: nextMisses,
      ships: board.ships,
    },
    result: 'miss',
  };
}

export function remainingShips(board: PlayerBoard): number {
  return board.ships.filter((ship) => !ship.sunk).length;
}
