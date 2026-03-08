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

export function UnoLightBoard({ state, mySymbol, onMove, disabled }: UnoLightBoardProps) {
  const isFinished = state.status === 'finished' || state.status === 'draw';
  const myTurn = state.players[state.currentPlayerIndex]?.symbol === mySymbol && !disabled && !isFinished;

  const me = state.players.find((p) => p.symbol === mySymbol);
  const opp = state.players.find((p) => p.symbol !== mySymbol);

  const myHand = state.hands?.[mySymbol] || [];
  const oppCount = opp ? state.hands?.[opp.symbol]?.length ?? 0 : 0;

  const [wildColor, setWildColor] = useState<Color>('R');

  const playable = useMemo(() => new Set(myHand.filter((c) => canPlay(c, state.topCard, state.activeColor))), [myHand, state.topCard, state.activeColor]);

  const playCard = (card: string) => {
    if (!myTurn) return;
    const p = parseCard(card);
    const move: UnoLightMove = {
      type: 'play',
      card,
      chooseColor: p.color === 'W' ? wildColor : undefined,
    };
    onMove(move);
  };

  const drawCard = () => {
    if (!myTurn) return;
    onMove({ type: 'draw' });
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

      <div style={{ display: 'flex', gap: 12, width: '100%', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 12, minWidth: 190, textAlign: 'center' }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Top Card</div>
          <div style={{ margin: '0 auto', width: 76, height: 110, borderRadius: 10, border: '2px solid #cbd5e1', background: top ? colorHex(top.color) : '#fff', display: 'grid', placeItems: 'center' }}>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: 28 }}>{top ? valueLabel(top.value) : '—'}</div>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: '#475569' }}>Active color: <strong>{state.activeColor || '—'}</strong></div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 12, minWidth: 260 }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Wild Color</div>
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
          {myHand.map((card, i) => {
            const p = parseCard(card);
            const isPlayable = playable.has(card);
            return (
              <button
                key={`${card}-${i}`}
                onClick={() => playCard(card)}
                disabled={!myTurn || !isPlayable}
                style={{
                  width: 62,
                  height: 90,
                  flex: '0 0 auto',
                  borderRadius: 10,
                  border: isPlayable ? '2px solid #6D7DFF' : '2px solid #cbd5e1',
                  background: p.color === 'W' ? 'linear-gradient(135deg,#ef4444 0%, #22c55e 33%, #3b82f6 66%, #eab308 100%)' : colorHex(p.color),
                  color: '#fff',
                  fontWeight: 900,
                  cursor: myTurn && isPlayable ? 'pointer' : 'default',
                  opacity: isPlayable ? 1 : 0.58,
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
