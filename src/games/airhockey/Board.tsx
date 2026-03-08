import type { GameBoardProps } from '../types';
import type { AirHockeyState, AirHockeyMove } from './types';

interface AirHockeyBoardProps extends GameBoardProps<AirHockeyState> {}

export function AirHockeyBoard({ state, mySymbol, onMove, disabled }: AirHockeyBoardProps) {
  const isFinished = state.status === 'finished' || state.status === 'draw';
  const myTurn = state.holder === mySymbol && !isFinished && !disabled;

  const p1 = state.players[0];
  const p2 = state.players[1];
  const opponent = state.players.find((p) => p.symbol !== mySymbol);

  const goalieRows = state.goalieRows || {};
  const myGuard = typeof goalieRows[mySymbol] === 'number' ? goalieRows[mySymbol] : Math.floor((state.rows || 5) / 2);

  const submitMove = (shotRow: number) => {
    if (!myTurn) return;
    const move: AirHockeyMove = {
      shotRow,
      guardRow: myGuard,
    };
    onMove(move);
  };

  const myColor = mySymbol === p1?.symbol ? '#38bdf8' : '#f472b6';

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
            ? 'Your shot! Tap a row to shoot.'
            : `Defending... ${opponent?.displayName ?? 'Opponent'} has the puck`}
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
            const isSelectableShot = myTurn && col === 0;

            const p1Goalie = p1 && row === (state.goalieRows?.[p1.symbol] ?? -1) && col === 1;
            const p2Goalie = p2 && row === (state.goalieRows?.[p2.symbol] ?? -1) && col === state.cols - 2;

            return (
              <button
                key={idx}
                onClick={() => isSelectableShot && submitMove(row)}
                disabled={!isSelectableShot}
                style={{
                  border: 'none',
                  borderRadius: 8,
                  background: isGoalLeft || isGoalRight ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)',
                  cursor: isSelectableShot ? 'pointer' : 'default',
                  position: 'relative',
                  display: 'grid',
                  placeItems: 'center',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.2)',
                }}
                aria-label={`Rink cell ${row + 1}-${col + 1}`}
              >
                {isSelectableShot && <span style={{ position: 'absolute', left: 4, fontSize: 10, color: '#fff' }}>▶</span>}
                {p1Goalie && <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#38bdf8', border: '2px solid #fff' }} />}
                {p2Goalie && <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#f472b6', border: '2px solid #fff' }} />}
                {hasPuck && <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#111827', border: '2px solid #f9fafb' }} />}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.92)', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: '#334155', textAlign: 'center' }}>
        Pick a row to shoot. If it matches your opponent&apos;s guard row, they save it. First to {state.targetScore} goals wins.
      </div>

      <div style={{ fontSize: 12, color: 'white', opacity: 0.95 }}>
        Your color: <span style={{ color: myColor, fontWeight: 700 }}>{myColor === '#38bdf8' ? 'Blue' : 'Pink'}</span>
      </div>
    </div>
  );
}

export default AirHockeyBoard;
