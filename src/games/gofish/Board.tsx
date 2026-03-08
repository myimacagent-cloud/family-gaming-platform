import { useEffect, useState } from 'react';
import type { GameBoardProps } from '../types';
import type { GoFishState, GoFishMove } from './types';

interface GoFishBoardProps extends GameBoardProps<GoFishState> {}

function rankLabel(rank: number): string {
  if (rank === 11) return 'J';
  if (rank === 12) return 'Q';
  if (rank === 13) return 'K';
  if (rank === 14) return 'A';
  return String(rank);
}

function rankCounts(cards: number[]): { rank: number; count: number }[] {
  const counts: Record<number, number> = {};
  for (const c of cards) counts[c] = (counts[c] || 0) + 1;
  return Object.entries(counts)
    .map(([rank, count]) => ({ rank: Number(rank), count }))
    .sort((a, b) => a.rank - b.rank);
}

function suitFor(rank: number): string {
  const suits = ['♠', '♥', '♦', '♣'];
  return suits[rank % suits.length];
}

function isRedSuit(suit: string): boolean {
  return suit === '♥' || suit === '♦';
}

function CardBack({ small = false }: { small?: boolean }) {
  const w = small ? 46 : 56;
  const h = small ? 66 : 78;
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 8,
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        border: '2px solid rgba(255,255,255,0.75)',
        boxShadow: '0 3px 8px rgba(15,23,42,0.25)',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <div
        style={{
          width: '70%',
          height: '70%',
          borderRadius: 6,
          border: '1px dashed rgba(255,255,255,0.7)',
          display: 'grid',
          placeItems: 'center',
          color: 'rgba(255,255,255,0.9)',
          fontWeight: 800,
          fontSize: 14,
        }}
      >
        🃏
      </div>
    </div>
  );
}

export function GoFishBoard({ state, mySymbol, onMove, disabled }: GoFishBoardProps) {
  const isFinished = state.status === 'finished' || state.status === 'draw';
  const myTurn = state.players[state.currentPlayerIndex]?.symbol === mySymbol && !disabled && !isFinished;

  const me = state.players.find((p) => p.symbol === mySymbol);
  const opp = state.players.find((p) => p.symbol !== mySymbol);

  const myHand = state.hands?.[mySymbol] || [];
  const oppHandCount = opp ? state.hands?.[opp.symbol]?.length ?? 0 : 0;
  const myBooks = state.books?.[mySymbol] ?? 0;
  const oppBooks = opp ? state.books?.[opp.symbol] ?? 0 : 0;

  const [animatedRank, setAnimatedRank] = useState<number | null>(null);
  const [showDeal, setShowDeal] = useState(true);

  useEffect(() => {
    setShowDeal(true);
    const t = setTimeout(() => setShowDeal(false), 900);
    return () => clearTimeout(t);
  }, [state.status, me?.symbol, opp?.symbol]);

  const askRank = (rank: number) => {
    if (!myTurn) return;
    setAnimatedRank(rank);
    setTimeout(() => {
      const move: GoFishMove = { type: 'ask_rank', rank };
      onMove(move);
      setAnimatedRank(null);
    }, 180);
  };

  const grouped = rankCounts(myHand);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: 'min(860px, calc(100vw - 28px))', position: 'relative' }}>
      {showDeal && (
        <div style={{ position: 'absolute', top: -8, right: 0, left: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 5 }}>
          <div style={{ background: '#111827', color: '#fff', padding: '6px 12px', borderRadius: 999, fontWeight: 800, fontSize: 12, animation: 'dealPulse 900ms ease' }}>
            🃏 Dealing cards...
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 14, background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: '10px 14px', fontWeight: 700, flexWrap: 'wrap', justifyContent: 'center' }}>
        <span>🟦 {me?.displayName ?? 'You'} books: {myBooks}</span>
        <span>🟥 {opp?.displayName ?? 'Opponent'} books: {oppBooks}</span>
        <span>🃏 Deck: {state.deck?.length ?? 0}</span>
        <span>🤫 Opponent hand: {oppHandCount}</span>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.92)', borderRadius: 12, padding: 10, width: '100%' }}>
        <div style={{ fontWeight: 800, marginBottom: 8, color: '#334155' }}>Opponent Hand</div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {Array.from({ length: oppHandCount }).map((_, i) => (
            <div key={i} style={{ flex: '0 0 auto', animation: showDeal ? `dealIn 500ms ease ${i * 40}ms both` : undefined }}>
              <CardBack small />
            </div>
          ))}
          {oppHandCount === 0 && <span style={{ color: '#64748b' }}>No cards</span>}
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.9)', borderRadius: 10, padding: '8px 12px', fontWeight: 700, color: '#334155', textAlign: 'center' }}>
        {isFinished ? '🏁 Game complete' : myTurn ? 'Your turn — tap a card rank to ask.' : 'Waiting for opponent...'}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.92)', borderRadius: 10, padding: '8px 12px', width: '100%', textAlign: 'center', fontSize: 13, color: '#334155' }}>
        {state.lastAction || 'Start by asking for a rank in your hand.'}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 14, padding: 14, width: '100%' }}>
        <div style={{ fontWeight: 800, marginBottom: 10, color: '#334155' }}>Your Hand (tap a card)</div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {grouped.length === 0 && <span style={{ color: '#64748b' }}>No cards in hand</span>}
          {grouped.map(({ rank, count }, i) => {
            const suit = suitFor(rank);
            const red = isRedSuit(suit);
            const isAnimated = animatedRank === rank;

            return (
              <button
                key={rank}
                onClick={() => askRank(rank)}
                disabled={!myTurn}
                style={{
                  border: 'none',
                  padding: 0,
                  background: 'transparent',
                  cursor: myTurn ? 'pointer' : 'default',
                  transform: isAnimated ? 'translateY(-8px) scale(1.05) rotate(-2deg)' : 'none',
                  transition: 'transform 180ms ease',
                  flex: '0 0 auto',
                  animation: showDeal ? `dealIn 500ms ease ${i * 40}ms both` : undefined,
                }}
              >
                <div
                  style={{
                    width: 60,
                    height: 88,
                    borderRadius: 10,
                    background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                    border: '2px solid #cbd5e1',
                    boxShadow: isAnimated
                      ? '0 10px 18px rgba(109,125,255,0.3)'
                      : '0 3px 8px rgba(15,23,42,0.16)',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: 6,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 800, color: red ? '#dc2626' : '#0f172a', lineHeight: 1 }}>
                    {rankLabel(rank)}{suit}
                  </div>
                  <div style={{ textAlign: 'center', fontSize: 22, color: red ? '#dc2626' : '#0f172a', lineHeight: 1 }}>
                    {suit}
                  </div>
                  <div style={{ alignSelf: 'flex-end', fontSize: 12, fontWeight: 800, color: red ? '#dc2626' : '#0f172a', transform: 'rotate(180deg)', lineHeight: 1 }}>
                    {rankLabel(rank)}{suit}
                  </div>
                  <div style={{ position: 'absolute', top: 4, right: 4, background: '#6D7DFF', color: '#fff', borderRadius: 999, padding: '1px 5px', fontSize: 10, fontWeight: 800 }}>
                    x{count}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes dealIn { 0% { transform: translateY(-16px) scale(0.9); opacity: 0; } 100% { transform: translateY(0) scale(1); opacity: 1; } }
        @keyframes dealPulse { 0% { transform: scale(0.96); opacity: 0.7; } 50% { transform: scale(1.04); opacity: 1; } 100% { transform: scale(1); opacity: 0.95; } }
      `}</style>
    </div>
  );
}

export default GoFishBoard;
