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

export function ChessBoard({
  state,
  mySymbol,
  onMove,
  disabled
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
      <div style={{ 
        background: 'rgba(255,255,255,0.95)', 
        border: '2px solid #111827', 
        borderRadius: 8, 
        padding: '10px 16px', 
        fontWeight: 800, 
        color: '#111827',
        textAlign: 'center',
        fontSize: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        {isFinished ? '🏁 Game Over!' : isMyTurn ? '🎯 Your Turn' : '⏳ Waiting for Opponent'}
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        background: '#111827',
        padding: '24px 24px 24px 32px',
        borderRadius: 12,
        boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
        position: 'relative',
      }}>
        <div style={{ display: 'flex', marginLeft: 24 }}>
          {FILES.map((f) => (
            <div key={`top-${f}`} style={{ 
              width: 'min(50px, calc((100vw - 100px) / 8))', 
              textAlign: 'center', 
              color: '#ffffff',
              fontWeight: 700,
              fontSize: 14,
              paddingBottom: 4
            }}>
              {f.toUpperCase()}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex' }}>
          <div style={{ display: 'flex', flexDirection: 'column', marginRight: 4 }}>
            {RANKS.map((r) => (
              <div key={`left-${r}`} style={{ 
                height: 'min(50px, calc((100vw - 100px) / 8))', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 14
              }}>
                {r}
              </div>
            ))}
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(8, 1fr)',
            border: '3px solid #374151',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3)'
          }}>
            {board.map((row, rowIndex) =>
              row.map((piece, colIndex) => {
                const rank = RANKS[rowIndex];
                const file = FILES[colIndex];
                const square = `${file}${rank}` as Square;
                const isLight = (rowIndex + colIndex) % 2 === 0;
                const isSelected = selectedSquare === square;

                const lightSquare = '#FFFFFF';
                const darkSquare = '#000000';
                const bgColor = isSelected ? '#22d3ee' : (isLight ? lightSquare : darkSquare);

                return (
                  <button
                    key={square}
                    onClick={() => handleSquareClick(square, piece)}
                    disabled={disabled || isFinished || !isMyTurn}
                    style={{
                      width: 'min(50px, calc((100vw - 100px) / 8))',
                      aspectRatio: '1 / 1',
                      background: bgColor,
                      border: isSelected ? '3px solid #0891b2' : 'none',
                      cursor: disabled || isFinished || !isMyTurn ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 'clamp(32px, 6.5vw, 44px)',
                      padding: 0,
                    }}
                  >
                    {piece ? (
                      <span style={{
                        filter: piece.color === 'b' 
                          ? 'drop-shadow(0.5px 0.5px 0.5px rgba(255,255,255,0.4))' 
                          : 'drop-shadow(0.5px 0.5px 0.5px rgba(0,0,0,0.4))',
                      }}>
                        {CHESS_PIECES[piece.color][piece.type]}
                      </span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 8 }}>
            {RANKS.map((r) => (
              <div key={`right-${r}`} style={{ 
                height: 'min(50px, calc((100vw - 100px) / 8))', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 14
              }}>
                {r}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', marginLeft: 24 }}>
          {FILES.map((f) => (
            <div key={`bottom-${f}`} style={{ 
              width: 'min(50px, calc((100vw - 100px) / 8))', 
              textAlign: 'center', 
              color: '#ffffff',
              fontWeight: 700,
              fontSize: 14,
              paddingTop: 4
            }}>
              {f.toUpperCase()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ChessBoard;
