import { useEffect, useCallback, useState, useRef } from 'react';
import type { GameBoardProps } from '../types';
import type { DanceBattlesState, DanceBattlesMove, ArrowDirection, HitResult } from './types';
import { ARROW_FALL_DURATION, SONG_DURATION, LANES } from './types';

interface DanceBattlesBoardProps extends GameBoardProps<DanceBattlesState> {}

function getHitFeedback(result: HitResult): { text: string; color: string } {
  switch (result) {
    case 'perfect': return { text: 'PERFECT! +5', color: '#22d3ee' };
    case 'close': return { text: 'CLOSE! +2', color: '#fbbf24' };
    case 'miss': return { text: 'MISS', color: '#ef4444' };
    default: return { text: '', color: '#fff' };
  }
}

export function DanceBattlesBoard({ state, mySymbol, onMove, disabled }: DanceBattlesBoardProps) {
  const [localTime, setLocalTime] = useState(0);
  const [lastKeyTime, setLastKeyTime] = useState<Record<ArrowDirection, number>>({ up: 0, down: 0, left: 0, right: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  const isPlaying = state.status === 'active';
  const isFinished = state.status === 'finished' || state.status === 'draw';
  const songProgress = Math.min(100, (localTime / SONG_DURATION) * 100);
  
  const opp = state.players.find((p) => p.symbol !== mySymbol);
  const myScore = state.scores?.[mySymbol] ?? 0;
  const oppScore = opp ? state.scores?.[opp.symbol] ?? 0 : 0;
  const myStreak = state.streaks?.[mySymbol] ?? 0;
  const oppStreak = opp ? state.streaks?.[opp.symbol] ?? 0 : 0;
  
  // Sync time with server
  useEffect(() => {
    if (!isPlaying) return;
    const songStart = state.songStartTime;
    if (!songStart) return;
    const updateTime = () => {
      const elapsed = Date.now() - songStart;
      setLocalTime(Math.max(0, Math.min(SONG_DURATION, elapsed)));
    };
    updateTime();
    const interval = setInterval(updateTime, 16);
    return () => clearInterval(interval);
  }, [isPlaying, state.songStartTime]);
  
  const handleKeyPress = useCallback((direction: ArrowDirection) => {
    if (!isPlaying || disabled) return;
    const now = Date.now();
    if (now - lastKeyTime[direction] < 100) return;
    setLastKeyTime(prev => ({ ...prev, [direction]: now }));
    
    const songTime = state.songStartTime ? Date.now() - state.songStartTime : 0;
    const move: DanceBattlesMove = { type: 'hit_arrow', direction, timestamp: songTime };
    onMove(move);
  }, [isPlaying, disabled, lastKeyTime, state.songStartTime, onMove]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const lane = LANES.find(l => l.key === e.key);
      if (lane) { e.preventDefault(); handleKeyPress(lane.direction); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyPress]);
  
  const myLastHit = state.lastHit?.[mySymbol];
  
  const getArrowPosition = (noteTime: number) => {
    const timeUntilHit = noteTime - localTime;
    const progress = 1 - (timeUntilHit / ARROW_FALL_DURATION);
    return Math.max(-20, Math.min(110, progress * 120 - 10));
  };
  
  const visibleArrows = state.arrows.filter(arrow => {
    const pos = getArrowPosition(arrow.time);
    return pos > -10 && pos < 110;
  });
  
  const arrowSymbol = (dir: ArrowDirection) => {
    switch (dir) { case 'up': return '⬆️'; case 'down': return '⬇️'; case 'left': return '⬅️'; case 'right': return '➡️'; }
  };
  
  const getLaneIndex = (dir: ArrowDirection) => LANES.findIndex(l => l.direction === dir);
  
  const timeUntilStart = state.songStartTime ? Math.max(0, state.songStartTime - Date.now()) : 0;
  const showCountdown = isPlaying && timeUntilStart > 0;
  const countdownNum = Math.ceil(timeUntilStart / 1000);
  
  // Wait screen
  if (state.status === 'waiting') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 40 }}>
        <div style={{ fontSize: 48 }}>🕺</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'white' }}>Dance Battles</div>
        <div style={{ fontSize: 16, color: '#94a3b8', fontWeight: 600 }}>Press arrow keys when the falling arrows reach the target!</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ background: '#ef4444', padding: '8px 12px', borderRadius: 8, fontWeight: 700 }}>⬅️ Left</div>
          <div style={{ background: '#22c55e', padding: '8px 12px', borderRadius: 8, fontWeight: 700 }}>⬇️ Down</div>
          <div style={{ background: '#3b82f6', padding: '8px 12px', borderRadius: 8, fontWeight: 700 }}>⬆️ Up</div>
          <div style={{ background: '#f59e0b', padding: '8px 12px', borderRadius: 8, fontWeight: 700 }}>➡️ Right</div>
        </div>
        <div style={{ fontSize: 14, color: '#64748b', marginTop: 8 }}>🎯 Perfect hit = 5pts • Nearly = 2pts • Miss = 0pts</div>
        <div style={{ fontSize: 14, color: '#22d3ee', fontWeight: 700 }}>Waiting for opponent...</div>
      </div>
    );
  }
  
  // End screen
  if (isFinished) {
    const iWon = state.winner === mySymbol;
    const isDraw = state.status === 'draw';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: 40 }}>
        <div style={{ fontSize: 64 }}>{iWon ? '🏆' : isDraw ? '🤝' : '💃'}</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: iWon ? '#22d3ee' : isDraw ? '#fbbf24' : '#f472b6' }}>
          {iWon ? 'YOU WIN!' : isDraw ? "IT'S A TIE!" : 'YOU LOSE'}
        </div>
        <div style={{ display: 'flex', gap: 40, fontSize: 24, fontWeight: 800 }}>
          <div style={{ color: '#22d3ee' }}>You: {myScore}</div>
          <div style={{ color: '#f472b6' }}>Opp: {oppScore}</div>
        </div>
        <div style={{ fontSize: 14, color: '#94a3b8' }}>Click Instant Restart to play again!</div>
      </div>
    );
  }
  
  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: 16, width: 'min(600px, calc(100vw - 24px))', userSelect: 'none' }} tabIndex={0}>
      {/* Header */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ flex: '1 1 100%', background: 'rgba(0,0,0,0.3)', borderRadius: 10, height: 12, overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${songProgress}%`, background: 'linear-gradient(90deg, #22d3ee, #a78bfa, #f472b6)', borderRadius: 10, transition: 'width 0.1s linear' }} />
        </div>
        <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: '12px 16px', textAlign: 'center', flex: 1, border: '2px solid #22d3ee', boxShadow: myScore > oppScore ? '0 0 20px rgba(34,211,238,0.5)' : 'none' }}>
          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>YOU</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#22d3ee' }}>{myScore}</div>
          <div style={{ fontSize: 12, color: myStreak > 2 ? '#fbbf24' : '#64748b', fontWeight: 700 }}>{myStreak > 1 ? `🔥 ${myStreak}` : ' '}</div>
        </div>
        <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: '12px 16px', textAlign: 'center', flex: 1, border: '2px solid #f472b6', boxShadow: oppScore > myScore ? '0 0 20px rgba(244,114,182,0.5)' : 'none' }}>
          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>OPP</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#f472b6' }}>{oppScore}</div>
          <div style={{ fontSize: 12, color: oppStreak > 2 ? '#fbbf24' : '#64748b', fontWeight: 700 }}>{oppStreak > 1 ? `🔥 ${oppStreak}` : ' '}</div>
        </div>
      </div>
      
      {/* Game Area */}
      <div style={{ position: 'relative', height: 400, background: 'linear-gradient(180deg, rgba(17,24,39,0.95) 0%, rgba(49,46,129,0.9) 100%)', borderRadius: 16, overflow: 'hidden', border: '3px solid rgba(34,211,238,0.5)', boxShadow: 'inset 0 0 40px rgba(34,211,238,0.1), 0 0 30px rgba(34,211,238,0.2)' }}>
        {/* Lanes */}
        {LANES.map((lane, idx) => (
          <div key={lane.direction} style={{ position: 'absolute', left: `${(idx / 4) * 100}%`, width: '25%', height: '100%', borderRight: idx < 3 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
            {/* Target zone */}
            <div style={{ position: 'absolute', bottom: 20, left: 8, right: 8, height: 60, border: `2px solid ${lane.color}66`, borderRadius: 8, background: `${lane.color}11` }} />
          </div>
        ))}
        
        {/* Hit zone line */}
        <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, height: 4, background: 'rgba(34,211,238,0.6)', boxShadow: '0 0 10px #22d3ee' }} />
        
        {/* Arrows */}
        {visibleArrows.map(arrow => {
          const pos = getArrowPosition(arrow.time);
          const laneIdx = getLaneIndex(arrow.direction);
          const lane = LANES[laneIdx];
          return (
            <div key={arrow.id} style={{ position: 'absolute', left: `${(laneIdx / 4) * 100 + 2}%`, top: `${pos}%`, width: '21%', height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, textShadow: `0 0 15px ${lane.color}`, filter: 'drop-shadow(0 0 8px ' + lane.color + ')', transition: 'top 0.016s linear' }}>
              {arrowSymbol(arrow.direction)}
            </div>
          );
        })}
        
        {/* Hit feedback */}
        {myLastHit && (
          <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 28, fontWeight: 900, color: getHitFeedback(myLastHit.result).color, textShadow: `0 0 20px ${getHitFeedback(myLastHit.result).color}`, animation: 'hitPop 0.3s ease-out' }}>
            {getHitFeedback(myLastHit.result).text}
          </div>
        )}
        
        {/* Countdown */}
        {showCountdown && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', fontSize: 80, fontWeight: 900, color: '#22d3ee', textShadow: '0 0 30px #22d3ee' }}>
            {countdownNum}
          </div>
        )}
      </div>
      
      {/* Controls hint */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        {LANES.map(lane => (
          <button key={lane.direction} onClick={() => handleKeyPress(lane.direction)} disabled={!isPlaying || disabled} style={{ padding: '12px 16px', borderRadius: 8, border: 'none', background: lane.color, color: '#fff', fontWeight: 700, fontSize: 14, cursor: isPlaying && !disabled ? 'pointer' : 'default', opacity: isPlaying && !disabled ? 1 : 0.5 }}>
            {lane.symbol} {lane.key.replace('Arrow', '')}
          </button>
        ))}
      </div>
      
      <style>{`@keyframes hitPop { 0% { transform: translate(-50%, -50%) scale(1.5); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(1); opacity: 0; } }`}</style>
    </div>
  );
}

export default DanceBattlesBoard;