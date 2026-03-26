import type { GameBoardProps } from '../types';
import type { SnakesLaddersState, SnakesLaddersMove } from './types';

interface SnakesLaddersBoardProps extends GameBoardProps<SnakesLaddersState> {}

const LADDERS: Array<[number, number]> = [[3,22],[8,30],[28,84],[58,77],[75,86],[80,99]];
const SNAKES: Array<[number, number]> = [[17,4],[52,29],[57,40],[62,22],[88,18],[95,51],[97,79]];

export function SnakesLaddersBoard({ state, mySymbol, onMove, disabled }: SnakesLaddersBoardProps) {
  const isFinished = state.status === 'finished' || state.status === 'draw';
  const myTurn = state.players[state.currentPlayerIndex]?.symbol === mySymbol && !disabled && !isFinished;

  const p1 = state.players[0];
  const p2 = state.players[1];
  const p1Pos = p1 ? state.positions?.[p1.symbol] ?? 1 : 1;
  const p2Pos = p2 ? state.positions?.[p2.symbol] ?? 1 : 1;

  const roll = () => {
    if (!myTurn) return;
    const move: SnakesLaddersMove = { type: 'roll' };
    onMove(move);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 'min(860px, calc(100vw - 24px))' }}>
      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#334155' }}>
        {state.lastAction}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 12, fontWeight: 700 }}>
          🔵 {p1?.displayName ?? 'P1'}: {p1Pos}
        </div>
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 12, fontWeight: 700 }}>
          🩷 {p2?.displayName ?? 'P2'}: {p2Pos}
        </div>
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 12, fontWeight: 700 }}>
          🎲 Last roll: {state.lastRoll || '—'}
        </div>
      </div>

      <div style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.95) 0%, rgba(236,72,153,0.10) 50%, rgba(34,197,94,0.10) 100%)', borderRadius: 12, padding: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4 }}>
          {Array.from({ length: 100 }, (_, i) => 100 - i).map((n) => {
            const isP1 = p1Pos === n;
            const isP2 = p2Pos === n;
            const ladderFrom = LADDERS.find(([a]) => a === n);
            const ladderTo = LADDERS.find(([, b]) => b === n);
            const snakeFrom = SNAKES.find(([a]) => a === n);
            const snakeTo = SNAKES.find(([, b]) => b === n);

            return (
              <div key={n} style={{ minHeight: 28, borderRadius: 6, background: n % 2 === 0 ? '#fef3c7' : '#dbeafe', border: '1px solid #cbd5e1', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, position: 'relative', overflow: 'hidden' }}>
                {n}

                {ladderFrom && <div style={{ position: 'absolute', top: 1, left: 2, fontSize: 10 }}>🪜↑{ladderFrom[1]}</div>}
                {ladderTo && <div style={{ position: 'absolute', top: 1, right: 2, fontSize: 9, opacity: 0.75 }}>🪜</div>}

                {snakeFrom && <div style={{ position: 'absolute', bottom: 1, left: 2, fontSize: 10 }}>🐍↓{snakeFrom[1]}</div>}
                {snakeTo && <div style={{ position: 'absolute', bottom: 1, right: 2, fontSize: 9, opacity: 0.75 }}>🐍</div>}

                {(isP1 || isP2) && (
                  <div style={{ position: 'absolute', bottom: 2, right: 2, fontSize: 11 }}>
                    {isP1 ? '🔷' : ''}{isP2 ? '🟣' : ''}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: '8px 10px', fontSize: 12, color: '#334155' }}>
        🪜 = ladder up • 🐍 = snake down • colorful board mode
      </div>

      <button onClick={roll} disabled={!myTurn} style={{ border: 'none', borderRadius: 10, padding: '10px 14px', background: myTurn ? '#6D7DFF' : '#94a3b8', color: '#fff', fontWeight: 800, cursor: myTurn ? 'pointer' : 'default' }}>
        Roll Dice
      </button>
    </div>
  );
}

export default SnakesLaddersBoard;
