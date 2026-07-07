// All 90 Splendor development cards: 40 tier-1, 30 tier-2, 20 tier-3
// Format: { id, tier, gem (produced), points, cost: { color: count } }

function c(id, tier, gem, points, cost) {
  return { id, tier, gem, points, cost };
}

const CARDS = [
  // ── TIER 1 (40 cards) ────────────────────────────────────────
  // Diamond-producing
  c('d1_1', 1, 'diamond', 0, { onyx: 3 }),
  c('d1_2', 1, 'diamond', 0, { sapphire: 1, emerald: 1, ruby: 1, onyx: 1 }),
  c('d1_3', 1, 'diamond', 0, { onyx: 2, ruby: 1 }),
  c('d1_4', 1, 'diamond', 0, { sapphire: 1, emerald: 2, ruby: 1 }),
  c('d1_5', 1, 'diamond', 0, { sapphire: 2, ruby: 2 }),
  c('d1_6', 1, 'diamond', 0, { emerald: 3 }),
  c('d1_7', 1, 'diamond', 0, { ruby: 2, emerald: 1 }),
  c('d1_8', 1, 'diamond', 1, { onyx: 4 }),

  // Sapphire-producing
  c('s1_1', 1, 'sapphire', 0, { diamond: 3 }),
  c('s1_2', 1, 'sapphire', 0, { diamond: 1, emerald: 1, ruby: 1, onyx: 1 }),
  c('s1_3', 1, 'sapphire', 0, { diamond: 2, onyx: 1 }),
  c('s1_4', 1, 'sapphire', 0, { diamond: 1, emerald: 1, ruby: 2 }),
  c('s1_5', 1, 'sapphire', 0, { onyx: 2, ruby: 2 }),
  c('s1_6', 1, 'sapphire', 0, { ruby: 3 }),
  c('s1_7', 1, 'sapphire', 0, { diamond: 2, ruby: 1 }),
  c('s1_8', 1, 'sapphire', 1, { diamond: 4 }),

  // Emerald-producing
  c('e1_1', 1, 'emerald', 0, { sapphire: 3 }),
  c('e1_2', 1, 'emerald', 0, { diamond: 1, sapphire: 1, ruby: 1, onyx: 1 }),
  c('e1_3', 1, 'emerald', 0, { sapphire: 2, diamond: 1 }),
  c('e1_4', 1, 'emerald', 0, { sapphire: 2, onyx: 2 }),
  c('e1_5', 1, 'emerald', 0, { diamond: 2, sapphire: 1 }),
  c('e1_6', 1, 'emerald', 0, { ruby: 3 }),
  c('e1_7', 1, 'emerald', 0, { sapphire: 2, ruby: 1 }),
  c('e1_8', 1, 'emerald', 1, { sapphire: 4 }),

  // Ruby-producing
  c('r1_1', 1, 'ruby', 0, { emerald: 3 }),
  c('r1_2', 1, 'ruby', 0, { diamond: 1, sapphire: 1, emerald: 1, onyx: 1 }),
  c('r1_3', 1, 'ruby', 0, { emerald: 2, sapphire: 1 }),
  c('r1_4', 1, 'ruby', 0, { emerald: 2, onyx: 2 }),
  c('r1_5', 1, 'ruby', 0, { sapphire: 3 }),
  c('r1_6', 1, 'ruby', 0, { onyx: 2, diamond: 1 }),
  c('r1_7', 1, 'ruby', 0, { emerald: 2, sapphire: 2 }),
  c('r1_8', 1, 'ruby', 1, { emerald: 4 }),

  // Onyx-producing
  c('o1_1', 1, 'onyx', 0, { ruby: 3 }),
  c('o1_2', 1, 'onyx', 0, { diamond: 1, sapphire: 1, emerald: 1, ruby: 1 }),
  c('o1_3', 1, 'onyx', 0, { ruby: 2, diamond: 1 }),
  c('o1_4', 1, 'onyx', 0, { ruby: 2, emerald: 2 }),
  c('o1_5', 1, 'onyx', 0, { emerald: 3 }),
  c('o1_6', 1, 'onyx', 0, { sapphire: 2, emerald: 1 }),
  c('o1_7', 1, 'onyx', 0, { ruby: 2, sapphire: 1 }),
  c('o1_8', 1, 'onyx', 1, { ruby: 4 }),

  // ── TIER 2 (30 cards) ────────────────────────────────────────
  // Diamond-producing
  c('d2_1', 2, 'diamond', 1, { emerald: 3, sapphire: 2, onyx: 2 }),
  c('d2_2', 2, 'diamond', 1, { ruby: 3, onyx: 3 }),
  c('d2_3', 2, 'diamond', 2, { sapphire: 3, onyx: 3 }),
  c('d2_4', 2, 'diamond', 2, { emerald: 3, ruby: 3 }),
  c('d2_5', 2, 'diamond', 2, { onyx: 5 }),
  c('d2_6', 2, 'diamond', 3, { onyx: 6 }),

  // Sapphire-producing
  c('s2_1', 2, 'sapphire', 1, { onyx: 3, diamond: 2, ruby: 2 }),
  c('s2_2', 2, 'sapphire', 1, { emerald: 3, diamond: 3 }),
  c('s2_3', 2, 'sapphire', 2, { onyx: 3, diamond: 3 }),
  c('s2_4', 2, 'sapphire', 2, { emerald: 3, onyx: 3 }),
  c('s2_5', 2, 'sapphire', 2, { diamond: 5 }),
  c('s2_6', 2, 'sapphire', 3, { diamond: 6 }),

  // Emerald-producing
  c('e2_1', 2, 'emerald', 1, { diamond: 3, sapphire: 2, ruby: 2 }),
  c('e2_2', 2, 'emerald', 1, { onyx: 3, sapphire: 3 }),
  c('e2_3', 2, 'emerald', 2, { diamond: 3, sapphire: 3 }),
  c('e2_4', 2, 'emerald', 2, { ruby: 3, sapphire: 3 }),
  c('e2_5', 2, 'emerald', 2, { sapphire: 5 }),
  c('e2_6', 2, 'emerald', 3, { sapphire: 6 }),

  // Ruby-producing
  c('r2_1', 2, 'ruby', 1, { sapphire: 3, emerald: 2, diamond: 2 }),
  c('r2_2', 2, 'ruby', 1, { diamond: 3, emerald: 3 }),
  c('r2_3', 2, 'ruby', 2, { sapphire: 3, emerald: 3 }),
  c('r2_4', 2, 'ruby', 2, { onyx: 3, emerald: 3 }),
  c('r2_5', 2, 'ruby', 2, { emerald: 5 }),
  c('r2_6', 2, 'ruby', 3, { emerald: 6 }),

  // Onyx-producing
  c('o2_1', 2, 'onyx', 1, { ruby: 3, emerald: 2, sapphire: 2 }),
  c('o2_2', 2, 'onyx', 1, { sapphire: 3, ruby: 3 }),
  c('o2_3', 2, 'onyx', 2, { ruby: 3, emerald: 3 }),
  c('o2_4', 2, 'onyx', 2, { diamond: 3, ruby: 3 }),
  c('o2_5', 2, 'onyx', 2, { ruby: 5 }),
  c('o2_6', 2, 'onyx', 3, { ruby: 6 }),

  // ── TIER 3 (20 cards) ────────────────────────────────────────
  // Diamond-producing
  c('d3_1', 3, 'diamond', 3, { sapphire: 3, emerald: 3, ruby: 3, onyx: 5 }),
  c('d3_2', 3, 'diamond', 4, { emerald: 3, ruby: 3, onyx: 7 }),
  c('d3_3', 3, 'diamond', 4, { onyx: 3, ruby: 3, emerald: 3, diamond: 3 }),
  c('d3_4', 3, 'diamond', 5, { onyx: 7, diamond: 3 }),

  // Sapphire-producing
  c('s3_1', 3, 'sapphire', 3, { diamond: 3, emerald: 3, ruby: 3, onyx: 5 }),
  c('s3_2', 3, 'sapphire', 4, { diamond: 3, ruby: 3, onyx: 7 }),
  c('s3_3', 3, 'sapphire', 4, { diamond: 3, ruby: 3, onyx: 3, sapphire: 3 }),
  c('s3_4', 3, 'sapphire', 5, { diamond: 7, sapphire: 3 }),

  // Emerald-producing
  c('e3_1', 3, 'emerald', 3, { diamond: 3, sapphire: 3, ruby: 3, onyx: 5 }),
  c('e3_2', 3, 'emerald', 4, { diamond: 3, sapphire: 7 }),
  c('e3_3', 3, 'emerald', 4, { diamond: 3, sapphire: 3, onyx: 3, emerald: 3 }),
  c('e3_4', 3, 'emerald', 5, { sapphire: 7, emerald: 3 }),

  // Ruby-producing
  c('r3_1', 3, 'ruby', 3, { diamond: 3, sapphire: 3, emerald: 5, onyx: 3 }),
  c('r3_2', 3, 'ruby', 4, { sapphire: 3, emerald: 7 }),
  c('r3_3', 3, 'ruby', 4, { sapphire: 3, emerald: 3, diamond: 3, ruby: 3 }),
  c('r3_4', 3, 'ruby', 5, { emerald: 7, ruby: 3 }),

  // Onyx-producing
  c('o3_1', 3, 'onyx', 3, { diamond: 3, sapphire: 5, emerald: 3, ruby: 3 }),
  c('o3_2', 3, 'onyx', 4, { ruby: 3, diamond: 7 }),
  c('o3_3', 3, 'onyx', 4, { ruby: 3, diamond: 3, sapphire: 3, onyx: 3 }),
  c('o3_4', 3, 'onyx', 5, { ruby: 7, onyx: 3 }),
];

module.exports = { CARDS };
