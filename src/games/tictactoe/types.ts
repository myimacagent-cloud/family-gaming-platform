import type { BaseGameState } from '../types';

export type TicTacToeCell = 'X' | 'O' | null;

export interface TicTacToeState extends BaseGameState {
  gameType: 'tictactoe';
  board: TicTacToeCell[]; // 9 cells (0-8)
  winningCells: number[] | null;
}

export interface TicTacToeMove {
  index: number; // 0-8
}

// Check if a player has won
export function checkWin(board: TicTacToeCell[], symbol: string): number[] | null {
  const wins = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6], // diagonals
  ];
  
  for (const combo of wins) {
    if (combo.every(i => board[i] === symbol)) {
      return combo;
    }
  }
  return null;
}
