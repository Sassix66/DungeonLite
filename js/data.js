export const ITEMS = [
  { id: "sword", name: "Rostklinge", icon: "🗡️", slot: "weapon", attack: 3, defense: 0, hp: 0, value: 18 },
  { id: "helm", name: "Steinhelm", icon: "🪖", slot: "helmet", attack: 0, defense: 3, hp: 4, value: 20 },
  { id: "armor", name: "Eisenweste", icon: "🥋", slot: "armor", attack: 0, defense: 6, hp: 10, value: 55 },
  { id: "ring", name: "Bernsteinring", icon: "💍", slot: "ring", attack: 4, defense: 2, hp: 8, value: 90 },
  { id: "potion", name: "Heiltrank", icon: "🧪", type: "potion", heal: 35, value: 12 },
  { id: "key", name: "Knochenschlüssel", icon: "🗝️", type: "key", value: 0 }
];

export const ENEMIES = [
  { name: "Höhlenratte", icon: "🐀", hp: 34, attack: 9, defense: 2, reward: 14, xp: 15 },
  { name: "Knochendiener", icon: "💀", hp: 52, attack: 13, defense: 4, reward: 21, xp: 24 },
  { name: "Grubendämon", icon: "👿", hp: 75, attack: 17, defense: 6, reward: 32, xp: 36 }
];

export const BOSSES = [
  { name: "Knochenfürst", icon: "👹", hp: 150, attack: 20, defense: 8, reward: 85, xp: 100 }
];
