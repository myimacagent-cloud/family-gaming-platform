import { useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import type { PieceSymbol, Square, Color } from 'chess.js';
import type { GameBoardProps } from '../types';
import type { ChessState, ChessMove } from './logic';

interface ChessBoardProps extends GameBoardProps<ChessState> {}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'] as const;

const CHESS_PIECES: Record<Color, Record<PieceSymbol, string>> = {
  w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
};

function colorFromPlayerSymbol(state: ChessState, mySymbol: string): 'w' | 'b' | null {
  const index = state.players.findIndex((p) => p.symbol === mySymbol);
  if (index === 0) return 'w';
  if (index === 1) return 'b';
  return null;
}

export function ChessBoard({ state, mySymbol, onMove, disabled }: ChessBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const chess = useMemo(() => new Chess(state.fen), [state.fen]);
  const board = chess.board();
  const myColor = colorFromPlayerSymbol(state, mySymbol);
  const isMyTurn = myColor !== null && chess.turn() === myColor;
  const isFinished = state.status === 'finished';
  
  const p1 = state.players[0];
  const p2 = state.players[1];

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
    const isPromotion =
      fromPiece?.type === 'p' &&
      ((fromPiece.color === 'w' && targetRank === '8') ||
        (fromPiece.color === 'b' && targetRank === '1'));
    const move: ChessMove = {
      from: selectedSquare,
      to: square,
      ...(isPromotion ? { promotion: 'q' } : {}),
    };
    onMove(move);
    setSelectedSquare(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
      {/* Player Identity */}
      <div style={{ 
        display: 'flex', 
        gap: 12, 
        flexWrap: 'wrap', 
        justifyContent: 'center',
        background: 'rgba(255,255,255,0.95)',
        padding: '8px 16px',
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <span style={{
          background: '#111827',
          color: '#ffffff',
          padding: '6px 12px',
          borderRadius: 8,
          fontWeight: 700,
          fontSize: 14
        }}>
          ⚫ {p1?.displayName ?? 'Player 1'} (Black)
        </span>
        <span style={{
          background: '#ffffff',
          color: '#111827',
          border: '2px solid #111827',
          padding: '6px 12px',
          borderRadius: 8,
          fontWeight: 700,
          fontSize: 14
        }}>
          ⚪ {p2?.displayName ?? 'Player 2'} (White)
        </span>
      </div>

      {/* Turn indicator */}
      <div style={{ 
        background: isMyTurn ? '#dcfce7' : '#f3f4f6', 
        border: isMyTurn ? '2px solid #22c55e' : '2px solid #9ca3af',
        borderRadius: 8, 
        padding: '10px 16px', 
        fontWeight: 800, 
        color: isMyTurn ? '#166534' : '#374151',
        textAlign: 'center',
        fontSize: '16px'
      }}>
        {isFinished ? '🏁 Game Over!' : isMyTurn ? '🎯 Your Turn!' : '⏳ Waiting for Opponent'}
      </div>

      {/* Chess Board */}
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        background: '#1f2937', 
        padding: '20px', 
        borderRadius: 12, 
        boxShadow: '0 12px 32px rgba(0,0,0,0.4)' 
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(8, 1fr)',
          border: '2px solid #4b5563'
        }}>
          {board.map((row, rowIndex) =>
            row.map((piece, colIndex) => {
              const rank = RANKS[rowIndex];
              const file = FILES[colIndex];
              const square = `${file}${rank}` as Square;
              const isLight = (rowIndex + colIndex) % 2 === 0;
              const isSelected = selectedSquare === square;

              const lightSquare = '#e5e7eb';
              const darkSquare = '#000000';
              const bgColor = isSelected ? '#22d3ee' : (isLight ? lightSquare : darkSquare);

              return (
                <button
                  key={square}
                  onClick={() => handleSquareClick(square, piece)}
                  disabled={disabled || isFinished || !isMyTurn}
                  style={{
                    width: 'min(48px, calc((100vw - 80px) / 8))',
                    aspectRatio: '1 / 1',
                    background: bgColor,
                    border: isSelected ? '3px solid #0891b2' : '1px solid #4b5563',
                    cursor: disabled || isFinished || !isMyTurn ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    fontSize: 'clamp(24px, 5.5vw, 36px)'
                  }}
                >
                  {piece ? (
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '75%',
                      height: '75%',
                      borderRadius: '50%',
                      background: piece.color === 'w' ? '#ffffff' : '#111827',
                      color: piece.color === 'w' ? '#111827' : '#ffffff',
                      border: piece.color === 'w' ? '2px solid #111827' : '2px solid #6b7280',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      fontSize: 'clamp(18px, 4vw, 28px)',
                      fontWeight: 700
                    }}>
                      {CHESS_PIECES[piece.color][piece.type]}
                    </span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default ChessBoard;
