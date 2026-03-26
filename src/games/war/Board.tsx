import type { GameBoardProps } from '../types';
import type { WarState, WarMove } from './types';

interface WarBoardProps extends GameBoardProps<WarState> {}

function rankLabel(rank: number | null | undefined): string {
  if (typeof rank !== 'number') return '—';
  if (rank === 11) return 'J';
  if (rank === 12) return 'Q';
  if (rank === 13) return 'K';
  if (rank === 14) return 'A';
  return String(rank);
}

export function WarBoard({ state, mySymbol, onMove, disabled }: WarBoardProps) {
  const isFinished = state.status === 'finished' || state.status === 'draw';
  const myTurn = state.players[state.currentPlayerIndex]?.symbol === mySymbol && !disabled && !isFinished;

  const p1 = state.players[0];
  const p2 = state.players[1];

  const play = () => {
    if (!myTurn) return;
    const move: WarMove = { action: 'play_card' };
    onMove(move);
  };

  const p1Card = p1 ? state.tableCards?.[p1.symbol] ?? null : null;
  const p2Card = p2 ? state.tableCards?.[p2.symbol] ?? null : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ display: 'flex', gap: 14, background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: '10px 14px', fontWeight: 700 }}>
        <span>🟦 {p1?.displayName ?? 'P1'}: {state.tricksWon?.[p1?.symbol ?? 'X'] ?? 0} tricks</span>
        <span>🟥 {p2?.displayName ?? 'P2'}: {state.tricksWon?.[p2?.symbol ?? 'O'] ?? 0} tricks</span>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.9)', borderRadius: 10, padding: '8px 12px', fontWeight: 700, color: '#334155' }}>
        {isFinished ? '🏁 Round complete' : myTurn ? 'Your turn — flip your top card!' : 'Waiting for opponent...'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, width: 'min(520px, calc(100vw - 40px))' }}>
        {[p1, p2].map((p, idx) => {
          const card = idx === 0 ? p1Card : p2Card;
          return (
            <div key={p?.symbol ?? idx} style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>{p?.displayName ?? `Player ${idx + 1}`}</div>
              <div style={{ margin: '0 auto', width: 84, height: 118, borderRadius: 10, background: '#fff', border: '2px solid #cbd5e1', display: 'grid', placeItems: 'center', fontSize: 36, fontWeight: 800, color: '#1f2937' }}>
                {rankLabel(card)}
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>Cards left: {state.decks?.[p?.symbol ?? '']?.length ?? 0}</div>
            </div>
          );
        })}
      </div>

      <button
        onClick={play}
        disabled={!myTurn}
        style={{
          padding: '12px 20px',
          border: 'none',
          borderRadius: 10,
          background: myTurn ? '#6D7DFF' : '#94a3b8',
          color: '#fff',
          fontWeight: 800,
          cursor: myTurn ? 'pointer' : 'default',
        }}
      >
        Flip Card
      </button>

      <div style={{ fontSize: 12, color: 'white', opacity: 0.95 }}>Round {state.round} / {state.maxRounds}</div>
    </div>
  );
}

export default WarBoard;
