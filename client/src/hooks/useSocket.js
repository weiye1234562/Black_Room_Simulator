import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';

export function useSocket() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState(null);

  // Connect
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const socket = io(SERVER_URL, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('state_update', (state) => setGameState((prev) => ({ ...prev, ...state })));
    socket.on('state_sync', (state) => setGameState((prev) => ({ ...prev, ...state })));
    socket.on('room_created', (data) => setGameState((prev) => ({ ...prev, roomCreated: data })));
    socket.on('joined', (data) => setGameState((prev) => ({ ...prev, joined: data })));
    socket.on('room_info', (data) => setGameState((prev) => ({ ...prev, roomInfo: data })));
    socket.on('room_closed', (data) => setGameState((prev) => ({ ...prev, roomClosed: data })));
    socket.on('error', (err) => setError(err.message));

    socketRef.current = socket;
    return socket;
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnected(false);
      setGameState(null);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Emit helper
  const emit = useCallback((event, data) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    socket: socketRef.current,
    connected,
    gameState,
    error,
    connect,
    disconnect,
    emit,
    clearError,
  };
}
