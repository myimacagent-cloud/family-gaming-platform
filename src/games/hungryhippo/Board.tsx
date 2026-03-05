import type { GameBoardProps } from '../types';
import type { HungryHippoState, HungryHippoMove } from './types';

interface HungryHippoBoardProps extends GameBoardProps<HungryHippoState> {}

export function HungryHippoBoard({ state, mySymbol, onMove, disabled }: HungryHippoBoardProps) {
  const isMyTurn = state.players[state.currentPlayerIndex]?.symbol === mySymbol;
  const isFinished = state.status === 'finished' || state.status === 'draw';
  const canPlay = !disabled && !isFinished && isMyTurn;
  
  const handleChomp = (marbleId: string) => {
    if (!canPlay) return;
    const move: HungryHippoMove = { action: 'chomp', targetMarbleId: marbleId };
    onMove(move);
  };

  const getHippoEmoji = (position: string) => {
    switch (position) {
      case 'top-left': return '↖️';
      case 'top-right': return '↗️';
      case 'bottom-left': return '↙️';
      case 'bottom-right': return '↘️';
      default: return '🦛';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 16 }}>
      {/* Title */}
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '12px 24px', borderRadius: 16 }}>
        <h2 style={{ margin: 0, color: '#fff', fontSize: 28 }}>🦛 Hungry Hippo Arena</h2>
      </div>

      {/* Score Board */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        {state.hippos.map((hippo, idx) => (
          <div key={hippo.symbol} style={{
            background: hippo.color, padding: '10px 18px', borderRadius: 20, color: '#fff',
            fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8
          }}>
            <span>{getHippoEmoji(hippo.position)} {state.players[idx]?.displayName}: {hippo.marblesEaten}</span>
          </div>
        ))}
      </div>

      {/* Turn Indicator */}
      <div style={{
        background: isMyTurn ? '#dcfce7' : '#f3f4f6',
        border: isMyTurn ? '3px solid #22c55e' : '3px solid #9ca3af',
        borderRadius: 12, padding: '10px 20px', fontWeight: 800,
        color: isMyTurn ? '#166534' : '#374151', fontSize: '18px'
      }}>
        {isFinished ? '🏁 Game Over!' : isMyTurn ? '🎯 YOUR TURN! Click marbles!' : '⏳ Waiting...'}
      </div>

      {/* Game Board */}
      <div style={{
        width: 'min(420px, 92vw)', aspectRatio: '1 / 1',
        background: 'radial-gradient(circle, #a0522d 0%, #8B4513 50%, #654321 100%)',
        borderRadius: '50%', position: 'relative',
        boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5), 0 15px 40px rgba(0,0,0,0.4)',
        border: '10px solid #4A3728', overflow: 'hidden'
      }}>
        {/* Hippos at corners */}
        {state.hippos.map((hippo) => {
          const top = hippo.position.includes('top') ? '2%' : '78%';
          const left = hippo.position.includes('left') ? '2%' : '78%';
          return (
            <div key={hippo.symbol} style={{
              position: 'absolute', top, left,
              width: 70, height: 70, background: hippo.color,
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, zIndex: 20, border: '4px solid #fff',
              transform: hippo.isChomping ? 'scale(1.4)' : 'scale(1)'
            }}>
              {hippo.isChomping ? '😋' : '🦛'}
            </div>
          );
        })}

        {/* Marbles */}
        {state.marbles.map((marble) => {
          const isEaten = marble.collectedBy !== null;
          const colorMap = { gold: '#FFD700', blue: '#3B82F6', green: '#22C55E', red: '#EF4444' };
          
          return (
            <button
              key={marble.id}
              onClick={() => !isEaten && handleChomp(marble.id)}
              disabled={!canPlay || isEaten}
              style={{
                position: 'absolute',
                left: `${marble.x}%`, top: `${marble.y}%`,
                width: 30, height: 30,
                background: colorMap[marble.color],
                borderRadius: '50%', border: '3px solid #fff',
                boxShadow: '0 4px 8px rgba(0,0,0,0.4)',
                cursor: !canPlay || isEaten ? 'default' : 'pointer',
                opacity: isEaten ? 0 : 1,
                zIndex: 5
              }}
            />
          );
        })}
      </div>

      {/* Winner */}
      {isFinished && state.winner && (
        <div style={{ background: '#fbbf24', padding: '20px 40px', borderRadius: 20 }}>
          <h3>🏆 Winner: {state.players.find(p => p.symbol === state.winner)?.displayName}!</h3>
        </div>
      )}
    </div>
  );
}

export default HungryHippoBoard;
