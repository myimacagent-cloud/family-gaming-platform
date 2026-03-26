import type { BaseGameState } from '../types';

export type EdgeOrientation = 'h' | 'v';

export interface DotsAndBoxesState extends BaseGameState {
  gameType: 'dotsandboxes-v81';
  rows: number; // dot rows
  cols: number; // dot cols
  horizontalEdges: boolean[]; // rows * (cols - 1)
  verticalEdges: boolean[]; // (rows - 1) * cols
  boxes: (string | null)[]; // (rows - 1) * (cols - 1), stores owner symbol
  scores: Record<string, number>;
}

export interface DotsAndBoxesMove {
  orientation: EdgeOrientation;
  index: number;
}

export function horizontalEdgeIndex(_rows: number, cols: number, r: number, c: number): number {
  // r in [0, rows-1], c in [0, cols-2]
  return r * (cols - 1) + c;
}

export function verticalEdgeIndex(_rows: number, cols: number, r: number, c: number): number {
  // r in [0, rows-2], c in [0, cols-1]
  return r * cols + c;
}

export function boxIndex(cols: number, r: number, c: number): number {
  // r in [0, rows-2], c in [0, cols-2]
  return r * (cols - 1) + c;
}
