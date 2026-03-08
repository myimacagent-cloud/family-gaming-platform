import { useState } from 'react';
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: 'min(760px, calc(100vw - 40px))' }}>
      <div style={{ display: 'flex', gap: 14, background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: '10px 14px', fontWeight: 700, flexWrap: 'wrap', justifyContent: 'center' }}>
        <span>🟦 {me?.displayName ?? 'You'} books: {myBooks}</span>
        <span>🟥 {opp?.displayName ?? 'Opponent'} books: {oppBooks}</span>
        <span>🃏 Deck: {state.deck?.length ?? 0}</span>
        <span>🤫 Opponent hand: {oppHandCount}</span>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.9)', borderRadius: 10, padding: '8px 12px', fontWeight: 700, color: '#334155', textAlign: 'center' }}>
        {isFinished ? '🏁 Game complete' : myTurn ? 'Your turn — tap a card rank to ask.' : 'Waiting for opponent...'}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.92)', borderRadius: 10, padding: '8px 12px', width: '100%', textAlign: 'center', fontSize: 13, color: '#334155' }}>
        {state.lastAction || 'Start by asking for a rank you have.'}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 14, padding: 14, width: '100%' }}>
        <div style={{ fontWeight: 800, marginBottom: 10, color: '#334155' }}>Your Hand (tap a card)</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {grouped.length === 0 && <span style={{ color: '#64748b' }}>No cards in hand</span>}
          {grouped.map(({ rank, count }) => {
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
                  transform: isAnimated ? 'translateY(-10px) scale(1.06) rotate(-2deg)' : 'none',
                  transition: 'transform 180ms ease',
                }}
              >
                <div
                  style={{
                    width: 78,
                    height: 112,
                    borderRadius: 12,
                    background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                    border: '2px solid #cbd5e1',
                    boxShadow: isAnimated
                      ? '0 12px 24px rgba(109,125,255,0.35)'
                      : '0 4px 10px rgba(15,23,42,0.18)',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: 8,
                  }}
                >
                  <div style={{ fontSize: 16, fontWeight: 800, color: red ? '#dc2626' : '#0f172a', lineHeight: 1 }}>
                    {rankLabel(rank)}{suit}
                  </div>
                  <div style={{ textAlign: 'center', fontSize: 30, color: red ? '#dc2626' : '#0f172a', lineHeight: 1 }}>
                    {suit}
                  </div>
                  <div style={{ alignSelf: 'flex-end', fontSize: 16, fontWeight: 800, color: red ? '#dc2626' : '#0f172a', transform: 'rotate(180deg)', lineHeight: 1 }}>
                    {rankLabel(rank)}{suit}
                  </div>
                  <div style={{ position: 'absolute', top: 6, right: 6, background: '#6D7DFF', color: '#fff', borderRadius: 999, padding: '2px 6px', fontSize: 11, fontWeight: 800 }}>
                    x{count}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default GoFishBoard;
