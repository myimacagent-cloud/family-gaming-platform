import { useState, useEffect, useRef, useCallback } from 'react';
import type { ClientMessage, ServerMessage, RoomState } from '../types/messages';

type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'offline';

interface WebSocketHook {
  connectionState: ConnectionState;
  roomState: RoomState | null;
  gameType: string | null;
  error: string | null;
  sendMessage: (msg: ClientMessage) => void;
  reconnect: () => void;
}

const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;

export function useWebSocket(roomCode: string): WebSocketHook {
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [gameType, setGameType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const userId = useRef(localStorage.getItem('userId') || crypto.randomUUID()).current;
  const displayName = useRef(localStorage.getItem('displayName') || 'Player').current;

  useEffect(() => {
    if (!localStorage.getItem('userId')) {
      localStorage.setItem('userId', userId);
    }
  }, [userId]);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    const wsUrl = import.meta.env.VITE_WS_URL || `wss://family-gaming-platform.juniorcrockett23124-cmd.workers.dev/websocket?room=${roomCode}`;
    console.log(`[WS] Connecting to ${wsUrl} (attempt ${reconnectAttempts.current + 1})`);
    setConnectionState(reconnectAttempts.current > 0 ? 'reconnecting' : 'connecting');
    setError(null);

    const socket = new WebSocket(wsUrl);
    ws.current = socket;

    socket.onopen = () => {
      console.log('[WS] Connected');
      setConnectionState('connected');
      reconnectAttempts.current = 0;

      const joinMsg: ClientMessage = {
        type: 'join_room',
        userId,
        displayName,
        roomCode,
      };
      socket.send(JSON.stringify(joinMsg));

      heartbeatInterval.current = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
    };

    socket.onmessage = (event) => {
      try {
        const msg: ServerMessage = JSON.parse(event.data);
        console.log('[WS] Received:', msg.type);
        switch (msg.type) {
          case 'state_sync':
            setRoomState(msg.state);
            if (msg.state.gameType && !gameType) {
              setGameType(msg.state.gameType);
            }
            break;
          case 'move_applied':
            setRoomState(msg.state);
            break;
          case 'player_update':
            setRoomState(prev => prev ? { ...prev, players: msg.players } : null);
            break;
          case 'error':
            setError(msg.message);
            break;
          case 'joined':
            console.log(`[WS] Joined as ${msg.symbol}`);
            if (msg.gameType) {
              setGameType(msg.gameType);
            }
            break;
          case 'room_full':
            setError('Room is full');
            break;
        }
      } catch (err) {
        console.error('[WS] Parse error:', err);
      }
    };

    socket.onclose = () => {
      console.log('[WS] Closed');
      setConnectionState('offline');
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(BASE_DELAY_MS * Math.pow(2, reconnectAttempts.current), MAX_DELAY_MS);
        console.log(`[WS] Reconnecting in ${delay}ms...`);
        setConnectionState('reconnecting');
        reconnectTimer.current = setTimeout(() => {
          reconnectAttempts.current++;
          connect();
        }, delay);
      } else {
        setError('Max reconnection attempts reached. Please refresh to retry.');
      }
    };

    socket.onerror = (err) => {
      console.error('[WS] Error:', err);
      setError('Connection error');
    };
  }, [roomCode, userId, displayName]);

  const sendMessage = useCallback((msg: ClientMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      console.log('[WS] Sending:', msg.type);
      ws.current.send(JSON.stringify(msg));
    } else {
      console.warn('[WS] Cannot send, connection not open');
    }
  }, []);

  const reconnect = useCallback(() => {
    reconnectAttempts.current = 0;
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    connect();
  }, [connect]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
      if (ws.current) ws.current.close();
    };
  }, [connect]);

  return { connectionState, roomState, gameType, error, sendMessage, reconnect };
}
