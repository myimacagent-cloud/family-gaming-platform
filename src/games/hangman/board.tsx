import type { FormEvent } from 'react';
import type { GameBoardProps } from '../types';
import type { HangmanState, HangmanMove } from './logic';

interface HangmanBoardProps extends GameBoardProps<HangmanState> {}


function HangmanDrawing({ wrongGuesses }: { wrongGuesses: number }) {
  const head = wrongGuesses >= 1;
  const body = wrongGuesses >= 2;
  const leftArm = wrongGuesses >= 3;
  const rightArm = wrongGuesses >= 4;
  const leftLeg = wrongGuesses >= 5;
  const rightLeg = wrongGuesses >= 6;

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <svg width="180" height="180" viewBox="0 0 180 180" role="img" aria-label="Hangman drawing">
        <line x1="20" y1="165" x2="100" y2="165" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
        <line x1="45" y1="165" x2="45" y2="20" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
        <line x1="45" y1="20" x2="120" y2="20" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
        <line x1="120" y1="20" x2="120" y2="40" stroke="#334155" strokeWidth="6" strokeLinecap="round" />

        {head && <circle cx="120" cy="55" r="15" fill="none" stroke="#0f172a" strokeWidth="5" />}
        {body && <line x1="120" y1="70" x2="120" y2="110" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />}
        {leftArm && <line x1="120" y1="82" x2="98" y2="98" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />}
        {rightArm && <line x1="120" y1="82" x2="142" y2="98" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />}
        {leftLeg && <line x1="120" y1="110" x2="102" y2="140" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />}
        {rightLeg && <line x1="120" y1="110" x2="138" y2="140" stroke="#0f172a" strokeWidth="5" strokeLinecap="round" />}
      </svg>
    </div>
  );
}


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

      <HangmanDrawing wrongGuesses={state.wrongGuesses} />

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
