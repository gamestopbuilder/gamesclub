import React from 'react';
import { GEM_COLORS } from './constants';

export default function NoblesCol({ nobles }) {
  const activeNobles = nobles.filter(Boolean);

  return (
    <div className="nobles-col">
      {activeNobles.map(noble => (
        <div key={noble.id} className="noble-tile">
          <div className="pts-star">{noble.points}</div>
          <div className="noble-req">
            {/*
              CRITICAL: noble requirements show RECTANGLES because they
              require bought development cards — not coins.
            */}
            {Object.entries(noble.requires).map(([color, count]) => (
              <div
                key={color}
                className="noble-rect"
                style={{ background: GEM_COLORS[color].card }}
              >
                {count}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
