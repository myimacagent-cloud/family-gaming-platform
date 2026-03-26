import type { GameDefinition, MoveValidation } from '../types';
import type { DanceBattlesState, DanceBattlesMove, ArrowDirection, ArrowNote, HitResult } from './types';
import { DanceBattlesBoard } from './Board';
import { SONG_DURATION, SCORE_VALUES, TIMING_WINDOWS } from './types';

const GAME_ID = 'dancebattles';

// Generate arrow notes for a song
function generateSongArrows(): ArrowNote[] {
  const arrows: ArrowNote[] = [];
  const directions: ArrowDirection[] = ['up', 'down', 'left', 'right'];
  const minInterval = 400; // ms between arrows at minimum
  const maxInterval = 900; // ms between arrows at maximum
  
  let currentTime = 1500; // Start 1.5s into the song
  let id = 0;
  
  while (currentTime < SONG_DURATION - 1000) { // End 1s before song ends
    // Add 1-3 arrows at a time (sometimes chords)
    const numArrows = Math.random() < 0.15 ? (Math.random() < 0.5 ? 2 : 3) : 1;
    const usedDirections = new Set<ArrowDirection>();
    
    for (let i = 0; i < numArrows; i++) {
      let dir: ArrowDirection;
      do {
        dir = directions[Math.floor(Math.random() * directions.length)];
      } while (usedDirections.has(dir) && usedDirections.size < directions.length);
      
      usedDirections.add(dir);
      arrows.push({
        id: `note-${id++}`,
        direction: dir,
        time: currentTime,
        lane: 0, // Both players see same arrows
      });
    }
    
    // Next arrow(s) after a random interval
    currentTime += minInterval + Math.random() * (maxInterval - minInterval);
  }
  
  return arrows;
}

function createInitialState(_roomCode: string): DanceBattlesState {
  return {
    gameType: GAME_ID,
    players: [],
    status: 'waiting',
    winner: null,
    currentPlayerIndex: 0,
    songStartTime: null,
    songDuration: SONG_DURATION,
    currentTime: 0,
    arrows: [],
    scores: {},
    hits: {},
    lastHit: {},
    streaks: {},
    maxStreaks: {},
  };
}

function createRestartState(currentState: DanceBattlesState): DanceBattlesState {
  return {
    ...currentState,
    status: 'active',
    winner: null,
    songStartTime: Date.now() + 2000, // Start 2 seconds from now for countdown
    currentTime: 0,
    arrows: generateSongArrows(),
    scores: currentState.players.reduce((acc, p) => ({ ...acc, [p.symbol]: 0 }), {}),
    hits: currentState.players.reduce((acc, p) => ({ ...acc, [p.symbol]: [] }), {}),
    lastHit: currentState.players.reduce((acc, p) => ({ ...acc, [p.symbol]: null }), {}),
    streaks: currentState.players.reduce((acc, p) => ({ ...acc, [p.symbol]: 0 }), {}),
    maxStreaks: currentState.players.reduce((acc, p) => ({ ...acc, [p.symbol]: 0 }), {}),
  };
}

function validateMove(state: DanceBattlesState, move: DanceBattlesMove, _playerSymbol: string): MoveValidation {
  if (state.status !== 'active') return { valid: false, error: 'Game not active' };
  if (!state.songStartTime) return { valid: false, error: 'Song not started' };
  
  // Check if countdown is still active
  const timeSinceStart = Date.now() - state.songStartTime;
  if (timeSinceStart < 0) return { valid: false, error: 'Countdown in progress' };
  
  // Check if song has ended
  if (timeSinceStart > SONG_DURATION) return { valid: false, error: 'Song ended' };
  
  if (!move || move.type !== 'hit_arrow') return { valid: false, error: 'Invalid move' };
  if (!['up', 'down', 'left', 'right'].includes(move.direction)) return { valid: false, error: 'Invalid direction' };
  
  return { valid: true };
}

function findClosestUnhitArrow(state: DanceBattlesState, playerSymbol: string, direction: ArrowDirection, hitTime: number): ArrowNote | null {
  const playerHits = state.hits[playerSymbol] || [];
  
  // Find closest unhit arrow in the right direction that's within reasonable range
  let closest: ArrowNote | null = null;
  let closestDiff = Infinity;
  
  for (const arrow of state.arrows) {
    // Skip already hit arrows
    if (playerHits.includes(arrow.id)) continue;
    if (arrow.direction !== direction) continue;
    
    const diff = Math.abs(arrow.time - hitTime);
    
    // Only consider arrows that haven't passed too far (within 200ms after)
    if (diff < 300 && diff < closestDiff) {
      closest = arrow;
      closestDiff = diff;
    }
  }
  
  return closest;
}

function determineHitResult(timeDiff: number): HitResult {
  const absDiff = Math.abs(timeDiff);
  if (absDiff <= TIMING_WINDOWS.perfect) return 'perfect';
  if (absDiff <= TIMING_WINDOWS.close) return 'close';
  return 'miss';
}

