import type { GameBoardProps } from '../types';
import type { GridChipsState, GridChipsMove } from './types';

interface GridChipsBoardProps extends GameBoardProps<GridChipsState> {}

export function GridChipsBoard({ state, mySymbol, onMove, disabled }: GridChipsBoardProps) {
  const isMyTurn = state.players[state.currentPlayerIndex]?.symbol === mySymbol;
  const isFinished = state.status === 'finished' || state.status === 'draw';
  const canPlay = !disabled && !isFinished && isMyTurn;

  const p1 = state.players[0];
  const p2 = state.players[1];

  const colorFor = (symbol: string | null) => {
    if (!symbol) return '#e2e8f0';
    if (symbol === p1?.symbol) return '#3b82f6';
    if (symbol === p2?.symbol) return '#ec4899';
    return '#a78bfa';
  };

  const hasPlayed = (state.moveCounts[mySymbol] || 0) > 0;

  const makeMove = (index: number) => {
    if (!canPlay) return;
    const move: GridChipsMove = { index };
    onMove(move);
  };

  const dotView = (dots: number, owner: string | null) => {
    if (dots <= 0 || !owner) return null;

    const tokenColor = owner === p1?.symbol ? '#3b82f6' : '#ec4899';

    return (
      <div
        style={{
          width: '74%',
          height: '74%',
          borderRadius: '50%',
          background: tokenColor,
          display: 'grid',
          placeItems: 'center',
          boxShadow: '0 6px 12px rgba(0,0,0,0.18)',
        }}
      >
        <div
          style={{
            width: '62%',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {Array.from({ length: dots }).map((_, i) => (
            <span
              key={i}
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#ffffff',
              }}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ display: 'flex', gap: 14, background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: '10px 14px', fontWeight: 700 }}>
        <span style={{ color: '#2563eb' }}>🔵 {p1?.displayName ?? 'P1'}</span>
        <span style={{ color: '#db2777' }}>🩷 {p2?.displayName ?? 'P2'}</span>
      </div>

      {!isFinished && (
        <div style={{ background: 'rgba(255,255,255,0.9)', borderRadius: 10, padding: '8px 12px', fontWeight: 700, color: '#334155', textAlign: 'center' }}>
          {isMyTurn
            ? hasPlayed
              ? 'Your turn — play only your color.'
              : 'Your first move: tap a white tile (starts with 3 dots).'
            : '⏳ Waiting for opponent...'}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${state.cols}, 1fr)`,
          gap: 6,
          width: 'min(520px, calc(100vw - 40px))',
          aspectRatio: '1 / 1',
          background: 'rgba(15,23,42,0.95)',
          borderRadius: 14,
          padding: 10,
        }}
      >
        {state.board.map((cell, i) => {
          const selectable = canPlay
            ? hasPlayed
              ? cell.owner === mySymbol
              : cell.owner === null
            : false;

          return (
            <button
              key={i}
              onClick={() => makeMove(i)}
              disabled={!selectable}
              style={{
                border: selectable ? '2px solid rgba(15,23,42,0.2)' : 'none',
                borderRadius: 10,
                background: selectable ? '#f8d4da' : colorFor(cell.owner),
                cursor: selectable ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: cell.owner
                  ? 'inset 0 0 0 2px rgba(15,23,42,0.15)'
                  : 'inset 0 0 0 2px rgba(51,65,85,0.25)',
              }}
              aria-label={`Cell ${i + 1}`}
            >
              {dotView(cell.dots, cell.owner)}
            </button>
          );
        })}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.92)', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: '#334155', textAlign: 'center' }}>
        Rules: first tap = 3 dots on a white tile. Then you can only play your own color. At 4 dots, tile bursts to neighbors.
      </div>

      {isFinished && (
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: '10px 14px', fontWeight: 800, color: '#1e293b' }}>
          {state.status === 'draw' ? '🤝 Tie game!' : state.winner === mySymbol ? '🏆 You win!' : '🎉 Opponent wins!'}
        </div>
      )}
    </div>
  );
}

export default GridChipsBoard;
