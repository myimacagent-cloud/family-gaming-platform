import type { GameBoardProps } from '../types';
import type { ColorWarsState, ColorWarsMove } from './types';

interface ColorWarsBoardProps extends GameBoardProps<ColorWarsState> {}

export function ColorWarsBoard({ state, mySymbol, onMove, disabled }: ColorWarsBoardProps) {
  const isMyTurn = state.players[state.currentPlayerIndex]?.symbol === mySymbol;
  const isFinished = state.status === 'finished' || state.status === 'draw';
  const canPlay = !disabled && !isFinished && isMyTurn;

  const p1 = state.players[0];
  const p2 = state.players[1];

  const colorFor = (symbol: string | null) => {
    if (!symbol) return '#e2e8f0';
    if (symbol === p1?.symbol) return '#22d3ee';
    if (symbol === p2?.symbol) return '#f472b6';
    return '#a78bfa';
  };

  const makeMove = (index: number) => {
    if (!canPlay) return;
    const move: ColorWarsMove = { index };
    onMove(move);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ display: 'flex', gap: 14, background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: '10px 14px', fontWeight: 700 }}>
        <span style={{ color: '#0891b2' }}>🩵 {p1?.displayName ?? 'P1'}: {state.scores[p1?.symbol ?? 'X'] ?? 0}</span>
        <span style={{ color: '#db2777' }}>🩷 {p2?.displayName ?? 'P2'}: {state.scores[p2?.symbol ?? 'O'] ?? 0}</span>
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
          gap: 6,
          width: 'min(420px, calc(100vw - 40px))',
          aspectRatio: '1 / 1',
          background: 'rgba(15,23,42,0.95)',
          borderRadius: 14,
          padding: 10,
        }}
      >
        {state.board.map((cell, i) => (
          <button
            key={i}
            onClick={() => makeMove(i)}
            disabled={!canPlay || cell !== null}
            style={{
              border: 'none',
              borderRadius: 10,
              background: colorFor(cell),
              cursor: !canPlay || cell !== null ? 'default' : 'pointer',
              boxShadow: cell ? 'inset 0 0 0 2px rgba(15,23,42,0.15)' : 'inset 0 0 0 2px rgba(51,65,85,0.25)',
            }}
            aria-label={`Cell ${i + 1}`}
          />
        ))}
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
