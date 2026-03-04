import { useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import type { PieceSymbol, Square, Color } from 'chess.js';
import type { GameBoardProps } from '../types';
import type { ChessState, ChessMove } from './logic';

interface ChessBoardProps extends GameBoardProps<ChessState> {}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
const PIECE_ICONS: Record<PieceSymbol, string> = {
  k: '♔',
  q: '♛',
  r: '♜',
  b: '♝',
  n: '♞',
  p: '♟',
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
  const me = state.players.find((p) => p.symbol === mySymbol);
  const opponent = state.players.find((p) => p.symbol !== mySymbol);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
      {/* Player Identity - P1 and P2 clearly different */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 4 }}>
        <span style={{
          color: '#000000',
          background: '#ffffff',
          border: '3px solid #22d3ee',
          borderRadius: 999,
          padding: '6px 12px',
          fontWeight: 800,
          fontSize: '16px'
        }}>
          ⚪ P1 (White): {p1?.displayName ?? 'Player 1'}
        </span>
        <span style={{
          color: '#ffffff',
          background: '#000000',
          border: '3px solid #f472b6',
          borderRadius: 999,
          padding: '6px 12px',
          fontWeight: 800,
          fontSize: '16px'
        }}>
          ⚫ P2 (Black): {p2?.displayName ?? 'Player 2'}
        </span>
      </div>

      {/* You/Opponent labels */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {me && (
          <span style={{
            color: myColor === 'w' ? '#0891b2' : '#db2777',
            background: '#f3f4f6',
            borderRadius: 999,
            padding: '4px 10px',
            fontWeight: 700,
            fontSize: '14px'
          }}>
            👤 You: {me.displayName} ({myColor === 'w' ? 'White' : 'Black'})
          </span>
        )}
        {opponent && (
          <span style={{
            color: '#6b7280',
            background: '#f3f4f6',
            borderRadius: 999,
            padding: '4px 10px',
            fontWeight: 700,
            fontSize: '14px'
          }}>
            👤 Opponent: {opponent.displayName}
          </span>
        )}
      </div>

      {/* Turn indicator */}
      <div style={{
        background: 'rgba(255,255,255,0.92)',
        borderRadius: 12,
        padding: '8px 12px',
        fontWeight: 700,
        color: '#334155',
        textAlign: 'center',
      }}>
        {isFinished ? '🏁 Game over!' : isMyTurn ? '🌟 Your turn!' : '⏳ Opponent\'s turn'}
      </div>

      {/* Chess Board - Pure Black and White */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(8, minmax(0, 1fr))',
        gap: '1px',
        width: 'min(430px, calc(100vw - 40px))',
        aspectRatio: '1 / 1',
        background: '#000000',
        padding: '4px',
        borderRadius: '8px',
        boxSizing: 'border-box',
        margin: '0 auto',
        boxShadow: '0 10px 24px rgba(0,0,0,0.22)',
      }}>
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
                  border: isSelected ? '3px solid #22d3ee' : '1px solid #333333',
                  borderRadius: '4px',
                  background: isLight ? '#ffffff' : '#000000',
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
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '85%',
                    height: '85%',
                    borderRadius: '50%',
                    background: piece.color === 'w' ? '#ffffff' : '#111827',
                    border: piece.color === 'w' ? '3px solid #22d3ee' : '3px solid #f472b6',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                  }}>
                    <span style={{
                      fontSize: 'clamp(22px, 5.5vw, 40px)',
                      color: piece.color === 'w' ? '#000000' : '#ffffff',
                      fontWeight: 700,
                    }}>
                      {PIECE_ICONS[piece.type]}
                    </span>
                  </span>
                ) : ''}
                {(rank === 1 || file === 'a') && (
                  <span style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '4px',
                    fontSize: '10px',
                    color: isLight ? '#000000' : '#ffffff',
                    fontWeight: 700,
                  }}>
                    {file}{rank}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ChessBoard;
