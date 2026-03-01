import type { FormEvent } from 'react';
import type { GameBoardProps } from '../types';
import type { HangmanState, HangmanMove } from './logic';

interface HangmanBoardProps extends GameBoardProps<HangmanState> {}

export function HangmanBoard({
  state,
  myPlayerId,
  mySymbol,
  onMove,
  disabled,
}: HangmanBoardProps) {
  const isMyTurn = state.players[state.currentPlayerIndex]?.symbol === mySymbol;
  const isFinished = state.status === 'finished';

  const guessedSet = new Set(state.guessedLetters);

  const displayWord = state.word
    .split('')
    .map((char) => (guessedSet.has(char) || isFinished ? char : '_'))
    .join(' ');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const input = form.elements.namedItem('letter') as HTMLInputElement | null;
    const letter = input?.value?.trim().toUpperCase() || '';
    if (!letter || letter.length !== 1) return;

    const move: HangmanMove = {
      type: 'guess_letter',
      userId: myPlayerId,
      letter,
    };

    onMove(move);
    form.reset();
  };

  const currentPlayerName = state.players[state.currentPlayerIndex]?.displayName || 'Unknown';

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.95)',
        borderRadius: '16px',
        padding: '24px',
        minWidth: '360px',
        boxShadow: '0 10px 24px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      <div style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '6px', textAlign: 'center' }}>
        {displayWord}
      </div>

      <div style={{ textAlign: 'center', color: '#444', fontWeight: 600 }}>
        Wrong: {state.wrongGuesses} / {state.maxWrong}
      </div>

      <div style={{ textAlign: 'center', color: '#444' }}>
        Guessed: {state.guessedLetters.length ? state.guessedLetters.join(', ') : '—'}
      </div>

      {!isFinished && (
        <div style={{ textAlign: 'center', fontWeight: 600, color: '#333' }}>
          Turn: {currentPlayerName}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <input
          name="letter"
          type="text"
          maxLength={1}
          placeholder="A"
          disabled={disabled || !isMyTurn || isFinished}
          style={{
            width: '72px',
            textAlign: 'center',
            fontSize: '28px',
            fontWeight: 700,
            border: '2px solid #d1d5db',
            borderRadius: '10px',
            padding: '8px',
          }}
          onInput={(e) => {
            const target = e.currentTarget;
            target.value = target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 1);
          }}
        />
        <button
          type="submit"
          disabled={disabled || !isMyTurn || isFinished}
          style={{
            padding: '10px 16px',
            fontSize: '16px',
            fontWeight: 700,
            border: 'none',
            borderRadius: '10px',
            background: '#667eea',
            color: '#fff',
            cursor: disabled || !isMyTurn || isFinished ? 'default' : 'pointer',
          }}
        >
          Guess
        </button>
      </form>

      {isFinished && state.winner === 'players' && (
        <div style={{ textAlign: 'center', fontWeight: 800, color: '#059669' }}>
          You won!
        </div>
      )}

      {isFinished && state.winner === 'system' && (
        <div style={{ textAlign: 'center', fontWeight: 800, color: '#dc2626' }}>
          You lost! Word was: {state.word}
        </div>
      )}
    </div>
  );
}

export default HangmanBoard;
