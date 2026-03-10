import { useState } from 'react';
import type { GameBoardProps } from '../types';
import type { DanceBattlesState, DanceBattlesMove } from './types';

interface DanceBattlesBoardProps extends GameBoardProps<DanceBattlesState> {}

const SUGGESTED = ['Wave', 'Spin', 'Slide', 'Moonwalk', 'PopLock', 'Freeze', 'Shuffle', 'Flare'];

export function DanceBattlesBoard({ state, mySymbol, onMove, disabled }: DanceBattlesBoardProps) {
  const isFinished = state.status === 'finished' || state.status === 'draw';
  const myTurn = state.players[state.currentPlayerIndex]?.symbol === mySymbol && !disabled && !isFinished;
  const [moveInput, setMoveInput] = useState('');

  const me = state.players.find((p) => p.symbol === mySymbol);
  const opp = state.players.find((p) => p.symbol !== mySymbol);

  const myScore = state.scores?.[mySymbol] ?? 0;
  const oppScore = opp ? state.scores?.[opp.symbol] ?? 0 : 0;

  const submit = (moveText?: string) => {
    const finalMove = (moveText ?? moveInput).trim();
    if (!myTurn || !finalMove) return;
    const move: DanceBattlesMove = { type: 'submit_move', move: finalMove };
    onMove(move);
    setMoveInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 'min(820px, calc(100vw - 24px))' }}>
      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#334155' }}>
        {state.lastAction}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: '8px 12px', fontWeight: 800 }}>Round: {state.round}/{state.maxRounds}</div>
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: '8px 12px', fontWeight: 800 }}>🔵 {me?.displayName ?? 'You'}: {myScore}</div>
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: '8px 12px', fontWeight: 800 }}>🩷 {opp?.displayName ?? 'Opponent'}: {oppScore}</div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 12 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Suggested Moves</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {SUGGESTED.map((m) => (
            <button key={m} onClick={() => submit(m)} disabled={!myTurn} style={{ border: '1px solid #cbd5e1', borderRadius: 999, padding: '6px 10px', background: myTurn ? '#fff' : '#e5e7eb', cursor: myTurn ? 'pointer' : 'default', fontWeight: 700 }}>
              {m}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          value={moveInput}
          onChange={(e) => setMoveInput(e.target.value)}
          placeholder="Type your dance move"
          disabled={!myTurn}
          style={{ flex: 1, minWidth: 200, padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1' }}
        />
        <button onClick={() => submit()} disabled={!myTurn || !moveInput.trim()} style={{ border: 'none', borderRadius: 10, padding: '10px 14px', background: myTurn && moveInput.trim() ? '#16a34a' : '#94a3b8', color: '#fff', fontWeight: 800, cursor: myTurn && moveInput.trim() ? 'pointer' : 'default' }}>
          Lock Move
        </button>
      </div>

      <div style={{ fontSize: 13, color: 'white', fontWeight: 700 }}>
        {isFinished
          ? state.winner === mySymbol
            ? '🏆 You won the dance battle!'
            : state.status === 'draw'
              ? 'Dance battle draw'
              : 'Opponent wins'
          : myTurn
            ? 'Your turn to submit move'
            : 'Waiting for opponent'}
      </div>
    </div>
  );
}

export default DanceBattlesBoard;
