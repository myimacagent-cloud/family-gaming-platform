import type { GameBoardProps } from '../types';
import type { OldMaidState, OldMaidMove } from './types';

interface OldMaidBoardProps extends GameBoardProps<OldMaidState> {}

const OLD_MAID = 99;

function rankLabel(rank: number): string {
  if (rank === OLD_MAID) return '🧙‍♀️';
  if (rank === 1) return 'A';
  if (rank === 11) return 'J';
  if (rank === 12) return 'Q';
  if (rank === 13) return 'K';
  return String(rank);
}

export function OldMaidBoard({ state, mySymbol, myPlayerId, onMove, disabled }: OldMaidBoardProps) {
  const meById = state.players.find((p) => p.userId === myPlayerId);
  const resolvedMySymbol = mySymbol || meById?.symbol || Object.keys(state.hands || {})[0] || '';
  const oppSymbol = Object.keys(state.hands || {}).find((s) => s !== resolvedMySymbol) || '';

  const isFinished = state.status === 'finished' || state.status === 'draw';
  const myTurn = state.currentPicker === resolvedMySymbol && !disabled && !isFinished;

  const me = state.players.find((p) => p.symbol === resolvedMySymbol) || meById;
  const opp = state.players.find((p) => p.symbol === oppSymbol) || state.players.find((p) => p.symbol !== resolvedMySymbol);

  const myHand = state.hands?.[resolvedMySymbol] || [];
  const oppHand = oppSymbol ? state.hands?.[oppSymbol] || [] : [];

  const myPairs = state.pairs?.[resolvedMySymbol] ?? 0;
  const oppPairs = oppSymbol ? state.pairs?.[oppSymbol] ?? 0 : 0;

  const drawFromOpp = (index: number) => {
    if (!myTurn) return;
    const move: OldMaidMove = { type: 'draw_from_opponent', index };
    onMove(move);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 'min(900px, calc(100vw - 24px))' }}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: '10px 14px', fontWeight: 800 }}>
          🔵 {me?.displayName ?? 'You'} pairs: {myPairs}
        </div>
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: '10px 14px', fontWeight: 800 }}>
          🩷 {opp?.displayName ?? 'Opponent'} pairs: {oppPairs}
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#334155' }}>
        {state.lastAction}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 12 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Opponent Hand (tap a card to draw)</div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          {oppHand.map((_, i) => (
            <button
              key={i}
              onClick={() => drawFromOpp(i)}
              disabled={!myTurn}
              style={{
                width: 48,
                height: 70,
                borderRadius: 8,
                border: '2px solid #cbd5e1',
                background: myTurn ? 'linear-gradient(135deg,#5b6cff 0%, #8b5cf6 100%)' : '#94a3b8',
                color: '#fff',
                fontWeight: 800,
                cursor: myTurn ? 'pointer' : 'default',
                flex: '0 0 auto',
              }}
              title={myTurn ? 'Draw this card' : 'Wait for your turn'}
            >
              🎴
            </button>
          ))}
          {oppHand.length === 0 && <span style={{ color: '#64748b' }}>No cards</span>}
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 12 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Your Hand</div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          {myHand.map((c, i) => (
            <div key={i} style={{ width: 52, height: 76, borderRadius: 10, border: '2px solid #cbd5e1', background: c === OLD_MAID ? 'linear-gradient(160deg, #ef4444 0%, #b91c1c 100%)' : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)', display: 'grid', placeItems: 'center', fontWeight: 900, color: c === OLD_MAID ? '#fff' : '#1f2937', flex: '0 0 auto', boxShadow: '0 4px 10px rgba(15,23,42,0.16)', position: 'relative' }}>
              <span style={{ position: 'absolute', top: 4, left: 5, fontSize: 10, opacity: 0.85 }}>{rankLabel(c)}</span>
              <span style={{ fontSize: c === OLD_MAID ? 20 : 24 }}>{rankLabel(c)}</span>
              <span style={{ position: 'absolute', bottom: 4, right: 5, fontSize: 10, transform: 'rotate(180deg)', opacity: 0.85 }}>{rankLabel(c)}</span>
            </div>
          ))}
          {myHand.length === 0 && <span style={{ color: '#64748b' }}>No cards</span>}
        </div>
      </div>

      <div style={{ fontSize: 13, color: 'white', fontWeight: 700 }}>
        {isFinished
          ? state.winner === resolvedMySymbol
            ? '🏆 You win!'
            : 'You got the Old Maid 😅'
          : myTurn
            ? 'Your turn: draw from opponent'
            : `Waiting for ${opp?.displayName ?? 'opponent'}`}
      </div>

      <div style={{ fontSize: 12, color: 'white', opacity: 0.95 }}>
        {me?.displayName ?? 'You'} cards: {myHand.length} • {opp?.displayName ?? 'Opponent'} cards: {oppHand.length}
      </div>
    </div>
  );
}

export default OldMaidBoard;
