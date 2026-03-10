import { useState } from 'react';
import type { GameBoardProps } from '../types';
import type { MakeAWordState, MakeAWordMove } from './types';

interface MakeAWordBoardProps extends GameBoardProps<MakeAWordState> {}

export function MakeAWordBoard({ state, mySymbol, onMove, disabled }: MakeAWordBoardProps) {
  const isFinished = state.status === 'finished' || state.status === 'draw';
  const myTurn = state.players[state.currentPlayerIndex]?.symbol === mySymbol && !disabled && !isFinished;

  const [letterInput, setLetterInput] = useState('');
  const [wordInput, setWordInput] = useState('');

  const submitLetter = () => {
    if (!myTurn) return;
    const move: MakeAWordMove = { type: 'choose_letter', letter: letterInput };
    onMove(move);
    setLetterInput('');
  };

  const submitWord = () => {
    if (!myTurn) return;
    const move: MakeAWordMove = { type: 'submit_word', word: wordInput };
    onMove(move);
    setWordInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 'min(820px, calc(100vw - 24px))' }}>
      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#334155' }}>
        {state.lastAction}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 12, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontWeight: 800 }}>First letter: {state.letters.first ?? '—'}</span>
        <span style={{ fontWeight: 800 }}>Last letter: {state.letters.last ?? '—'}</span>
        {state.winningWord && <span style={{ fontWeight: 800, color: '#16a34a' }}>Winning word: {state.winningWord}</span>}
      </div>

      {state.phase === 'choose_letters' ? (
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={letterInput}
            onChange={(e) => setLetterInput(e.target.value.toUpperCase().slice(0, 1))}
            placeholder="Type one letter"
            maxLength={1}
            style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 16, width: 120 }}
            disabled={!myTurn}
          />
          <button
            onClick={submitLetter}
            disabled={!myTurn}
            style={{ border: 'none', borderRadius: 10, padding: '10px 14px', background: myTurn ? '#6D7DFF' : '#94a3b8', color: '#fff', fontWeight: 800, cursor: myTurn ? 'pointer' : 'default' }}
          >
            Submit Letter
          </button>
        </div>
      ) : (
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={wordInput}
            onChange={(e) => setWordInput(e.target.value)}
            placeholder="Type your word"
            style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 16, width: 240 }}
            disabled={!myTurn}
          />
          <button
            onClick={submitWord}
            disabled={!myTurn}
            style={{ border: 'none', borderRadius: 10, padding: '10px 14px', background: myTurn ? '#16a34a' : '#94a3b8', color: '#fff', fontWeight: 800, cursor: myTurn ? 'pointer' : 'default' }}
          >
            Submit Word
          </button>
        </div>
      )}

      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 12 }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Attempts</div>
        {state.attempts.length === 0 ? (
          <div style={{ color: '#64748b' }}>No attempts yet.</div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {state.attempts.map((a, i) => {
              const who = state.players.find((p) => p.symbol === a.symbol)?.displayName || a.symbol;
              return <li key={`${a.symbol}-${i}`}>{who}: {a.word}</li>;
            })}
          </ul>
        )}
      </div>

      <div style={{ fontSize: 13, color: 'white', fontWeight: 700 }}>
        {isFinished
          ? state.winner === mySymbol
            ? '🏆 You won!'
            : state.status === 'draw'
              ? 'Draw'
              : 'Opponent won'
          : myTurn
            ? 'Your turn'
            : 'Opponent turn'}
      </div>
    </div>
  );
}

export default MakeAWordBoard;
