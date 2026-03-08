import { useMemo, useState } from 'react';
import type { GameBoardProps } from '../types';
import type { UnoLightState, UnoLightMove } from './types';

interface UnoLightBoardProps extends GameBoardProps<UnoLightState> {}

type Color = 'R' | 'G' | 'B' | 'Y';

function parseCard(card: string): { color: Color | 'W'; value: string } {
  const [color, value] = card.split('-');
  return { color: color as Color | 'W', value };
}

function colorHex(color: Color | 'W'): string {
  if (color === 'R') return '#ef4444';
  if (color === 'G') return '#22c55e';
  if (color === 'B') return '#3b82f6';
  if (color === 'Y') return '#eab308';
  return '#111827';
}

function valueLabel(value: string): string {
  if (value === 'SKIP') return '⛔';
  if (value === 'REV') return '🔄';
  if (value === 'D2') return '+2';
  if (value === 'D4') return '+4';
  if (value === 'WILD') return '★';
  return value;
}

function canPlay(card: string, topCard: string | null, activeColor: Color | null): boolean {
  if (!topCard || !activeColor) return true;
  const c = parseCard(card);
  const top = parseCard(topCard);
  if (c.color === 'W') return true;
  return c.color === activeColor || c.value === top.value;
}

function CardBack() {
  return (
    <div
      style={{
        width: 46,
        height: 66,
        borderRadius: 8,
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        border: '2px solid rgba(255,255,255,0.75)',
        boxShadow: '0 3px 8px rgba(15,23,42,0.25)',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <span style={{ color: '#fff', fontWeight: 800, fontSize: 12 }}>🎴</span>
    </div>
  );
}

export function UnoLightBoard({ state, mySymbol, myPlayerId, onMove, disabled }: UnoLightBoardProps) {
  const isFinished = state.status === 'finished' || state.status === 'draw';

  const meById = state.players.find((p) => p.userId === myPlayerId);
  const resolvedMySymbol = mySymbol || meById?.symbol || Object.keys(state.hands || {})[0] || '';
  const me = state.players.find((p) => p.symbol === resolvedMySymbol) || meById;
  const opp = state.players.find((p) => p.symbol !== resolvedMySymbol);
  const oppSymbol = opp?.symbol || Object.keys(state.hands || {}).find((k) => k !== resolvedMySymbol) || '';

  const myTurn = state.players[state.currentPlayerIndex]?.symbol === resolvedMySymbol && !disabled && !isFinished;

  const myHand = state.hands?.[resolvedMySymbol] || [];
  const oppCount = oppSymbol ? state.hands?.[oppSymbol]?.length ?? 0 : 0;

  const [wildColor, setWildColor] = useState<Color>('R');
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  const playable = useMemo(
    () => new Set(myHand.filter((c) => canPlay(c, state.topCard, state.activeColor as Color | null))),
    [myHand, state.topCard, state.activeColor]
  );

  const selectCard = (card: string) => {
    if (!myTurn || !playable.has(card)) return;
    setSelectedCard((prev) => (prev === card ? null : card));
  };

  const confirmPlay = () => {
    if (!myTurn || !selectedCard) return;
    const p = parseCard(selectedCard);
    const move: UnoLightMove = {
      type: 'play',
      card: selectedCard,
      chooseColor: p.color === 'W' ? wildColor : undefined,
    };
    onMove(move);
    setSelectedCard(null);
  };

  const drawCard = () => {
    if (!myTurn) return;
    onMove({ type: 'draw' });
    setSelectedCard(null);
  };

  const top = state.topCard ? parseCard(state.topCard) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: 'min(900px, calc(100vw - 24px))' }}>
      <div style={{ display: 'flex', gap: 14, background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: '10px 14px', fontWeight: 700, flexWrap: 'wrap', justifyContent: 'center' }}>
        <span>🟦 {me?.displayName ?? 'You'}: {myHand.length} cards</span>
        <span>🟥 {opp?.displayName ?? 'Opponent'}: {oppCount} cards</span>
        <span>🃏 Deck: {state.deck.length}</span>
        {state.pendingDraw > 0 && <span>⚠️ Pending draw: +{state.pendingDraw}</span>}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.92)', borderRadius: 10, padding: '8px 12px', width: '100%', textAlign: 'center', color: '#334155', fontWeight: 700 }}>
        {state.lastAction}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.92)', borderRadius: 12, padding: 10, width: '100%' }}>
        <div style={{ fontWeight: 800, marginBottom: 8, color: '#334155' }}>Opponent Hand</div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', minHeight: 78, overflowX: 'auto', padding: '2px 4px 4px' }}>
          {Array.from({ length: oppCount }).map((_, i) => {
            const mid = (oppCount - 1) / 2;
            const offset = i - mid;
            const angle = Math.max(-16, Math.min(16, offset * 4));
            const lift = Math.max(0, 7 - Math.abs(offset) * 2);
            return (
              <div
                key={i}
                style={{
                  flex: '0 0 auto',
                  marginLeft: i === 0 ? 0 : -16,
                  transform: `rotate(${angle}deg) translateY(${-lift}px)`,
                  transformOrigin: 'bottom center',
                }}
              >
                <CardBack />
              </div>
            );
          })}
          {oppCount === 0 && <span style={{ color: '#64748b' }}>No cards</span>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, width: '100%', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 12, minWidth: 190, textAlign: 'center' }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Top Card</div>
          <div style={{ margin: '0 auto', width: 76, height: 110, borderRadius: 10, border: '2px solid #cbd5e1', background: top ? colorHex(top.color) : '#fff', display: 'grid', placeItems: 'center' }}>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: 28 }}>{top ? valueLabel(top.value) : '—'}</div>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: '#475569' }}>Active color: <strong>{state.activeColor || '—'}</strong></div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 12, minWidth: 280 }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Actions</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {(['R', 'G', 'B', 'Y'] as Color[]).map((c) => (
              <button
                key={c}
                onClick={() => setWildColor(c)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  border: wildColor === c ? '3px solid #111827' : '1px solid #cbd5e1',
                  background: colorHex(c),
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={confirmPlay}
              disabled={!myTurn || !selectedCard}
              style={{ border: 'none', borderRadius: 10, padding: '10px 14px', background: myTurn && selectedCard ? '#16a34a' : '#94a3b8', color: '#fff', fontWeight: 800, cursor: myTurn && selectedCard ? 'pointer' : 'default' }}
            >
              ✅ Confirm Play
            </button>
            <button
              onClick={drawCard}
              disabled={!myTurn}
              style={{ border: 'none', borderRadius: 10, padding: '10px 14px', background: myTurn ? '#6D7DFF' : '#94a3b8', color: '#fff', fontWeight: 800, cursor: myTurn ? 'pointer' : 'default' }}
            >
              Draw Card
            </button>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: '#475569' }}>{myTurn ? 'Your turn' : 'Waiting for opponent'}</div>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 14, padding: 14, width: '100%' }}>
        <div style={{ fontWeight: 800, marginBottom: 10, color: '#334155' }}>Your Hand (tap to select)</div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {myHand.length === 0 && <span style={{ color: '#64748b' }}>No cards in hand</span>}
          {myHand.map((card, i) => {
            const p = parseCard(card);
            const isPlayable = playable.has(card);
            const isSelected = selectedCard === card;
            return (
              <button
                key={`${card}-${i}`}
                onClick={() => selectCard(card)}
                disabled={!myTurn || !isPlayable}
                style={{
                  width: 62,
                  height: 90,
                  flex: '0 0 auto',
                  borderRadius: 10,
                  border: isSelected ? '3px solid #16a34a' : isPlayable ? '2px solid #6D7DFF' : '2px solid #cbd5e1',
                  background: p.color === 'W' ? 'linear-gradient(135deg,#ef4444 0%, #22c55e 33%, #3b82f6 66%, #eab308 100%)' : colorHex(p.color),
                  color: '#fff',
                  fontWeight: 900,
                  cursor: myTurn && isPlayable ? 'pointer' : 'default',
                  opacity: isPlayable ? 1 : 0.58,
                  transform: isSelected ? 'translateY(-8px) scale(1.05) rotate(-2deg)' : 'none',
                  transition: 'transform 170ms ease',
                }}
              >
                {valueLabel(p.value)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default UnoLightBoard;
