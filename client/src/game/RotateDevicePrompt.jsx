import React from 'react';

export default function RotateDevicePrompt() {
  return (
    <div style={styles.page}>
      <div style={styles.icon}>⟳</div>
      <div style={styles.title}>Rotate your device</div>
      <p style={styles.sub}>Gamesclub needs a landscape screen to show the whole board.</p>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#ffffff',
    color: '#334155',
    textAlign: 'center',
    padding: '24px',
    fontFamily: "'DM Sans', sans-serif",
  },
  icon: {
    fontSize: '3rem',
    marginBottom: '16px',
  },
  title: {
    fontSize: '1.3rem',
    fontWeight: 700,
    color: '#b8860b',
    marginBottom: '8px',
  },
  sub: {
    fontSize: '0.95rem',
    color: '#64748b',
    maxWidth: '280px',
  },
};
