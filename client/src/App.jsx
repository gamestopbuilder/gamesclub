import React, { useState, useCallback, useRef } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import HomeScreen  from './screens/HomeScreen';
import LobbyScreen from './screens/LobbyScreen';
import GameBoard   from './game/GameBoard';

const SESSION_KEY = 'gamesclub_session';

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(roomId, playerId) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ roomId, playerId }));
  } catch {
    // localStorage unavailable (private browsing, etc.) — reconnect just won't persist
  }
}

function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

export default function App() {
  const initialSession = useRef(loadSession());

  const [screen,      setScreen]      = useState(initialSession.current ? 'connecting' : 'home'); // 'home' | 'connecting' | 'lobby' | 'game'
  const [roomId,      setRoomId]      = useState(null);
  const [playerId,    setPlayerId]    = useState(null);
  const [players,     setPlayers]     = useState([]);
  const [playerNames, setPlayerNames] = useState({});   // { playerId: displayName }
  const [isHost,      setIsHost]      = useState(false);
  const [gameState,   setGameState]   = useState(null);
  const [error,       setError]       = useState(null);
  const [turnDurationMs, setTurnDurationMs] = useState(60000);

  const handleMessage = useCallback((msg) => {
    switch (msg.type) {
      case 'room_created':
        setRoomId(msg.roomId);
        setPlayerId(msg.playerId);
        setPlayers([msg.playerId]);
        setPlayerNames({ [msg.playerId]: msg.name });
        setIsHost(true);
        setTurnDurationMs(msg.turnDurationMs ?? 60000);
        setScreen('lobby');
        saveSession(msg.roomId, msg.playerId);
        break;

      case 'room_joined':
        setRoomId(msg.roomId);
        setPlayerId(msg.playerId);
        setPlayers(msg.players ?? [msg.playerId]);
        setPlayerNames(msg.names ?? {});
        setIsHost(false);
        setTurnDurationMs(msg.turnDurationMs ?? 60000);
        setScreen('lobby');
        saveSession(msg.roomId, msg.playerId);
        break;

      // Response to a rejoin_room attempt — restores whichever screen we were on.
      case 'rejoined':
        setRoomId(msg.roomId);
        setPlayerId(msg.playerId);
        setPlayers(msg.players ?? [msg.playerId]);
        setPlayerNames(msg.names ?? {});
        setIsHost(!!msg.isHost);
        setTurnDurationMs(msg.turnDurationMs ?? 60000);
        if (msg.state) {
          setGameState(msg.state);
          setScreen('game');
        } else {
          setScreen('lobby');
        }
        saveSession(msg.roomId, msg.playerId);
        break;

      case 'rejoin_failed':
        clearSession();
        setScreen('home');
        break;

      case 'timer_set':
        setTurnDurationMs(msg.durationMs);
        break;

      case 'player_joined':
        setPlayers(prev => prev.includes(msg.playerId) ? prev : [...prev, msg.playerId]);
        setPlayerNames(prev => ({ ...prev, [msg.playerId]: msg.name ?? msg.playerId }));
        break;

      case 'player_left':
        setPlayers(prev => prev.filter(id => id !== msg.playerId));
        break;

      case 'game_started':
        setGameState(msg.state);
        setScreen('game');
        break;

      case 'game_state':
        setGameState(msg.state);
        break;

      case 'error':
        setError(msg.message);
        setTimeout(() => setError(null), 4000);
        break;

      default:
        break;
    }
  }, []);

  // Fires on every successful connection (first load AND automatic
  // reconnects after a drop) — if we have a saved session, reclaim it.
  const handleOpen = useCallback(() => {
    const session = loadSession();
    if (session?.roomId && session?.playerId) {
      send('rejoin_room', session);
    }
  }, []);

  const { send } = useWebSocket(handleMessage, handleOpen);

  // Called by HomeScreen when the player locks in their name
  const handleSetName = useCallback((name) => {
    // We'll also update playerNames once we know our playerId (in room_created / room_joined)
    // Nothing to do here yet — name goes out in the WS payload
  }, []);

  return (
    <>
      {error && <div style={styles.errorBanner}>{error}</div>}

      {screen === 'connecting' && (
        <div style={styles.connectingPage}>Reconnecting…</div>
      )}

      {screen === 'home' && (
        <HomeScreen send={send} onSetName={handleSetName} />
      )}

      {screen === 'lobby' && (
        <LobbyScreen
          roomId={roomId}
          playerId={playerId}
          players={players}
          playerNames={playerNames}
          isHost={isHost}
          send={send}
          turnDurationMs={turnDurationMs}
        />
      )}

      {screen === 'game' && gameState && (
        <GameBoard
          gameState={gameState}
          myPlayerId={playerId}
          send={send}
        />
      )}
    </>
  );
}

const styles = {
  errorBanner: {
    position:     'fixed',
    top:          '16px',
    left:         '50%',
    transform:    'translateX(-50%)',
    background:   '#e05c5c',
    color:        '#fff',
    padding:      '10px 24px',
    borderRadius: '8px',
    fontWeight:   '600',
    fontSize:     '0.9rem',
    zIndex:       1000,
    boxShadow:    '0 4px 12px rgba(0,0,0,0.3)',
  },
  connectingPage: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#8892a4',
    fontSize: '1.1rem',
  },
};
