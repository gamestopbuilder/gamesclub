const { CARDS } = require('./cards');
const { NOBLES } = require('./nobles');

const COLORS = ['diamond', 'sapphire', 'emerald', 'ruby', 'onyx'];

// ── Utilities ────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function gemPoolFor(numPlayers) {
  const n = numPlayers === 2 ? 4 : numPlayers === 3 ? 5 : 7;
  return { diamond: n, sapphire: n, emerald: n, ruby: n, onyx: n, gold: 5 };
}

function makeTier(tier) {
  const cards = shuffle(CARDS.filter(c => c.tier === tier));
  return { deck: cards.slice(4), face: cards.slice(0, 4) };
}

function totalGems(player) {
  return Object.values(player.gems).reduce((s, v) => s + v, 0);
}

// Discard `count` gems from `player`, returning them to the bank.
// Used only as the timeout fallback — colors with the highest holdings go first.
function autoDiscardExcess(state, player, count) {
  let remaining = count;
  const order = [...COLORS, 'gold'].sort((a, b) => (player.gems[b] || 0) - (player.gems[a] || 0));
  for (const color of order) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, player.gems[color] || 0);
    player.gems[color] -= take;
    state.gems[color] = (state.gems[color] || 0) + take;
    remaining -= take;
  }
}

// ── Affordability (used server-side for validation) ──────────

function canAfford(player, card) {
  let goldNeeded = 0;
  for (const color of COLORS) {
    const cost = (card.cost[color] || 0);
    const discount = (player.cards[color] || 0);
    const have = (player.gems[color] || 0);
    const shortfall = Math.max(0, cost - discount - have);
    goldNeeded += shortfall;
  }
  return goldNeeded <= (player.gems.gold || 0);
}

// ── Game creation ────────────────────────────────────────────

function createGame(playerIds, playerNames = {}, turnDurationMs = 60000) {
  const n = playerIds.length;
  const players = playerIds.map(id => ({
    id,
    name:     playerNames[id] || `Player-${id.slice(0, 4)}`,
    gems:     { diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0, gold: 0 },
    cards:    { diamond: 0, sapphire: 0, emerald: 0, ruby: 0, onyx: 0 }, // bought-card bonuses
    reserved: [],   // full card objects, max 3
    nobles:   [],
    score:    0,
    consecutiveTimeouts: 0,
    skipped:  false,  // true once a player has 3 consecutive timeouts — auto-passed forever after
  }));

  return {
    players,
    gems: gemPoolFor(n),
    tiers: [makeTier(1), makeTier(2), makeTier(3)],
    nobles: shuffle(NOBLES).slice(0, n + 1),
    currentPlayerIndex: 0,
    phase: 'playing',   // 'playing' | 'ended'
    lastRound: false,
    lastRoundStarterIndex: null,
    winner: null,
    pendingDiscard: null,     // { playerId, count } — set when a reserve pushes a player over 10 gems
    turnDurationMs,
    turnDeadline: null,       // absolute timestamp; set by the server when it (re)schedules the turn timer
  };
}

// ── Noble check ──────────────────────────────────────────────

function checkNobles(state, player) {
  for (let i = 0; i < state.nobles.length; i++) {
    const noble = state.nobles[i];
    if (!noble) continue;
    const qualifies = Object.entries(noble.requires).every(
      ([color, needed]) => (player.cards[color] || 0) >= needed
    );
    if (qualifies) {
      player.score += noble.points;
      player.nobles.push({ ...noble });
      state.nobles[i] = null;
      break; // one noble per turn
    }
  }
}

// ── Buy a card (mutates state) ───────────────────────────────

function executeCardBuy(state, player, card, tierIndex, faceIndex) {
  // Pay gems, returning surplus to pool
  for (const color of COLORS) {
    const cost      = (card.cost[color] || 0);
    const discount  = (player.cards[color] || 0);
    let   remaining = Math.max(0, cost - discount);

    const fromGems = Math.min(remaining, player.gems[color] || 0);
    player.gems[color] = (player.gems[color] || 0) - fromGems;
    state.gems[color]  = (state.gems[color]  || 0) + fromGems;
    remaining -= fromGems;

    if (remaining > 0) {
      player.gems.gold -= remaining;
      state.gems.gold  += remaining;
    }
  }

  // Credit the card
  player.cards[card.gem] = (player.cards[card.gem] || 0) + 1;
  player.score += card.points;

  // Refill board slot from deck
  if (tierIndex !== -1 && faceIndex !== -1) {
    const tier = state.tiers[tierIndex];
    tier.face[faceIndex] = tier.deck.length > 0 ? tier.deck.pop() : null;
  }
}

