import React from 'react';
import { GEM_COLORS, GEM_ORDER } from './constants';

// All 6 gem types shown in the right column; gold is last and non-clickable
const ALL_GEMS = [...GEM_ORDER, 'gold'];

export default function GemsCol({ gems, isMyTurn, pendingGems, onGemClick }) {
  return (
    <div className="gems-col">
      {ALL_GEMS.map(color => {
        const count    = gems[color] || 0;
        const isGold   = color === 'gold';
        const isPicking = pendingGems.some(g => g === color);
        const depleted = count === 0;

        // Determine whether this token is interactable this turn
        const clickable = isMyTurn && !isGold && !depleted;

        const classes = [
          'gem-token',
          clickable ? 'clickable' : '',
          isPicking  ? 'picking'   : '',
          depleted   ? 'depleted'  : '',
        ].filter(Boolean).join(' ');

        return (
          <div
            key={color}
            className={classes}
            style={{
              background:  GEM_COLORS[color].bg,
              borderColor: GEM_COLORS[color].border || 'rgba(255,255,255,0.15)',
              // Dim slightly when not your turn (except gold which is always informational)
              opacity: (!isMyTurn && !isGold) ? 0.6 : undefined,
            }}
            title={
              isGold
                ? `Gold wildcards: ${count} (gained by reserving cards)`
                : `${color}: ${count} in bank${isMyTurn ? ' — click to take' : ''}`
            }
            onClick={() => clickable && onGemClick(color)}
          >
            {count}
          </div>
        );
      })}
    </div>
  );
}
