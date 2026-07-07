// 10 noble tiles — N+1 are chosen randomly at game start
// All worth 3 prestige points; requirements are bought-card counts per color

const NOBLES = [
  { id: 'n1',  points: 3, requires: { diamond: 3, sapphire: 3, emerald: 3 } },
  { id: 'n2',  points: 3, requires: { diamond: 3, sapphire: 3, ruby: 3 } },
  { id: 'n3',  points: 3, requires: { diamond: 3, emerald: 3, onyx: 3 } },
  { id: 'n4',  points: 3, requires: { sapphire: 3, ruby: 3, onyx: 3 } },
  { id: 'n5',  points: 3, requires: { emerald: 3, ruby: 3, onyx: 3 } },
  { id: 'n6',  points: 3, requires: { diamond: 4, sapphire: 4 } },
  { id: 'n7',  points: 3, requires: { diamond: 4, onyx: 4 } },
  { id: 'n8',  points: 3, requires: { sapphire: 4, emerald: 4 } },
  { id: 'n9',  points: 3, requires: { emerald: 4, ruby: 4 } },
  { id: 'n10', points: 3, requires: { ruby: 4, onyx: 4 } },
];

module.exports = { NOBLES };
