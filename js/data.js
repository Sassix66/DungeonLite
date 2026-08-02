export const BIOMES = [
  {
    id: "mine",
    name: "Verlassene Mine",
    floorFrom: 1,
    floorTo: 10,
    accent: "#8d744e",
    enemies: [
      { name: "Minenratte", icon: "🐀", hp: 30, attack: 8, defense: 1, reward: 10, xp: 12 },
      { name: "Höhlenfledermaus", icon: "🦇", hp: 34, attack: 9, defense: 1, reward: 11, xp: 13 },
      { name: "Schlammkriecher", icon: "🟢", hp: 42, attack: 10, defense: 2, reward: 13, xp: 15 }
    ],
    boss: { name: "Der Tiefenbohrer", icon: "⛏️", hp: 145, attack: 16, defense: 5, reward: 75, xp: 90 }
  },
  {
    id: "crypt",
    name: "Vergessene Krypta",
    floorFrom: 11,
    floorTo: 20,
    accent: "#6f6b8f",
    enemies: [
      { name: "Skelettwächter", icon: "💀", hp: 55, attack: 14, defense: 4, reward: 20, xp: 24 },
      { name: "Grabzombie", icon: "🧟", hp: 68, attack: 15, defense: 5, reward: 23, xp: 28 },
      { name: "Nebelgeist", icon: "👻", hp: 50, attack: 17, defense: 3, reward: 25, xp: 30 }
    ],
    boss: { name: "Der Knochengraf", icon: "👑", hp: 260, attack: 24, defense: 9, reward: 150, xp: 180 }
  },
  {
    id: "forest",
    name: "Verwunschener Wald",
    floorFrom: 21,
    floorTo: 30,
    accent: "#4f805d",
    enemies: [
      { name: "Schattenwolf", icon: "🐺", hp: 88, attack: 22, defense: 6, reward: 34, xp: 40 },
      { name: "Giftspinne", icon: "🕷️", hp: 74, attack: 24, defense: 5, reward: 36, xp: 42 },
      { name: "Dornenbandit", icon: "🥷", hp: 98, attack: 23, defense: 8, reward: 38, xp: 46 }
    ],
    boss: { name: "Die Wurzelmutter", icon: "🌳", hp: 390, attack: 31, defense: 12, reward: 235, xp: 280 }
  },
  {
    id: "fortress",
    name: "Orkfestung",
    floorFrom: 31,
    floorTo: 40,
    accent: "#8b4f3f",
    enemies: [
      { name: "Orkkrieger", icon: "👺", hp: 120, attack: 30, defense: 10, reward: 48, xp: 58 },
      { name: "Goblinplünderer", icon: "👹", hp: 102, attack: 32, defense: 8, reward: 50, xp: 60 },
      { name: "Festungsschamane", icon: "🧙", hp: 108, attack: 34, defense: 9, reward: 54, xp: 64 }
    ],
    boss: { name: "Kriegshäuptling Grom", icon: "🪓", hp: 560, attack: 40, defense: 16, reward: 340, xp: 410 }
  },
  {
    id: "ice",
    name: "Eishöhlen",
    floorFrom: 41,
    floorTo: 50,
    accent: "#5f91b8",
    enemies: [
      { name: "Eiswandler", icon: "🧊", hp: 150, attack: 38, defense: 13, reward: 65, xp: 78 },
      { name: "Frostspinne", icon: "❄️", hp: 132, attack: 41, defense: 11, reward: 68, xp: 82 },
      { name: "Gletscherbestie", icon: "🐻", hp: 174, attack: 39, defense: 15, reward: 72, xp: 86 }
    ],
    boss: { name: "Der Frostkoloss", icon: "🗿", hp: 760, attack: 51, defense: 21, reward: 480, xp: 570 }
  },
  {
    id: "volcano",
    name: "Feuerfestung",
    floorFrom: 51,
    floorTo: 60,
    accent: "#b64b37",
    enemies: [
      { name: "Aschendämon", icon: "🔥", hp: 190, attack: 49, defense: 16, reward: 88, xp: 105 },
      { name: "Lavahund", icon: "🐕", hp: 170, attack: 52, defense: 14, reward: 92, xp: 110 },
      { name: "Glutritter", icon: "🛡️", hp: 210, attack: 50, defense: 19, reward: 96, xp: 116 }
    ],
    boss: { name: "Der Magmakönig", icon: "🌋", hp: 980, attack: 64, defense: 27, reward: 650, xp: 760 }
  }
];

