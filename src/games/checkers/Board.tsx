import { useMemo, useState } from 'react';
import type { GameBoardProps } from '../types';
import type { CheckersMove, CheckersState } from './types';

function rowOf(i: number) {
  return Math.floor(i / 8);
}

function colOf(i: number) {
  return i % 8;
}

export function CheckersBoard({ state, mySymbol, onMove, disabled }: GameBoardProps<CheckersState>) {
  const [selected, setSelected] = useState<number | null>(null);

  const me = state.players.find((p) => p.symbol === mySymbol);
  const opp = state.players.find((p) => p.symbol !== mySymbol);
  const myTurn = state.players[state.currentPlayerIndex]?.symbol === mySymbol;
  const isFinished = state.status === 'finished' || state.status === 'draw';

  const myCount = useMemo(() => state.board.filter((p) => p?.owner === mySymbol).length, [state.board, mySymbol]);
  const oppCount = useMemo(() => state.board.filter((p) => p?.owner === opp?.symbol).length, [state.board, opp?.symbol]);

  const canPlay = !disabled && !isFinished && myTurn;

  const clickCell = (i: number) => {
    if (!canPlay) return;
    const piece = state.board[i];

    if (selected === null) {
      if (piece?.owner === mySymbol) setSelected(i);
      return;
    }

    if (selected === i) {
      setSelected(null);
      return;
    }

    if (piece?.owner === mySymbol) {
      setSelected(i);
      return;
    }

    const move: CheckersMove = { from: selected, to: i };
    onMove(move);
    setSelected(null);
  };

  const statusText = isFinished
    ? state.winner === mySymbol
      ? '🏆 You won!'
      : state.status === 'draw'
        ? '🤝 Draw'
        : 'You lost this round'
    : myTurn
      ? 'Your turn'
      : "Opponent's turn";

  return (
    <div style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: '10px 14px', fontWeight: 700 }}>
        🔴⚫ Checkers — {statusText}
      </div>

      <div style={{ display: 'flex', gap: 14, background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: '10px 14px', fontWeight: 700 }}>
        <span>🧑 {me?.displayName || 'You'}: {myCount}</span>
        <span>👤 {opp?.displayName || 'Opponent'}: {oppCount}</span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          width: 'min(520px, calc(100vw - 36px))',
          aspectRatio: '1 / 1',
          borderRadius: 14,
          overflow: 'hidden',
          border: '3px solid rgba(255,255,255,0.8)',
          background: '#334155',
        }}
      >
        {state.board.map((piece, i) => {
          const r = rowOf(i);
          const c = colOf(i);
          const dark = (r + c) % 2 === 1;
          const isSelected = selected === i;

          let pieceColor = '';
          if (piece?.owner === state.players[0]?.symbol) pieceColor = '#ef4444';
          if (piece?.owner === state.players[1]?.symbol) pieceColor = '#111827';

          return (
            <button
              key={i}
              onClick={() => clickCell(i)}
              style={{
                border: isSelected ? '3px solid #facc15' : '1px solid rgba(0,0,0,0.12)',
                background: dark ? '#b45309' : '#fde68a',
                cursor: canPlay ? 'pointer' : 'default',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {piece && (
                <div
                  style={{
                    width: '72%',
                    height: '72%',
                    borderRadius: '999px',
                    background: pieceColor,
                    boxShadow: 'inset 0 3px 0 rgba(255,255,255,0.25), 0 2px 4px rgba(0,0,0,0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: piece.owner === state.players[1]?.symbol ? '#fde68a' : '#fff',
                    fontSize: '18px',
                    fontWeight: 800,
                  }}
                >
                  {piece.king ? '♔' : ''}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.9)', borderRadius: 10, padding: '8px 12px', fontSize: 12, color: '#334155' }}>
        Tap your piece, then tap destination. Diagonal moves; jump over opponent to capture; reach back row to become king.
      </div>
    </div>
  );
}

export default CheckersBoard;