// ── Advance turn & check end ─────────────────────────────────

function advanceTurn(state, player) {
  checkNobles(state, player);

  // Trigger last round when someone hits 15
  if (player.score >= 15 && !state.lastRound) {
    state.lastRound = true;
    state.lastRoundStarterIndex = state.currentPlayerIndex;
  }

  state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;

  // End game when the round is complete (everyone had the same number of turns)
  if (state.lastRound && state.currentPlayerIndex === state.lastRoundStarterIndex) {
    state.phase = 'ended';
    // Pick winner: highest score; tie goes to fewest bought cards
    let winner = state.players[0];
    for (const p of state.players.slice(1)) {
      const pCards = Object.values(p.cards).reduce((a, b) => a + b, 0);
      const wCards = Object.values(winner.cards).reduce((a, b) => a + b, 0);
      if (p.score > winner.score || (p.score === winner.score && pCards < wCards)) {
        winner = p;
      }
    }
    state.winner = winner.id;
  }
}

// ── Main action handler ──────────────────────────────────────

function applyAction(state, playerId, action) {
  if (state.phase !== 'playing') {
    return { error: 'Game is already over' };
  }

  const currentPlayer = state.players[state.currentPlayerIndex];
  if (currentPlayer.id !== playerId) {
    return { error: 'It is not your turn' };
  }

  const player = currentPlayer;

  // ── pending discard gate ─────────────────────────────────────
  // A reserve that pushed this player over 10 gems must be resolved
  // with discard_gems before any other action is accepted.
  if (state.pendingDiscard) {
    if (action.type !== 'discard_gems') {
      return { error: 'You must discard gems down to the 10-gem limit first' };
    }
    return handleDiscard(state, player, action);
  }

  // ── take_gems ──────────────────────────────────────────────
  if (action.type === 'take_gems') {
    const gems = action.gems; // array of color strings, e.g. ['diamond', 'sapphire']
    if (!Array.isArray(gems) || gems.length === 0) {
      return { error: 'No gems selected' };
    }

    // Count occurrences of each color
    const counts = {};
    for (const g of gems) counts[g] = (counts[g] || 0) + 1;
    const colors = Object.keys(counts);

    const allDifferent = gems.length <= 3 && colors.length === gems.length;
    const twoSame      = gems.length === 2 && colors.length === 1;

    if (!allDifferent && !twoSame) {
      return { error: 'Invalid gem selection: take 1-3 different or 2 of the same' };
    }

    if (twoSame) {
      const col = colors[0];
      if ((state.gems[col] || 0) < 4) {
        return { error: `Need at least 4 ${col} gems in the bank to take 2` };
      }
    }

    // Availability check
    for (const [color, count] of Object.entries(counts)) {
      if ((state.gems[color] || 0) < count) {
        return { error: `Not enough ${color} gems in the bank` };
      }
    }

    // 10-gem hand limit
    if (totalGems(player) + gems.length > 10) {
      return { error: 'Taking those gems would exceed your 10-gem hand limit' };
    }

    for (const [color, count] of Object.entries(counts)) {
      state.gems[color]        -= count;
      player.gems[color] = (player.gems[color] || 0) + count;
    }

    player.consecutiveTimeouts = 0;
    advanceTurn(state, player);
    return { ok: true };
  }

  // ── buy_card ───────────────────────────────────────────────
  if (action.type === 'buy_card') {
    const { cardId } = action;

    // Search reserved first
    const resIdx = player.reserved.findIndex(c => c && c.id === cardId);
    if (resIdx !== -1) {
      const card = player.reserved[resIdx];
      if (!canAfford(player, card)) return { error: 'Cannot afford this card' };
      executeCardBuy(state, player, card, -1, -1);
      player.reserved.splice(resIdx, 1);
      player.consecutiveTimeouts = 0;
      advanceTurn(state, player);
      return { ok: true };
    }

    // Search face-up board
    for (let t = 0; t < state.tiers.length; t++) {
      const fi = state.tiers[t].face.findIndex(c => c && c.id === cardId);
      if (fi !== -1) {
        const card = state.tiers[t].face[fi];
        if (!canAfford(player, card)) return { error: 'Cannot afford this card' };
        executeCardBuy(state, player, card, t, fi);
        player.consecutiveTimeouts = 0;
        advanceTurn(state, player);
        return { ok: true };
      }
    }

    return { error: 'Card not found on the board' };
  }

  // ── reserve_card ───────────────────────────────────────────
  if (action.type === 'reserve_card') {
    if (player.reserved.length >= 3) {
      return { error: 'You already have 3 reserved cards' };
    }

    const { cardId } = action;
    let card = null;
    let tierIndex = -1;
    let faceIndex = -1;

    // Reserve from deck top: cardId = 'deck_1' / 'deck_2' / 'deck_3'
    if (cardId.startsWith('deck_')) {
      const t = parseInt(cardId.slice(5), 10) - 1;
      const tier = state.tiers[t];
      if (!tier || tier.deck.length === 0) {
        return { error: 'That deck is empty' };
      }
      card = tier.deck.pop();
      tierIndex = t;
    } else {
      // Reserve a face-up card
      for (let t = 0; t < state.tiers.length; t++) {
        const fi = state.tiers[t].face.findIndex(c => c && c.id === cardId);
        if (fi !== -1) {
          card = state.tiers[t].face[fi];
          tierIndex = t;
          faceIndex = fi;
          break;
        }
      }
    }

    if (!card) return { error: 'Card not found' };

    // Take gold if available
    if (state.gems.gold > 0) {
      state.gems.gold--;
      player.gems.gold = (player.gems.gold || 0) + 1;
    }

    player.reserved.push({ ...card });

    // Refill face-up slot
    if (faceIndex !== -1) {
      const tier = state.tiers[tierIndex];
      tier.face[faceIndex] = tier.deck.length > 0 ? tier.deck.pop() : null;
    }

    player.consecutiveTimeouts = 0;

    // Taking a gold gem may push the player over the 10-gem hand limit —
    // they must discard back down before the turn can advance.
    const excess = totalGems(player) - 10;
    if (excess > 0) {
      state.pendingDiscard = { playerId: player.id, count: excess };
      return { ok: true };
    }

    advanceTurn(state, player);
    return { ok: true };
  }

  return { error: `Unknown action type: ${action.type}` };
}

