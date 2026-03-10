import { useState } from 'react';
import type { GameBoardProps } from '../types';
import type { SpadesState, SpadesMove } from './types';

interface SpadesBoardProps extends GameBoardProps<SpadesState> {}

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

export function SpadesBoard({ state, mySymbol, onMove, disabled }: SpadesBoardProps) {
  const isFinished = state.status === 'finished' || state.status === 'draw';
  const myTurn = state.players[state.currentPlayerIndex]?.symbol === mySymbol && !disabled && !isFinished;

  const me = state.players.find((p) => p.symbol === mySymbol);
  const opp = state.players.find((p) => p.symbol !== mySymbol);

  const myHand = state.hands?.[mySymbol] || [];
  const oppCount = opp ? state.hands?.[opp.symbol]?.length ?? 0 : 0;

  const myBid = state.bids?.[mySymbol];
  const oppBid = opp ? state.bids?.[opp.symbol] : null;
  const myTricks = state.tricksWon?.[mySymbol] ?? 0;
  const oppTricks = opp ? state.tricksWon?.[opp.symbol] ?? 0 : 0;

  const biddingPhase = myBid === null || oppBid === null;
  const [bidValue, setBidValue] = useState(4);

  const submitBid = () => {
    if (!myTurn) return;
    const move: SpadesMove = { type: 'bid', bid: bidValue };
    onMove(move);
  };

  const playCard = (card: string) => {
    if (!myTurn || biddingPhase) return;
    const move: SpadesMove = { type: 'play', card };
    onMove(move);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 'min(920px, calc(100vw - 24px))' }}>
      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#334155' }}>
        {state.lastAction}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: '8px 12px', fontWeight: 800 }}>🔵 {me?.displayName ?? 'You'} bid/tricks: {myBid ?? '—'} / {myTricks}</div>
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: '8px 12px', fontWeight: 800 }}>🩷 {opp?.displayName ?? 'Opponent'} bid/tricks: {oppBid ?? '—'} / {oppTricks}</div>
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: '8px 12px', fontWeight: 800 }}>Trick #{state.trickNumber}</div>
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: '8px 12px', fontWeight: 800 }}>Spades broken: {state.spadesBroken ? 'Yes' : 'No'}</div>
      </div>

      {biddingPhase && (
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <strong>Bid:</strong>
          <input
            type="range"
            min={0}
            max={13}
            value={bidValue}
            onChange={(e) => setBidValue(Number(e.target.value))}
            style={{ width: 180 }}
            disabled={!myTurn}
          />
          <span style={{ fontWeight: 900 }}>{bidValue}</span>
          <button onClick={submitBid} disabled={!myTurn} style={{ border: 'none', borderRadius: 10, padding: '10px 14px', background: myTurn ? '#6D7DFF' : '#94a3b8', color: '#fff', fontWeight: 800, cursor: myTurn ? 'pointer' : 'default' }}>Submit Bid</button>
        </div>
      )}

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
                disabled={!myTurn || biddingPhase}
                style={{
                  width: 60,
                  height: 84,
                  borderRadius: 10,
                  border: '2px solid #6D7DFF',
                  background: '#fff',
                  color: suitColor(c.suit),
                  fontWeight: 900,
                  cursor: myTurn && !biddingPhase ? 'pointer' : 'default',
                  flex: '0 0 auto',
                  opacity: myTurn && !biddingPhase ? 1 : 0.65,
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

export default SpadesBoard;
