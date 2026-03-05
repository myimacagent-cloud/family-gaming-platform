import type { GameBoardProps } from '../types';
import type { BattleshipState, BattleshipMove } from './types';

interface BattleshipBoardProps extends GameBoardProps<BattleshipState> {}

export function BattleshipBoard({ state, mySymbol, onMove, disabled }: BattleshipBoardProps) {
  const isFinished = state.status === 'finished';
  const opponent = state.players.find(p => p.symbol !== mySymbol);
  const myGrid = state.grids[mySymbol];
  const opponentGrid = opponent ? state.grids[opponent.symbol] : null;
  
  const canAttack = state.phase === 'battle' && !disabled && state.currentAttacker === mySymbol;

  const handleAttack = (row: number, col: number) => {
    if (!canAttack) return;
    const move: BattleshipMove = { action: 'attack', row, col };
    onMove(move);
  };

  const getCellStyle = (cell: string, isMyGrid: boolean) => {
    const base = { width: 28, height: 28, border: '1px solid #64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 };
    
    if (cell === 'empty') return { ...base, background: '#1e3a8a' };
    if (cell === 'ship') return { ...base, background: isMyGrid ? '#6366f1' : '#1e3a8a' };
    if (cell === 'hit') return { ...base, background: '#ef4444', color: '#fff' };
    if (cell === 'miss') return { ...base, background: '#94a3b8' };
    return base;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 12 }}>
      <h2 style={{ margin: 0, color: '#fff', fontSize: 20 }}>🚢 Battleship</h2>
      
      <div style={{ background: '#1e40af', padding: '8px 16px', borderRadius: 8, color: '#fff' }}>
        {state.phase === 'setup' ? '📍 Place Your Ships' : 
         state.phase === 'battle' ? (canAttack ? '💥 Your Turn!' : '⏳ Waiting...') : 
         '🏁 Game Over'}
      </div>

      <div>
        <p style={{ margin: '0 0 4px 0', color: '#fff', fontWeight: 600 }}>Your Fleet</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 2 }}>
          {myGrid?.cells.map((row, r) => 
            row.map((cell, c) => (
              <div key={`my-${r}-${c}`} style={getCellStyle(cell, true)}>
                {cell === 'hit' ? '💥' : cell === 'miss' ? '•' : cell === 'ship' ? '🚢' : ''}
              </div>
            ))
          )}
        </div>
      </div>

      {state.phase === 'battle' && (
        <div>
          <p style={{ margin: '0 0 4px 0', color: '#fff', fontWeight: 600 }}>Enemy Waters</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 2 }}>
            {opponentGrid?.cells.map((row, r) => 
              row.map((cell, c) => (
                <button
                  key={`opp-${r}-${c}`}
                  onClick={() => handleAttack(r, c)}
                  disabled={!canAttack || cell === 'hit' || cell === 'miss'}
                  style={{
                    ...getCellStyle(cell === 'ship' ? 'empty' : cell, false),
                    cursor: canAttack && cell !== 'hit' && cell !== 'miss' ? 'pointer' : 'default',
                    opacity: cell === 'hit' || cell === 'miss' ? 0.6 : 1
                  }}
                >
                  {cell === 'hit' ? '💥' : cell === 'miss' ? '•' : ''}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {state.phase === 'setup' && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {['carrier', 'battleship', 'cruiser', 'submarine', 'destroyer'].map((ship) => {
            const placed = myGrid?.ships.some(s => s.type === ship);
            return (
              <button
                key={ship}
                disabled={placed}
                style={{
                  background: placed ? '#22c55e' : '#3b82f6',
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: 'none',
                  opacity: placed ? 0.7 : 1
                }}
              >
                {ship} {placed ? '✓' : ''}
              </button>
            );
          })}
        </div>
      )}

      {isFinished && (
        <div style={{ background: '#fbbf24', padding: 16, borderRadius: 12, textAlign: 'center' }}>
          <h3>🏆 {state.winner === mySymbol ? 'You Won!' : 'You Lost!'}</h3>
        </div>
      )}
    </div>
  );
}

export default BattleshipBoard;