// ── discard_gems (resolves a pendingDiscard) ──────────────────

function handleDiscard(state, player, action) {
  const { count } = state.pendingDiscard;
  const gems = action.gems;
  if (!gems || typeof gems !== 'object' || Array.isArray(gems)) {
    return { error: 'Invalid discard payload' };
  }

  const allColors = [...COLORS, 'gold'];
  let total = 0;
  for (const color of allColors) {
    const n = gems[color] || 0;
    if (n < 0 || !Number.isInteger(n)) return { error: 'Invalid discard amount' };
    if (n > (player.gems[color] || 0)) return { error: `You don't have that many ${color} gems` };
    total += n;
  }
  if (total !== count) {
    return { error: `You must discard exactly ${count} gem(s)` };
  }

  for (const color of allColors) {
    const n = gems[color] || 0;
    if (n > 0) {
      player.gems[color] -= n;
      state.gems[color]  = (state.gems[color] || 0) + n;
    }
  }

  state.pendingDiscard = null;
  player.consecutiveTimeouts = 0;
  advanceTurn(state, player);
  return { ok: true };
}

// ── Turn timeout (called by the server when a player's clock runs out) ──
// Auto-resolves any pending discard, counts the timeout, and passes the turn.

function resolveTimeout(state) {
  const player = state.players[state.currentPlayerIndex];

  if (state.pendingDiscard && state.pendingDiscard.playerId === player.id) {
    autoDiscardExcess(state, player, state.pendingDiscard.count);
    state.pendingDiscard = null;
  }

  if (!player.skipped) {
    player.consecutiveTimeouts += 1;
    if (player.consecutiveTimeouts >= 3) {
      player.skipped = true;
    }
  }

  advanceTurn(state, player);
}

module.exports = { createGame, applyAction, canAfford, resolveTimeout };
