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
  { id: "shortsword", name: "Kurzschwert", icon: "🗡️", slot: "weapon", weaponType: "sword", attack: 4, defense: 0, hp: 0, value: 20 },
  { id: "longsword", name: "Langschwert", icon: "⚔️", slot: "weapon", weaponType: "sword", attack: 6, defense: 1, hp: 0, value: 30 },
  { id: "broadsword", name: "Breitschwert", icon: "⚔️", slot: "weapon", weaponType: "sword", attack: 8, defense: 0, hp: 0, value: 38 },
  { id: "dagger", name: "Dolch", icon: "🔪", slot: "weapon", weaponType: "dagger", attack: 3, defense: 0, hp: 0, value: 18 },
  { id: "twinblade", name: "Zwillingsklinge", icon: "🗡️", slot: "weapon", weaponType: "dagger", attack: 5, defense: 0, hp: 0, value: 28 },
  { id: "waraxe", name: "Kriegsaxt", icon: "🪓", slot: "weapon", weaponType: "heavy", attack: 7, defense: 0, hp: 0, value: 32 },
  { id: "greataxe", name: "Großaxt", icon: "🪓", slot: "weapon", weaponType: "heavy", attack: 10, defense: -1, hp: 0, value: 45 },
  { id: "warhammer", name: "Kriegshammer", icon: "🔨", slot: "weapon", weaponType: "heavy", attack: 9, defense: 1, hp: 0, value: 44 },
  { id: "bow", name: "Langbogen", icon: "🏹", slot: "weapon", weaponType: "ranged", attack: 6, defense: 0, hp: 0, value: 34 },
  { id: "crossbow", name: "Armbrust", icon: "🏹", slot: "weapon", weaponType: "ranged", attack: 8, defense: 0, hp: 0, value: 42 },
  { id: "staff", name: "Runenstab", icon: "🪄", slot: "weapon", weaponType: "magic", attack: 6, defense: 1, hp: 4, value: 39 },
  { id: "scepter", name: "Schattenzepter", icon: "🪄", slot: "weapon", weaponType: "magic", attack: 7, defense: 0, hp: 6, value: 44 },

  { id: "buckler", name: "Buckler", icon: "🛡️", slot: "offhand", attack: 0, defense: 3, hp: 0, value: 22 },
  { id: "shield", name: "Rundschild", icon: "🛡️", slot: "offhand", attack: 0, defense: 5, hp: 0, value: 30 },
  { id: "tower-shield", name: "Turmschild", icon: "🛡️", slot: "offhand", attack: -1, defense: 8, hp: 10, value: 46 },
  { id: "focus", name: "Arkanfokus", icon: "🔮", slot: "offhand", attack: 2, defense: 1, hp: 5, value: 33 },

  { id: "leather-cap", name: "Lederkappe", icon: "🧢", slot: "helmet", attack: 0, defense: 2, hp: 4, value: 18 },
  { id: "helmet", name: "Eisenhelm", icon: "🪖", slot: "helmet", attack: 0, defense: 3, hp: 5, value: 24 },
  { id: "greathelm", name: "Großhelm", icon: "🪖", slot: "helmet", attack: 0, defense: 5, hp: 8, value: 35 },
  { id: "leather-armor", name: "Lederrüstung", icon: "🥋", slot: "armor", attack: 0, defense: 4, hp: 8, value: 28 },
  { id: "chest", name: "Kettenrüstung", icon: "🥋", slot: "armor", attack: 0, defense: 7, hp: 12, value: 45 },
  { id: "plate", name: "Plattenrüstung", icon: "🥋", slot: "armor", attack: -1, defense: 10, hp: 18, value: 62 },
  { id: "cloth-gloves", name: "Stoffhandschuhe", icon: "🧤", slot: "gloves", attack: 1, defense: 1, hp: 0, value: 16 },
  { id: "gloves", name: "Kampfhandschuhe", icon: "🧤", slot: "gloves", attack: 2, defense: 2, hp: 0, value: 26 },
  { id: "gauntlets", name: "Plattenhandschuhe", icon: "🧤", slot: "gloves", attack: 1, defense: 4, hp: 5, value: 34 },
  { id: "cloth-pants", name: "Stoffhose", icon: "🩳", slot: "pants", attack: 0, defense: 1, hp: 4, value: 15 },
  { id: "pants", name: "Beinschienen", icon: "🩳", slot: "pants", attack: 0, defense: 4, hp: 8, value: 30 },
  { id: "plate-legs", name: "Plattenbeine", icon: "🩳", slot: "pants", attack: 0, defense: 6, hp: 12, value: 42 },
  { id: "soft-boots", name: "Weiche Stiefel", icon: "🥾", slot: "boots", attack: 0, defense: 1, hp: 4, value: 16 },
  { id: "boots", name: "Pfadstiefel", icon: "🥾", slot: "boots", attack: 0, defense: 2, hp: 6, value: 22 },
  { id: "iron-boots", name: "Eisenstiefel", icon: "🥾", slot: "boots", attack: 0, defense: 4, hp: 8, value: 32 },
  { id: "copper-ring", name: "Kupferring", icon: "💍", slot: "ring1", attack: 1, defense: 0, hp: 3, value: 22 },
  { id: "ring", name: "Silberring", icon: "💍", slot: "ring1", attack: 2, defense: 1, hp: 4, value: 35 },
  { id: "signet", name: "Siegelring", icon: "💍", slot: "ring1", attack: 2, defense: 2, hp: 6, value: 44 },
  { id: "bone-amulet", name: "Knochenamulett", icon: "📿", slot: "amulet", attack: 1, defense: 0, hp: 8, value: 28 },
  { id: "amulet", name: "Runenamulett", icon: "📿", slot: "amulet", attack: 1, defense: 1, hp: 10, value: 42 },
  { id: "royal-amulet", name: "Königsamulett", icon: "📿", slot: "amulet", attack: 2, defense: 2, hp: 14, value: 56 },

  { id: "potion", name: "Heiltrank", icon: "🧪", type: "potion", heal: 35, value: 12 },
  { id: "greater-potion", name: "Großer Heiltrank", icon: "🧪", type: "potion", heal: 70, value: 28 },
  { id: "key", name: "Silberschlüssel", icon: "🗝️", type: "key", value: 0 }
];

