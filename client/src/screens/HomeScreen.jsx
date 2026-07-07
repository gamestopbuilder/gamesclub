import React, { useState } from 'react';

export default function HomeScreen({ send, onSetName }) {
  const [name,     setName]     = useState('');
  const [joining,  setJoining]  = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [error,    setError]    = useState('');

  function validateName() {
    if (!name.trim()) { setError('Enter your name first.'); return false; }
    setError('');
    return true;
  }

  function handleCreate() {
    if (!validateName()) return;
    onSetName(name.trim());
    send('create_room', { name: name.trim() });
  }

  function handleJoinSubmit() {
    const code = roomCode.trim().toUpperCase();
    if (!validateName()) return;
    if (!code) { setError('Enter a room code.'); return; }
    setError('');
    onSetName(name.trim());
    send('join_room', { roomId: code, name: name.trim() });
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Gamesclub</h1>
        <p style={styles.subtitle}>Splendor</p>

        {/* Name field — always shown first */}
        <div style={styles.field}>
          <label style={styles.label}>Your name</label>
          <input
            style={styles.input}
            placeholder="Enter your name"
            value={name}
            maxLength={20}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !joining && handleCreate()}
            autoFocus
          />
        </div>

        {error && <p style={styles.error}>{error}</p>}

        {!joining ? (
          <div style={styles.buttonGroup}>
            <button style={styles.btnPrimary} onClick={handleCreate}>
              Create Game
            </button>
            <button style={styles.btnSecondary} onClick={() => setJoining(true)}>
              Join Game
            </button>
          </div>
        ) : (
          <div style={styles.joinForm}>
            <input
              style={{ ...styles.input, letterSpacing: '0.2em', fontSize: '1.2rem', textAlign: 'center' }}
              placeholder="Room code"
              value={roomCode}
              maxLength={6}
              onChange={e => setRoomCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoinSubmit()}
              autoFocus
            />
            <div style={styles.buttonGroup}>
              <button style={styles.btnPrimary} onClick={handleJoinSubmit}>
                Join
              </button>
              <button style={styles.btnSecondary} onClick={() => { setJoining(false); setError(''); setRoomCode(''); }}>
                Back
              </button>
            </div>
          </div>
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
    minWidth: '340px',
  },
  title: {
    fontSize: '2.4rem',
    fontWeight: '700',
    color: '#e2b96f',
    marginBottom: '4px',
    letterSpacing: '0.05em',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#8892a4',
    marginBottom: '32px',
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
  },
  field: {
    textAlign: 'left',
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '0.75rem',
    color: '#8892a4',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '8px',
    border: '2px solid #2a3a5c',
    background: '#0f1929',
    color: '#eee',
    fontSize: '1rem',
    outline: 'none',
    boxSizing: 'border-box',
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  btnPrimary: {
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
  btnSecondary: {
    padding: '14px 0',
    borderRadius: '8px',
    border: '2px solid #2a3a5c',
    background: 'transparent',
    color: '#8892a4',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  joinForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  error: {
    color: '#e05c5c',
    fontSize: '0.85rem',
    margin: '0 0 12px',
  },
};
