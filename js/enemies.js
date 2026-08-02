const ENEMIES = [
  { name: "Schlammkriecher", icon: "🟢", hp: 25, attack: 7, defense: 1, gold: 7, xp: 10 },
  { name: "Dornentier", icon: "🐾", hp: 39, attack: 10, defense: 3, gold: 11, xp: 15 },
  { name: "Grubenräuber", icon: "👺", hp: 53, attack: 13, defense: 5, gold: 17, xp: 23 },
  { name: "Aschenritter", icon: "💀", hp: 74, attack: 17, defense: 7, gold: 27, xp: 36 }
];

const BOSSES = [
  { name: "Torwächter von Varn", icon: "🛡️", hp: 115, attack: 16, defense: 7, gold: 65, xp: 75 },
  { name: "Die steinerne Matriarchin", icon: "🗿", hp: 175, attack: 22, defense: 10, gold: 95, xp: 110 }
];

export function enemyFor(stage, boss = false) {
  const pool = boss ? BOSSES : ENEMIES;
  const index = Math.min(pool.length - 1, Math.floor((stage - 1) / 2));
  const base = pool[index];
  const scale = 1 + (stage - 1) * .13;
  const hp = Math.round(base.hp * scale);

  return {
    ...base,
    hp,
    maxHp: hp,
    attack: Math.round(base.attack * scale),
    defense: Math.round(base.defense * scale),
    gold: Math.round(base.gold * scale),
    xp: Math.round(base.xp * scale),
    boss
  };
}
