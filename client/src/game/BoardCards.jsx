import React from 'react';
import Card from './Card';

// Tier 3 at top, tier 1 at bottom (Splendor standard layout)
const TIER_RENDER_ORDER = [2, 1, 0];

export default function BoardCards({
  tiers,
  isMyTurn,
  myPlayer,
  selectedCardId,
  onCardSelect,
  onBuy,
  onReserve,
}) {
  return (
    <div className="board-col">
      {TIER_RENDER_ORDER.map(tierIdx => {
        const tier    = tiers[tierIdx];
        const tierNum = tierIdx + 1; // 1-based tier label

        return (
          <div key={tierIdx} className="card-row">
            {/* Face-down deck — click to reserve blind from deck top */}
            <div
              className="tier-deck"
              style={{ cursor: (isMyTurn && tier.deck.length > 0) ? 'pointer' : 'default' }}
              title={
                tier.deck.length > 0
                  ? `Reserve from Tier ${tierNum} deck (${tier.deck.length} left)`
                  : `Tier ${tierNum} deck empty`
              }
              onClick={e => {
                e.stopPropagation();
                if (isMyTurn && tier.deck.length > 0) {
                  onReserve({ id: `deck_${tierNum}` });
                }
              }}
            >
              <div className="tier-numeral">{tierNum}</div>
              <div className="tier-count">{tier.deck.length}</div>
            </div>

            {/* Four face-up card slots */}
            {tier.face.map((card, slotIdx) => (
              <Card
                key={card ? card.id : `empty-t${tierIdx}-s${slotIdx}`}
                card={card}
                isMyTurn={isMyTurn}
                isSelected={!!card && selectedCardId === card.id}
                myPlayer={myPlayer}
                onSelect={onCardSelect}
                onBuy={onBuy}
                onReserve={onReserve}
                popupBelow={tierIdx === 2}  /* tier 3 is the top row — popup must open downward */
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
