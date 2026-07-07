import React, { useState, useCallback } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import HomeScreen  from './screens/HomeScreen';
import LobbyScreen from './screens/LobbyScreen';
import GameBoard   from './game/GameBoard';

export default function App() {
  const [screen,      setScreen]      = useState('home'); // 'home' | 'lobby' | 'game'
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
        break;

      case 'room_joined':
        setRoomId(msg.roomId);
        setPlayerId(msg.playerId);
        setPlayers(msg.players ?? [msg.playerId]);
        setPlayerNames(msg.names ?? {});
        setIsHost(false);
        setTurnDurationMs(msg.turnDurationMs ?? 60000);
        setScreen('lobby');
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

  const { send } = useWebSocket(handleMessage);

  // Called by HomeScreen when the player locks in their name
  const handleSetName = useCallback((name) => {
    // We'll also update playerNames once we know our playerId (in room_created / room_joined)
    // Nothing to do here yet — name goes out in the WS payload
  }, []);

  return (
    <>
      {error && <div style={styles.errorBanner}>{error}</div>}

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
};
