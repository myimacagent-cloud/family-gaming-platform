import type { GameBoardProps } from '../types';
import type { HeartsState, HeartsMove } from './types';

interface HeartsBoardProps extends GameBoardProps<HeartsState> {}

function parseCard(card: string): { rank: number; suit: 'S' | 'H' | 'D' | 'C' } {
  const [r, s] = card.split('-');
  return { rank: Number(r), suit: s as 'S' | 'H' | 'D' | 'C' };
}

function rankLabel(rank: number): string {
  if (rank === 11) return 'J';
  if (rank === 12) return 'Q';
  if (rank === 13) return 'K';
  if (rank === 14) return 'A';
  return String(rank);
}

function suitLabel(suit: 'S' | 'H' | 'D' | 'C'): string {
  return suit === 'S' ? '♠' : suit === 'H' ? '♥' : suit === 'D' ? '♦' : '♣';
}

function suitColor(suit: 'S' | 'H' | 'D' | 'C'): string {
  return suit === 'H' || suit === 'D' ? '#dc2626' : '#111827';
}

export function HeartsBoard({ state, mySymbol, onMove, disabled }: HeartsBoardProps) {
  const isFinished = state.status === 'finished' || state.status === 'draw';
  const myTurn = state.players[state.currentPlayerIndex]?.symbol === mySymbol && !disabled && !isFinished;

  const me = state.players.find((p) => p.symbol === mySymbol);
  const opp = state.players.find((p) => p.symbol !== mySymbol);

  const myHand = state.hands?.[mySymbol] || [];
  const oppCount = opp ? state.hands?.[opp.symbol]?.length ?? 0 : 0;
  const myPoints = state.points?.[mySymbol] ?? 0;
  const oppPoints = opp ? state.points?.[opp.symbol] ?? 0 : 0;

  const playCard = (card: string) => {
    if (!myTurn) return;
    const move: HeartsMove = { type: 'play', card };
    onMove(move);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 'min(920px, calc(100vw - 24px))' }}>
      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#334155' }}>
        {state.lastAction}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: '8px 12px', fontWeight: 800 }}>🔵 {me?.displayName ?? 'You'} points: {myPoints}</div>
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: '8px 12px', fontWeight: 800 }}>🩷 {opp?.displayName ?? 'Opponent'} points: {oppPoints}</div>
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: '8px 12px', fontWeight: 800 }}>Trick #{state.trickNumber}</div>
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: '8px 12px', fontWeight: 800 }}>Hearts broken: {state.heartsBroken ? 'Yes' : 'No'}</div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 10 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Current Trick</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {state.currentTrick.length === 0 && <span style={{ color: '#64748b' }}>No cards played yet</span>}
          {state.currentTrick.map((p, i) => {
            const c = parseCard(p.card);
            return (
              <div key={i} style={{ width: 64, height: 88, borderRadius: 10, border: '2px solid #cbd5e1', background: '#fff', display: 'grid', placeItems: 'center' }}>
                <div style={{ textAlign: 'center', color: suitColor(c.suit), fontWeight: 900 }}>
                  <div>{rankLabel(c.rank)}</div>
                  <div style={{ fontSize: 20 }}>{suitLabel(c.suit)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 12 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Your Hand</div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          {myHand.map((card, i) => {
            const c = parseCard(card);
            return (
              <button
                key={`${card}-${i}`}
                onClick={() => playCard(card)}
                disabled={!myTurn}
                style={{
                  width: 60,
                  height: 84,
                  borderRadius: 10,
                  border: '2px solid #6D7DFF',
                  background: '#fff',
                  color: suitColor(c.suit),
                  fontWeight: 900,
                  cursor: myTurn ? 'pointer' : 'default',
                  flex: '0 0 auto',
                  opacity: myTurn ? 1 : 0.65,
                }}
              >
                {rankLabel(c.rank)}{suitLabel(c.suit)}
              </button>
            );
          })}
          {myHand.length === 0 && <span style={{ color: '#64748b' }}>No cards</span>}
        </div>
      </div>

      <div style={{ fontSize: 13, color: 'white', fontWeight: 700 }}>
        Opponent cards: {oppCount} • {myTurn ? 'Your turn' : 'Opponent turn'}
      </div>
    </div>
  );
}

export default HeartsBoard;
