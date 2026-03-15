import type { GameBoardProps } from '../types';
import type { BingoState, BingoMove } from './types';

interface BingoBoardProps extends GameBoardProps<BingoState> {}

export function BingoBoard({ state, mySymbol, onMove, disabled }: BingoBoardProps) {
  const isFinished = state.status === 'finished' || state.status === 'draw';
  const myTurnCaller = state.players[state.currentPlayerIndex]?.symbol === mySymbol;
  const canCall = myTurnCaller && state.pendingCall && !disabled && !isFinished;
  const canMark = !state.pendingCall && !disabled && !isFinished;

  const myBoard = state.boards?.[mySymbol] || [];
  const myMarked = state.marked?.[mySymbol] || Array.from({ length: 25 }, () => false);

  const me = state.players.find((p) => p.symbol === mySymbol);
  const opp = state.players.find((p) => p.symbol !== mySymbol);

  const markCell = (index: number) => {
    if (!canMark) return;
    const move: BingoMove = { type: 'mark', index };
    onMove(move);
  };

  const call = () => {
    if (!canCall) return;
    const move: BingoMove = { type: 'call' };
    onMove(move);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 'min(860px, calc(100vw - 24px))' }}>
      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#334155' }}>
        {state.lastAction}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: '8px 12px', fontWeight: 800 }}>
          🔵 {me?.displayName ?? 'You'}
        </div>
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: '8px 12px', fontWeight: 800 }}>
          🩷 {opp?.displayName ?? 'Opponent'}
        </div>
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: '8px 12px', fontWeight: 800 }}>
          📣 Last called: {state.lastCalled ?? '—'}
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
          {myBoard.map((num, i) => {
            const marked = myMarked[i];
            const center = i === 12;
            const callable = canMark && state.lastCalled === num && !marked;
            return (
              <button
                key={i}
                onClick={() => markCell(i)}
                disabled={!callable}
                style={{
                  minHeight: 48,
                  borderRadius: 8,
                  border: callable ? '2px solid #16a34a' : '1px solid #cbd5e1',
                  background: center || marked ? '#16a34a' : '#fff',
                  color: center || marked ? '#fff' : '#1f2937',
                  fontWeight: 800,
                  cursor: callable ? 'pointer' : 'default',
                }}
                title={callable ? 'Mark this called number' : ''}
              >
                {center ? 'FREE' : num}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={call}
        disabled={!canCall}
        style={{
          border: 'none',
          borderRadius: 10,
          padding: '10px 14px',
          background: canCall ? '#6D7DFF' : '#94a3b8',
          color: '#fff',
          fontWeight: 800,
          cursor: canCall ? 'pointer' : 'default',
        }}
      >
        Call Number
      </button>

      <div style={{ fontSize: 13, color: 'white', fontWeight: 700 }}>
        {isFinished
          ? state.status === 'draw'
            ? 'Draw game'
            : state.winner === mySymbol
              ? '🏆 BINGO! You win!'
              : 'Opponent got BINGO!'
          : canCall
            ? 'Your turn to call a number'
            : canMark
              ? 'Mark the called number if you have it'
              : "Waiting for caller"}
      </div>
    </div>
  );
}

export default BingoBoard;
