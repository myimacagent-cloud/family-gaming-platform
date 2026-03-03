import type { GameBoardProps } from '../types';
import type { DotsAndBoxesState, DotsAndBoxesMove } from './types';
import { horizontalEdgeIndex, verticalEdgeIndex, boxIndex } from './types';

interface DotsAndBoxesBoardProps extends GameBoardProps<DotsAndBoxesState> {}

export function DotsAndBoxesBoard({ state, mySymbol, onMove, disabled }: DotsAndBoxesBoardProps) {
  const isMyTurn = state.players[state.currentPlayerIndex]?.symbol === mySymbol;
  const isFinished = state.status === 'finished' || state.status === 'draw';
  const canPlay = !disabled && !isFinished && isMyTurn;
  const submitMove = (orientation: 'h' | 'v', index: number) => {
    if (!canPlay) return;
    const move: DotsAndBoxesMove = { orientation, index };
    onMove(move);
  };

  const boardSize = 2 * state.rows - 1; // 19 for 10x10 dots
  const p1 = state.players[0];
  const p2 = state.players[1];

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      gap: 12,
      width: '100%',
      maxWidth: 'min(96vw, 520px)',
      margin: '0 auto',
      padding: '0 8px'
    }}>
      {/* Scoreboard */}
      <div style={{ 
        display: 'flex', 
        gap: 16, 
        background: 'rgba(255,255,255,0.95)', 
        borderRadius: 12, 
        padding: '12px 20px', 
        fontWeight: 700,
        fontSize: 'clamp(14px, 4vw, 18px)',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <span style={{ color: '#6366f1' }}>
          {p1?.displayName ?? 'P1'} ({p1?.symbol ?? 'X'}): {state.scores[p1?.symbol ?? 'X'] ?? 0}
        </span>
        <span style={{ color: '#8b5cf6' }}>
          {p2?.displayName ?? 'P2'} ({p2?.symbol ?? 'O'}): {state.scores[p2?.symbol ?? 'O'] ?? 0}
        </span>
      </div>

      {/* Game grid - responsive size */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
        gap: 'clamp(1px, 0.5vw, 4px)',
        padding: 'clamp(6px, 2vw, 12px)',
        borderRadius: 14,
        background: 'rgba(255,255,255,0.92)',
        boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
        width: '100%',
        aspectRatio: '1',
        maxHeight: '80vh'
      }}>
        {Array.from({ length: boardSize * boardSize }).map((_, idx) => {
          const gr = Math.floor(idx / boardSize);
          const gc = idx % boardSize;

          // Dot
          if (gr % 2 === 0 && gc % 2 === 0) {
            return (
              <div key={idx} style={{ 
                width: '100%',
                aspectRatio: '1',
                borderRadius: '50%', 
                background: '#334155',
                alignSelf: 'center',
                justifySelf: 'center',
                minWidth: 6,
                minHeight: 6
              }} />
            );
          }

          // Horizontal edge
          if (gr % 2 === 0 && gc % 2 === 1) {
            const r = gr / 2;
            const c = (gc - 1) / 2;
            const edgeIdx = horizontalEdgeIndex(state.rows, state.cols, r, c);
            const taken = state.horizontalEdges[edgeIdx];
            return (
              <button 
                key={idx} 
                onClick={() => submitMove('h', edgeIdx)}
                disabled={!canPlay || taken}
                style={{ 
                  width: '100%',
                  height: 'clamp(8px, 2vw, 12px)',
                  alignSelf: 'center',
                  border: 'none',
                  borderRadius: 6,
                  background: taken ? '#00e5ff' : '#64748b',
                  cursor: !canPlay || taken ? 'default' : 'pointer',
                  padding: 0
                }}
                aria-label={`Horizontal edge ${edgeIdx}`}
              />
            );
          }

          // Vertical edge
          if (gr % 2 === 1 && gc % 2 === 0) {
            const r = (gr - 1) / 2;
            const c = gc / 2;
            const edgeIdx = verticalEdgeIndex(state.rows, state.cols, r, c);
            const taken = state.verticalEdges[edgeIdx];
            return (
              <button 
                key={idx} 
                onClick={() => submitMove('v', edgeIdx)}
                disabled={!canPlay || taken}
                style={{ 
                  width: 'clamp(8px, 2vw, 12px)',
                  height: '100%',
                  justifySelf: 'center',
                  border: 'none',
                  borderRadius: 6,
                  background: taken ? '#00e5ff' : '#64748b',
                  cursor: !canPlay || taken ? 'default' : 'pointer',
                  padding: 0
                }}
                aria-label={`Vertical edge ${edgeIdx}`}
              />
            );
          }

          // Box cell
          const br = (gr - 1) / 2;
          const bc = (gc - 1) / 2;
          const bIdx = boxIndex(state.cols, br, bc);
          const owner = state.boxes[bIdx];
          const p1Symbol = state.players[0]?.symbol;
          const isP1 = owner === p1Symbol;
          
          return (
            <div 
              key={idx} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontWeight: 800, 
                borderRadius: 6,
                border: '1px solid rgba(71, 85, 105, 0.35)',
                background: owner 
                  ? (isP1 ? 'rgba(99,102,241,0.45)' : 'rgba(139,92,246,0.45)')
                  : 'rgba(226,232,240,0.8)',
                color: isP1 ? '#312e81' : '#581c87',
                fontSize: 'clamp(10px, 3vw, 16px)',
                width: '100%',
                aspectRatio: '1'
              }}
            >
              {owner ?? ''}
            </div>
          );
        })}
      </div>

      {/* Turn indicator */}
      {!isFinished && (
        <div style={{
          padding: '10px 20px',
          borderRadius: 10,
          background: isMyTurn ? 'rgba(99,102,241,0.15)' : 'rgba(148,163,184,0.15)',
          color: isMyTurn ? '#4338ca' : '#475569',
          fontWeight: 600,
          fontSize: 'clamp(14px, 4vw, 16px)'
        }}>
          {isMyTurn ? '🎯 Your turn! Click an edge to draw.' : '⏳ Waiting for opponent...'}
        </div>
      )}

      {/* Game over message */}
      {isFinished && (
        <div style={{
          padding: '16px 24px',
          borderRadius: 12,
          background: state.winner === mySymbol ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
          color: state.winner === mySymbol ? '#166534' : '#991b1b',
          fontWeight: 700,
          fontSize: 'clamp(16px, 5vw, 20px)',
          textAlign: 'center'
        }}>
          {state.status === 'draw' 
            ? '🤝 It\'s a draw!' 
            : state.winner === mySymbol 
              ? '🎉 You won!' 
              : '😢 You lost!'}
        </div>
      )}
    </div>
  );
}

export default DotsAndBoxesBoard;
