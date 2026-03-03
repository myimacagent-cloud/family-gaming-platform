import { useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import type { PieceSymbol, Square, Color } from 'chess.js';
import type { GameBoardProps } from '../types';
import type { ChessState, ChessMove } from './logic';

interface ChessBoardProps extends GameBoardProps<ChessState> {}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

const PIECE_ICONS: Record<PieceSymbol, string> = {
  k: '👑',
  q: '✨',
  r: '🏰',
  b: '🧙',
  n: '🐴',
  p: '🛡️',
};

function colorFromPlayerSymbol(state: ChessState, mySymbol: string): 'w' | 'b' | null {
  const index = state.players.findIndex((p) => p.symbol === mySymbol);
  if (index === 0) return 'w';
  if (index === 1) return 'b';
  return null;
}

export function ChessBoard({
  state,
  mySymbol,
  onMove,
  disabled,
}: ChessBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);

  const chess = useMemo(() => new Chess(state.fen), [state.fen]);
  const board = chess.board();

  const myColor = colorFromPlayerSymbol(state, mySymbol);
  const isMyTurn = myColor !== null && chess.turn() === myColor;
  const isFinished = state.status === 'finished';

  const handleSquareClick = (
    square: Square,
    piece: { type: PieceSymbol; color: Color } | null,
  ) => {
    if (disabled || isFinished || !isMyTurn || !myColor) {
      return;
    }

    if (!selectedSquare) {
      if (piece && piece.color === myColor) {
        setSelectedSquare(square);
      }
      return;
    }

    if (selectedSquare === square) {
      setSelectedSquare(null);
      return;
    }

    if (piece && piece.color === myColor) {
      setSelectedSquare(square);
      return;
    }

    const fromPiece = chess.get(selectedSquare);
    const targetRank = square[1];
    const isPromotion = fromPiece?.type === 'p' && ((fromPiece.color === 'w' && targetRank === '8') || (fromPiece.color === 'b' && targetRank === '1'));

    const move: ChessMove = {
      from: selectedSquare,
      to: square,
      ...(isPromotion ? { promotion: 'q' } : {}),
    };

    onMove(move);
    setSelectedSquare(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
      <div
        style={{
          background: 'rgba(255,255,255,0.92)',
          borderRadius: 12,
          padding: '8px 12px',
          fontWeight: 700,
          color: '#334155',
          textAlign: 'center',
        }}
      >
        {isFinished ? '🏁 Game over!' : isMyTurn ? '🌟 Your turn! Pick a piece, then tap where it should go.' : '⏳ Opponent\'s turn'}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 'min(430px, calc(100vw - 40px))' }}>
        {(['k', 'q', 'r', 'b', 'n', 'p'] as PieceSymbol[]).map((t) => (
          <span key={t} style={{ background: 'rgba(255,255,255,0.9)', borderRadius: 999, padding: '4px 8px', fontSize: 18, fontWeight: 700, color: '#334155' }}>
            {PIECE_ICONS[t]}
          </span>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, minmax(0, 1fr))',
          gap: '2px',
          width: 'min(430px, calc(100vw - 40px))',
          aspectRatio: '1 / 1',
          background: '#0f172a',
          padding: '6px',
          borderRadius: '12px',
          boxSizing: 'border-box',
          margin: '0 auto',
          boxShadow: '0 10px 24px rgba(0,0,0,0.22)',
        }}
      >
        {board.map((row, rowIndex) =>
          row.map((piece, colIndex) => {
            const rank = 8 - rowIndex;
            const file = FILES[colIndex];
            const square = `${file}${rank}` as Square;
            const isLight = (rowIndex + colIndex) % 2 === 0;
            const isSelected = selectedSquare === square;

            return (
              <button
                key={square}
                onClick={() => handleSquareClick(square, piece)}
                disabled={disabled || isFinished || !isMyTurn}
                style={{
                  border: isSelected ? '3px solid #22d3ee' : 'none',
                  borderRadius: '6px',
                  background: isLight ? '#fde68a' : '#86efac',
                  color: '#111827',
                  fontSize: 'clamp(24px, 6vw, 44px)',
                  cursor: disabled || isFinished || !isMyTurn ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  userSelect: 'none',
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '1 / 1',
                  minWidth: 0,
                  minHeight: 0,
                  padding: 0,
                  boxSizing: 'border-box',
                }}
              >
                {piece ? (
                  <span
                    style={{
                      width: '76%',
                      height: '76%',
                      borderRadius: '999px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      fontWeight: 900,
                      fontSize: 'clamp(14px, 3.2vw, 22px)',
                      background: piece.color === 'w' ? '#ffffff' : '#0f172a',
                      color: piece.color === 'w' ? '#0f172a' : '#f8fafc',
                      border: piece.color === 'w' ? '2px solid #334155' : '2px solid #e2e8f0',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                      lineHeight: 1,
                      position: 'relative',
                    }}
                  >
                    <span style={{ fontSize: 'clamp(18px, 4.2vw, 28px)' }}>{PIECE_ICONS[piece.type]}</span>
                  </span>
                ) : ''}
                {(rank === 1 || file === 'a') && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '2px',
                      right: '4px',
                      fontSize: '10px',
                      color: 'rgba(15,23,42,0.65)',
                      fontWeight: 700,
                    }}
                  >
                    {file}{rank}
                  </span>
                )}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}

export default ChessBoard;
