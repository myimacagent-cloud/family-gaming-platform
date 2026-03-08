import type { GameBoardProps } from '../types';
import type { GoFishState, GoFishMove } from './types';

interface GoFishBoardProps extends GameBoardProps<GoFishState> {}

function rankLabel(rank: number): string {
  if (rank === 11) return 'J';
  if (rank === 12) return 'Q';
  if (rank === 13) return 'K';
  if (rank === 14) return 'A';
  return String(rank);
}

function rankCounts(cards: number[]): { rank: number; count: number }[] {
  const counts: Record<number, number> = {};
  for (const c of cards) counts[c] = (counts[c] || 0) + 1;
  return Object.entries(counts)
    .map(([rank, count]) => ({ rank: Number(rank), count }))
    .sort((a, b) => a.rank - b.rank);
}

export function GoFishBoard({ state, mySymbol, onMove, disabled }: GoFishBoardProps) {
  const isFinished = state.status === 'finished' || state.status === 'draw';
  const myTurn = state.players[state.currentPlayerIndex]?.symbol === mySymbol && !disabled && !isFinished;

  const me = state.players.find((p) => p.symbol === mySymbol);
  const opp = state.players.find((p) => p.symbol !== mySymbol);

  const myHand = state.hands?.[mySymbol] || [];
  const oppHandCount = opp ? state.hands?.[opp.symbol]?.length ?? 0 : 0;
  const myBooks = state.books?.[mySymbol] ?? 0;
  const oppBooks = opp ? state.books?.[opp.symbol] ?? 0 : 0;

  const askRank = (rank: number) => {
    if (!myTurn) return;
    const move: GoFishMove = { type: 'ask_rank', rank };
    onMove(move);
  };

  const grouped = rankCounts(myHand);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: 'min(720px, calc(100vw - 40px))' }}>
      <div style={{ display: 'flex', gap: 14, background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: '10px 14px', fontWeight: 700, flexWrap: 'wrap', justifyContent: 'center' }}>
        <span>🟦 {me?.displayName ?? 'You'} books: {myBooks}</span>
        <span>🟥 {opp?.displayName ?? 'Opponent'} books: {oppBooks}</span>
        <span>🃏 Deck: {state.deck?.length ?? 0}</span>
        <span>🤫 Opponent hand: {oppHandCount}</span>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.9)', borderRadius: 10, padding: '8px 12px', fontWeight: 700, color: '#334155', textAlign: 'center' }}>
        {isFinished ? '🏁 Game complete' : myTurn ? 'Your turn — choose a rank to ask for.' : 'Waiting for opponent...'}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.92)', borderRadius: 10, padding: '8px 12px', width: '100%', textAlign: 'center', fontSize: 13, color: '#334155' }}>
        {state.lastAction || 'Start by asking for a rank you have.'}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 14, padding: 14, width: '100%' }}>
        <div style={{ fontWeight: 800, marginBottom: 10, color: '#334155' }}>Your Hand (tap a rank)</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {grouped.length === 0 && <span style={{ color: '#64748b' }}>No cards in hand</span>}
          {grouped.map(({ rank, count }) => (
            <button
              key={rank}
              onClick={() => askRank(rank)}
              disabled={!myTurn}
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: 10,
                padding: '10px 12px',
                minWidth: 64,
                background: myTurn ? '#fff' : '#e5e7eb',
                cursor: myTurn ? 'pointer' : 'default',
                fontWeight: 800,
                color: '#1f2937',
              }}
            >
              <div style={{ fontSize: 20 }}>{rankLabel(rank)}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>x{count}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default GoFishBoard;
