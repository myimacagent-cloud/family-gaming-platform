import type { GameBoardProps } from '../types';
import type { ColorWarsState, ColorWarsMove } from './types';

interface ColorWarsBoardProps extends GameBoardProps<ColorWarsState> {}

function Token({ color, dots }: { color: string; dots: number }) {
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
            background: '#fff',
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
  const hasStarted = !!state.started?.[mySymbol];

  const makeMove = (index: number) => {
    if (!canPlay) return;
    const move: ColorWarsMove = { index };
    onMove(move);
  };

  const cellBgFor = (owner: string | null) => {
    if (!owner) return '#e2e8f0';
    if (owner === p1?.symbol) return '#a5f3fc';
    if (owner === p2?.symbol) return '#fbcfe8';
    return '#c4b5fd';
  };

  const tokenColorFor = (owner: string | null) => {
    if (!owner) return null;
    if (owner === p1?.symbol) return '#22d3ee';
    if (owner === p2?.symbol) return '#f472b6';
    return '#8b5cf6';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ display: 'flex', gap: 14, background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: '10px 14px', fontWeight: 700 }}>
        <span style={{ color: '#0891b2' }}>🩵 {p1?.displayName ?? 'P1'}: {state.scores[p1?.symbol ?? 'X'] ?? 0}</span>
        <span style={{ color: '#db2777' }}>🩷 {p2?.displayName ?? 'P2'}: {state.scores[p2?.symbol ?? 'O'] ?? 0}</span>
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
          background: 'rgba(15,23,42,0.95)',
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
                border: 'none',
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
