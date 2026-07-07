import React from 'react';
import { GEM_COLORS, GEM_ORDER, AVATAR_COLORS, playerLabel } from './constants';

export default function PlayerPanel({ player, playerIndex, isActive, myPlayerId, secondsLeft = null }) {
  const isMe = player.id === myPlayerId;
  const name = player.name || playerLabel(player.id, myPlayerId);
  const avatarBg = AVATAR_COLORS[playerIndex % AVATAR_COLORS.length];

  return (
    <div className={`player-panel ${isActive ? 'active-player' : ''}`}>
      {player.skipped && <div className="skipped-badge">AFK — skipped</div>}
      {isActive && (
        <div className="turn-indicator">
          {isMe ? 'YOUR TURN' : 'THEIR TURN'}
          {typeof secondsLeft === 'number' && (
            <span className={`turn-timer${secondsLeft <= 10 ? ' low' : ''}`}> · {secondsLeft}s</span>
          )}
        </div>
      )}

      {/* ── Header: avatar | name | score ── */}
      <div className="pp-top">
        <div className="pp-avatar" style={{ background: avatarBg }}>
          {name.slice(0, 2).toUpperCase()}
        </div>
        <span className="pp-name">{name}</span>
        <div className="pp-score">{player.score}</div>
      </div>

      {/* ── Color columns ──────────────────────────────────────
          CRITICAL: rectangle (cards bought) above circle (coins)
          Same gem color in each vertical column.
      ── */}
      <div className="color-cols">
        {GEM_ORDER.map(color => (
          <div key={color} className="color-col">
            {/* Rectangle = bought cards of this color */}
            <div
              className="cc-rect"
              style={{ background: GEM_COLORS[color].card }}
            >
              {player.cards[color] || 0}
            </div>
            {/* Circle = coins/gems of this color */}
            <div
              className="cc-circle"
              style={{
                background: GEM_COLORS[color].bg,
                borderColor: GEM_COLORS[color].border,
              }}
            >
              {player.gems[color] || 0}
            </div>
          </div>
        ))}
      </div>

      {/* ── Footer: gold coin | reserved count ── */}
      <div className="pp-footer">
        <div className="pp-gold">
          <div className="pp-gold-circle">{player.gems.gold || 0}</div>
          <span>gold</span>
        </div>
        <span className="pp-reserved">
          {player.reserved.length > 0 ? `${player.reserved.length} rsv` : ''}
        </span>
      </div>
    </div>
  );
}
