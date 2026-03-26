import type { BaseGameState } from '../types';

// Arrow direction types
export type ArrowDirection = 'up' | 'down' | 'left' | 'right';

// Arrow note in the song
export interface ArrowNote {
  id: string;
  direction: ArrowDirection;
  time: number; // ms from start of song
  lane: 0 | 1; // 0 = left player, 1 = right player (or both see arrows but hit their own)
}

// Hit result from player input
export type HitResult = 'perfect' | 'close' | 'miss';

// Scoring
export const SCORE_VALUES: Record<HitResult, number> = {
  perfect: 5,
  close: 2,
  miss: 0,
};

// Timing windows (ms)
export const TIMING_WINDOWS = {
  perfect: 80,  // +/- 80ms = perfect
  close: 180,   // +/- 180ms = close
};

// Song settings
export const SONG_DURATION = 30000; // 30 seconds of gameplay
export const ARROW_FALL_DURATION = 1500; // Time for arrow to fall from top to hit zone

export interface DanceBattlesState extends BaseGameState {
  gameType: 'dancebattles';
  status: 'waiting' | 'active' | 'finished' | 'draw';
  
  // Timing
  songStartTime: number | null; // server timestamp when song starts
  songDuration: number; // total song length in ms
  currentTime: number; // current playback position
  
  // Arrow tracks (same arrows for both players)
  arrows: ArrowNote[];
  
  // Player scores
  scores: Record<string, number>; // symbol -> score
  
  // Hit tracking per player (symbol -> note ids that are hit)
  hits: Record<string, string[]>;
  
  // Recent hit results for UI feedback
  lastHit: Record<string, { result: HitResult; arrow: ArrowDirection } | null>; // symbol -> last hit result
  
  // Streaks
  streaks: Record<string, number>; // symbol -> current streak
  maxStreaks: Record<string, number>; // symbol -> highest streak
  
  winner: string | null;
}

// Client -> Server: Player hit an arrow key
export interface DanceBattlesMove {
  type: 'hit_arrow';
  direction: ArrowDirection;
  timestamp: number; // client timestamp (relative to song start)
}

// For server authorative timing
export interface DanceBattlesServerUpdate {
  currentTime: number;
  noteHits: Record<string, HitResult>; // noteId -> result (processed server-side)
}

// Arrow lane configuration (visual)
export const LANES: { direction: ArrowDirection; key: string; symbol: string; color: string }[] = [
  { direction: 'left', key: 'ArrowLeft', symbol: '⬅️', color: '#ef4444' },
  { direction: 'down', key: 'ArrowDown', symbol: '⬇️', color: '#22c55e' },
  { direction: 'up', key: 'ArrowUp', symbol: '⬆️', color: '#3b82f6' },
  { direction: 'right', key: 'ArrowRight', symbol: '➡️', color: '#f59e0b' },
];
