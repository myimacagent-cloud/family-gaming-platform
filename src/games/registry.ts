import type { GameDefinition, GameRegistry } from './types';
import { ticTacToeGame } from './tictactoe';
import { ticTacToe3PieceGame } from './tictactoe-3piece';
import { hangmanGame } from './hangman';
import { dotsAndBoxesGame } from './dotsandboxes';

// Central registry of all available games
export const gameRegistry: GameRegistry = {
  [ticTacToeGame.id]: ticTacToeGame,
  [ticTacToe3PieceGame.id]: ticTacToe3PieceGame,
  [hangmanGame.id]: hangmanGame,
  [dotsAndBoxesGame.id]: dotsAndBoxesGame,
};

// Helper functions
export function getGame(id: string): GameDefinition | undefined {
  return gameRegistry[id];
}

export function getAllGames(): GameDefinition[] {
  return Object.values(gameRegistry);
}

export function gameExists(id: string): boolean {
  return id in gameRegistry;
}

export function getGameList(): { id: string; displayName: string; description: string }[] {
  return Object.values(gameRegistry).map(g => ({
    id: g.id,
    displayName: g.displayName,
    description: g.description,
  }));
}
