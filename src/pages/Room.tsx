import { useParams, useNavigate } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';
import { useState } from 'react';
import type { ClientMessage } from '../types/messages';

const STATUS_COLORS: Record<string, string> = {
  connecting: '#f59e0b',
  connected: '#10b981',
  reconnecting: '#f59e0b',
  offline: '#ef4444',
};

const STATUS_TEXT: Record<string, string> = {
  connecting: 'Connecting...',
  connected: 'Connected',
  reconnecting: 'Reconnecting...',
  offline: 'Offline',
};

export default function Room() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId') || '';
  const [showCopied, setShowCopied] = useState(false);

  const { connectionState, roomState, sendMessage, reconnect } = useWebSocket(roomCode || '');

  const handleCellClick = (index: number) => {
    if (connectionState !== 'connected') return;
    if (!roomState) return;
    if (roomState.status !== 'active') return;
    if (roomState.board[index] !== null) return;

    const player = roomState.players.find(p => p.userId === userId);
    if (!player || player.symbol !== roomState.turn) return;

    const msg: ClientMessage = {
      type: 'make_move',
      userId,
      index,
    };
    sendMessage(msg);
  };

  const handleRestart = () => {
    if (connectionState !== 'connected') return;
    const msg: ClientMessage = {
      type: 'restart_game',
      userId,
    };
    sendMessage(msg);
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode || '');
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const currentPlayer = roomState?.players.find(p => p.userId === userId);
  const myTurn = currentPlayer?.symbol === roomState?.turn && roomState?.status === 'active';
  const isWaiting = roomState?.status === 'waiting';
  const isFinished = roomState?.status === 'finished' || roomState?.status === 'draw';

  const statusMessage = () => {
    if (isWaiting) return 'Waiting for opponent...';
    if (roomState?.status === 'active') {
      return myTurn ? 'Your turn!' : "Opponent's turn";
    }
    if (isFinished) {
      if (roomState?.winner) {
        return roomState.winner === currentPlayer?.symbol ? 'You won! 🎉' : 'You lost 😢';
      }
      return "It's a draw! 🤝";
    }
    return '';
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.95)', padding: '15px 25px', borderRadius: '15px', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0, fontSize: '22px', color: '#333' }}>🎮 Tic-Tac-Toe</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#666', fontSize: '14px' }}>Room:</span>
            <code onClick={copyRoomCode} style={{ background: '#f0f0f0', padding: '6px 12px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', letterSpacing: '2px', color: '#667eea', cursor: 'pointer' }}>
              {roomCode}
            </code>
            {showCopied && <span style={{ color: '#10b981', fontSize: '12px' }}>Copied!</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '20px', background: STATUS_COLORS[connectionState] + '20', color: STATUS_COLORS[connectionState], fontSize: '13px', fontWeight: 600 }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: STATUS_COLORS[connectionState] }} />
            {STATUS_TEXT[connectionState]}
          </div>
          {connectionState === 'offline' && (
            <button onClick={reconnect} style={{ padding: '8px 16px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Reconnect</button>
          )}
        </div>
      </div>

      {/* Game Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '25px' }}>
        {/* Players */}
        {roomState && (
          <div style={{ display: 'flex', gap: '40px', padding: '20px 40px', background: 'rgba(255,255,255,0.95)', borderRadius: '15px', alignItems: 'center' }}>
            {roomState.players.map((p) => (
              <div key={p.userId} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: p.connected ? 1 : 0.5 }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 'bold', background: p.symbol === 'X' ? '#667eea' : '#764ba2', color: 'white', boxShadow: p.userId === userId ? '0 0 0 4px #ffeb3b' : 'none' }}>
                  {p.symbol}
                </div>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{p.displayName}</span>
                <span style={{ fontSize: '12px', color: p.connected ? '#10b981' : '#ef4444' }}>{p.connected ? 'Online' : 'Offline'}</span>
              </div>
            ))}
          </div>
        )}

        {/* Status Message */}
        {roomState && (
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)', padding: '0 20px', textAlign: 'center' }}>
            {statusMessage()}
          </div>
        )}

        {/* Game Board */}
        {roomState && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', width: '320px', height: '320px' }}>
            {roomState.board.map((cell, index) => {
              const isWinning = roomState.winningCells?.includes(index);
              return (
                <button
                  key={index}
                  onClick={() => handleCellClick(index)}
                  disabled={!myTurn || cell !== null || isFinished}
                  style={{ width: '100%', height: '100%', fontSize: '48px', fontWeight: 'bold', border: 'none', borderRadius: '12px', cursor: cell === null && myTurn && !isFinished ? 'pointer' : 'default', background: isWinning ? '#10b981' : 'rgba(255,255,255,0.95)', color: cell === 'X' ? '#667eea' : '#764ba2', transition: 'transform 0.1s', boxShadow: isWinning ? '0 0 20px #10b981' : '0 4px 10px rgba(0,0,0,0.2)' }}
                >
                  {cell}
                </button>
              );
            })}
          </div>
        )}

        {/* Restart Button */}
        {isFinished && (
          <button onClick={handleRestart} style={{ padding: '16px 40px', fontSize: '18px', fontWeight: 600, background: 'white', color: '#667eea', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(0,0,0,0.2)' }}>
            Play Again
          </button>
        )}

        {/* Leave Button */}
        <button onClick={() => navigate('/')} style={{ padding: '12px 30px', fontSize: '14px', fontWeight: 600, background: 'rgba(0,0,0,0.3)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '20px' }}>
          ← Leave Room
        </button>
      </div>
    </div>
  );
}
