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
      {/* Player Identity */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 4 }}>
        <span style={{ color: '#111827', background: '#ffffff', border: '2px solid #111827', borderRadius: 999, padding: '4px 10px', fontWeight: 700 }}>
          ⚪ {p1?.displayName ?? 'P1'}
        </span>
        <span style={{ color: '#ffffff', background: '#111827', border: '2px solid #111827', borderRadius: 999, padding: '4px 10px', fontWeight: 700 }}>
          ⚫ {p2?.displayName ?? 'P2'}
        </span>
        {me && (
          <span style={{ color: '#1f2937', background: '#e5e7eb', borderRadius: 999, padding: '4px 10px', fontWeight: 700 }}>
            You: {me.displayName}
          </span>
        )}
        {opponent && (
          <span style={{ color: '#1f2937', background: '#e5e7eb', borderRadius: 999, padding: '4px 10px', fontWeight: 700 }}>
            Opponent: {opponent.displayName}
          </span>
        )}
      </div>

      {/* Turn indicator */}
      <div style={{ background: 'rgba(255,255,255,0.92)', borderRadius: 12, padding: '8px 12px', fontWeight: 700, color: '#334155', textAlign: 'center', }} >
        {isFinished ? '🏁 Game over!' : isMyTurn ? '🌟 Your turn! Pick a piece, then tap where it should go.' : '⏳ Opponent\'s turn'}
      </div>

      {/* Chess Board - Black and White */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(0, 1fr))', gap: '1px', width: 'min(430px, calc(100vw - 40px))', aspectRatio: '1 / 1', background: '#111827', padding: '4px', borderRadius: '8px', boxSizing: 'border-box', margin: '0 auto', boxShadow: '0 10px 24px rgba(0,0,0,0.22)', }} >
        {board.map((row, rowIndex) =>
          row.map((piece, colIndex) => {
            const rank = 8 - rowIndex;
            const file = FILES[colIndex];
            const square = `${file}${rank}` as Square;
            const isLight = (rowIndex + colIndex) % 2 === 0;
            const isSelected = selectedSquare === square;

            // Show piece as either white or black based on its color
            const pieceBg = piece?.color === 'w' ? '#e5e5e5' : '#1f2937';

            return (
              <button
                key={square}
                onClick={() => handleSquareClick(square, piece)}
                disabled={disabled || isFinished || !isMyTurn}
                style={{
                  border: isSelected ? '3px solid #22d3ee' : '1px solid #374151',
                  borderRadius: '4px',
                  background: isLight ? '#f9fafb' : '#d1d5db',
                  color: '#111827',
                  fontSize: 'clamp(28px, 7vw, 48px)',
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
                    width: '80%',
                    height: '80%',
                    borderRadius: '50%',
                    background: pieceBg,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }}>
                    <span style={{ fontSize: 'clamp(20px, 5vw, 38px)' }}>
                      <span style={{ filter: piece?.color === 'w' ? 'none' : 'drop-shadow(0 1px 2px rgba(255,255,255,0.3))' }}>
                        {PIECE_ICONS[piece.type]}
                      </span>
                    </span>
                  </span>
                ) : (
                  ''
                )}
                {(rank === 1 || file === 'a') && (
                  <span style={{ position: 'absolute', bottom: '2px', right: '4px', fontSize: '10px', color: isLight ? '#374151' : '#9ca3af', fontWeight: 700, }} >
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
