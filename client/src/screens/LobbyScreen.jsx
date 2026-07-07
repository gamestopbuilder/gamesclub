import React, { useState } from 'react';

const TIMER_OPTIONS_SEC = [30, 60, 90, 120];

export default function LobbyScreen({ roomId, playerId, players, playerNames = {}, isHost, send, turnDurationMs = 60000 }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleStart() {
    send('start_game');
  }

  function handleTimerSelect(seconds) {
    send('set_timer', { durationMs: seconds * 1000 });
  }

  const canStart = isHost && players.length >= 2;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.heading}>Waiting for players</h2>

        <div style={styles.codeBlock}>
          <p style={styles.codeLabel}>Room Code</p>
          <div style={styles.codeRow}>
            <span style={styles.code}>{roomId}</span>
            <button style={styles.copyBtn} onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p style={styles.codeHint}>Share this code with your friends</p>
        </div>

        <div style={styles.playerList}>
          <p style={styles.playerListLabel}>Players ({players.length} / 4)</p>
          {players.map((pid) => {
            const displayName = playerNames[pid] || `Player-${pid.slice(0, 4)}`;
            const isMe = pid === playerId;
            return (
              <div key={pid} style={styles.playerRow}>
                <span style={styles.dot} />
                <span style={styles.playerName}>
                  {displayName}{isMe ? ' (You)' : ''}
                  {pid === players[0] && <span style={styles.hostBadge}>Host</span>}
                </span>
              </div>
            );
          })}
        </div>

        <div style={styles.timerBlock}>
          <p style={styles.playerListLabel}>Turn timer</p>
          {isHost ? (
            <div style={styles.timerOptions}>
              {TIMER_OPTIONS_SEC.map((sec) => {
                const active = turnDurationMs === sec * 1000;
                return (
                  <button
                    key={sec}
                    style={{ ...styles.timerBtn, ...(active ? styles.timerBtnActive : {}) }}
                    onClick={() => handleTimerSelect(sec)}
                  >
                    {sec}s
                  </button>
                );
              })}
            </div>
          ) : (
            <p style={styles.timerReadout}>{turnDurationMs / 1000} seconds per turn</p>
          )}
        </div>

        {isHost ? (
          <button
            style={{ ...styles.startBtn, ...(canStart ? {} : styles.startBtnDisabled) }}
            onClick={handleStart}
            disabled={!canStart}
          >
            {canStart ? 'Start Game' : `Waiting for more players…`}
          </button>
        ) : (
          <p style={styles.waitingText}>Waiting for the host to start the game…</p>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    background: '#16213e',
    borderRadius: '16px',
    padding: '48px 56px',
    textAlign: 'center',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    minWidth: '380px',
  },
  heading: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#e2b96f',
    marginBottom: '32px',
  },
  codeBlock: {
    background: '#0f1929',
    borderRadius: '12px',
    padding: '20px 24px',
    marginBottom: '28px',
  },
  codeLabel: {
    fontSize: '0.75rem',
    color: '#8892a4',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    marginBottom: '8px',
  },
  codeRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    marginBottom: '8px',
  },
  code: {
    fontSize: '2rem',
    fontWeight: '700',
    letterSpacing: '0.3em',
    color: '#fff',
  },
  copyBtn: {
    padding: '6px 14px',
    borderRadius: '6px',
    border: '1px solid #2a3a5c',
    background: 'transparent',
    color: '#8892a4',
    fontSize: '0.8rem',
    cursor: 'pointer',
  },
  codeHint: {
    fontSize: '0.8rem',
    color: '#4a5568',
    margin: 0,
  },
  playerList: {
    marginBottom: '28px',
    textAlign: 'left',
  },
  playerListLabel: {
    fontSize: '0.75rem',
    color: '#8892a4',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    marginBottom: '12px',
  },
  playerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 0',
    borderBottom: '1px solid #1e2d4a',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#4caf7d',
    flexShrink: 0,
  },
  playerName: {
    fontSize: '0.95rem',
    color: '#cdd6f4',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  hostBadge: {
    fontSize: '0.65rem',
    background: '#2a3a5c',
    color: '#e2b96f',
    padding: '2px 8px',
    borderRadius: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  timerBlock: {
    marginBottom: '28px',
    textAlign: 'left',
  },
  timerOptions: {
    display: 'flex',
    gap: '8px',
  },
  timerBtn: {
    flex: 1,
    padding: '10px 0',
    borderRadius: '8px',
    border: '2px solid #2a3a5c',
    background: 'transparent',
    color: '#8892a4',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  timerBtnActive: {
    border: '2px solid #e2b96f',
    color: '#e2b96f',
    background: 'rgba(226,185,111,0.1)',
  },
  timerReadout: {
    fontSize: '0.9rem',
    color: '#cdd6f4',
    margin: 0,
  },
  startBtn: {
    width: '100%',
    padding: '14px 0',
    borderRadius: '8px',
    border: 'none',
    background: '#e2b96f',
    color: '#1a1a2e',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
    letterSpacing: '0.05em',
  },
  startBtnDisabled: {
    background: '#2a3a5c',
    color: '#4a5568',
    cursor: 'not-allowed',
  },
  waitingText: {
    fontSize: '0.9rem',
    color: '#4a5568',
    fontStyle: 'italic',
  },
};
