import { useMemo, useState } from 'react';
import type { GameBoardProps } from '../types';
import type { BattleshipState, Orientation, PlayerBoard, ShipType } from './types';
import { GRID_SIZE, SHIPS } from './types';

const ROWS = 'ABCDEFGHIJ'.split('');
const COLS = Array.from({ length: GRID_SIZE }, (_, i) => String(i + 1));

const SHIP_EMOJI: Record<ShipType, string> = {
  carrier: '🛳️',
  battleship: '🚢',
  cruiser: '⛴️',
  submarine: '🛥️',
  destroyer: '🚤',
};

function blankBoard(): PlayerBoard {
  const grid = Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, () => false));
  return {
    ships: [],
    shipCells: grid.map((r) => [...r]),
    hits: grid.map((r) => [...r]),
    misses: grid.map((r) => [...r]),
    placed: [],
  };
}

export function BattleshipBoard({ state, mySymbol, onMove, disabled }: GameBoardProps<BattleshipState>) {
  const [selectedShip, setSelectedShip] = useState<ShipType | null>(null);
  const [orientation, setOrientation] = useState<Orientation>('horizontal');

  const me = state.players.find((p) => p.symbol === mySymbol);
  const opponent = state.players.find((p) => p.symbol !== mySymbol);

  const myBoard = state.boards[mySymbol] || blankBoard();
  const targetBoard = opponent ? state.boards[opponent.symbol] || blankBoard() : blankBoard();

  const canPlace = state.phase === 'setup' && !disabled;
  const canAttack = state.phase === 'battle' && !disabled && state.currentAttacker === mySymbol;
  const isMyTurn = state.currentAttacker === mySymbol;

  const status = useMemo(() => {
    if (state.phase === 'setup') return `Place ships (${myBoard.placed.length}/${SHIPS.length})`;
    if (state.phase === 'battle') return isMyTurn ? 'Your turn to attack' : "Opponent's turn";
    return state.winner === mySymbol ? 'You win! 🎉' : 'You lost this round';
  }, [state.phase, state.winner, myBoard.placed.length, isMyTurn, mySymbol]);

  const doPlace = (row: number, col: number) => {
    if (!canPlace || !selectedShip) return;
    onMove({ action: 'place_ship', row, col, shipType: selectedShip, orientation });
  };

  const doAttack = (row: number, col: number) => {
    if (!canAttack) return;
    onMove({ action: 'attack', row, col });
  };

  const renderGrid = (board: PlayerBoard, mode: 'ship' | 'target') => (
    <div>
      <div style={{ display: 'flex', marginBottom: 4 }}>
        <div style={{ width: 24 }} />
        {COLS.map((n) => (
          <div key={n} style={{ width: 26, textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>{n}</div>
        ))}
      </div>

      {Array.from({ length: GRID_SIZE }, (_, row) => (
        <div key={row} style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
          <div style={{ width: 24, textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>{ROWS[row]}</div>
          {Array.from({ length: GRID_SIZE }, (_, col) => {
            const hit = board.hits[row][col];
            const miss = board.misses[row][col];
            const ship = board.shipCells[row][col];

            const bg = hit ? '#ef4444' : miss ? '#ffffff' : mode === 'ship' && ship ? '#9ca3af' : '#1e40af';

            const canClick = mode === 'ship'
              ? canPlace && !!selectedShip && !ship
              : canAttack && !hit && !miss;

            return (
              <button
                key={`${mode}-${row}-${col}`}
                onClick={() => (mode === 'ship' ? doPlace(row, col) : doAttack(row, col))}
                disabled={!canClick}
                title={`${ROWS[row]}${col + 1}`}
                style={{
                  width: 24,
                  height: 24,
                  margin: 1,
                  borderRadius: 4,
                  border: canClick ? '2px solid #fbbf24' : '1px solid rgba(255,255,255,0.4)',
                  background: bg,
                  cursor: canClick ? 'pointer' : 'default',
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ width: '100%', maxWidth: 1120, padding: 20 }}>
      <div style={{ background: 'rgba(255,255,255,0.94)', borderRadius: 14, padding: '12px 16px', marginBottom: 12 }}>
        <div style={{ fontWeight: 800, color: '#1f2937' }}>🚢 Battleship</div>
        <div style={{ color: '#334155', fontWeight: 600, fontSize: 14 }}>{status}</div>
        {state.lastAttack && (
          <div style={{ color: '#475569', marginTop: 4, fontSize: 12 }}>
            Last attack: {ROWS[state.lastAttack.row]}{state.lastAttack.col + 1} — {
              state.lastAttack.result === 'sunk' && state.lastAttack.sunkShip
                ? `Ship sunk (${state.lastAttack.sunkShip})`
                : state.lastAttack.result === 'hit'
                  ? 'Hit'
                  : 'Miss'
            }
          </div>
        )}
      </div>

      {state.phase === 'setup' && (
        <div style={{ background: 'rgba(15,23,42,0.86)', borderRadius: 14, padding: 12, marginBottom: 12 }}>
          <div style={{ color: '#fff', fontWeight: 700, marginBottom: 8 }}>Ship placement</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            {SHIPS.map((s) => {
              const placed = myBoard.placed.includes(s.type);
              const selected = selectedShip === s.type;
              return (
                <button
                  key={s.type}
                  disabled={placed}
                  onClick={() => setSelectedShip(s.type)}
                  style={{
                    border: 'none',
                    borderRadius: 10,
                    padding: '8px 12px',
                    fontWeight: 700,
                    background: placed ? '#22c55e' : selected ? '#f59e0b' : '#334155',
                    color: placed || selected ? '#0f172a' : '#fff',
                    cursor: placed ? 'default' : 'pointer',
                  }}
                >
                  {SHIP_EMOJI[s.type]} {s.label} ({s.length}) {placed ? '✓' : ''}
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
              }}
            >
              ↕ Vertical
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
        <div style={{ background: 'rgba(15,23,42,0.9)', borderRadius: 14, padding: 10 }}>
          <div style={{ color: '#fff', fontWeight: 700, marginBottom: 8 }}>🛡️ Ship Board ({me?.displayName || 'You'})</div>
          {renderGrid(myBoard, 'ship')}
          <div style={{ color: '#cbd5e1', fontSize: 12, marginTop: 6 }}>Gray ships, Red hits, White misses</div>
        </div>

        <div style={{ background: 'rgba(30,27,75,0.9)', borderRadius: 14, padding: 10 }}>
          <div style={{ color: '#fff', fontWeight: 700, marginBottom: 8 }}>🎯 Target Board ({opponent?.displayName || 'Opponent'})</div>
          {renderGrid(targetBoard, 'target')}
          <div style={{ color: '#cbd5e1', fontSize: 12, marginTop: 6 }}>Red hits, White misses</div>
        </div>
      </div>
    </div>
  );
}

export default BattleshipBoard;
