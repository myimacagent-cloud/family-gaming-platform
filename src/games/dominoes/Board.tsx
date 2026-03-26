import { useState } from 'react';
import type { GameBoardProps } from '../types';
import type { DominoesState, DominoesMove } from './types';

interface DominoesBoardProps extends GameBoardProps<DominoesState> {}

function parseDomino(t: string): [number, number] {
  const [a, b] = t.split('-').map(Number);
  return [a, b];
}

function canPlayDomino(t: string, left: number | null, right: number | null): boolean {
  if (left === null || right === null) return true;
  const [a, b] = parseDomino(t);
  return a === left || b === left || a === right || b === right;
}

export function DominoesBoard({ state, mySymbol, myPlayerId, onMove, disabled }: DominoesBoardProps) {
  const meById = state.players.find((p) => p.userId === myPlayerId);
  const resolvedMySymbol = mySymbol || meById?.symbol || Object.keys(state.hands || {})[0] || '';
  const oppSymbol = Object.keys(state.hands || {}).find((s) => s !== resolvedMySymbol) || '';

  const isFinished = state.status === 'finished' || state.status === 'draw';
  const myTurn = state.players[state.currentPlayerIndex]?.symbol === resolvedMySymbol && !disabled && !isFinished;

  const me = state.players.find((p) => p.symbol === resolvedMySymbol) || meById;
  const opp = state.players.find((p) => p.symbol === oppSymbol) || state.players.find((p) => p.symbol !== resolvedMySymbol);

  const myHand = state.hands?.[resolvedMySymbol] || [];
  const oppCount = oppSymbol ? state.hands?.[oppSymbol]?.length ?? 0 : 0;

  const [selectedDomino, setSelectedDomino] = useState<string | null>(null);

  const play = (side: 'left' | 'right') => {
    if (!myTurn || !selectedDomino) return;
    const move: DominoesMove = { type: 'play', tile: selectedDomino, side };
    onMove(move);
    setSelectedDomino(null);
  };

  const draw = () => {
    if (!myTurn) return;
    const move: DominoesMove = { type: 'draw' };
    onMove(move);
    setSelectedDomino(null);
  };

  const left = state.leftEnd;
  const right = state.rightEnd;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 'min(920px, calc(100vw - 24px))' }}>
      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#334155' }}>
        {state.lastAction}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: '8px 12px', fontWeight: 800 }}>🔵 {me?.displayName ?? 'You'} dominoes: {myHand.length}</div>
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: '8px 12px', fontWeight: 800 }}>🩷 {opp?.displayName ?? 'Opponent'} dominoes: {oppCount}</div>
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: '8px 12px', fontWeight: 800 }}>Ends: {left ?? '—'} | {right ?? '—'}</div>
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: '8px 12px', fontWeight: 800 }}>Boneyard: {state.boneyard.length}</div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 10 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Chain</div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
          {state.chain.length === 0 && <span style={{ color: '#64748b' }}>No dominoes played yet</span>}
          {state.chain.map((t, i) => {
            const [a, b] = parseDomino(t);
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
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Your Hand (tap domino then choose side)</div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 10 }}>
          {myHand.map((t, i) => {
            const [a, b] = parseDomino(t);
            const playable = canPlayDomino(t, left, right);
            const selected = selectedDomino === t;
            return (
              <button
                key={`${t}-${i}`}
                onClick={() => playable && myTurn && setSelectedDomino(t)}
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
          {myHand.length === 0 && <span style={{ color: '#64748b' }}>No dominoes</span>}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => play('left')} disabled={!myTurn || !selectedDomino} style={{ border: 'none', borderRadius: 10, padding: '10px 14px', background: myTurn && selectedDomino ? '#16a34a' : '#94a3b8', color: '#fff', fontWeight: 800, cursor: myTurn && selectedDomino ? 'pointer' : 'default' }}>Play Left</button>
          <button onClick={() => play('right')} disabled={!myTurn || !selectedDomino} style={{ border: 'none', borderRadius: 10, padding: '10px 14px', background: myTurn && selectedDomino ? '#0ea5e9' : '#94a3b8', color: '#fff', fontWeight: 800, cursor: myTurn && selectedDomino ? 'pointer' : 'default' }}>Play Right</button>
          <button onClick={draw} disabled={!myTurn || state.boneyard.length === 0} style={{ border: 'none', borderRadius: 10, padding: '10px 14px', background: myTurn && state.boneyard.length > 0 ? '#f59e0b' : '#94a3b8', color: '#fff', fontWeight: 800, cursor: myTurn && state.boneyard.length > 0 ? 'pointer' : 'default' }}>Draw Domino</button>
        </div>
      </div>
    </div>
  );
}

export default DominoesBoard;
