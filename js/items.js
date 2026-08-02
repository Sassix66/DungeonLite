const RARITIES = [
  { id: "common", label: "Gewöhnlich", weight: 64, multiplier: 1 },
  { id: "rare", label: "Selten", weight: 25, multiplier: 1.45 },
  { id: "epic", label: "Episch", weight: 9, multiplier: 2.1 },
  { id: "legendary", label: "Legendär", weight: 2, multiplier: 3.2 }
];

const BASE_ITEMS = [
  { name: "Knochenklinge", slot: "weapon", attack: 3, defense: 0, hp: 0 },
  { name: "Moosbeil", slot: "weapon", attack: 4, defense: 0, hp: 0 },
  { name: "Wächterweste", slot: "armor", attack: 0, defense: 3, hp: 8 },
  { name: "Runenpanzer", slot: "armor", attack: 0, defense: 4, hp: 12 },
  { name: "Bernsteinring", slot: "accessory", attack: 1, defense: 1, hp: 10 },
  { name: "Nachtamulett", slot: "accessory", attack: 2, defense: 0, hp: 14 }
];

function id() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

export function createPotion() {
  return {
    id: id(),
    name: "Heiltrank",
    type: "potion",
    heal: 35
  };
}

function pickRarity() {
  const total = RARITIES.reduce((sum, rarity) => sum + rarity.weight, 0);
  let roll = Math.random() * total;

  for (const rarity of RARITIES) {
    roll -= rarity.weight;
    if (roll <= 0) return rarity;
  }

  return RARITIES[0];
}

export function createEquipment(floor) {
  const base = BASE_ITEMS[Math.floor(Math.random() * BASE_ITEMS.length)];
  const rarity = pickRarity();
  const floorScale = 1 + Math.max(0, floor - 1) * 0.08;

  return {
    id: id(),
    type: "equipment",
    name: base.name,
    slot: base.slot,
    rarity: rarity.id,
    rarityLabel: rarity.label,
    attack: Math.max(0, Math.round(base.attack * rarity.multiplier * floorScale)),
    defense: Math.max(0, Math.round(base.defense * rarity.multiplier * floorScale)),
    hp: Math.max(0, Math.round(base.hp * rarity.multiplier * floorScale)),
    value: Math.max(4, Math.round((base.attack * 6 + base.defense * 6 + base.hp) * rarity.multiplier))
  };
}
