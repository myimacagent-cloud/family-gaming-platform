import type { GameBoardProps } from '../types';
import type { TicTacToe3PieceState, TicTacToe3PieceMove } from './logic';

interface TicTacToe3PieceBoardProps extends GameBoardProps<TicTacToe3PieceState> {}

export function TicTacToe3PieceBoard({
  state,
  mySymbol,
  onMove,
  disabled,
}: TicTacToe3PieceBoardProps) {
  const isMyTurn = state.players[state.currentPlayerIndex]?.symbol === mySymbol;
  const isFinished = state.status === 'finished' || state.status === 'draw';

  const currentTurnSymbol = state.players[state.currentPlayerIndex]?.symbol;
  const expiringIndex = !isFinished
    ? state.playerStates.find(
        (p) => p.symbol === currentTurnSymbol && p.moves.length === 3,
      )?.moves[0]
    : undefined;

  const handleCellClick = (index: number) => {
    if (disabled || !isMyTurn || state.board[index] !== null || isFinished) {
      return;
    }
    const move: TicTacToe3PieceMove = { index };
    onMove(move);
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px',
        width: '320px',
        height: '320px',
      }}
    >
      {state.board.map((cell, index) => {
        const isWinning = state.winningCells?.includes(index) ?? false;
        const isExpiring = index === expiringIndex;
        return (
          <button
            key={index}
            onClick={() => handleCellClick(index)}
            disabled={!isMyTurn || cell !== null || isFinished || disabled}
            style={{
              width: '100px',
              height: '100px',
              fontSize: '48px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '12px',
              cursor: isMyTurn && cell === null && !isFinished && !disabled
                ? 'pointer'
                : 'default',
              background: isWinning
                ? '#10b981'
                : 'rgba(255,255,255,0.95)',
              color: cell === 'X' ? '#667eea' : '#764ba2',
              opacity: isExpiring ? 0.35 : 1,
              transition: 'transform 0.1s, opacity 0.2s',
              boxShadow: isWinning
                ? '0 0 20px #10b981'
                : isExpiring
                  ? '0 0 0 2px rgba(239,68,68,0.45), 0 4px 10px rgba(0,0,0,0.2)'
                  : '0 4px 10px rgba(0,0,0,0.2)',
            }}
          >
            {cell}
          </button>
        );
      })}
    </div>
  );
}

export default TicTacToe3PieceBoard;
