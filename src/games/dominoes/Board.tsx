import { useState } from 'react';
import type { GameBoardProps } from '../types';
import type { DominoesState, DominoesMove } from './types';

interface DominoesBoardProps extends GameBoardProps<DominoesState> {}

function parseTile(t: string): [number, number] {
  const [a, b] = t.split('-').map(Number);
  return [a, b];
}

function canPlayTile(t: string, left: number | null, right: number | null): boolean {
  if (left === null || right === null) return true;
  const [a, b] = parseTile(t);
  return a === left || b === left || a === right || b === right;
}

export function DominoesBoard({ state, mySymbol, onMove, disabled }: DominoesBoardProps) {
  const isFinished = state.status === 'finished' || state.status === 'draw';
  const myTurn = state.players[state.currentPlayerIndex]?.symbol === mySymbol && !disabled && !isFinished;

  const me = state.players.find((p) => p.symbol === mySymbol);
  const opp = state.players.find((p) => p.symbol !== mySymbol);

  const myHand = state.hands?.[mySymbol] || [];
  const oppCount = opp ? state.hands?.[opp.symbol]?.length ?? 0 : 0;

  const [selectedTile, setSelectedTile] = useState<string | null>(null);

  const play = (side: 'left' | 'right') => {
    if (!myTurn || !selectedTile) return;
    const move: DominoesMove = { type: 'play', tile: selectedTile, side };
    onMove(move);
    setSelectedTile(null);
  };

  const draw = () => {
    if (!myTurn) return;
    const move: DominoesMove = { type: 'draw' };
    onMove(move);
    setSelectedTile(null);
  };

  const left = state.leftEnd;
  const right = state.rightEnd;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 'min(920px, calc(100vw - 24px))' }}>
      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#334155' }}>
        {state.lastAction}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: '8px 12px', fontWeight: 800 }}>🔵 {me?.displayName ?? 'You'} tiles: {myHand.length}</div>
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: '8px 12px', fontWeight: 800 }}>🩷 {opp?.displayName ?? 'Opponent'} tiles: {oppCount}</div>
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: '8px 12px', fontWeight: 800 }}>Ends: {left ?? '—'} | {right ?? '—'}</div>
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: '8px 12px', fontWeight: 800 }}>Boneyard: {state.boneyard.length}</div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 10 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Chain</div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
          {state.chain.length === 0 && <span style={{ color: '#64748b' }}>No tiles played yet</span>}
          {state.chain.map((t, i) => {
            const [a, b] = parseTile(t);
            return (
              <div key={`${t}-${i}`} style={{ width: 56, height: 28, borderRadius: 6, border: '2px solid #cbd5e1', background: '#fff', display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden', flex: '0 0 auto' }}>
                <div style={{ display: 'grid', placeItems: 'center', borderRight: '1px solid #cbd5e1', fontWeight: 900 }}>{a}</div>
                <div style={{ display: 'grid', placeItems: 'center', fontWeight: 900 }}>{b}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 12 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Your Hand (tap tile then choose side)</div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 10 }}>
          {myHand.map((t, i) => {
            const [a, b] = parseTile(t);
            const playable = canPlayTile(t, left, right);
            const selected = selectedTile === t;
            return (
              <button
                key={`${t}-${i}`}
                onClick={() => playable && myTurn && setSelectedTile(t)}
                disabled={!playable || !myTurn}
                style={{
                  width: 72,
                  height: 36,
                  borderRadius: 8,
                  border: selected ? '3px solid #16a34a' : playable ? '2px solid #6D7DFF' : '2px solid #cbd5e1',
                  background: '#fff',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  overflow: 'hidden',
                  opacity: playable ? 1 : 0.5,
                  cursor: playable && myTurn ? 'pointer' : 'default',
                  flex: '0 0 auto',
                }}
              >
                <span style={{ display: 'grid', placeItems: 'center', borderRight: '1px solid #cbd5e1', fontWeight: 900 }}>{a}</span>
                <span style={{ display: 'grid', placeItems: 'center', fontWeight: 900 }}>{b}</span>
              </button>
            );
          })}
          {myHand.length === 0 && <span style={{ color: '#64748b' }}>No tiles</span>}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => play('left')} disabled={!myTurn || !selectedTile} style={{ border: 'none', borderRadius: 10, padding: '10px 14px', background: myTurn && selectedTile ? '#16a34a' : '#94a3b8', color: '#fff', fontWeight: 800, cursor: myTurn && selectedTile ? 'pointer' : 'default' }}>Play Left</button>
          <button onClick={() => play('right')} disabled={!myTurn || !selectedTile} style={{ border: 'none', borderRadius: 10, padding: '10px 14px', background: myTurn && selectedTile ? '#0ea5e9' : '#94a3b8', color: '#fff', fontWeight: 800, cursor: myTurn && selectedTile ? 'pointer' : 'default' }}>Play Right</button>
          <button onClick={draw} disabled={!myTurn || state.boneyard.length === 0} style={{ border: 'none', borderRadius: 10, padding: '10px 14px', background: myTurn && state.boneyard.length > 0 ? '#f59e0b' : '#94a3b8', color: '#fff', fontWeight: 800, cursor: myTurn && state.boneyard.length > 0 ? 'pointer' : 'default' }}>Draw Tile</button>
        </div>
      </div>
    </div>
  );
}

export default DominoesBoard;
