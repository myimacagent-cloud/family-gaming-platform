import { useEffect, useMemo, useRef, useState } from 'react';
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

export function TriviaDuelBoard({ state, mySymbol, onMove, disabled, theme }: TriviaDuelBoardProps) {
  const isFinished = state.status === 'finished' || state.status === 'draw';
  const me = state.players.find((p) => p.symbol === mySymbol);
  const opp = state.players.find((p) => p.symbol !== mySymbol);
  const [nowMs, setNowMs] = useState(Date.now());
  const timeoutSentRef = useRef<string>('');

  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 150);
    return () => clearInterval(t);
  }, []);

  const qKey = `${state.currentQuestion?.id || 'none'}:${state.round}:${state.categoryIndex}:${state.suddenDeathPair}`;
  useEffect(() => {
    timeoutSentRef.current = '';
  }, [qKey]);

  const remainingSec = useMemo(() => {
    if (!state.questionStartedAt) return state.questionTimeLimitSec;
    const left = state.questionTimeLimitSec - (nowMs - state.questionStartedAt) / 1000;
    return Math.max(0, Math.ceil(left));
  }, [state.questionStartedAt, state.questionTimeLimitSec, nowMs]);

  const introLeftMs = Math.max(0, state.roundIntroUntil - nowMs);
  const introActive = introLeftMs > 0;
  const introOpacity = introActive ? Math.min(1, introLeftMs / 500) : 0;

  const cooldownLeftSec = Math.max(0, Math.ceil(((state.cooldownUntil[mySymbol] || 0) - nowMs) / 1000));
  const canAnswer = !disabled && !isFinished && !introActive && cooldownLeftSec <= 0 && !!state.currentQuestion && nowMs >= (state.questionStartedAt || 0);

  useEffect(() => {
    if (!canAnswer || remainingSec > 0) return;
    if (timeoutSentRef.current === qKey) return;
    timeoutSentRef.current = qKey;
    const move: TriviaDuelMove = { type: 'timeout_tick' };
    onMove(move);
  }, [canAnswer, remainingSec, onMove, qKey]);

  const submit = (idx: number) => {
    if (!canAnswer) return;
    const move: TriviaDuelMove = { type: 'submit_answer', choiceIndex: idx };
    onMove(move);
  };

  const winnerName = state.players.find((p) => p.symbol === state.winner)?.displayName || 'Winner';
  const pxA = theme?.accent || '#22d3ee';
  const pxB = theme?.accent2 || '#ec4899';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 'min(920px, calc(100vw - 24px))', position: 'relative' }}>
      {introActive && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 30, borderRadius: 14, background: `${pxA}ee`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 20, opacity: introOpacity, transition: 'opacity 180ms linear' }}>
          <div style={{ fontWeight: 900, whiteSpace: 'pre-line', fontSize: 28, textShadow: '0 2px 10px rgba(0,0,0,0.35)' }}>{state.roundIntroText || `ROUND ${state.round}`}</div>
        </div>
      )}

      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#334155' }}>
        {state.lastAction}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 12, display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontWeight: 800, color: '#0f172a' }}>
          <span>🎯 Round {state.round}{state.suddenDeath ? ' • Sudden Death' : ''}</span>
          <span>📚 {state.currentQuestion ? CATEGORY_LABELS[state.currentQuestion.category] : 'Category'}</span>
          <span>⏱️ {remainingSec}s</span>
          {cooldownLeftSec > 0 && <span>❄️ Cooldown: {cooldownLeftSec}s</span>}
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontWeight: 700, color: '#334155' }}>
          <span>🏆 Match points — {me?.displayName || 'You'}: {state.roundPoints[mySymbol] || 0}</span>
          <span>{opp?.displayName || 'Opponent'}: {opp ? state.roundPoints[opp.symbol] || 0 : 0}</span>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontWeight: 700, color: '#334155' }}>
          <span>⚡ Category points this round — {me?.displayName || 'You'}: {state.currentRoundCorrect[mySymbol] || 0}</span>
          <span>{opp?.displayName || 'Opponent'}: {opp ? state.currentRoundCorrect[opp.symbol] || 0 : 0}</span>
          <span>🔥 Streak: {state.streaks[mySymbol] || 0}</span>
        </div>
      </div>

      {state.currentQuestion && !isFinished && (
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 900, color: '#1e293b', marginBottom: 10 }}>{state.currentQuestion.prompt}</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {state.currentQuestion.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => submit(i)}
                disabled={!canAnswer}
                style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', background: canAnswer ? '#fff' : '#f1f5f9', color: '#0f172a', fontWeight: 700, cursor: canAnswer ? 'pointer' : 'default' }}
              >
                {String.fromCharCode(65 + i)}. {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {isFinished && (
        <div style={{ background: 'rgba(15,23,42,0.96)', borderRadius: 14, padding: 18, color: '#fff', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {Array.from({ length: 22 }).map((_, i) => (
              <span key={i} style={{ position: 'absolute', left: `${(i * 43) % 100}%`, top: `${(i * 27) % 100}%`, width: 6, height: 6, background: i % 2 === 0 ? pxA : pxB, boxShadow: `0 0 10px ${i % 2 === 0 ? pxA : pxB}`, borderRadius: 1, opacity: 0.9 }} />
            ))}
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 8 }}>GAME OVER</div>
            <div style={{ fontSize: 30, fontWeight: 900 }}>{winnerName} WINS</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TriviaDuelBoard;
