// ── Gem visual config ────────────────────────────────────────
// bg   = token / coin circle color
// border = token border color
// card = bought-card rectangle color (darker shade)

export const GEM_COLORS = {
  diamond: { bg: '#a09070', border: '#c8b080', card: '#7a6840' },
  sapphire: { bg: '#2060a0', border: '#2060a0', card: '#1a5090' },
  emerald:  { bg: '#1a7a3a', border: '#1a7a3a', card: '#1a5a28' },
  ruby:     { bg: '#9a2020', border: '#9a2020', card: '#7a1818' },
  onyx:     { bg: '#303030', border: '#555555', card: '#282828' },
  gold:     { bg: '#c09020', border: '#f0c030', card: '#c09020' },
};

// The 5 gem colors in display order (no gold — gold is handled separately)
export const GEM_ORDER = ['diamond', 'sapphire', 'emerald', 'ruby', 'onyx'];

// Avatar background colors per seat index
export const AVATAR_COLORS = ['#2060a0', '#9a2020', '#1a7a3a', '#8a6020'];

// ── Helpers ──────────────────────────────────────────────────

/** Returns whether a player can afford a card (accounting for bonuses + gold wildcards) */
export function canAfford(player, card) {
  let goldNeeded = 0;
  for (const color of GEM_ORDER) {
    const cost      = card.cost[color] || 0;
    const discount  = player.cards[color] || 0;
    const have      = player.gems[color] || 0;
    const shortfall = Math.max(0, cost - discount - have);
    goldNeeded += shortfall;
  }
  return goldNeeded <= (player.gems.gold || 0);
}

/** Short display name for a player */
export function playerLabel(playerId, myPlayerId) {
  return playerId === myPlayerId ? 'You' : `P-${playerId.slice(0, 4)}`;
}

/** Total gems in a player's hand (all colors including gold) */
export function totalGems(player) {
  return [...GEM_ORDER, 'gold'].reduce((s, c) => s + (player.gems[c] || 0), 0);
}
