import React from 'react';
import { GEM_COLORS, GEM_ORDER, canAfford } from './constants';

export default function Card({ card, isMyTurn, isSelected, myPlayer, onSelect, onBuy, onReserve, popupBelow = false }) {
  // Empty slot — render a transparent spacer to keep the row aligned
  if (!card) {
    return <div style={{ width: 112, height: 144, flexShrink: 0 }} />;
  }

  const affordable = myPlayer ? canAfford(myPlayer, card) : false;
  const costsToShow = GEM_ORDER.filter(color => (card.cost[color] || 0) > 0);

  function handleClick(e) {
    e.stopPropagation(); // prevent game-board click from deselecting immediately
    onSelect(card);
  }

  return (
    <div
      className={[
        'card',
        isSelected ? 'highlighted' : '',
        !isSelected && isMyTurn && affordable ? 'can-afford' : '',
      ].join(' ')}
      onClick={handleClick}
    >
      {/* ── Action popup (shows above the card when selected) ── */}
      {isSelected && isMyTurn && (
        <div className={`card-actions show${popupBelow ? ' popup-below' : ''}`} onClick={e => e.stopPropagation()}>
          <button
            className="ca-btn ca-buy"
            disabled={!affordable}
            onClick={e => { e.stopPropagation(); if (affordable) onBuy(card); }}
          >
            {affordable ? '✓ Buy' : '✗ Buy'}
          </button>
          <button
            className="ca-btn ca-reserve"
            onClick={e => { e.stopPropagation(); onReserve(card); }}
          >
            Reserve
          </button>
          <div className="ca-arrow" />
        </div>
      )}

      {/* ── Card top: prestige points + gem produced ── */}
      <div className={`card-top tier-${card.tier}`}>
        {card.points > 0
          ? <div className="pts-star">{card.points}</div>
          : <div style={{ width: 32, height: 32 }} />
        }
        <div
          className="card-gem-badge"
          style={{
            background: GEM_COLORS[card.gem].bg,
            borderColor: GEM_COLORS[card.gem].border,
          }}
        />
      </div>

      {/* ── Card bottom: cost circles (coins, not rectangles) ── */}
      <div className="card-costs">
        {costsToShow.map(color => (
          <div
            key={color}
            className="cost-circle"
            style={{ background: GEM_COLORS[color].bg }}
          >
            {card.cost[color]}
          </div>
        ))}
      </div>
    </div>
  );
}