function finalizeByScore(state: DanceBattlesState): DanceBattlesState {
  const players = state.players;
  if (players.length < 2) return state;

  const [p1, p2] = players;
  const score1 = state.scores[p1.symbol] || 0;
  const score2 = state.scores[p2.symbol] || 0;

  let winner: string | null = null;
  let status: 'finished' | 'draw' = 'finished';

  if (score1 > score2) {
    winner = p1.symbol;
  } else if (score2 > score1) {
    winner = p2.symbol;
  } else {
    const streak1 = state.maxStreaks[p1.symbol] || 0;
    const streak2 = state.maxStreaks[p2.symbol] || 0;
    if (streak1 > streak2) {
      winner = p1.symbol;
    } else if (streak2 > streak1) {
      winner = p2.symbol;
    } else {
      status = 'draw';
    }
  }

  return {
    ...state,
    status,
    winner,
  };
}

function applyMove(state: DanceBattlesState, move: DanceBattlesMove, playerSymbol: string): DanceBattlesState {
  const hitTime = move.timestamp;
  const closestArrow = findClosestUnhitArrow(state, playerSymbol, move.direction, hitTime);
  
  const newHits = { ...state.hits };
  const newScores = { ...state.scores };
  const newLastHit = { ...state.lastHit };
  const newStreaks = { ...state.streaks };
  const newMaxStreaks = { ...state.maxStreaks };
  
  let result: HitResult = 'miss';
  
  if (closestArrow) {
    const timeDiff = closestArrow.time - hitTime;
    result = determineHitResult(timeDiff);
    
    // Mark arrow as hit
    newHits[playerSymbol] = [...(newHits[playerSymbol] || []), closestArrow.id];
    
    // Update score
    const points = SCORE_VALUES[result];
    newScores[playerSymbol] = (newScores[playerSymbol] || 0) + points;
    
    // Update streak
    if (result === 'miss') {
      newStreaks[playerSymbol] = 0;
    } else {
      newStreaks[playerSymbol] = (newStreaks[playerSymbol] || 0) + 1;
      if (newStreaks[playerSymbol] > (newMaxStreaks[playerSymbol] || 0)) {
        newMaxStreaks[playerSymbol] = newStreaks[playerSymbol];
      }
    }
  } else {
    // No arrow to hit - counts as a miss if there's an arrow nearby
    newStreaks[playerSymbol] = 0;
  }
  
  // Store last hit for UI feedback
  newLastHit[playerSymbol] = { result, arrow: move.direction };
  
  const newState: DanceBattlesState = {
    ...state,
    hits: newHits,
    scores: newScores,
    lastHit: newLastHit,
    streaks: newStreaks,
    maxStreaks: newMaxStreaks,
  };
  
  // Check if song has ended
  const songTime = state.songStartTime ? Date.now() - state.songStartTime : 0;
  if (songTime > SONG_DURATION) {
    return finalizeByScore(newState);
  }
  
  return newState;
}

function checkGameEnd(state: DanceBattlesState): { ended: boolean; winner: string | null; draw: boolean } {
  // End if status is already finished
  if (state.status === 'finished' || state.status === 'draw') {
    return { ended: true, winner: state.winner, draw: state.status === 'draw' };
  }
  
  // Check if song has ended based on time
  if (state.songStartTime) {
    const elapsed = Date.now() - state.songStartTime;
    if (elapsed > state.songDuration + 1000) { // Wait 1s after song ends for late hits
      const players = state.players;
      if (players.length < 2) return { ended: false, winner: null, draw: false };
      
      const [p1, p2] = players;
      const score1 = state.scores[p1.symbol] || 0;
      const score2 = state.scores[p2.symbol] || 0;
      
      let winner: string | null = null;
      let status: 'finished' | 'draw' = 'finished';
      
      if (score1 > score2) {
        winner = p1.symbol;
      } else if (score2 > score1) {
        winner = p2.symbol;
      } else {
        // Tiebreaker: check max streak
        const streak1 = state.maxStreaks[p1.symbol] || 0;
        const streak2 = state.maxStreaks[p2.symbol] || 0;
        if (streak1 > streak2) {
          winner = p1.symbol;
        } else if (streak2 > streak1) {
          winner = p2.symbol;
        } else {
          status = 'draw';
        }
      }
      
      return { ended: true, winner, draw: status === 'draw' };
    }
  }
  
  return { ended: false, winner: null, draw: false };
}

export const danceBattlesGame: GameDefinition<DanceBattlesState, DanceBattlesMove> = {
  id: GAME_ID,
  displayName: '🕺 Dance Battles',
  description: 'Press arrow keys as falling arrows reach the target!',
  minPlayers: 2,
  maxPlayers: 2,
  createInitialState,
  createRestartState,
  renderBoard: DanceBattlesBoard,
  validateMove,
  applyMove,
  checkGameEnd,
};