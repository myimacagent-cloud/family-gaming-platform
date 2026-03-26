import type { GameBoardProps } from '../types';
import type { BlackjackState, BlackjackMove } from './types';

interface BlackjackBoardProps extends GameBoardProps<BlackjackState> {}

function rankLabel(rank: number): string {
  if (rank === 1) return 'A';
  if (rank === 11) return 'J';
  if (rank === 12) return 'Q';
  if (rank === 13) return 'K';
  return String(rank);
}

export function BlackjackBoard({ state, mySymbol, onMove, disabled }: BlackjackBoardProps) {
  const isFinished = state.status === 'finished' || state.status === 'draw';
  const myTurn = state.players[state.currentPlayerIndex]?.symbol === mySymbol && !disabled && !isFinished;

  const opp = state.players.find((p) => p.symbol !== mySymbol);

  const myHand = state.hands?.[mySymbol] || [];
  const oppHand = opp ? state.hands?.[opp.symbol] || [] : [];

  const myTotal = state.totals?.[mySymbol] ?? 0;
  const oppTotal = opp ? state.totals?.[opp.symbol] ?? 0 : 0;

  const hit = () => {
    if (!myTurn) return;
    const move: BlackjackMove = { type: 'hit' };
    onMove(move);
  };

  const stand = () => {
    if (!myTurn) return;
    const move: BlackjackMove = { type: 'stand' };
    onMove(move);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 'min(860px, calc(100vw - 24px))' }}>
      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#334155' }}>
        {state.lastAction}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Opponent Hand</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {oppHand.map((c, i) => (
              <div key={i} style={{ width: 50, height: 74, borderRadius: 8, border: '2px solid #cbd5e1', background: state.reveal ? '#fff' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'grid', placeItems: 'center', fontWeight: 900, color: state.reveal ? '#1f2937' : '#fff' }}>
                {state.reveal ? rankLabel(c) : '🎴'}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8, fontSize: 13, color: '#475569' }}>Total: {state.reveal ? oppTotal : '??'}</div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Your Hand</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {myHand.map((c, i) => (
              <div key={i} style={{ width: 50, height: 74, borderRadius: 8, border: '2px solid #cbd5e1', background: '#fff', display: 'grid', placeItems: 'center', fontWeight: 900, color: '#1f2937' }}>
                {rankLabel(c)}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8, fontSize: 13, color: '#475569' }}>Total: {myTotal}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={hit} disabled={!myTurn} style={{ border: 'none', borderRadius: 10, padding: '10px 14px', background: myTurn ? '#16a34a' : '#94a3b8', color: '#fff', fontWeight: 800, cursor: myTurn ? 'pointer' : 'default' }}>Hit</button>
        <button onClick={stand} disabled={!myTurn} style={{ border: 'none', borderRadius: 10, padding: '10px 14px', background: myTurn ? '#f59e0b' : '#94a3b8', color: '#fff', fontWeight: 800, cursor: myTurn ? 'pointer' : 'default' }}>Stand</button>
      </div>

      <div style={{ fontSize: 13, color: 'white', fontWeight: 700 }}>
        {isFinished
          ? state.status === 'draw'
            ? 'Push (draw).'
            : state.winner === mySymbol
              ? '🏆 You win!'
              : 'Opponent wins.'
          : myTurn
            ? 'Your turn'
            : 'Waiting for opponent'}
      </div>
    </div>
  );
}

export default BlackjackBoard;
