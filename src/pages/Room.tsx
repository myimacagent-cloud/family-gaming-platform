import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';
import { useState, useMemo } from 'react';
import { getGame } from '../games/registry';

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
  const location = useLocation();
  const userId = localStorage.getItem('userId') || '';
  const [showCopied, setShowCopied] = useState(false);
  const { connectionState, roomState, gameType: wsGameType, sendMessage, reconnect } = useWebSocket(roomCode || '');

  const gameType = useMemo(() => {
    // Priority: 1) location state (from creating room), 2) websocket gameType, 3) roomState gameType
    return (location.state as { gameType?: string })?.gameType || wsGameType || roomState?.gameType || '';
  }, [location.state, wsGameType, roomState?.gameType]);

  const gameDefinition = useMemo(() => {
    return gameType ? getGame(gameType) : undefined;
  }, [gameType]);

  const handleMakeMove = (move: unknown) => {
    if (connectionState !== 'connected') return;
    sendMessage({ type: 'make_move', userId, move });
  };

  const handleRestart = () => {
    if (connectionState !== 'connected') return;
    sendMessage({ type: 'restart_game', userId });
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode || '');
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const currentPlayer = roomState?.players.find(p => p.userId === userId);
  const currentPlayerSymbol = roomState?.players[roomState?.currentPlayerIndex ?? 0]?.symbol;
  const myTurn = currentPlayer?.symbol === currentPlayerSymbol && roomState?.status === 'active';
  const isWaiting = roomState?.status === 'waiting';
  const isFinished = roomState?.status === 'finished' || roomState?.status === 'draw';

  const statusMessage = () => {
    if (isWaiting) return 'Waiting for opponent...';
    if (roomState?.status === 'active') return myTurn ? 'Your turn!' : "Opponent's turn";
    if (isFinished) {
      if (roomState?.winner) return roomState.winner === currentPlayer?.symbol ? 'You won!' : 'You lost';
      return "It's a draw!";
    }
    return '';
  };

  const gameBoard = useMemo(() => {
    if (!roomState || !gameDefinition) return null;
    return gameDefinition.renderBoard({
      state: roomState as any,
      myPlayerId: userId,
      mySymbol: currentPlayer?.symbol || '',
      onMove: handleMakeMove,
      disabled: connectionState !== 'connected',
    });
  }, [roomState, gameDefinition, userId, currentPlayer?.symbol, connectionState]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.95)', padding: '15px 25px', borderRadius: '15px', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0, fontSize: '22px', color: '#333' }}>
            {gameDefinition?.displayName || 'Game Room'}
          </h1>
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
            <button onClick={reconnect} style={{ padding: '8px 16px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
              Reconnect
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '25px' }}>
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

        {roomState && (
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)', padding: '0 20px', textAlign: 'center' }}>
            {statusMessage()}
          </div>
        )}

        {gameBoard}

        {isFinished && (
          <button onClick={handleRestart} style={{ padding: '16px 40px', fontSize: '18px', fontWeight: 600, background: 'white', color: '#667eea', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(0,0,0,0.2)' }}>
            Play Again
          </button>
        )}

        <button onClick={() => navigate('/')} style={{ padding: '12px 30px', fontSize: '14px', fontWeight: 600, background: 'rgba(0,0,0,0.3)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '20px' }}>
          Leave Room
        </button>
      </div>
    </div>
  );
}
