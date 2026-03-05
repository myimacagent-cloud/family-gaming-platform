import type { GameBoardProps } from '../types';
import type { BattleshipState } from './types';
import { useState } from 'react';

const GRID_SIZE = 5;
const COLS = ['A', 'B', 'C', 'D', 'E'];
const ROWS = ['1', '2', '3', '4', '5'];

type ShipType = 'battleship' | 'cruiser' | 'submarine';

export function BattleshipBoard({ state, mySymbol, onMove, disabled }: GameBoardProps<BattleshipState>) {
  const isFinished = state.status === 'finished';
  const opponent = state.players.find(p => p.symbol !== mySymbol);
  const myGrid = state.grids[mySymbol];
  const opponentGrid = opponent ? state.grids[opponent.symbol] : null;
  const canAttack = state.phase === 'battle' && !disabled && state.currentAttacker === mySymbol;
  
  const [selectedShip, setSelectedShip] = useState<ShipType | null>(null);
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');

  const handleAttack = (row: number, col: number) => {
    if (!canAttack) return;
    onMove({ action: 'attack', row, col });
  };

  const handlePlaceShip = (row: number, col: number) => {
    if (!selectedShip || !myGrid) return;
    onMove({ action: 'place_ship', row, col, shipType: selectedShip, orientation });
  };

  const renderCell = (cell: string, r: number, c: number, isMyGrid: boolean) => {
    const isSetup = state.phase === 'setup';
    const canClick = isMyGrid 
      ? (isSetup && selectedShip && cell === 'empty')
      : (state.phase === 'battle' && canAttack && cell !== 'hit');
    
    let bgColor = '#1e40af';
    let emoji = '';
    
    if (cell === 'ship' && isMyGrid) {
      bgColor = '#7c3aed';
      emoji = '🚢';
    } else if (cell === 'hit') {
      bgColor = '#ef4444';
      emoji = '💥';
    } else if (cell === 'miss') {
      bgColor = '#64748b';
      emoji = '•';
    }
    
    return (
      <button
        key={`cell-${r}-${c}`}
        onClick={() => {
          if (isMyGrid && isSetup && selectedShip && cell === 'empty') {
            handlePlaceShip(r, c);
          } else if (!isMyGrid && cell !== 'hit' && cell !== 'miss') {
            handleAttack(r, c);
          }
        }}
        disabled={!canClick}
        style={{
          width: 56, height: 56, margin: 2, backgroundColor: bgColor,
          border: canClick ? '4px solid #fbbf24' : '3px solid #475569',
          borderRadius: 6, fontSize: 28,
          cursor: canClick ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        {emoji}
      </button>
    );
  };

  const renderGrid = (isMyGrid: boolean) => {
    const grid = isMyGrid ? myGrid : opponentGrid;
    const cells = grid?.cells || Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill('empty'));
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 auto' }}>
        <div style={{ display: 'flex', marginBottom: 4 }}>
          <div style={{ width: 44 }}></div>
          {COLS.map(col => (
            <div key={col} style={{ width: 60, textAlign: 'center', fontWeight: 700, fontSize: 18, color: isMyGrid ? '#60a5fa' : '#f87171' }}>{col}</div>
          ))}
        </div>
        
        {cells.map((row, rIdx) => (
          <div key={rIdx} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: 44, textAlign: 'center', fontWeight: 700, fontSize: 18, color: isMyGrid ? '#60a5fa' : '#f87171' }}>{ROWS[rIdx]}</div>
            {row.map((cell, cIdx) => renderCell(cell, rIdx, cIdx, isMyGrid))}
          </div>
        ))}
      </div>
    );
  };

  const myShips = myGrid?.ships || [];
  const shipsToPlace: { type: ShipType; emoji: string; len: number }[] = [
    { type: 'battleship', emoji: '⛴️', len: 3 },
    { type: 'cruiser', emoji: '🛳️', len: 2 },
    { type: 'submarine', emoji: '🛥️', len: 2 },
  ];

  return (
    <div style={{ padding: 20, textAlign: 'center' }}>
      <h2 style={{ color: '#fff', fontSize: 32, marginBottom: 16 }}>🚢 Battleship</h2>
      
      <div style={{ 
        background: state.phase === 'setup' ? '#fef3c7' : canAttack ? '#dcfce7' : '#fecaca',
        padding: '16px', borderRadius: 12, marginBottom: 20, fontWeight: 700, fontSize: 18,
        border: '4px solid ' + (state.phase === 'setup' ? '#fbbf24' : canAttack ? '#22c55e' : '#ef4444')
      }}>
        {state.phase === 'setup' ? '📍 Place 3 ships on YOUR grid' :
         canAttack ? '💥 Attack enemy waters!' :
         '⏳ Waiting...'}
      </div>

      {state.phase === 'setup' && (
        <div style={{ background: '#1e1b4b', padding: 20, borderRadius: 16, marginBottom: 20 }}>
          <p style={{ color: '#fff', fontWeight: 700, marginBottom: 12 }}>Select ship, then click YOUR grid:</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 12 }}>
            {shipsToPlace.map(({ type, emoji, len }) => {
              const placed = myShips.some((s: any) => s.type === type);
              const selected = selectedShip === type;
              return (
                <button key={type} onClick={() => !placed && setSelectedShip(type)}
                  style={{
                    background: placed ? '#22c55e' : selected ? '#fbbf24' : '#3b82f6',
                    color: '#000', padding: '14px 24px', borderRadius: 12,
                    fontWeight: 700, fontSize: 14,
                    border: selected ? '3px solid #fff' : 'none'
                  }}>
                  {emoji} {type} ({len}) {placed ? '✓' : selected ? '←' : ''}
                </button>
              );
            })}
          </div>
          {selectedShip && (
            <div>
              <p style={{ color: '#fbbf24', fontWeight: 700 }}>Choose direction:</p>
              <button onClick={() => setOrientation('horizontal')}
                style={{ background: orientation === 'horizontal' ? '#22c55e' : '#64748b', color: '#fff', padding: '10px 20px', borderRadius: 8, marginRight: 8 }}>
                ↔ Horizontal
              </button>
              <button onClick={() => setOrientation('vertical')}
                style={{ background: orientation === 'vertical' ? '#22c55e' : '#64748b', color: '#fff', padding: '10px 20px', borderRadius: 8 }}>
                ↕ Vertical
              </button>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 20 }}>
        <div style={{ background: '#0f172a', padding: 24, borderRadius: 16 }}>
          <h3 style={{ color: '#60a5fa', marginBottom: 8 }}>🛡️ YOUR FLEET</h3>
          <p style={{ color: '#fff', fontSize: 16 }}>{myShips.length}/3 ships placed</p>
          {renderGrid(true)}
        </div>
        
        {state.phase === 'battle' && (
          <div style={{ background: '#1e1b4b', padding: 24, borderRadius: 16 }}>
            <h3 style={{ color: '#f87171', marginBottom: 8 }}>🎯 ENEMY WATERS</h3>
            <p style={{ color: '#fff', fontSize: 16 }}>Click blue cells to attack</p>
            {renderGrid(false)}
          </div>
        )}
      </div>

      {isFinished && (
        <div style={{ background: '#fbbf24', padding: 24, borderRadius: 16, marginTop: 20 }}>
          <h2 style={{ color: '#000', margin: 0 }}>{state.winner === mySymbol ? '🏆 You Win!' : '💥 You Lost'}</h2>
        </div>
      )}
    </div>
  );
}

export default BattleshipBoard;