export const BASE_ITEMS = [
  { id: "shortsword", name: "Kurzschwert", icon: "🗡️", slot: "weapon", attack: 4, defense: 0, hp: 0, value: 20 },
  { id: "waraxe", name: "Kriegsaxt", icon: "🪓", slot: "weapon", attack: 6, defense: 0, hp: 0, value: 28 },
  { id: "shield", name: "Rundschild", icon: "🛡️", slot: "offhand", attack: 0, defense: 5, hp: 0, value: 30 },
  { id: "helmet", name: "Eisenhelm", icon: "🪖", slot: "helmet", attack: 0, defense: 3, hp: 5, value: 24 },
  { id: "chest", name: "Kettenrüstung", icon: "🥋", slot: "armor", attack: 0, defense: 7, hp: 12, value: 45 },
  { id: "gloves", name: "Kampfhandschuhe", icon: "🧤", slot: "gloves", attack: 2, defense: 2, hp: 0, value: 26 },
  { id: "pants", name: "Beinschienen", icon: "🩳", slot: "pants", attack: 0, defense: 4, hp: 8, value: 30 },
  { id: "boots", name: "Pfadstiefel", icon: "🥾", slot: "boots", attack: 0, defense: 2, hp: 6, value: 22 },
  { id: "ring", name: "Silberring", icon: "💍", slot: "ring1", attack: 2, defense: 1, hp: 4, value: 35 },
  { id: "amulet", name: "Runenamulett", icon: "📿", slot: "amulet", attack: 1, defense: 1, hp: 10, value: 42 },
  { id: "potion", name: "Heiltrank", icon: "🧪", type: "potion", heal: 35, value: 12 },
  { id: "key", name: "Silberschlüssel", icon: "🗝️", type: "key", value: 0 }
];

export const PREFIXES = [
  { name: "Scharf", attack: 3 },
  { name: "Gehärtet", defense: 3 },
  { name: "Vital", hp: 12 },
  { name: "Präzise", critChance: 2 },
  { name: "Erneuernd", recovery: 1 }
];

export const SUFFIXES = [
  { name: "des Berserkers", attack: 4 },
  { name: "des Wächters", defense: 4 },
  { name: "des Bären", hp: 18 },
  { name: "der Präzision", critChance: 3 },
  { name: "der Regeneration", recovery: 1 }
];

export const RARITIES = [
  { id: "common", label: "Gewöhnlich", threshold: 1.0, multiplier: 1.0, affixes: 0 },
  { id: "uncommon", label: "Ungewöhnlich", threshold: 0.58, multiplier: 1.2, affixes: 1 },
  { id: "rare", label: "Selten", threshold: 0.28, multiplier: 1.55, affixes: 2 },
  { id: "epic", label: "Episch", threshold: 0.11, multiplier: 2.05, affixes: 2 },
  { id: "legendary", label: "Legendär", threshold: 0.035, multiplier: 2.8, affixes: 3 },
  { id: "mythic", label: "Mythisch", threshold: 0.008, multiplier: 3.7, affixes: 4 }
];

export const QUEST_TEMPLATES = [
  { id: "kill", label: "Besiege Gegner", target: 8, rewardGold: 80, rewardGems: 1 },
  { id: "explore", label: "Erkunde Felder", target: 12, rewardGold: 60, rewardGems: 1 },
  { id: "chest", label: "Öffne Schatztruhen", target: 3, rewardGold: 100, rewardGems: 2 },
  { id: "boss", label: "Besiege einen Boss", target: 1, rewardGold: 150, rewardGems: 3 }
];
