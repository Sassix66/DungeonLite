const ENEMIES = [
  { name: "Moorschleim", icon: "🟢", hp: 28, attack: 7, defense: 1, gold: 8, xp: 12 },
  { name: "Krallenratte", icon: "🐀", hp: 36, attack: 9, defense: 2, gold: 11, xp: 16 },
  { name: "Höhlenkobold", icon: "👺", hp: 48, attack: 12, defense: 4, gold: 17, xp: 24 },
  { name: "Knochenwächter", icon: "💀", hp: 64, attack: 15, defense: 6, gold: 25, xp: 34 }
];

export function createEnemy(floor) {
  const index = Math.min(ENEMIES.length - 1, Math.floor((floor - 1) / 2));
  const base = ENEMIES[index];
  const scale = 1 + (floor - 1) * 0.12;
  const hp = Math.round(base.hp * scale);

  return {
    ...base,
    hp,
    maxHp: hp,
    attack: Math.round(base.attack * scale),
    defense: Math.round(base.defense * scale),
    gold: Math.round(base.gold * scale),
    xp: Math.round(base.xp * scale)
  };
}
