import type { GameBoardProps } from '../types';
import type { ColorWarsState, ColorWarsMove } from './types';

interface ColorWarsBoardProps extends GameBoardProps<ColorWarsState> {}

function Token({ color, dots }: { color: string; dots: number }) {
  const dotColor = color === '#ffffff' ? '#111827' : '#ffffff';
  const patterns: Record<number, Array<{ top: string; left: string }>> = {
    1: [{ top: '50%', left: '50%' }],
    2: [{ top: '42%', left: '35%' }, { top: '58%', left: '65%' }],
    3: [{ top: '28%', left: '50%' }, { top: '62%', left: '34%' }, { top: '62%', left: '66%' }],
  };
  const points = patterns[Math.min(3, Math.max(1, dots))] || patterns[1];

  return (
    <span
      style={{
        width: '72%',
        height: '72%',
        borderRadius: '999px',
        background: color,
        position: 'relative',
        display: 'block',
        boxShadow: '0 4px 10px rgba(15,23,42,0.2)',
      }}
    >
      {points.map((dot, idx) => (
        <span
          key={idx}
          style={{
            position: 'absolute',
            width: '16%',
            height: '16%',
            borderRadius: '50%',
            background: dotColor,
            top: dot.top,
            left: dot.left,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </span>
  );
}

export function ColorWarsBoard({ state, mySymbol, onMove, disabled }: ColorWarsBoardProps) {
  const isMyTurn = state.players[state.currentPlayerIndex]?.symbol === mySymbol;
  const isFinished = state.status === 'finished' || state.status === 'draw';
  const canPlay = !disabled && !isFinished && isMyTurn;

  const p1 = state.players[0];
  const p2 = state.players[1];
  const me = state.players.find((p) => p.symbol === mySymbol);
  const opponent = state.players.find((p) => p.symbol !== mySymbol);
  const hasStarted = !!state.started?.[mySymbol];

  const makeMove = (index: number) => {
    if (!canPlay) return;
    const move: ColorWarsMove = { index };
    onMove(move);
  };

  const cellBgFor = (owner: string | null) => {
    if (!owner) return '#f3f4f6';
    if (owner === p1?.symbol) return '#d1d5db';
    if (owner === p2?.symbol) return '#9ca3af';
    return '#e5e7eb';
  };

  const tokenColorFor = (owner: string | null) => {
    if (!owner) return null;
    if (owner === p1?.symbol) return '#ffffff';
    if (owner === p2?.symbol) return '#111827';
    return '#6b7280';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ display: 'flex', gap: 10, background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: '10px 12px', fontWeight: 700, flexWrap: 'wrap', justifyContent: 'center' }}>
        <span style={{ color: '#111827', background: '#ffffff', border: '2px solid #111827', borderRadius: 999, padding: '4px 10px' }}>
          ⚪ {p1?.displayName ?? 'P1'}: {state.scores[p1?.symbol ?? 'X'] ?? 0}
        </span>
        <span style={{ color: '#ffffff', background: '#111827', border: '2px solid #111827', borderRadius: 999, padding: '4px 10px' }}>
          ⚫ {p2?.displayName ?? 'P2'}: {state.scores[p2?.symbol ?? 'O'] ?? 0}
        </span>
        {me && (
          <span style={{ color: '#1f2937', background: '#e5e7eb', borderRadius: 999, padding: '4px 10px' }}>
            You: {me.displayName}
          </span>
        )}
        {opponent && (
          <span style={{ color: '#1f2937', background: '#e5e7eb', borderRadius: 999, padding: '4px 10px' }}>
            Opponent: {opponent.displayName}
          </span>
        )}
      </div>

      {!isFinished && (
        <div style={{ background: 'rgba(255,255,255,0.9)', borderRadius: 10, padding: '8px 12px', fontWeight: 700, color: '#334155' }}>
          {isMyTurn
            ? (hasStarted ? '🎨 Your turn — play on your color only (4 dots = burst)!' : '🎨 Your first tap starts with 3 dots!')
            : '⏳ Waiting for opponent...'}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${state.cols}, 1fr)`,
          gap: 6,
          width: 'min(420px, calc(100vw - 40px))',
          aspectRatio: '1 / 1',
          background: '#000000',
          borderRadius: 14,
          padding: 10,
        }}
      >
        {state.board.map((cell, i) => {
          const tokenColor = tokenColorFor(cell.owner);
          const blockedByOpponent = hasStarted
            ? cell.owner !== mySymbol
            : cell.owner !== null;
          return (
            <button
              key={i}
              onClick={() => makeMove(i)}
              disabled={!canPlay || blockedByOpponent}
              style={{
                border: '1px solid #111827',
                borderRadius: 10,
                background: cellBgFor(cell.owner),
                cursor: !canPlay || blockedByOpponent ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
              aria-label={`Cell ${i + 1}`}
            >
              {tokenColor && cell.dots > 0 ? <Token color={tokenColor} dots={cell.dots} /> : null}
            </button>
          );
        })}
      </div>

      {isFinished && (
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: '10px 14px', fontWeight: 800, color: '#1e293b' }}>
          {state.status === 'draw' ? '🤝 Tie game!' : state.winner === mySymbol ? '🏆 You win Color Wars!' : '🎉 Opponent wins this round!'}
        </div>
      )}
    </div>
  );
}

export default ColorWarsBoard;
