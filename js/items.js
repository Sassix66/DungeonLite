const RARITIES = [
  { id: "common", label: "Gewöhnlich", weight: 63, mult: 1 },
  { id: "rare", label: "Selten", weight: 25, mult: 1.5 },
  { id: "epic", label: "Episch", weight: 10, mult: 2.2 },
  { id: "legendary", label: "Legendär", weight: 2, mult: 3.3 }
];

const BASES = [
  { name: "Moorstahlklinge", slot: "weapon", attack: 4 },
  { name: "Dornenhammer", slot: "weapon", attack: 5 },
  { name: "Fährtenmantel", slot: "armor", defense: 3, hp: 8 },
  { name: "Schieferpanzer", slot: "armor", defense: 4, hp: 12 },
  { name: "Glutring", slot: "accessory", attack: 1, defense: 1, hp: 8 },
  { name: "Mondsplitter", slot: "accessory", attack: 2, hp: 12 }
];

function uid() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function rarity() {
  let roll = Math.random() * RARITIES.reduce((s, r) => s + r.weight, 0);
  for (const r of RARITIES) {
    roll -= r.weight;
    if (roll <= 0) return r;
  }
  return RARITIES[0];
}

export function potion() {
  return { id: uid(), type: "potion", name: "Heiltrank", heal: 32 };
}

export function equipment(depth) {
  const base = BASES[Math.floor(Math.random() * BASES.length)];
  const r = rarity();
  const scale = 1 + depth * .07;

  return {
    id: uid(),
    type: "equipment",
    name: base.name,
    slot: base.slot,
    rarity: r.id,
    rarityLabel: r.label,
    attack: Math.round((base.attack || 0) * r.mult * scale),
    defense: Math.round((base.defense || 0) * r.mult * scale),
    hp: Math.round((base.hp || 0) * r.mult * scale)
  };
}
