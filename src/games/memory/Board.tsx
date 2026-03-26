import { useEffect, useState } from 'react';
import type { GameBoardProps } from '../types';
import type { MemoryState, MemoryMove } from './types';

interface MemoryBoardProps extends GameBoardProps<MemoryState> {}

export function MemoryBoard({ state, mySymbol, onMove, disabled }: MemoryBoardProps) {
  const isMyTurn = state.players[state.currentPlayerIndex]?.symbol === mySymbol;
  const isFinished = state.status === 'finished';
  const canPlay = !disabled && !isFinished && (state.players.length === 1 || isMyTurn);
  
  const [flippingBack, setFlippingBack] = useState(false);
  
  // Handle flipping back non-matching cards
  useEffect(() => {
    if (state.flippedIndices.length === 2 && !flippingBack) {
      const [idx1, idx2] = state.flippedIndices;
      const card1 = state.cards[idx1];
      const card2 = state.cards[idx2];
      
      if (card1.emoji !== card2.emoji) {
        setFlippingBack(true);
        const timer = setTimeout(() => {
          setFlippingBack(false);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [state.flippedIndices, state.cards, flippingBack]);

  const makeMove = (index: number) => {
    if (!canPlay || flippingBack) return;
    if (state.cards[index].isFlipped || state.cards[index].isMatched) return;
    if (state.flippedIndices.length >= 2) return;
    
    const move: MemoryMove = { index };
    onMove(move);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {/* Title */}
      <div style={{
        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        padding: '12px 24px',
        borderRadius: 16,
        textAlign: 'center',
        boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)'
      }}>
        <h2 style={{ margin: 0, color: '#fff', fontSize: 24, fontWeight: 800 }}>
          🧠 Memory Match
        </h2>
      </div>

      {/* Stats */}
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
          background: '#8b5cf6',
          color: '#fff',
          padding: '8px 16px',
          borderRadius: 12,
          fontWeight: 700,
          fontSize: 16
        }}>
          🎯 Pairs: {state.matchedPairs}/{state.totalPairs}
        </span>
        <span style={{
          background: '#06b6d4',
          color: '#fff',
          padding: '8px 16px',
          borderRadius: 12,
          fontWeight: 700,
          fontSize: 16
        }}>
          🔄 Attempts: {state.attempts}
        </span>
        {state.players.length > 1 && (
          <span style={{
            background: isMyTurn ? '#22c55e' : '#9ca3af',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 16
          }}>
            {isMyTurn ? '👆 Your Turn!' : '⏳ Waiting...'}
          </span>
        )}
      </div>

      {/* Card Grid */}
      <div style={{
        background: '#1e1b4b',
        padding: '20px',
        borderRadius: 16,
        boxShadow: '0 10px 40px rgba(30, 27, 75, 0.5)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12
        }}>
          {state.cards.map((card, index) => {
            const isFlipped = card.isFlipped || card.isMatched || (flippingBack && state.flippedIndices.includes(index));
            
            return (
              <button
                key={card.id}
                onClick={() => makeMove(index)}
                disabled={!canPlay || card.isMatched || isFlipped || flippingBack}
                style={{
                  width: 72,
                  height: 96,
                  background: isFlipped
                    ? card.isMatched
                      ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                      : 'linear-gradient(135deg, #fff 0%, #f3f4f6 100%)'
                    : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  border: card.isMatched
                    ? '3px solid #22c55e'
                    : isFlipped
                      ? '3px solid #8b5cf6'
                      : '3px solid #4338ca',
                  borderRadius: 12,
                  cursor: !canPlay || card.isMatched || isFlipped || flippingBack ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 40,
                  boxShadow: isFlipped
                    ? card.isMatched
                      ? '0 0 20px rgba(34, 197, 94, 0.6), inset 0 2px 4px rgba(0,0,0,0.1)'
                      : '0 4px 12px rgba(139, 92, 246, 0.4), inset 0 2px 4px rgba(0,0,0,0.1)'
                    : '0 6px 20px rgba(0,0,0,0.3), inset 0 -2px 4px rgba(0,0,0,0.2)',
                  transform: isFlipped ? 'rotateY(0deg)' : 'rotateY(180deg)',
                  transition: 'all 0.3s ease',
                  opacity: card.isMatched ? 0.8 : 1
                }}
              >
                {isFlipped ? card.emoji : '?'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Instructions */}
      <div style={{
        background: 'rgba(255,255,255,0.9)',
        padding: '12px 24px',
        borderRadius: 12,
        textAlign: 'center',
        maxWidth: 350
      }}>
        <p style={{ margin: 0, color: '#4b5563', fontSize: 14, fontWeight: 500 }}>
          {isFinished
            ? '🎉 Great job! You found all the pairs!'
            : 'Flip two cards to find matching pairs!'}
        </p>
      </div>

      {/* Winner Message */}
      {isFinished && state.winner && (
        <div style={{
          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
          padding: '24px 48px',
          borderRadius: 20,
          textAlign: 'center',
          boxShadow: '0 10px 40px rgba(251, 191, 36, 0.5)',
          animation: 'pulse 1s infinite'
        }}>
          <h2 style={{ margin: 0, color: '#fff', fontSize: 28, fontWeight: 800 }}>
            🏆 You Won! 🏆
          </h2>
          <p style={{ margin: '8px 0 0 0', color: '#fff', fontSize: 18 }}>
            Completed in {state.attempts} attempts!
          </p>
        </div>
      )}
    </div>
  );
}

export default MemoryBoard;
