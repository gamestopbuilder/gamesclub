import React from 'react';
import { GEM_COLORS, GEM_ORDER, canAfford, totalGems } from './constants';

export default function BottomBar({
  myPlayer,
  pendingGems,
  isMyTurn,
  canEndTurn,
  onGemReturn,
  onEndTurn,
  selectedCardId,
  onSelectCard,
  onBuy,
}) {
  const gemCount = totalGems(myPlayer);

  return (
    <div className="bottom-bar">

      {/* ── Zone 1 (150px): Gems picked this turn ── */}
      <div className="zone-hand">
        <div className="zone-label">Gems this turn</div>
        <div className="hand-gems">
          {pendingGems.map((color, i) => (
            <div
              key={i}
              className="hand-gem"
              style={{ background: GEM_COLORS[color].bg }}
              title="Click to return to bank"
              onClick={() => isMyTurn && onGemReturn(i)}
            />
          ))}
          {pendingGems.length === 0 && isMyTurn && (
            <span style={{ fontSize: 10, color: '#4a5568', lineHeight: 1.2 }}>
              Click gem circles →
            </span>
          )}
          {!isMyTurn && (
            <span className="not-my-turn-hint">Waiting for your turn…</span>
          )}
        </div>
      </div>

      {/* ── Zone 2 (flex): My cards + coins + reserved ── */}
      <div className="zone-center">

        {/* Color columns — rectangle (cards) above circle (coins) per color */}
        <div>
          <div className="my-color-cols">
            {GEM_ORDER.map(color => (
              <div key={color} className="my-color-col">
                {/* Rectangle = bought cards of this color */}
                <div
                  className="my-cc-rect"
                  style={{ background: GEM_COLORS[color].card }}
                >
                  {myPlayer.cards[color] || 0}
                </div>
                {/* Circle = coins of this color */}
                <div
                  className="my-cc-circle"
                  style={{
                    background:  GEM_COLORS[color].bg,
                    borderColor: GEM_COLORS[color].border,
                  }}
                >
                  {myPlayer.gems[color] || 0}
                </div>
              </div>
            ))}

            {/* Gold — circle only (no card-type bonus for gold) */}
            <div className="my-color-col">
              <div className="my-cc-rect" style={{ background: 'transparent' }} />
              <div
                className="my-cc-circle"
                style={{
                  background:  GEM_COLORS.gold.bg,
                  borderColor: GEM_COLORS.gold.border,
                }}
              >
                {myPlayer.gems.gold || 0}
              </div>
            </div>
          </div>

          <div className="gem-total">{gemCount} / 10 gems</div>
        </div>

        {/* Reserved cards mini view */}
        {myPlayer.reserved.length > 0 && (
          <div className="reserved-cards">
            {myPlayer.reserved.map(card => {
              const isSelected  = selectedCardId === card.id;
              const affordable  = canAfford(myPlayer, card);
              const costsToShow = GEM_ORDER.filter(c => (card.cost[c] || 0) > 0);

              return (
                <div
                  key={card.id}
                  className={`reserved-card ${isSelected ? 'selected' : ''}`}
                  onClick={e => { e.stopPropagation(); onSelectCard(card); }}
                  title={`Tier ${card.tier} reserved card — ${affordable ? 'you can afford this' : 'cannot afford yet'}`}
                >
                  {/* Mini card face */}
                  <div className={`card-top tier-${card.tier}`} style={{ flex: '0 0 28px', padding: 3 }}>
                    <div className="card-pts" style={{ width: 13, height: 13, fontSize: 9 }}>
                      {card.points > 0 ? card.points : ''}
                    </div>
                    <div
                      className="card-gem-badge"
                      style={{
                        background:  GEM_COLORS[card.gem].bg,
                        borderColor: GEM_COLORS[card.gem].border,
                        width: 10, height: 10,
                      }}
                    />
                  </div>
                  <div className="card-costs" style={{ flex: 1, padding: '2px 3px', gap: 2 }}>
                    {costsToShow.map(c => (
                      <div
                        key={c}
                        className="cost-circle"
                        style={{ background: GEM_COLORS[c].bg, width: 12, height: 12, fontSize: 8 }}
                      >
                        {card.cost[c]}
                      </div>
                    ))}
                  </div>

                  {/* Buy overlay when selected */}
                  {isSelected && isMyTurn && (
                    <div
                      onClick={e => e.stopPropagation()}
                      style={{
                        position:    'absolute',
                        inset:       0,
                        background:  'rgba(0,0,0,0.75)',
                        display:     'flex',
                        alignItems:  'center',
                        justifyContent: 'center',
                        borderRadius: 4,
                      }}
                    >
                      <button
                        className="ca-btn ca-buy"
                        disabled={!affordable}
                        style={{ fontSize: 10, padding: '4px 6px', ...(affordable ? {} : { opacity: 0.4, cursor: 'not-allowed' }) }}
                        onClick={e => { e.stopPropagation(); if (affordable) onBuy(card); }}
                      >
                        {affordable ? 'Buy' : '—'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Zone 3 (120px): Score + End Turn ── */}
      <div className="zone-right">
        <div className="score-badge">⭐ {myPlayer.score} pts</div>
        <button
          className={`end-turn-btn ${canEndTurn ? 'active' : ''}`}
          disabled={!canEndTurn}
          onClick={canEndTurn ? onEndTurn : undefined}
          title={canEndTurn ? 'Confirm gem selection' : 'Select gems first'}
        >
          End Turn
        </button>
      </div>
    </div>
  );
}
