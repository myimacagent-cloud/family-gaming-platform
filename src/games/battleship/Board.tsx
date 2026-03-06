import { useMemo, useState } from 'react';
import type { GameBoardProps } from '../types';
import type { BattleshipState, PlayerBoard, ShipType } from './types';
import { BATTLESHIP_GRID_SIZE, SHIP_DEFINITIONS } from './types';

const ROW_LABELS = 'ABCDEFGHIJ'.split('');
const COL_LABELS = Array.from({ length: BATTLESHIP_GRID_SIZE }, (_, i) => String(i + 1));

const SHIP_EMOJI: Record<ShipType, string> = {
  carrier: '🛳️',
  battleship: '🚢',
  cruiser: '⛴️',
  submarine: '🛥️',
  destroyer: '🚤',
};

export function BattleshipBoard({ state, mySymbol, onMove, disabled }: GameBoardProps<BattleshipState>) {
  if (!state) return null;

  const [selectedShip, setSelectedShip] = useState<ShipType | null>(null);
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');

  const me = state.players.find((p) => p.symbol === mySymbol);
  const opponent = state.players.find((p) => p.symbol !== mySymbol);

  const myBoard: PlayerBoard | undefined = state.boards?.[mySymbol];
  const opponentBoard: PlayerBoard | undefined = opponent ? state.boards?.[opponent.symbol] : undefined;

  const canPlace = state.phase === 'setup' && !disabled;
  const canAttack = state.phase === 'battle' && !disabled && state.currentAttacker === mySymbol;

  const setupPlacedCount = myBoard?.placedShips.length || 0;
  const isMyTurn = state.currentAttacker === mySymbol;

  const statusText = useMemo(() => {
    if (state.phase === 'setup') {
      return `Place your fleet (${setupPlacedCount}/${SHIP_DEFINITIONS.length})`;
    }
    if (state.phase === 'battle') {
      return isMyTurn ? 'Your turn — choose a target on enemy waters.' : "Opponent's turn.";
    }
    if (state.status === 'finished') {
      return state.winner === mySymbol ? 'You won! All enemy ships sunk.' : 'Defeat. Your fleet was sunk.';
    }
    return '';
  }, [state.phase, state.status, state.winner, mySymbol, isMyTurn, setupPlacedCount]);

  const handlePlace = (row: number, col: number) => {
    if (!canPlace || !selectedShip) return;
    onMove({ action: 'place_ship', row, col, shipType: selectedShip, orientation });
  };

  const handleAttack = (row: number, col: number) => {
    if (!canAttack) return;
    onMove({ action: 'attack', row, col });
  };

  const renderBoard = (board: PlayerBoard | undefined, mode: 'ship' | 'target') => {
    if (!board) {
      return <div style={{ color: '#fff', fontSize: 14 }}>Waiting for board...</div>;
    }

    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ width: 28 }} />
          {COL_LABELS.map((label) => (
            <div key={label} style={{ width: 28, textAlign: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }}>
              {label}
            </div>
          ))}
        </div>

        {Array.from({ length: BATTLESHIP_GRID_SIZE }, (_, row) => (
          <div key={row} style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
            <div style={{ width: 28, textAlign: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>{ROW_LABELS[row]}</div>
            {Array.from({ length: BATTLESHIP_GRID_SIZE }, (_, col) => {
              const isHit = board.hits[row][col];
              const isMiss = board.misses[row][col];
              const hasShip = board.shipCells[row][col];
              const isUnknownTarget = mode === 'target' && !isHit && !isMiss;

              const bg = isHit ? '#ef4444' : isMiss ? '#ffffff' : mode === 'ship' && hasShip ? '#9ca3af' : '#1e3a8a';
              const canClick = mode === 'ship'
                ? canPlace && !!selectedShip && !hasShip
                : canAttack && isUnknownTarget;

              return (
                <button
                  key={`${mode}-${row}-${col}`}
                  onClick={() => (mode === 'ship' ? handlePlace(row, col) : handleAttack(row, col))}
                  disabled={!canClick}
                  title={`${ROW_LABELS[row]}${col + 1}`}
                  style={{
                    width: 26,
                    height: 26,
                    margin: 1,
                    borderRadius: 4,
                    border: canClick ? '2px solid #fbbf24' : '1px solid rgba(255,255,255,0.45)',
                    background: bg,
                    cursor: canClick ? 'pointer' : 'default',
                    padding: 0,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ width: '100%', maxWidth: 1100, padding: 20 }}>
      <div style={{ background: 'rgba(255,255,255,0.92)', borderRadius: 16, padding: '14px 18px', marginBottom: 14 }}>
        <div style={{ fontWeight: 800, color: '#1f2937' }}>🚢 Battleship</div>
        <div style={{ color: '#334155', fontWeight: 600, fontSize: 14 }}>{statusText}</div>
        {state.lastAttack && (
          <div style={{ marginTop: 6, fontSize: 13, color: '#475569' }}>
            Last attack: {ROW_LABELS[state.lastAttack.row]}{state.lastAttack.col + 1} —
            {state.lastAttack.result === 'sunk' && state.lastAttack.sunkShipType
              ? ` Ship sunk (${state.lastAttack.sunkShipType})`
              : state.lastAttack.result === 'hit'
                ? ' Hit'
                : ' Miss'}
          </div>
        )}
      </div>

      {state.phase === 'setup' && (
        <div style={{ background: 'rgba(15, 23, 42, 0.85)', borderRadius: 14, padding: 14, marginBottom: 14 }}>
          <div style={{ color: '#fff', fontWeight: 700, marginBottom: 8 }}>Ship placement</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            {SHIP_DEFINITIONS.map((ship) => {
              const isPlaced = !!myBoard?.placedShips.includes(ship.type);
              const isSelected = selectedShip === ship.type;
              return (
                <button
                  key={ship.type}
                  disabled={isPlaced}
                  onClick={() => setSelectedShip(ship.type)}
                  style={{
                    border: 'none',
                    borderRadius: 10,
                    padding: '8px 12px',
                    fontWeight: 700,
                    fontSize: 13,
                    background: isPlaced ? '#22c55e' : isSelected ? '#fbbf24' : '#334155',
                    color: isPlaced || isSelected ? '#0f172a' : '#fff',
                    cursor: isPlaced ? 'default' : 'pointer',
                  }}
                >
                  {SHIP_EMOJI[ship.type]} {ship.label} ({ship.length}) {isPlaced ? '✓' : ''}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setOrientation('horizontal')}
              style={{
                border: 'none',
                borderRadius: 8,
                padding: '6px 10px',
                fontWeight: 700,
                background: orientation === 'horizontal' ? '#f59e0b' : '#475569',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              ↔ Horizontal
            </button>
            <button
              onClick={() => setOrientation('vertical')}
              style={{
                border: 'none',
                borderRadius: 8,
                padding: '6px 10px',
                fontWeight: 700,
                background: orientation === 'vertical' ? '#f59e0b' : '#475569',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              ↕ Vertical
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
        <div style={{ background: 'rgba(15, 23, 42, 0.9)', borderRadius: 14, padding: 12 }}>
          <div style={{ color: '#e2e8f0', fontWeight: 700, marginBottom: 8 }}>🛡️ Ship Board ({me?.displayName || 'You'})</div>
          {renderBoard(myBoard, 'ship')}
          <div style={{ marginTop: 8, fontSize: 12, color: '#cbd5e1' }}>Gray = ships, Red = hit, White = miss</div>
        </div>

        <div style={{ background: 'rgba(30, 27, 75, 0.9)', borderRadius: 14, padding: 12 }}>
          <div style={{ color: '#e2e8f0', fontWeight: 700, marginBottom: 8 }}>
            🎯 Target Board ({opponent?.displayName || 'Opponent'})
          </div>
          {renderBoard(opponentBoard, 'target')}
          <div style={{ marginTop: 8, fontSize: 12, color: '#cbd5e1' }}>Red = hit, White = miss</div>
        </div>
      </div>
    </div>
  );
}

export default BattleshipBoard;