export const PREFIXES = [
  { name: "Scharf", attack: 3 },
  { name: "Brutal", attack: 5 },
  { name: "Massiv", attack: 7 },
  { name: "Gehärtet", defense: 3 },
  { name: "Verstärkt", defense: 5 },
  { name: "Unnachgiebig", defense: 7 },
  { name: "Vital", hp: 12 },
  { name: "Lebenskräftig", hp: 20 },
  { name: "Kolossal", hp: 32 },
  { name: "Präzise", critChance: 2 },
  { name: "Zielsicher", critChance: 4 },
  { name: "Tödlich", critChance: 6 },
  { name: "Erneuernd", recovery: 1 },
  { name: "Regenerierend", recovery: 2 },
  { name: "Ausgeglichen", attack: 2, defense: 2 },
  { name: "Standhaft", defense: 3, hp: 10 },
  { name: "Rastlos", attack: 2, recovery: 1 }
];

export const SUFFIXES = [
  { name: "des Berserkers", attack: 4 },
  { name: "des Kriegsherrn", attack: 7 },
  { name: "des Wächters", defense: 4 },
  { name: "der Festung", defense: 7 },
  { name: "des Bären", hp: 18 },
  { name: "des Kolosses", hp: 30 },
  { name: "der Präzision", critChance: 3 },
  { name: "des Falken", critChance: 5 },
  { name: "der Regeneration", recovery: 1 },
  { name: "der Erholung", recovery: 2 },
  { name: "des Ritters", attack: 2, defense: 3 },
  { name: "des Überlebenden", defense: 2, hp: 14 },
  { name: "des Jägers", attack: 3, critChance: 2 },
  { name: "des Pilgers", hp: 10, recovery: 1 },
  { name: "der Balance", attack: 2, defense: 2, hp: 6 }
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


export const ROOM_TEMPLATES = {
  start: [
    {
      id: "start-cross",
      category: "start",
      layout: [
        "........",
        "...E....",
        "........",
        ".V....V.",
        "........",
        "...X....",
        "........",
        "........"
      ]
    },
    {
      id: "start-corners",
      category: "start",
      layout: [
        "V......V",
        "........",
        "...E....",
        "........",
        "........",
        "...X....",
        "........",
        "V......V"
      ]
    }
  ],

  normal: [
    {
      id: "normal-lane",
      category: "normal",
      layout: [
        "........",
        ".V....V.",
        "........",
        ".EE.....",
        "........",
        ".....EE.",
        "........",
        "...X...."
      ]
    },
    {
      id: "normal-center",
      category: "normal",
      layout: [
        "........",
        "........",
        "...EE...",
        "........",
        ".V....V.",
        "........",
        "...X....",
        "........"
      ]
    },
    {
      id: "normal-split",
      category: "normal",
      layout: [
        "V......V",
        "........",
        ".EE..EE.",
        "........",
        "........",
        "...X....",
        "........",
        "V......V"
      ]
    },
    {
      id: "normal-diagonal",
      category: "normal",
      layout: [
        "EE......",
        "........",
        "..V.....",
        "........",
        ".....V..",
        "........",
        "......EE",
        "...X...."
      ]
    }
  ],

  explore: [
    {
      id: "explore-open",
      category: "explore",
      layout: [
        "........",
        "..???...",
        "........",
        "....V...",
        "........",
        "...???..",
        "........",
        "...X...."
      ]
    },
    {
      id: "explore-ring",
      category: "explore",
      layout: [
        "........",
        ".?....?.",
        "........",
        "...EE...",
        "........",
        ".?....?.",
        "........",
        "...X...."
      ]
    }
  ],

  treasure: [
    {
      id: "treasure-guarded",
      category: "treasure",
      layout: [
        "........",
        "...C....",
        "........",
        "..EE....",
        "........",
        ".V....V.",
        "........",
        "...X...."
      ]
    },
    {
      id: "treasure-vault",
      category: "treasure",
      layout: [
        "........",
        "..C.C...",
        "........",
        "...EE...",
        "........",
        ".V....V.",
        "........",
        "...X...."
      ]
    }
  ],

  elite: [
    {
      id: "elite-center",
      category: "elite",
      layout: [
        "........",
        "........",
        "...L....",
        "........",
        ".V....V.",
        "........",
        "...C....",
        "...X...."
      ]
    },
    {
      id: "elite-arena",
      category: "elite",
      layout: [
        "........",
        ".V....V.",
        "........",
        "...L....",
        "........",
        ".V....V.",
        "........",
        "...X...."
      ]
    }
  ],

  boss: [
    {
      id: "boss-throne",
      category: "boss",
      layout: [
        "........",
        "...B....",
        "........",
        "........",
        ".V....V.",
        "........",
        "...C....",
        "...X...."
      ]
    },
    {
      id: "boss-sanctum",
      category: "boss",
      layout: [
        "........",
        "..V..V..",
        "...B....",
        "........",
        "........",
        "..V..V..",
        "...C....",
        "...X...."
      ]
    }
  ],

  merchant: [
    {
      id: "merchant-stall",
      category: "merchant",
      layout: [
        "........",
        "..V..V..",
        "........",
        "...M....",
        "........",
        "..V..V..",
        "........",
        "...X...."
      ]
    }
  ],

  fountain: [
    {
      id: "fountain-room",
      category: "fountain",
      layout: [
        "........",
        "........",
        "...W....",
        "........",
        ".V....V.",
        "........",
        "........",
        "...X...."
      ]
    }
  ],

  shrine: [
    {
      id: "shrine-room",
      category: "shrine",
      layout: [
        "........",
        "........",
        "...H....",
        "........",
        "........",
        ".V....V.",
        "........",
        "...X...."
      ]
    }
  ],

  event: [
    {
      id: "event-ruins",
      category: "event",
      layout: [
        "........",
        ".?...?..",
        "........",
        "...EE...",
        "........",
        ".V....V.",
        "........",
        "...X...."
      ]
    }
  ]
};

export const BIOME_DECORATIONS = {
  mine: [
    { icon: "🪨", className: "rock" },
    { icon: "⛏️", className: "tool" },
    { icon: "🕸️", className: "web" },
    { icon: "💎", className: "crystal" }
  ],
  crypt: [
    { icon: "🪦", className: "grave" },
    { icon: "🦴", className: "bone" },
    { icon: "🕯️", className: "candle" },
    { icon: "⚱️", className: "urn" }
  ],
  forest: [
    { icon: "🍄", className: "mushroom" },
    { icon: "🌿", className: "roots" },
    { icon: "🪵", className: "wood" },
    { icon: "🕸️", className: "web" }
  ],
  fortress: [
    { icon: "🧱", className: "brick" },
    { icon: "🛢️", className: "barrel" },
    { icon: "⚔️", className: "weapons" },
    { icon: "🔥", className: "torch" }
  ],
  ice: [
    { icon: "🧊", className: "ice" },
    { icon: "❄️", className: "snow" },
    { icon: "💎", className: "crystal" },
    { icon: "🪨", className: "rock" }
  ],
  volcano: [
    { icon: "🌋", className: "lava" },
    { icon: "🔥", className: "flame" },
    { icon: "🪨", className: "basalt" },
    { icon: "💎", className: "magma-crystal" }
  ]
};
