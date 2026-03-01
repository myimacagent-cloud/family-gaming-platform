import { useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import type { PieceSymbol, Square, Color } from 'chess.js';
import type { GameBoardProps } from '../types';
import type { ChessState, ChessMove } from './logic';

interface ChessBoardProps extends GameBoardProps<ChessState> {}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

const PIECES: Record<'w' | 'b', Record<PieceSymbol, string>> = {
  w: {
    k: '♔',
    q: '♕',
    r: '♖',
    b: '♗',
    n: '♘',
    p: '♙',
  },
  b: {
    k: '♚',
    q: '♛',
    r: '♜',
    b: '♝',
    n: '♞',
    p: '♟',
  },
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
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(8, minmax(0, 1fr))',
        gap: '2px',
        width: 'min(430px, calc(100vw - 40px))',
        aspectRatio: '1 / 1',
        background: '#1f2937',
        padding: '6px',
        borderRadius: '12px',
        boxSizing: 'border-box',
        margin: '0 auto',
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
                border: isSelected ? '2px solid #37cef4' : 'none',
                borderRadius: '6px',
                background: isLight ? '#dfdfdf' : '#5c5b5c',
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
              {piece ? PIECES[piece.color][piece.type] : ''}
              {(rank === 1 || file === 'a') && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '4px',
                    fontSize: '10px',
                    color: 'rgba(17,24,39,0.55)',
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
  );
}

export default ChessBoard;
