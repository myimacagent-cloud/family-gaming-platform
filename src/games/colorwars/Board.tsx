import type { GameBoardProps } from '../types';
import type { ColorWarsState, ColorWarsMove } from './types';

interface ColorWarsBoardProps extends GameBoardProps<ColorWarsState> {}

function Token({ color }: { color: string }) {
  return (
    <span
      style={{
        width: '70%',
        height: '70%',
        borderRadius: '999px',
        background: color,
        position: 'relative',
        display: 'block',
        boxShadow: '0 4px 10px rgba(15,23,42,0.2)',
      }}
    >
      {[
        { top: '26%', left: '50%' },
        { top: '58%', left: '34%' },
        { top: '58%', left: '66%' },
      ].map((dot, idx) => (
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

  const makeMove = (index: number) => {
    if (!canPlay) return;
    const move: ColorWarsMove = { index };
    onMove(move);
  };

  const cellBgFor = (symbol: string | null) => {
    if (!symbol) return '#e9d8bd';
    if (symbol === p1?.symbol) return '#d9f3fb';
    if (symbol === p2?.symbol) return '#ffd7df';
    return '#e9d8bd';
  };

  const tokenColorFor = (symbol: string | null) => {
    if (!symbol) return null;
    if (symbol === p1?.symbol) return '#16b5e6';
    if (symbol === p2?.symbol) return '#ff5a6e';
    return '#8b5cf6';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ display: 'flex', gap: 14, background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: '10px 14px', fontWeight: 700 }}>
        <span style={{ color: '#0891b2' }}>🔵 {p1?.displayName ?? 'P1'}: {state.scores[p1?.symbol ?? 'X'] ?? 0}</span>
        <span style={{ color: '#e11d48' }}>🔴 {p2?.displayName ?? 'P2'}: {state.scores[p2?.symbol ?? 'O'] ?? 0}</span>
      </div>

      {!isFinished && (
        <div style={{ background: 'rgba(255,255,255,0.9)', borderRadius: 10, padding: '8px 12px', fontWeight: 700, color: '#334155' }}>
          {isMyTurn ? '🎨 Your turn — claim a square!' : '⏳ Waiting for opponent...'}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${state.cols}, 1fr)`,
          gap: 10,
          width: 'min(460px, calc(100vw - 32px))',
          aspectRatio: '1 / 1',
          background: '#eb8f73',
          borderRadius: 18,
          padding: 12,
        }}
      >
        {state.board.map((cell, i) => {
          const tokenColor = tokenColorFor(cell);
          return (
            <button
              key={i}
              onClick={() => makeMove(i)}
              disabled={!canPlay || cell !== null}
              style={{
                border: 'none',
                borderRadius: 18,
                background: cellBgFor(cell),
                cursor: !canPlay || cell !== null ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
              aria-label={`Cell ${i + 1}`}
            >
              {tokenColor ? <Token color={tokenColor} /> : null}
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
