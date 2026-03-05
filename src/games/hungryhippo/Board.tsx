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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 16 }}>
      {/* Title */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        padding: '12px 24px', 
        borderRadius: 16,
        textAlign: 'center'
      }}>
        <h2 style={{ margin: 0, color: '#fff', fontSize: 24, fontWeight: 800 }}>
          🦛 Hungry Hippo
        </h2>
      </div>

      {/* Score Board */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        {state.hippos.map((hippo, idx) => (
          <div key={hippo.symbol} style={{
            background: hippo.color,
            padding: '8px 16px',
            borderRadius: 20,
            color: '#fff',
            fontWeight: 700
          }}>
            <span>{state.players[idx]?.displayName ?? `Player ${idx + 1}`}: {hippo.marblesEaten}</span>
          </div>
        ))}
      </div>

      {/* Game Board */}
      <div style={{
        width: 'min(400px, 90vw)',
        aspectRatio: '1 / 1',
        background: 'radial-gradient(circle, #8B4513 0%, #654321 100%)',
        borderRadius: '50%',
        position: 'relative',
        border: '8px solid #4A3728'
      }}>
        {/* Hippos */}
        {state.hippos.map((hippo) => {
          const top = hippo.position.includes('top') ? '5%' : '85%';
          const left = hippo.position.includes('left') ? '5%' : '85%';
          return (
            <div key={hippo.symbol} style={{
              position: 'absolute', top, left,
              width: 60, height: 60,
              background: hippo.color,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 30
            }}>
              🦛
            </div>
          );
        })}

        {/* Marbles */}
        {state.marbles.map((marble) => {
          const isEaten = marble.collectedBy !== null;
          return (
            <button
              key={marble.id}
              onClick={() => !isEaten && handleChomp(marble.id)}
              disabled={!canPlay || isEaten}
              style={{
                position: 'absolute',
                left: `${marble.x}%`,
                top: `${marble.y}%`,
                width: isEaten ? 0 : 28,
                height: isEaten ? 0 : 28,
                background: marble.color === 'gold' ? '#FFD700' : 
                            marble.color === 'blue' ? '#3B82F6' :
                            marble.color === 'green' ? '#22C55E' : '#EF4444',
                borderRadius: '50%',
                border: '2px solid #fff',
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
        <div style={{
          background: '#fbbf24',
          padding: '20px 40px',
          borderRadius: 20,
          textAlign: 'center'
        }}>
          <h3>🏆 Winner! 🏆</h3>
          <p>{state.players.find(p => p.symbol === state.winner)?.displayName}</p>
        </div>
      )}
    </div>
  );
}

export default HungryHippoBoard;
