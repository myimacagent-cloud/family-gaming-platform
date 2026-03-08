import type { GameBoardProps } from '../types';
import type { GridChipsState, GridChipsMove } from './types';

interface GridChipsBoardProps extends GameBoardProps<GridChipsState> {}

export function GridChipsBoard({ state, mySymbol, onMove, disabled }: GridChipsBoardProps) {
  const isMyTurn = state.players[state.currentPlayerIndex]?.symbol === mySymbol;
  const isFinished = state.status === 'finished' || state.status === 'draw';
  const canPlay = !disabled && isMyTurn && !isFinished;

  const me = state.players.find((p) => p.symbol === mySymbol);
  const opponent = state.players.find((p) => p.symbol !== mySymbol);

  const fallbackMyStart = state.players[0]?.symbol === mySymbol ? 1 * state.cols + 1 : 2 * state.cols + 3;
  const fallbackOpponentStart = state.players[0]?.symbol === mySymbol ? 2 * state.cols + 3 : 1 * state.cols + 1;

  const myPos = state.positions[mySymbol] ?? fallbackMyStart;
  const opponentPos = opponent ? (state.positions[opponent.symbol] ?? fallbackOpponentStart) : -1;

  const getNeighbors = (index: number): number[] => {
    const r = Math.floor(index / state.cols);
    const c = index % state.cols;
    const out: number[] = [];
    if (r > 0) out.push((r - 1) * state.cols + c);
    if (r < state.rows - 1) out.push((r + 1) * state.cols + c);
    if (c > 0) out.push(r * state.cols + (c - 1));
    if (c < state.cols - 1) out.push(r * state.cols + (c + 1));
    return out;
  };

  const validTargets = canPlay && typeof myPos === 'number' ? new Set(getNeighbors(myPos)) : new Set<number>();

  const makeMove = (to: number) => {
    if (!canPlay || !validTargets.has(to)) return;
    const move: GridChipsMove = { to };
    onMove(move);
  };

  const chip = (symbol: string, isBlue: boolean) => (
    <div
      style={{
        width: '72%',
        height: '72%',
        borderRadius: '50%',
        background: isBlue ? '#22c5ee' : '#ff6262',
        display: 'grid',
        placeItems: 'center',
        boxShadow: '0 6px 14px rgba(0,0,0,0.18)',
      }}
    >
      <div
        style={{
          width: '60%',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)',
          gap: 6,
          transform: 'translateY(2px)',
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff', justifySelf: 'center', alignSelf: 'center' }} />
        <span />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff', justifySelf: 'center', alignSelf: 'center' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#fff', justifySelf: 'center', alignSelf: 'center' }} />
      </div>
      <span style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}>{symbol}</span>
    </div>
  );

  const total = state.rows * state.cols;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{ background: 'rgba(255,255,255,0.9)', borderRadius: 12, padding: '9px 12px', fontWeight: 700, color: '#334155' }}>
        {isFinished
          ? state.status === 'draw'
            ? '🤝 Draw game'
            : state.winner === mySymbol
              ? '🏆 You win!'
              : '🎉 Opponent wins!'
          : canPlay
            ? 'Your turn — move 1 square'
            : "Opponent's turn"}
      </div>

      <div
        style={{
          width: 'min(560px, calc(100vw - 40px))',
          aspectRatio: '1 / 1',
          background: '#ea8f74',
          borderRadius: 24,
          padding: 14,
          display: 'grid',
          gridTemplateColumns: `repeat(${state.cols}, 1fr)`,
          gap: 10,
          boxShadow: '0 15px 34px rgba(0,0,0,0.2)',
        }}
      >
        {Array.from({ length: total }, (_, i) => {
          const hasMe = myPos === i;
          const hasOpponent = opponentPos === i;
          const selectable = validTargets.has(i);

          return (
            <button
              key={i}
              onClick={() => makeMove(i)}
              disabled={!selectable}
              style={{
                border: 'none',
                borderRadius: 18,
                background: selectable ? '#f8d4da' : '#efdfc7',
                cursor: selectable ? 'pointer' : 'default',
                display: 'grid',
                placeItems: 'center',
                position: 'relative',
                transition: 'transform 120ms ease',
              }}
              aria-label={`Grid cell ${i + 1}`}
            >
              {hasMe && chip(mySymbol, true)}
              {hasOpponent && opponent && chip(opponent.symbol, false)}
            </button>
          );
        })}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.92)', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: '#334155' }}>
        Goal: reach your opponent&apos;s start tile or land on their chip.
      </div>

      <div style={{ fontSize: 12, color: 'white', opacity: 0.9 }}>
        {me?.displayName ?? 'Blue'} vs {opponent?.displayName ?? 'Red'}
      </div>
    </div>
  );
}

export default GridChipsBoard;
