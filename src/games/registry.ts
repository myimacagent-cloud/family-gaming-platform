import type { GameDefinition, GameRegistry } from './types';
import { ticTacToeGame } from './tictactoe';
import { ticTacToe3PieceGame } from './tictactoe-3piece';
import { hangmanGame } from './hangman';
import { chessGameDefinition } from './chess';
import { rockPaperScissorsGame } from './rockpaperscissors';
import { dotsAndBoxesGame } from './dotsandboxes';
import { colorWarsGame } from './colorwars';
import { connectFourGame } from './connectfour';
import { memoryGame } from './memory';
import { marblesEvenOddGame } from './marblesevenodd';
import { battleshipGame } from './battleship';
import { checkersGame } from './checkers';
import { airHockeyGame } from './airhockey';
import { warGame } from './war';
import { goFishGame } from './gofish';
import { crazyEightsGame } from './crazyeights';

// Central registry of all available games
export const gameRegistry: GameRegistry = {
  [ticTacToeGame.id]: ticTacToeGame,
  [ticTacToe3PieceGame.id]: ticTacToe3PieceGame,
  [hangmanGame.id]: hangmanGame,
  [chessGameDefinition.id]: chessGameDefinition,
  [rockPaperScissorsGame.id]: rockPaperScissorsGame,
  [dotsAndBoxesGame.id]: dotsAndBoxesGame,
  [colorWarsGame.id]: colorWarsGame,
  [connectFourGame.id]: connectFourGame,
  [memoryGame.id]: memoryGame,
  [marblesEvenOddGame.id]: marblesEvenOddGame,
  [battleshipGame.id]: battleshipGame,
  [checkersGame.id]: checkersGame,
  [airHockeyGame.id]: airHockeyGame,
  [warGame.id]: warGame,
  [goFishGame.id]: goFishGame,
  [crazyEightsGame.id]: crazyEightsGame,
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
