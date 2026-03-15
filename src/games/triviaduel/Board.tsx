import type { GameBoardProps } from '../types';
import type { TriviaDuelState, TriviaDuelMove, TriviaCategory } from './types';

interface TriviaDuelBoardProps extends GameBoardProps<TriviaDuelState> {}

const CATEGORY_LABELS: Record<TriviaCategory, string> = {
  sports: 'Sports',
  food: 'Food',
  general: 'General Knowledge',
  media: 'TV / Movies / Anime',
  geography: 'Geography',
};

const DIFF_LABEL: Record<number, string> = {
  1: 'Round 1 • Easy',
  2: 'Round 2 • Medium',
  3: 'Round 3 • Hard',
};

export function TriviaDuelBoard({ state, mySymbol, onMove, disabled }: TriviaDuelBoardProps) {
  const isFinished = state.status === 'finished' || state.status === 'draw';
  const me = state.players.find((p) => p.symbol === mySymbol);
  const opp = state.players.find((p) => p.symbol !== mySymbol);

  const myRoundPoints = state.roundPoints[mySymbol] || 0;
  const oppRoundPoints = opp ? state.roundPoints[opp.symbol] || 0 : 0;
  const myCorrectThisRound = state.currentRoundCorrect[mySymbol] || 0;
  const oppCorrectThisRound = opp ? state.currentRoundCorrect[opp.symbol] || 0 : 0;

  const myTurn = state.players[state.currentPlayerIndex]?.symbol === mySymbol && !disabled && !isFinished;
  const canAnswer = myTurn && state.currentQuestionForSymbol === mySymbol && !!state.currentQuestion;

  const submitAnswer = (choiceIndex: number) => {
    if (!canAnswer) return;
    const move: TriviaDuelMove = { type: 'submit_answer', choiceIndex };
    onMove(move);
  };

  const category = state.categoriesOrder[state.categoryIndex];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 'min(900px, calc(100vw - 24px))' }}>
      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#334155' }}>
        {state.lastAction}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 12, display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontWeight: 800, color: '#0f172a' }}>
          <span>🎯 {DIFF_LABEL[state.round]}</span>
          <span>📚 Category {state.categoryIndex + 1}/5: {category ? CATEGORY_LABELS[category] : '—'}</span>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontWeight: 700, color: '#334155' }}>
          <span>🏆 Round points — {me?.displayName || 'You'}: {myRoundPoints}</span>
          <span>{opp?.displayName || 'Opponent'}: {oppRoundPoints}</span>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontWeight: 700, color: '#334155' }}>
          <span>✅ Correct this round — {me?.displayName || 'You'}: {myCorrectThisRound}</span>
          <span>{opp?.displayName || 'Opponent'}: {oppCorrectThisRound}</span>
        </div>
      </div>

      {state.currentQuestion ? (
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 900, color: '#1e293b', marginBottom: 10 }}>{state.currentQuestion.prompt}</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {state.currentQuestion.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => submitAnswer(i)}
                disabled={!canAnswer}
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #cbd5e1',
                  background: canAnswer ? '#fff' : '#f1f5f9',
                  color: '#0f172a',
                  fontWeight: 700,
                  cursor: canAnswer ? 'pointer' : 'default',
                }}
              >
                {String.fromCharCode(65 + i)}. {opt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 12, color: '#475569', fontWeight: 700 }}>
          Loading question...
        </div>
      )}

      <div style={{ fontSize: 13, color: 'white', fontWeight: 700 }}>
        {isFinished
          ? state.winner === mySymbol
            ? '🏆 You won the Trivia Duel!'
            : state.status === 'draw'
              ? 'It ended in a draw.'
              : 'Opponent won the Trivia Duel.'
          : canAnswer
            ? 'Your turn: answer this question!'
            : 'Waiting for opponent answer...'}
      </div>
    </div>
  );
}

export default TriviaDuelBoard;
