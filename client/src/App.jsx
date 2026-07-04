import { useEffect, useState, useCallback } from 'react';
import { useSocket } from './hooks/useSocket';
import useWallpaper from './hooks/useWallpaper';
import HomePage from './pages/HomePage';
import PlayerPage from './pages/PlayerPage';
import RefereePage from './pages/RefereePage';
import SpectatorPage from './pages/SpectatorPage';

const SESSION_KEY = 'brs_session';

function saveSession(data) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch {}
}
function loadSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch { return null; }
}
function clearSession() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch {}
}

export default function App() {
  const { connected, gameState, error, connect, disconnect, emit, clearError } = useSocket();
  useWallpaper();

  const [page, setPage] = useState('home');
  const [playerSide, setPlayerSide] = useState(null);
  const [reconnected, setReconnected] = useState(false);

  // Connect on mount
  useEffect(() => { connect(); }, [connect]);

  // Auto-reconnect from saved session on first connect
  useEffect(() => {
    if (reconnected || !connected) return;
    const session = loadSession();
    if (!session) return;
    setReconnected(true);

    if (session.role === 'referee') {
      setPage('referee');
      emit('create_room');
    } else if (session.role === 'player') {
      setPlayerSide(session.side);
      setPage('player');
      emit('join_room', {
        code: session.code,
        name: session.name,
        role: 'player',
        side: session.side,
      });
    } else if (session.role === 'spectator') {
      setPage('spectator');
      emit('join_room', { code: session.code, role: 'spectator' });
    }
  }, [connected, reconnected, emit]);

  const handleJoin = useCallback((opts) => {
    clearError();
    if (opts.role === 'referee') {
      setPage('referee');
      emit('create_room');
      // Save after room_created event
    } else if (opts.role === 'player') {
      setPlayerSide(opts.side);
      setPage('player');
      emit('join_room', { code: opts.code, name: opts.name, role: 'player', side: opts.side });
      saveSession({ role: 'player', code: opts.code, name: opts.name, side: opts.side });
    } else if (opts.role === 'spectator') {
      setPage('spectator');
      emit('join_room', { code: opts.code, role: 'spectator' });
      saveSession({ role: 'spectator', code: opts.code });
    }
  }, [emit, clearError]);

  // Save referee session when room is created
  useEffect(() => {
    if (gameState?.code && page === 'referee' && connected) {
      saveSession({ role: 'referee', code: gameState.code });
    }
  }, [gameState?.code, page, connected]);

  const handleLeave = useCallback(() => {
    clearSession();
    disconnect();
    setPage('home');
    setPlayerSide(null);
    setReconnected(false);
    setTimeout(() => connect(), 200);
  }, [disconnect, connect]);

  // Handle server errors — clear session and go home if rejoining
  useEffect(() => {
    if (error && page !== 'home') {
      handleLeave();
      clearError();
    }
  }, [error]);

  // Handle room closed
  useEffect(() => {
    if (gameState?.roomClosed) {
      alert(gameState.roomClosed.reason || '房间已关闭');
      handleLeave();
    }
  }, [gameState?.roomClosed]);

  return (
    <div className="h-full text-white">
      {page === 'home' && (
        <HomePage
          onJoin={handleJoin}
          connected={connected}
          error={error}
          clearError={clearError}
          emit={emit}
          gameState={gameState}
        />
      )}
      {page === 'player' && (
        <PlayerPage gameState={gameState} emit={emit} side={playerSide} onLeave={handleLeave} />
      )}
      {page === 'referee' && (
        <RefereePage gameState={gameState} emit={emit} onLeave={handleLeave} />
      )}
      {page === 'spectator' && (
        <SpectatorPage gameState={gameState} onLeave={handleLeave} />
      )}
    </div>
  );
}
