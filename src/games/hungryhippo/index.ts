import type { GameDefinition, MoveValidation } from '../types';
import type { HungryHippoState, HungryHippoMove } from './types';
import { HungryHippoBoard } from './Board';

const GAME_ID = 'hungryhippo';

const HIPPO_COLORS = ['#ef4444', '#22c55e', '#3b82f6', '#eab308'];

function createInitialState(_roomCode: string): HungryHippoState {
  return {
    gameType: GAME_ID,
    players: [],
    status: 'waiting',
    winner: null,
    currentPlayerIndex: 0,
    marbles: [],
    hippos: [],
    phase: 'waiting',
    roundNumber: 1,
    playerReady: {},
  };
}

function createRestartState(currentState: HungryHippoState): HungryHippoState {
  const newHippos = currentState.players.map((p, index) => ({
    playerId: p.userId,
    symbol: p.symbol,
    position: (['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const)[index % 4],
    marblesEaten: 0,
    isChomping: false,
    color: HIPPO_COLORS[index % HIPPO_COLORS.length],
  }));
  
  return {
    ...currentState,
    status: 'active',
    winner: null,
    currentPlayerIndex: 0,
    marbles: [],
    hippos: newHippos,
    phase: 'dropping',
    roundNumber: currentState.roundNumber + 1,
    playerReady: {},
  };
}

function validateMove(state: HungryHippoState, move: HungryHippoMove, playerSymbol: string): MoveValidation {
  if (state.status !== 'active') return { valid: false, error: 'Game is not active' };
  
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (currentPlayer?.symbol !== playerSymbol) return { valid: false, error: 'Not your turn' };
  
  if (move.action === 'chomp') {
    if (!move.targetMarbleId) return { valid: false, error: 'No marble targeted' };
    
    const marble = state.marbles.find(m => m.id === move.targetMarbleId);
    if (!marble) return { valid: false, error: 'Marble not found' };
    if (marble.collectedBy) return { valid: false, error: 'Marble already eaten' };
  }
  
  return { valid: true };
}

function applyMove(state: HungryHippoState, move: HungryHippoMove, playerSymbol: string): HungryHippoState {
  const player = state.players.find(p => p.symbol === playerSymbol);
  if (!player) return state;
  
  const hippoIndex = state.hippos.findIndex(h => h.symbol === playerSymbol);
  if (hippoIndex === -1) return state;
  
  if (move.action === 'chomp' && move.targetMarbleId) {
    const marbleIndex = state.marbles.findIndex(m => m.id === move.targetMarbleId);
    if (marbleIndex === -1 || state.marbles[marbleIndex].collectedBy) return state;
    
    const newMarbles = [...state.marbles];
    const newHippos = [...state.hippos];
    
    newMarbles[marbleIndex] = { ...newMarbles[marbleIndex], collectedBy: playerSymbol };
    newHippos[hippoIndex] = { 
      ...newHippos[hippoIndex], 
      marblesEaten: newHippos[hippoIndex].marblesEaten + 1, 
      isChomping: true 
    };
    
    return { ...state, marbles: newMarbles, hippos: newHippos };
  }
  
  return state;
}

function checkGameEnd(state: HungryHippoState): { ended: boolean; winner: string | null; draw: boolean } {
  if (state.status === 'finished') return { ended: true, winner: state.winner, draw: false };
  if (state.status === 'draw') return { ended: true, winner: null, draw: true };
  
  const allEaten = state.marbles.length > 0 && state.marbles.every(m => m.collectedBy !== null);
  
  if (allEaten) {
    const maxEaten = Math.max(...state.hippos.map(h => h.marblesEaten));
    const winners = state.hippos.filter(h => h.marblesEaten === maxEaten);
    
    if (winners.length === 1) {
      return { ended: true, winner: winners[0].symbol, draw: false };
    }
    return { ended: true, winner: null, draw: true };
  }
  
  return { ended: false, winner: null, draw: false };
}

export const hungryHippoGame: GameDefinition<HungryHippoState, HungryHippoMove> = {
  id: GAME_ID,
  displayName: '🦛 Hungry Hippo',
  description: 'Classic marble chomping game - race to eat the most marbles!',
  minPlayers: 2,
  maxPlayers: 4,
  createInitialState,
  createRestartState,
  renderBoard: HungryHippoBoard,
  validateMove,
  applyMove,
  checkGameEnd,
};
