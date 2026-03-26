import { useState } from 'react';
import type { GameBoardProps } from '../types';
import type { MarblesEvenOddMove, MarblesEvenOddState, ParityGuess } from './types';

const PARITY_LABEL: Record<ParityGuess, string> = {
  even: '⚖️ Even',
  odd: '🎯 Odd',
};

export function MarblesEvenOddBoard({ state, mySymbol, onMove, disabled }: GameBoardProps<MarblesEvenOddState>) {
  const isFinished = state.status === 'finished' || state.status === 'draw';
  const myPick = state.picks?.[mySymbol] ?? null;
  const [marbles, setMarbles] = useState(1);
  const [guess, setGuess] = useState<ParityGuess>('even');

  const submit = () => {
    if (disabled || isFinished || myPick) return;
    const move: MarblesEvenOddMove = { marbles, guess };
    onMove(move);
  };

  const playerA = state.players[0];
  const playerB = state.players[1];

  const renderPlayer = (player: typeof playerA) => {
    if (!player) return null;
    const pick = state.picks?.[player.symbol] ?? null;

    return (
      <div style={{ background: '#fff', borderRadius: 12, padding: 12 }}>
        <div style={{ fontWeight: 700 }}>{player.displayName} ({player.symbol})</div>
        {!state.reveal ? (
          <div style={{ color: '#666' }}>{pick ? '✅ Locked in' : '⏳ Waiting...'}</div>
        ) : (
          <div style={{ marginTop: 6 }}>
            <div>Marbles: <b>{pick?.marbles ?? '-'}</b></div>
            <div>Guess: <b>{pick ? PARITY_LABEL[pick.guess] : '-'}</b></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', width: '100%', maxWidth: 560 }}>
      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 14, padding: 16, width: '100%' }}>
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>⚪ Marbles: Even or Odd</div>
        <div style={{ color: '#444', marginBottom: 12 }}>
          Each player picks <b>1-5</b> marbles and guesses if the total is <b>even</b> or <b>odd</b>.
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
          <label style={{ fontWeight: 700 }}>Your marbles:</label>
          <input
            type="number"
            min={1}
            max={5}
            value={marbles}
            onChange={(e) => setMarbles(Math.max(1, Math.min(5, Number(e.target.value) || 1)))}
            disabled={!!myPick || isFinished || disabled}
            style={{ width: 80, padding: '8px 10px', borderRadius: 8, border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {(['even', 'odd'] as ParityGuess[]).map((p) => (
            <button
              key={p}
              onClick={() => setGuess(p)}
              disabled={!!myPick || isFinished || disabled}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: guess === p ? '2px solid #667eea' : '2px solid #ddd',
                background: guess === p ? '#eef2ff' : '#fff',
                fontWeight: 700,
                cursor: !!myPick || isFinished || disabled ? 'default' : 'pointer',
              }}
            >
              {PARITY_LABEL[p]}
            </button>
          ))}
        </div>

        <button
          onClick={submit}
          disabled={!!myPick || isFinished || disabled}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 10,
            border: 'none',
            background: '#667eea',
            color: '#fff',
            fontWeight: 700,
            cursor: !!myPick || isFinished || disabled ? 'default' : 'pointer',
          }}
        >
          {myPick ? 'Choice Locked In ✅' : 'Lock In Choice'}
        </button>
      </div>

      <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {renderPlayer(playerA)}
        {renderPlayer(playerB)}
      </div>

      {state.reveal && state.totalMarbles !== null && (
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 12, width: '100%', textAlign: 'center' }}>
          <div>Total marbles: <b>{state.totalMarbles}</b></div>
          <div>Result: <b>{state.winningParity === 'even' ? '⚖️ Even' : '🎯 Odd'}</b></div>
        </div>
      )}
    </div>
  );
}

export default MarblesEvenOddBoard;
