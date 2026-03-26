import type { GameBoardProps } from '../types';
import type { RpsChoice, RpsState, RpsMove } from './types';

interface RpsBoardProps extends GameBoardProps<RpsState> {}

const LABELS: Record<RpsChoice, string> = {
  rock: '🪨 Rock',
  paper: '📄 Paper',
  scissors: '✂️ Scissors',
};

export function RpsBoard({ state, mySymbol, onMove, disabled }: RpsBoardProps) {
  const isFinished = state.status === 'finished' || state.status === 'draw';
  const myPick = state.picks?.[mySymbol] ?? null;

  const submitChoice = (choice: RpsChoice) => {
    if (disabled || isFinished || myPick) return;
    const move: RpsMove = { choice };
    onMove(move);
  };

  const playerA = state.players[0];
  const playerB = state.players[1];
  const aPick = playerA ? state.picks?.[playerA.symbol] : null;
  const bPick = playerB ? state.picks?.[playerB.symbol] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 10 }}>
        {(['rock', 'paper', 'scissors'] as RpsChoice[]).map((choice) => (
          <button
            key={choice}
            onClick={() => submitChoice(choice)}
            disabled={disabled || isFinished || !!myPick}
            style={{
              padding: '12px 18px',
              borderRadius: 10,
              border: myPick === choice ? '2px solid #10b981' : '2px solid #d1d5db',
              background: myPick === choice ? '#ecfdf5' : 'white',
              fontWeight: 600,
              cursor: disabled || isFinished || !!myPick ? 'default' : 'pointer',
            }}
          >
            {LABELS[choice]}
          </button>
        ))}
      </div>

      <div style={{ color: 'white', fontWeight: 600 }}>
        {myPick ? 'You locked in your choice.' : 'Choose Rock, Paper, or Scissors'}
      </div>

      <div style={{
        width: '100%',
        maxWidth: 460,
        background: 'rgba(255,255,255,0.95)',
        borderRadius: 12,
        padding: 14,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
      }}>
        <div>
          <div style={{ fontWeight: 700 }}>{playerA?.displayName ?? 'Player A'} ({playerA?.symbol ?? 'X'})</div>
          <div>{state.reveal ? (aPick ? LABELS[aPick] : '—') : (aPick ? '✅ Picked' : '⏳ Waiting')}</div>
        </div>
        <div>
          <div style={{ fontWeight: 700 }}>{playerB?.displayName ?? 'Player B'} ({playerB?.symbol ?? 'O'})</div>
          <div>{state.reveal ? (bPick ? LABELS[bPick] : '—') : (bPick ? '✅ Picked' : '⏳ Waiting')}</div>
        </div>
      </div>
    </div>
  );
}

export default RpsBoard;
