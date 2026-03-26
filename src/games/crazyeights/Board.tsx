import { useMemo, useState } from 'react';
import type { GameBoardProps } from '../types';
import type { CrazyEightsState, CrazyEightsMove } from './types';

interface CrazyEightsBoardProps extends GameBoardProps<CrazyEightsState> {}

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

function canPlayCard(card: string, topCard: string | null, activeSuit: 'S' | 'H' | 'D' | 'C' | null): boolean {
  if (!topCard || !activeSuit) return true;
  const c = parseCard(card);
  const top = parseCard(topCard);
  if (c.rank === 8) return true;
  return c.rank === top.rank || c.suit === activeSuit;
}

export function CrazyEightsBoard({ state, mySymbol, onMove, disabled }: CrazyEightsBoardProps) {
  const isFinished = state.status === 'finished' || state.status === 'draw';
  const myTurn = state.players[state.currentPlayerIndex]?.symbol === mySymbol && !disabled && !isFinished;

  const me = state.players.find((p) => p.symbol === mySymbol);
  const opp = state.players.find((p) => p.symbol !== mySymbol);

  const myHand = state.hands?.[mySymbol] || [];
  const oppHandCount = opp ? state.hands?.[opp.symbol]?.length ?? 0 : 0;

  const [chooseSuitForEight, setChooseSuitForEight] = useState<'S' | 'H' | 'D' | 'C'>('H');

  const playableSet = useMemo(() => {
    const set = new Set<string>();
    for (const c of myHand) {
      if (canPlayCard(c, state.topCard, state.activeSuit)) set.add(c);
    }
    return set;
  }, [myHand, state.topCard, state.activeSuit]);

  const playCard = (card: string) => {
    if (!myTurn) return;
    const parsed = parseCard(card);
    const move: CrazyEightsMove = {
      type: 'play',
      card,
      chooseSuit: parsed.rank === 8 ? chooseSuitForEight : undefined,
    };
    onMove(move);
  };

  const drawCard = () => {
    if (!myTurn) return;
    const move: CrazyEightsMove = { type: 'draw' };
    onMove(move);
  };

  const top = state.topCard ? parseCard(state.topCard) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: 'min(860px, calc(100vw - 24px))' }}>
      <div style={{ display: 'flex', gap: 14, background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: '10px 14px', fontWeight: 700, flexWrap: 'wrap', justifyContent: 'center' }}>
        <span>🟦 {me?.displayName ?? 'You'} cards: {myHand.length}</span>
        <span>🟥 {opp?.displayName ?? 'Opponent'} cards: {oppHandCount}</span>
        <span>🃏 Deck: {state.deck?.length ?? 0}</span>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.92)', borderRadius: 10, padding: '8px 12px', width: '100%', textAlign: 'center', color: '#334155', fontWeight: 700 }}>
        {state.lastAction}
      </div>

      <div style={{ display: 'flex', gap: 12, width: '100%', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 12, minWidth: 180, textAlign: 'center' }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Top Card</div>
          <div style={{ margin: '0 auto', width: 74, height: 108, borderRadius: 10, border: '2px solid #cbd5e1', background: '#fff', display: 'grid', placeItems: 'center' }}>
            {top ? (
              <div style={{ textAlign: 'center', color: suitColor(top.suit), fontWeight: 800 }}>
                <div style={{ fontSize: 26 }}>{rankLabel(top.rank)}</div>
                <div style={{ fontSize: 28 }}>{suitLabel(top.suit)}</div>
              </div>
            ) : '—'}
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: '#475569' }}>Active suit: {state.activeSuit ? suitLabel(state.activeSuit) : '—'}</div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 12, minWidth: 240 }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Actions</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            {(['S', 'H', 'D', 'C'] as const).map((suit) => (
              <button
                key={suit}
                onClick={() => setChooseSuitForEight(suit)}
                style={{
                  border: chooseSuitForEight === suit ? '2px solid #6D7DFF' : '1px solid #cbd5e1',
                  borderRadius: 8,
                  padding: '6px 10px',
                  background: '#fff',
                  fontWeight: 700,
                  color: suitColor(suit),
                  cursor: 'pointer',
                }}
              >
                {suitLabel(suit)}
              </button>
            ))}
          </div>
          <button
            onClick={drawCard}
            disabled={!myTurn}
            style={{ border: 'none', borderRadius: 10, padding: '10px 14px', background: myTurn ? '#6D7DFF' : '#94a3b8', color: '#fff', fontWeight: 800, cursor: myTurn ? 'pointer' : 'default' }}
          >
            Draw Card
          </button>
          <div style={{ marginTop: 8, fontSize: 12, color: '#475569' }}>{myTurn ? 'Your turn' : 'Waiting for opponent'}</div>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 14, padding: 14, width: '100%' }}>
        <div style={{ fontWeight: 800, marginBottom: 10, color: '#334155' }}>Your Hand</div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {myHand.length === 0 && <span style={{ color: '#64748b' }}>No cards in hand</span>}
          {myHand.map((card, idx) => {
            const p = parseCard(card);
            const playable = playableSet.has(card);
            return (
              <button
                key={`${card}-${idx}`}
                onClick={() => playCard(card)}
                disabled={!myTurn || !playable}
                style={{
                  border: playable ? '2px solid #6D7DFF' : '2px solid #cbd5e1',
                  borderRadius: 10,
                  background: '#fff',
                  width: 60,
                  height: 88,
                  flex: '0 0 auto',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: myTurn && playable ? 'pointer' : 'default',
                  opacity: playable ? 1 : 0.6,
                }}
                title={playable ? 'Playable' : 'Not playable'}
              >
                <div style={{ textAlign: 'center', color: suitColor(p.suit), fontWeight: 800, lineHeight: 1.05 }}>
                  <div style={{ fontSize: 18 }}>{rankLabel(p.rank)}</div>
                  <div style={{ fontSize: 20 }}>{suitLabel(p.suit)}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default CrazyEightsBoard;
