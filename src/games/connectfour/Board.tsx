import type { GameBoardProps } from '../types';
import type { ConnectFourState, ConnectFourMove } from './types';

interface ConnectFourBoardProps extends GameBoardProps<ConnectFourState> {}

export function ConnectFourBoard({ state, mySymbol, onMove, disabled }: ConnectFourBoardProps) {
  const isMyTurn = state.players[state.currentPlayerIndex]?.symbol === mySymbol;
  const isFinished = state.status === 'finished' || state.status === 'draw';
  const canPlay = !disabled && !isFinished && isMyTurn;

  const p1 = state.players[0];
  const p2 = state.players[1];

  const tokenColorFor = (symbol: string | null) => {
    if (!symbol) return null;
    if (symbol === p1?.symbol) return '#ef4444'; // Red
    if (symbol === p2?.symbol) return '#eab308'; // Yellow
    return '#9ca3af';
  };

  const makeMove = (col: number) => {
    if (!canPlay) return;
    const move: ConnectFourMove = { col };
    onMove(move);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {/* Title and Players */}
      <div style={{
        background: 'linear-gradient(135deg, #3730a3 0%, #4338ca 100%)',
        padding: '12px 24px',
        borderRadius: 16,
        textAlign: 'center',
        boxShadow: '0 4px 15px rgba(67, 56, 202, 0.4)'
      }}>
        <h2 style={{ margin: 0, color: '#fff', fontSize: 24, fontWeight: 800 }}>
          🔴 Connect Four 🟡
        </h2>
      </div>

      {/* Player Score Board */}
      <div style={{
        display: 'flex',
        gap: 16,
        flexWrap: 'wrap',
        justifyContent: 'center',
        background: 'rgba(255,255,255,0.95)',
        padding: '12px 20px',
        borderRadius: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <span style={{
          background: '#ef4444',
          color: '#fff',
          padding: '8px 16px',
          borderRadius: 12,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          🔴 {p1?.displayName ?? 'Player 1'}
        </span>
        <span style={{
          background: '#eab308',
          color: '#fff',
          padding: '8px 16px',
          borderRadius: 12,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          🟡 {p2?.displayName ?? 'Player 2'}
        </span>
      </div>

      {/* Turn Indicator */}
      <div style={{
        background: isMyTurn ? '#dcfce7' : '#f3f4f6',
        border: isMyTurn ? '2px solid #22c55e' : '2px solid #9ca3af',
        borderRadius: 12,
        padding: '12px 24px',
        fontWeight: 800,
        color: isMyTurn ? '#166534' : '#374151',
        textAlign: 'center',
        fontSize: '18px'
      }}>
        {isFinished ? '🏁 Game Over!' : isMyTurn ? '👆 Your Turn - Pick a Column!' : '⏳ Waiting for Opponent...'}
      </div>

      {/* Game Board */}
      <div style={{
        background: '#1e40af',
        padding: '16px',
        borderRadius: 16,
        boxShadow: '0 10px 40px rgba(30, 64, 175, 0.4), inset 0 2px 4px rgba(255,255,255,0.1)'
      }}>
        {/* Drop Indicators */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, justifyContent: 'center' }}>
          {Array(COLS).fill(null).map((_, col) => {
            const isAvailable = canPlay && state.board[0][col] === null;
            const myColor = mySymbol === p1?.symbol ? '#ef4444' : '#eab308';
            return (
              <button
                key={`drop-${col}`}
                onClick={() => makeMove(col)}
                disabled={!isAvailable}
                style={{
                  width: 44,
                  height: 36,
                  background: isAvailable
                    ? `radial-gradient(circle at 50% 100%, ${myColor}80, ${myColor})`
                    : 'transparent',
                  border: isAvailable ? `2px solid ${myColor}` : '2px solid transparent',
                  borderRadius: 8,
                  cursor: isAvailable ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 14,
                  opacity: isAvailable ? 1 : 0.3
                }}
              >
                {isAvailable ? '▼' : ''}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gap: 8
        }}>
          {state.board.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const isLastMove = state.lastMove?.row === rowIndex && state.lastMove?.col === colIndex;
              const tokenColor = tokenColorFor(cell);

              return (
                <div
                  key={`cell-${rowIndex}-${colIndex}`}
                  style={{
                    width: 44,
                    height: 44,
                    background: '#1e3a8a',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.4)'
                  }}
                >
                  {tokenColor && (
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: tokenColor,
                      border: `3px solid ${isLastMove ? '#fff' : 'rgba(0,0,0,0.2)'}`,
                      boxShadow: isLastMove
                        ? `0 0 15px ${tokenColor}, 0 2px 8px rgba(0,0,0,0.3)`
                        : `0 2px 8px rgba(0,0,0,0.3), inset 0 -2px 4px rgba(0,0,0,0.2)`,
                      animation: isLastMove ? 'pulse 0.5s' : 'none'
                    }} />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Winner Display */}
      {isFinished && state.winner && (
        <div style={{
          background: state.winner === p1?.symbol
            ? 'linear-gradient(135deg, #fca5a5 0%, #ef4444 100%)'
            : 'linear-gradient(135deg, #fde047 0%, #eab308 100%)',
          padding: '24px 48px',
          borderRadius: 20,
          textAlign: 'center',
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
          animation: 'pulse 1s infinite'
        }}>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#fff' }}>
            🎉 Winner! 🎉
          </h2>
          <p style={{ margin: '8px 0 0 0', fontSize: 22, fontWeight: 700, color: '#fff' }}>
            {state.players.find(p => p.symbol === state.winner)?.displayName}
          </p>
        </div>
      )}

      {/* Draw Display */}
      {isFinished && !state.winner && (
        <div style={{
          background: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
          padding: '24px 48px',
          borderRadius: 20,
          textAlign: 'center',
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)'
        }}>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#fff' }}>
            🤝 It's a Draw! 🤝
          </h2>
        </div>
      )}
    </div>
  );
}

const COLS = 7;

export default ConnectFourBoard;
