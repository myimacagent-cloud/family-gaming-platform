import { useEffect, useState } from 'react';
import type { GameBoardProps } from '../types';
import type { AirHockeyState, AirHockeyMove } from './types';

interface AirHockeyBoardProps extends GameBoardProps<AirHockeyState> {}

export function AirHockeyBoard({ state, mySymbol, onMove, disabled }: AirHockeyBoardProps) {
  const isFinished = state.status === 'finished' || state.status === 'draw';

  const effectiveHolder = state.holder ?? state.players[state.currentPlayerIndex]?.symbol ?? null;
  const myTurn = effectiveHolder === mySymbol && !isFinished && !disabled;

  const p1 = state.players[0];
  const p2 = state.players[1];
  const opponent = state.players.find((p) => p.symbol !== mySymbol);

  const goalieRows = state.goalieRows || {};
  const centerRow = Math.floor((state.rows || 5) / 2);
  const [guardRow, setGuardRow] = useState<number>(typeof goalieRows[mySymbol] === 'number' ? goalieRows[mySymbol] : centerRow);

  useEffect(() => {
    if (typeof goalieRows[mySymbol] === 'number') {
      setGuardRow(goalieRows[mySymbol]);
    }
  }, [goalieRows, mySymbol]);

  const [puckAnimKey, setPuckAnimKey] = useState(0);
  useEffect(() => {
    setPuckAnimKey((k) => k + 1);
  }, [state.puckRow, state.puckCol]);

  const submitMove = (shotRow: number) => {
    if (!myTurn) return;
    const move: AirHockeyMove = { shotRow, guardRow };
    onMove(move);
  };

  const myIsP1 = mySymbol === p1?.symbol;
  const myColor = myIsP1 ? '#38bdf8' : '#f472b6';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ display: 'flex', gap: 10, background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: '10px 14px', fontWeight: 700 }}>
        <span style={{ color: '#0284c7' }}>🔵 {p1?.displayName ?? 'Player 1'}: {state.scores?.[p1?.symbol ?? 'X'] ?? 0}</span>
        <span style={{ color: '#db2777' }}>🩷 {p2?.displayName ?? 'Player 2'}: {state.scores?.[p2?.symbol ?? 'O'] ?? 0}</span>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.9)', borderRadius: 10, padding: '8px 12px', fontWeight: 700, color: '#334155' }}>
        {isFinished
          ? state.winner === mySymbol
            ? '🏆 You win the match!'
            : '🏁 Match complete'
          : myTurn
            ? 'Your turn: pick guard row, then tap a shot row.'
            : `Defending... ${opponent?.displayName ?? 'Opponent'} has the puck`}
      </div>

      <div style={{ width: 'min(520px, calc(100vw - 40px))', display: 'grid', gap: 8 }}>
        <div style={{ background: 'rgba(255,255,255,0.92)', borderRadius: 10, padding: '8px 10px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: '#334155' }}>Set Guard Row</div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${state.rows}, 1fr)`, gap: 6 }}>
            {Array.from({ length: state.rows }, (_, row) => {
              const selected = guardRow === row;
              return (
                <button
                  key={`guard-${row}`}
                  onClick={() => setGuardRow(row)}
                  disabled={disabled || isFinished}
                  style={{
                    border: selected ? `2px solid ${myColor}` : '1px solid #cbd5e1',
                    borderRadius: 8,
                    padding: '6px 0',
                    background: selected ? `${myColor}22` : '#fff',
                    color: '#334155',
                    fontWeight: 700,
                    cursor: disabled || isFinished ? 'default' : 'pointer',
                  }}
                >
                  {row + 1}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.92)', borderRadius: 10, padding: '8px 10px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: '#334155' }}>Tap Row to Shoot</div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${state.rows}, 1fr)`, gap: 6 }}>
            {Array.from({ length: state.rows }, (_, row) => (
              <button
                key={`shot-${row}`}
                onClick={() => submitMove(row)}
                disabled={!myTurn}
                style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  padding: '6px 0',
                  background: myTurn ? '#fff' : '#e5e7eb',
                  color: '#334155',
                  fontWeight: 700,
                  cursor: myTurn ? 'pointer' : 'default',
                }}
              >
                {row + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          background: 'linear-gradient(180deg, #0ea5e9 0%, #0369a1 100%)',
          borderRadius: 16,
          padding: 12,
          width: 'min(520px, calc(100vw - 40px))',
          boxShadow: '0 8px 22px rgba(0,0,0,0.25)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${state.cols}, 1fr)`,
            gap: 6,
            aspectRatio: '9 / 5',
          }}
        >
          {Array.from({ length: state.rows * state.cols }, (_, idx) => {
            const row = Math.floor(idx / state.cols);
            const col = idx % state.cols;
            const hasPuck = row === state.puckRow && col === state.puckCol;
            const isGoalLeft = col === 0;
            const isGoalRight = col === state.cols - 1;

            const p1Goalie = p1 && row === (state.goalieRows?.[p1.symbol] ?? -1) && col === 1;
            const p2Goalie = p2 && row === (state.goalieRows?.[p2.symbol] ?? -1) && col === state.cols - 2;

            return (
              <div
                key={idx}
                style={{
                  borderRadius: 8,
                  background: isGoalLeft || isGoalRight ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)',
                  position: 'relative',
                  display: 'grid',
                  placeItems: 'center',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.2)',
                }}
                aria-label={`Rink cell ${row + 1}-${col + 1}`}
              >
                {p1Goalie && <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#38bdf8', border: '2px solid #fff' }} />}
                {p2Goalie && <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#f472b6', border: '2px solid #fff' }} />}
                {hasPuck && (
                  <div
                    key={`puck-${puckAnimKey}`}
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: '#111827',
                      border: '2px solid #f9fafb',
                      animation: 'puckMove 380ms ease',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`@keyframes puckMove { 0% { transform: scale(0.45); opacity: 0.4; } 55% { transform: scale(1.25); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }`}</style>

      <div style={{ background: 'rgba(255,255,255,0.92)', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: '#334155', textAlign: 'center' }}>
        Pick guard row, then shoot row. If shot row matches opponent&apos;s guard row, they save it. First to {state.targetScore} goals wins.
      </div>

      <div style={{ fontSize: 12, color: 'white', opacity: 0.95 }}>
        Your color: <span style={{ color: myColor, fontWeight: 700 }}>{myIsP1 ? 'Blue' : 'Pink'}</span>
      </div>
    </div>
  );
}

export default AirHockeyBoard;
