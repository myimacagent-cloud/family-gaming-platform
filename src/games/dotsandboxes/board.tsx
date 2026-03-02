import type { GameBoardProps } from '../types';
import type { DotsAndBoxesMove, DotsAndBoxesState } from './index';

const P1 = '#667eea';
const P2 = '#764ba2';

export function DotsAndBoxesBoard({ state, mySymbol, onMove, disabled }: GameBoardProps<DotsAndBoxesState>) {
  const n = state.boxSize;
  const me = state.players.find((p) => p.symbol === mySymbol);
  const currentSymbol = state.players[state.currentPlayerIndex]?.symbol;
  const myTurn = mySymbol && currentSymbol === mySymbol && state.status === 'active';

  const colorFor = (symbol: string | null) => {
    if (!symbol) return '#e5e7eb';
    return state.players[0]?.symbol === symbol ? P1 : P2;
  };

  const play = (move: DotsAndBoxesMove) => {
    if (!myTurn || disabled) return;
    onMove(move);
  };

  const cellSize = 42;
  const dotSize = 10;
  const hLen = cellSize - dotSize;
  const vLen = cellSize - dotSize;

  return (
    <div style={{ background: 'rgba(255,255,255,0.96)', borderRadius: 16, padding: 16, maxWidth: '96vw', overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 700, color: '#333' }}>{me ? `You: ${me.displayName} (${mySymbol})` : 'Dots & Boxes'}</div>
        <div style={{ display: 'flex', gap: 14, fontWeight: 700 }}>
          {state.players.map((p, idx) => (
            <div key={p.userId} style={{ color: idx === 0 ? P1 : P2 }}>
              {p.displayName}: {state.scores[p.symbol] || 0}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${2 * n + 1}, auto)`, alignItems: 'center', justifyContent: 'start', userSelect: 'none' }}>
        {Array.from({ length: 2 * n + 1 }).map((_, gr) =>
          Array.from({ length: 2 * n + 1 }).map((__, gc) => {
            const isDot = gr % 2 === 0 && gc % 2 === 0;
            const isHEdge = gr % 2 === 0 && gc % 2 === 1;
            const isVEdge = gr % 2 === 1 && gc % 2 === 0;

            if (isDot) {
              return <div key={`${gr}-${gc}`} style={{ width: dotSize, height: dotSize, borderRadius: '50%', background: '#374151', margin: 2 }} />;
            }

            if (isHEdge) {
              const r = gr / 2;
              const c = (gc - 1) / 2;
              const edgeOwner = state.hEdges[r][c];
              const canPlay = myTurn && !edgeOwner && !disabled;
              return (
                <button
                  key={`${gr}-${gc}`}
                  onClick={() => play({ o: 'h', r, c })}
                  disabled={!canPlay}
                  style={{ width: hLen, height: 10, margin: '0 2px', borderRadius: 6, border: 'none', background: edgeOwner ? colorFor(edgeOwner) : canPlay ? '#d1d5db' : '#f3f4f6', cursor: canPlay ? 'pointer' : 'default' }}
                />
              );
            }

            if (isVEdge) {
              const r = (gr - 1) / 2;
              const c = gc / 2;
              const edgeOwner = state.vEdges[r][c];
              const canPlay = myTurn && !edgeOwner && !disabled;
              return (
                <button
                  key={`${gr}-${gc}`}
                  onClick={() => play({ o: 'v', r, c })}
                  disabled={!canPlay}
                  style={{ width: 10, height: vLen, margin: '2px 0', borderRadius: 6, border: 'none', background: edgeOwner ? colorFor(edgeOwner) : canPlay ? '#d1d5db' : '#f3f4f6', cursor: canPlay ? 'pointer' : 'default' }}
                />
              );
            }

            const br = (gr - 1) / 2;
            const bc = (gc - 1) / 2;
            const owner = state.boxOwners[br][bc];
            return (
              <div
                key={`${gr}-${gc}`}
                style={{ width: cellSize - 12, height: cellSize - 12, margin: 1, borderRadius: 6, background: owner ? `${colorFor(owner)}33` : '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: owner ? colorFor(owner) : '#9ca3af', fontSize: 12 }}
              >
                {owner || ''}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
