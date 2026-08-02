import {
  BIOMES,
  BASE_ITEMS,
  PREFIXES,
  SUFFIXES,
  RARITIES,
  QUEST_TEMPLATES
} from "./data.js";
import { AudioManager } from "./audio.js";

const SAVE_KEY = "dungeonlite.v212";
const ACTION_AP_COST = 4;
const ENEMY_REGEN_DELAY = 1800;
const ENEMY_REGEN_PER_SECOND = 4;
const PLAYER_REGEN_DELAY = 5000;
const DEFEAT_REGEN_MULTIPLIER = 6;
const DEFEAT_REGEN_BONUS = 4;
const DEFEAT_PENALTY_DURATION = 180000;
const DEFEAT_ATTACK_MULTIPLIER = 0.70;
const DEFEAT_DEFENSE_MULTIPLIER = 0.70;

export class Game {
  constructor(root) {
    this.root = root;
    this.audio = new AudioManager();
    this.selectedItem = 0;
    this.activeTab = "equipment";
    this.activeOverlay = null;
    this.tileEffect = null;
    this.stageTransition = null;
    this.lastTick = performance.now();
    this.xpDisplay = { blueXp: null, whiteXp: null, catchupActive: false };
    this.state = this.load() || this.createState();
    this.loop = this.loop.bind(this);
  }

  createState() {
    const state = {
      floor: 1,
      gold: 0,
      gems: 0,
      silverKeys: 0,
      materials: { iron: 0, essence: 0, crystal: 0 },
      lastCombatAt: 0,
      meditation: { active: false, xpBuffer: 0 },
      defeatPenalty: {
        active: false,
        pending: false,
        expiresAt: 0
      },
      message: "Erkunde den Dungeon und sichere alle Räume.",
      player: {
        level: 1,
        xp: 0,
        xpNext: 60,
        hp: 100,
        maxHp: 100,
        ap: 50,
        maxAp: 50,
        baseAttack: 12,
        baseDefense: 5,
        recovery: 1,
        critChance: 5,
        talentPoints: 0,
        defeated: false,
        equipment: {
          weapon: null,
          offhand: null,
          helmet: null,
          armor: null,
          gloves: null,
          pants: null,
          boots: null,
          ring1: null,
          ring2: null,
          amulet: null
        },
        inventory: []
      },
      dungeon: null,
      currentRoomId: 0,
      quests: this.createQuests(),
      stats: {
        enemiesKilled: 0,
        bossesKilled: 0,
        chestsOpened: 0,
        exploredTiles: 0,
        itemsFound: 0,
        highestFloor: 1
      },
      collection: {
        enemies: {},
        items: {}
      },
      merchant: {
        stock: [],
        refreshFloor: 1
      }
    };

    this.state = state;
    state.dungeon = this.createDungeon();
    state.merchant.stock = this.createMerchantStock();
    return state;
  }

  start() {
    this.ensureStateShape();
    this.render();
    requestAnimationFrame(this.loop);
  }

  ensureStateShape() {
    const p = this.state.player;
    p.critChance ??= 5;
    p.talentPoints ??= 0;
    p.defeated ??= false;
    p.equipment ??= {};
    for (const slot of this.equipmentSlots()) {
      p.equipment[slot.id] ??= null;
    }

    this.state.defeatPenalty ??= {
      active: false,
      pending: false,
      expiresAt: 0
    };

    this.state.materials ??= { iron: 0, essence: 0, crystal: 0 };
    this.state.quests ??= this.createQuests();
    this.state.stats ??= {
      enemiesKilled: 0,
      bossesKilled: 0,
      chestsOpened: 0,
      exploredTiles: 0,
      itemsFound: 0,
      highestFloor: this.state.floor || 1
    };
    this.state.collection ??= { enemies: {}, items: {} };
    this.state.merchant ??= {
      stock: this.createMerchantStock(),
      refreshFloor: this.state.floor
    };
  }

  currentBiome() {
    return BIOMES.find(
      biome => this.state.floor >= biome.floorFrom &&
               this.state.floor <= biome.floorTo
    ) || BIOMES.at(-1);
  }

  createDungeon() {
    const floor = this.state.floor;
    const bossFloor = floor % 5 === 0;
    const roomCount = Math.min(16, 5 + Math.floor(floor / 3));
    const positions = [{ x: 0, y: 0 }];
    const used = new Set(["0,0"]);
    const directions = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 }
    ];

    while (positions.length < roomCount) {
      const origin = positions[Math.floor(Math.random() * positions.length)];
      const direction = directions[Math.floor(Math.random() * directions.length)];
      const candidate = {
        x: origin.x + direction.dx,
        y: origin.y + direction.dy
      };
      const key = `${candidate.x},${candidate.y}`;

      if (!used.has(key)) {
        used.add(key);
        positions.push(candidate);
      }
    }

    const farthestIndex = positions.reduce((best, position, index) => {
      const distance = Math.abs(position.x) + Math.abs(position.y);
      const bestPos = positions[best];
      const bestDistance = Math.abs(bestPos.x) + Math.abs(bestPos.y);
      return distance > bestDistance ? index : best;
    }, 0);

    const rooms = positions.map((position, index) => {
      let type = "normal";
      if (index === 0) type = "start";
      else if (index === farthestIndex) type = bossFloor ? "boss" : "elite";
      else type = this.randomRoomType();

      return {
        id: index,
        x: position.x,
        y: position.y,
        type,
        visited: index === 0,
        revealed: index === 0,
        completed: false,
        neighbors: {},
        tiles: []
      };
    });

    const byPosition = new Map(
      rooms.map(room => [`${room.x},${room.y}`, room.id])
    );

    for (const room of rooms) {
      for (const [name, offset] of Object.entries({
        up: { dx: 0, dy: -1 },
        down: { dx: 0, dy: 1 },
        left: { dx: -1, dy: 0 },
        right: { dx: 1, dy: 0 }
      })) {
        const id = byPosition.get(
          `${room.x + offset.dx},${room.y + offset.dy}`
        );
        if (id !== undefined) room.neighbors[name] = id;
      }

      room.tiles = this.createRoomTiles(room.type);
    }

    this.revealAdjacentRooms(rooms, 0);
    return { rooms, exitUnlocked: false };
  }

  randomRoomType() {
    const roll = Math.random();
    if (roll < 0.52) return "normal";
    if (roll < 0.70) return "explore";
    if (roll < 0.80) return "treasure";
    if (roll < 0.88) return "event";
    if (roll < 0.94) return "merchant";
    if (roll < 0.975) return "fountain";
    return "shrine";
  }

  createRoomTiles(roomType) {
    const templates = {
      start: ["enemy", "explore", "object"],
      normal: ["enemy", "explore", "object"],
      explore: ["enemy", "explore", "explore", "object"],
      elite: ["elite", "object", "treasure"],
      boss: ["boss", "enemy", "object", "treasure"],
      treasure: ["enemy", "treasure", "object"],
      event: ["enemy", "explore", "trap"],
      merchant: ["enemy", "merchant", "object"],
      fountain: ["enemy", "fountain", "object"],
      shrine: ["enemy", "shrine", "explore"]
    };

    const source = templates[roomType] || templates.normal;
    const guaranteedExtra = Math.floor((this.state.floor - 1) / 2);
    const randomExtra = Math.floor(Math.random() * (2 + Math.floor(this.state.floor / 4)));
    const typeBonus = roomType === "boss" ? 3 : roomType === "elite" ? 2 : 0;
    const count = Math.min(18, source.length + guaranteedExtra + randomExtra + typeBonus);

    const tiles = Array.from({ length: count }, (_, id) => {
      let type = source[id % source.length];

      if (id >= source.length) {
        const pool = ["enemy", "enemy", "explore", "object", "object", "trap"];
        if (roomType === "boss") pool.push("enemy");
        if (roomType === "treasure") pool.push("treasure");
        type = pool[Math.floor(Math.random() * pool.length)];
      }

      const tile = {
        id,
        type,
        progress: type === "explore" ? 0 : 100,
        discovered: type !== "explore",
        completed: false,
        locked: type === "treasure",
        lastHitAt: 0,
        grid: null
      };

      if (type === "enemy") tile.enemy = this.makeEnemy(false, false);

      if (type === "elite") {
        tile.type = "enemy";
        tile.elite = true;
        tile.enemy = this.makeEnemy(false, true);
      }

      if (type === "boss") {
        tile.enemy = this.makeEnemy(true, false);
      }

      if (type === "object") {
        const isVase = Math.random() < 0.5;
        const hp = 18 + this.state.floor * 2;
        tile.object = {
          name: isVase ? "Vase" : "Kiste",
          icon: isVase ? "🏺" : "📦",
          hp,
          maxHp: hp
        };
      }

      return tile;
    });

    return this.placeTilesOnGrid(tiles);
  }

  placeTilesOnGrid(tiles) {
    const gridSize = 8;
    const occupied = Array.from(
      { length: gridSize },
      () => Array(gridSize).fill(false)
    );

    // Große Kacheln zuerst platzieren, damit Bosse und Heiligtümer
    // zuverlässig zusammenhängende Flächen erhalten.
    const ordered = [...tiles].sort((a, b) => {
      const aSize = this.tileFootprint(a);
      const bSize = this.tileFootprint(b);
      return bSize.width * bSize.height - aSize.width * aSize.height;
    });

    for (const tile of ordered) {
      const size = this.tileFootprint(tile);
      const candidates = [];

      for (let row = 0; row <= gridSize - size.height; row += 1) {
        for (let column = 0; column <= gridSize - size.width; column += 1) {
          if (
            this.canPlaceGridTile(
              occupied,
              column,
              row,
              size.width,
              size.height
            )
          ) {
            candidates.push({ column, row });
          }
        }
      }

      if (candidates.length === 0) {
        // Als sichere Rückfalllösung wird die Kachel auf 1x1 reduziert.
        const fallback = [];

        for (let row = 0; row < gridSize; row += 1) {
          for (let column = 0; column < gridSize; column += 1) {
            if (!occupied[row][column]) {
              fallback.push({ column, row });
            }
          }
        }

        if (fallback.length === 0) {
          tile.hiddenByCapacity = true;
          continue;
        }

        const position =
          fallback[Math.floor(Math.random() * fallback.length)];

        tile.grid = {
          column: position.column + 1,
          row: position.row + 1,
          width: 1,
          height: 1
        };
        occupied[position.row][position.column] = true;
        continue;
      }

      const position =
        candidates[Math.floor(Math.random() * candidates.length)];

      tile.grid = {
        column: position.column + 1,
        row: position.row + 1,
        width: size.width,
        height: size.height
      };

      this.markGridOccupied(
        occupied,
        position.column,
        position.row,
        size.width,
        size.height
      );
    }

    return tiles;
  }

  tileFootprint(tile) {
    if (tile.type === "boss" || tile.type === "shrine") {
      return { width: 2, height: 2 };
    }

    if (tile.type === "enemy") {
      return { width: 2, height: 1 };
    }

    return { width: 1, height: 1 };
  }

  canPlaceGridTile(occupied, column, row, width, height) {
    for (let y = row; y < row + height; y += 1) {
      for (let x = column; x < column + width; x += 1) {
        if (occupied[y][x]) return false;
      }
    }

    return true;
  }

  markGridOccupied(occupied, column, row, width, height) {
    for (let y = row; y < row + height; y += 1) {
      for (let x = column; x < column + width; x += 1) {
        occupied[y][x] = true;
      }
    }
  }

  tileGridStyle(tile) {
    const grid = tile.grid || {
      column: 1,
      row: 1,
      width: 1,
      height: 1
    };

    return [
      `grid-column:${grid.column} / span ${grid.width}`,
      `grid-row:${grid.row} / span ${grid.height}`
    ].join(";");
  }

  makeEnemy(boss = false, elite = false) {
    const biome = this.currentBiome();
    const base = structuredClone(
      boss
        ? biome.boss
        : biome.enemies[Math.floor(Math.random() * biome.enemies.length)]
    );

    const floorScale = 1 + (this.state.floor - biome.floorFrom) * 0.07;
    const targetClicks = boss ? 11 : elite ? 7 : 4 + Math.floor(this.state.floor / 12);
    const defense = Math.max(1, Math.round(base.defense * floorScale));
    const expectedDamage = Math.max(1, this.attack - defense * 0.55);
    const hp = Math.max(
      Math.round(base.hp * floorScale),
      Math.round(expectedDamage * targetClicks)
    );
    const desiredDamage = this.player.maxHp * (boss ? 0.12 : elite ? 0.095 : 0.075);
    const attack = Math.max(
      Math.round(base.attack * floorScale),
      Math.round(desiredDamage + this.defense * 0.55)
    );

    return {
      ...base,
      hp,
      maxHp: hp,
      attack,
      defense,
      boss,
      elite,
      reward: Math.round(base.reward * floorScale * (boss ? 2.3 : elite ? 1.6 : 1)),
      xp: Math.round(base.xp * floorScale * (boss ? 2.3 : elite ? 1.6 : 1))
    };
  }

  createEquipmentReward(source = "normal") {
    const base = structuredClone(
      BASE_ITEMS.filter(item => item.slot)[
        Math.floor(Math.random() * BASE_ITEMS.filter(item => item.slot).length)
      ]
    );

    const itemLevel = Math.max(1, this.state.floor + Math.floor(Math.random() * 3) - 1);
    let roll = Math.random();
    if (source === "boss") roll *= 0.16;
    else if (source === "elite") roll *= 0.40;
    else if (source === "chest") roll *= 0.72;

    let rarity = RARITIES[0];
    for (const candidate of [...RARITIES].reverse()) {
      if (roll <= candidate.threshold) {
        rarity = candidate;
        break;
      }
    }

    const scale = (1 + itemLevel * 0.08) * rarity.multiplier;
    base.itemLevel = itemLevel;
    base.rarity = rarity.id;
    base.rarityLabel = rarity.label;
    base.attack = Math.round((base.attack || 0) * scale);
    base.defense = Math.round((base.defense || 0) * scale);
    base.hp = Math.round((base.hp || 0) * scale);
    base.critChance = 0;
    base.recovery = 0;

    const affixPool = [
      ...PREFIXES.map(value => ({ ...value, kind: "prefix" })),
      ...SUFFIXES.map(value => ({ ...value, kind: "suffix" }))
    ].sort(() => Math.random() - 0.5);

    const affixes = affixPool.slice(0, rarity.affixes);
    const prefixes = affixes.filter(a => a.kind === "prefix");
    const suffixes = affixes.filter(a => a.kind === "suffix");

    for (const affix of affixes) {
      base.attack += affix.attack || 0;
      base.defense += affix.defense || 0;
      base.hp += affix.hp || 0;
      base.critChance += affix.critChance || 0;
      base.recovery += affix.recovery || 0;
    }

    base.affixes = affixes.map(a => a.name);
    base.name = [
      rarity.label,
      prefixes[0]?.name,
      base.name,
      suffixes[0]?.name
    ].filter(Boolean).join(" ");
    base.power = this.itemPower(base);
    base.value = Math.round((base.value || 10) * scale + base.power * 1.2);
    base.uid = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    return base;
  }

  itemPower(item) {
    return Math.round(
      (item.attack || 0) * 2 +
      (item.defense || 0) * 1.7 +
      (item.hp || 0) * 0.35 +
      (item.critChance || 0) * 5 +
      (item.recovery || 0) * 8
    );
  }

  createMerchantStock() {
    return [
      this.createEquipmentReward("merchant"),
      this.createEquipmentReward("merchant"),
      structuredClone(BASE_ITEMS.find(item => item.type === "potion")),
      { id: "merchant-key", name: "Silberschlüssel", icon: "🗝️", type: "merchant-key", value: 45 }
    ];
  }

  createQuests() {
    return QUEST_TEMPLATES.slice(0, 3).map(template => ({
      ...structuredClone(template),
      progress: 0,
      claimed: false
    }));
  }

  get player() {
    return this.state.player;
  }

  get currentRoom() {
    return this.state.dungeon.rooms.find(room => room.id === this.state.currentRoomId);
  }

  get currentTiles() {
    return this.currentRoom?.tiles || [];
  }

  get attack() {
    const raw =
      this.player.baseAttack +
      this.equipmentBonus("attack");

    return this.state.defeatPenalty.active
      ? Math.max(1, Math.floor(raw * DEFEAT_ATTACK_MULTIPLIER))
      : raw;
  }

  get defense() {
    const raw =
      this.player.baseDefense +
      this.equipmentBonus("defense");

    return this.state.defeatPenalty.active
      ? Math.max(0, Math.floor(raw * DEFEAT_DEFENSE_MULTIPLIER))
      : raw;
  }

  get totalCritChance() {
    return Math.min(75, this.player.critChance + this.equipmentBonus("critChance"));
  }

  get totalRecovery() {
    return this.player.recovery + this.equipmentBonus("recovery");
  }

  equipmentBonus(key) {
    return Object.values(this.player.equipment)
      .filter(Boolean)
      .reduce((sum, item) => sum + (item[key] || 0), 0);
  }

  equipmentSlots() {
    return [
      { id: "weapon", label: "Waffe" },
      { id: "offhand", label: "Nebenhand" },
      { id: "helmet", label: "Helm" },
      { id: "armor", label: "Brust" },
      { id: "gloves", label: "Handschuhe" },
      { id: "pants", label: "Hose" },
      { id: "boots", label: "Schuhe" },
      { id: "ring1", label: "Ring 1" },
      { id: "ring2", label: "Ring 2" },
      { id: "amulet", label: "Amulett" }
    ];
  }

  loop(now) {
    const dt = Math.min(1, (now - this.lastTick) / 1000);
    this.lastTick = now;

    this.player.ap = Math.min(
      this.player.maxAp,
      this.player.ap + this.totalRecovery * dt
    );

    const outOfCombatFor = now - (this.state.lastCombatAt || 0);
    const canRegen =
      this.state.meditation.active ||
      this.state.lastCombatAt === 0 ||
      outOfCombatFor > PLAYER_REGEN_DELAY;

    if (this.player.defeated) {
      this.player.hp = Math.min(
        this.player.maxHp,
        this.player.hp +
        (this.totalRecovery * DEFEAT_REGEN_MULTIPLIER + DEFEAT_REGEN_BONUS) * dt
      );
      if (this.player.hp >= this.player.maxHp) {
        this.player.hp = this.player.maxHp;
        this.player.defeated = false;

        if (this.state.defeatPenalty.pending) {
          this.state.defeatPenalty.pending = false;
          this.state.defeatPenalty.active = true;
          this.state.defeatPenalty.expiresAt =
            Date.now() + DEFEAT_PENALTY_DURATION;
        }

        this.state.message =
          "Du bist genesen, leidest aber noch unter einem Niederlagenmalus.";
        this.render();
      }
    } else if (canRegen && this.player.hp < this.player.maxHp) {
      this.player.hp = Math.min(
        this.player.maxHp,
        this.player.hp + this.totalRecovery * dt
      );
    }

    if (this.state.meditation.active && !this.player.defeated) {
      const rate = 0.35 + this.totalRecovery * 0.25 + this.state.floor * 0.04;
      this.state.meditation.xpBuffer += rate * dt;
      if (this.state.meditation.xpBuffer >= 1) {
        const xp = Math.floor(this.state.meditation.xpBuffer);
        this.state.meditation.xpBuffer -= xp;
        this.gainXp(xp, false);
      }
    }

    for (const room of this.state.dungeon.rooms) {
      for (const tile of room.tiles) {
        if (!tile.enemy || tile.completed || tile.enemy.hp <= 0) continue;
        if (
          tile.lastHitAt > 0 &&
          now - tile.lastHitAt > ENEMY_REGEN_DELAY &&
          tile.enemy.hp < tile.enemy.maxHp
        ) {
          tile.enemy.hp = Math.min(
            tile.enemy.maxHp,
            tile.enemy.hp + ENEMY_REGEN_PER_SECOND * dt
          );
        }
      }
    }

    if (
      this.state.defeatPenalty.active &&
      Date.now() >= this.state.defeatPenalty.expiresAt
    ) {
      this.clearDefeatPenalty(
        "Der Niederlagenmalus ist abgeklungen."
      );
    }

    this.updateDynamicBars();
    this.updateDefeatPenaltyDisplay();
    requestAnimationFrame(this.loop);
  }

  render() {
    const biome = this.currentBiome();
    document.documentElement.style.setProperty("--biome-accent", biome.accent);

    this.root.innerHTML = `
      <div class="game-shell">
        ${this.renderTopbar()}
        <div class="main-grid">
          ${this.renderSidebar()}
          ${this.renderCenter()}
          ${this.renderRightPanel()}
        </div>
      </div>
      ${this.renderOverlay()}
      ${this.renderStageTransition()}
    `;
    this.bind();
  }

  renderTopbar() {
    const biome = this.currentBiome();
    return `
      <header class="topbar">
        <div class="level-badge box">
          <span>LEVEL</span>
          <strong>${this.player.level}</strong>
        </div>
        <div class="top-center box">
          ${this.resource("💎", this.state.gems)}
          ${this.resource("🪙", Math.floor(this.state.gold))}
          ${this.resource("🗝️", this.state.silverKeys)}
          ${this.resource("⛓️", this.state.materials.iron)}
          <div class="stage-title">
            ${biome.name} · ETAGE ${this.state.floor} · RAUM ${this.currentRoom.id + 1}
          </div>
        </div>
        <div class="top-actions box">
          <button class="icon-btn" id="questsBtn">📜</button>
          <button class="icon-btn" id="collectionBtn">📚</button>
          <button class="icon-btn" id="soundBtn">${this.audio.enabled ? "🔊" : "🔇"}</button>
          <button class="icon-btn" id="saveBtn">💾</button>
          <button class="icon-btn danger" id="resetBtn">⏻</button>
        </div>
      </header>
    `;
  }

  renderSidebar() {
    return `
      <aside class="sidebar box">
        ${this.statCard("❤️", "HP", this.player.hp, this.player.maxHp, "hp-fill", "hpBar", "hp")}
        ${this.statCard("⚡", "AP", this.player.ap, this.player.maxAp, "ap-fill", "apBar", "ap")}
        ${this.statCard("🗡️", "ANGRIFF", this.attack, 140, "atk-fill", "", "attack")}
        ${this.statCard("🛡️", "VERTEIDIGUNG", this.defense, 140, "def-fill", "", "defense")}
        ${this.statCard("🎯", "KRIT", this.totalCritChance, 75, "crit-fill", "", "crit")}
        ${this.statCard("💧", "ERHOLUNG", this.totalRecovery, 30, "rcv-fill", "", "recovery")}

        <div class="xp-card">
          <div class="xp-head">
            <span>ERFAHRUNG</span>
            <strong>${Math.floor(this.player.xp)}/${this.player.xpNext}</strong>
          </div>
          <div class="xp-track">
            <div id="xpGainBar" class="xp-gain-fill" style="width:${this.xpGainPercent()}%"></div>
            <div id="xpMainBar" class="xp-fill" style="width:${this.xpMainPercent()}%"></div>
          </div>
          <div class="talent-points">Talentpunkte: <strong>${this.player.talentPoints}</strong></div>
        </div>

        ${this.renderDefeatPenaltyCard()}

        <button class="meditation-btn ${this.state.meditation.active ? "active" : ""}"
          id="meditationBtn" ${this.player.defeated ? "disabled" : ""}>
          ${this.player.defeated ? "MEDITATION GESPERRT" :
            this.state.meditation.active ? "MEDITATION BEENDEN" : "MEDITIEREN"}
        </button>

        <div class="minimap-box">
          <div class="minimap-title">ETAGEN-KARTE</div>
          ${this.renderDungeonMap()}
        </div>
      </aside>
    `;
  }

  renderDungeonMap() {
    const rooms = this.state.dungeon.rooms;
    const visible = rooms.filter(room => room.revealed || room.visited);
    const minX = Math.min(...visible.map(room => room.x));
    const maxX = Math.max(...visible.map(room => room.x));
    const minY = Math.min(...visible.map(room => room.y));
    const maxY = Math.max(...visible.map(room => room.y));
    const width = (maxX - minX + 1) * 2 - 1;
    const height = (maxY - minY + 1) * 2 - 1;
    const cells = Array(width * height).fill(`<div class="map-space"></div>`);
    const setCell = (x, y, html) => cells[y * width + x] = html;

    for (const room of visible) {
      const gx = (room.x - minX) * 2;
      const gy = (room.y - minY) * 2;
      const classes = ["map-room"];
      if (room.visited) classes.push("visited");
      if (room.completed) classes.push("completed");
      if (room.id === this.currentRoom.id) classes.push("current");

      setCell(gx, gy, `
        <button class="${classes.join(" ")}" data-map-room="${room.id}"
          ${room.id === this.currentRoom.id || this.player.defeated ? "disabled" : ""}>
          ${room.id === this.currentRoom.id ? "●" :
            room.completed ? "✓" : this.roomTypeInfo(room.type).icon}
        </button>
      `);

      if (room.neighbors.right !== undefined) {
        const target = rooms.find(r => r.id === room.neighbors.right);
        if (target?.revealed) setCell(gx + 1, gy, `<div class="map-corridor horizontal"></div>`);
      }
      if (room.neighbors.down !== undefined) {
        const target = rooms.find(r => r.id === room.neighbors.down);
        if (target?.revealed) setCell(gx, gy + 1, `<div class="map-corridor vertical"></div>`);
      }
    }

    return `<div class="zelda-map connected-map"
      style="grid-template-columns:repeat(${width},24px);grid-template-rows:repeat(${height},24px)">
      ${cells.join("")}
    </div>`;
  }

  renderCenter() {
    return `
      <section class="center-panel box">
        <div class="notice ${this.player.defeated ? "defeat-notice" : ""}">
          ${this.escape(this.state.message)}
        </div>
        ${this.player.defeated ? `
          <div class="defeat-panel">
            <strong>BESIEGT</strong>
            <span>Alle Gegner wurden geheilt. Warte auf vollständige Genesung.</span>
          </div>` : ""}
        <div class="board-wrap">
          <div class="dungeon-board">
            ${this.currentTiles
              .filter(tile => !tile.hiddenByCapacity)
              .map(tile => this.renderTile(tile))
              .join("")}
            ${this.renderExitTile()}
          </div>
        </div>
      </section>
    `;
  }

  renderTile(tile) {
    if (tile.completed) {
      return `<button class="tile completed" style="${this.tileGridStyle(tile)}" disabled>
        <span class="tile-title">ERLEDIGT</span>
        <span class="tile-sub">${this.completedLabel(tile)}</span>
        <span class="tile-icon">✓</span>
      </button>`;
    }

    if (tile.type === "explore" && !tile.discovered) {
      return `<button class="tile explore" style="${this.tileGridStyle(tile)}" data-tile="${tile.id}" ${this.player.defeated ? "disabled" : ""}>
        <div class="progress-layer" style="transform:scaleX(${tile.progress / 100})"></div>
        <div class="tile-content">
          <span class="tile-title">${Math.floor(tile.progress)}%</span>
          <span class="tile-sub">ERKUNDEN · ${ACTION_AP_COST} AP</span>
          <span class="tile-icon">🔎</span>
        </div>
      </button>`;
    }

    if (tile.type === "enemy" || tile.type === "boss") {
      const enemy = tile.enemy;
      const layered = Boolean(enemy.elite || enemy.boss);
      const barCount = layered
        ? Math.max(1, Math.ceil(enemy.maxHp / 100))
        : 1;

      return `<button
        class="tile ${tile.type} ${enemy.elite ? "elite-enemy" : ""}"
        style="${this.tileGridStyle(tile)}"
        data-tile="${tile.id}"
        ${this.player.defeated ? "disabled" : ""}>
        ${this.renderEnemyHealthBars(enemy, barCount)}
        <div class="tile-content">
          <span class="tile-title">
            ${enemy.elite ? "★ " : ""}${this.escape(enemy.name)}
          </span>
          <span class="tile-sub">
            HP ${Math.ceil(enemy.hp)}/${enemy.maxHp}
            · ST ${enemy.attack}
            · ${ACTION_AP_COST} AP
          </span>
          <span class="enemy-bar-count">
            ${layered ? `${this.remainingHealthBars(enemy)}/${barCount} LEISTEN` : ""}
          </span>
          <span class="tile-icon">${enemy.icon}</span>
        </div>
      </button>`;
    }

    if (tile.type === "object") {
      return `<button class="tile object" style="${this.tileGridStyle(tile)}" data-tile="${tile.id}" ${this.player.defeated ? "disabled" : ""}>
        <span class="tile-title">${Math.ceil(tile.object.hp)}/${tile.object.maxHp}</span>
        <span class="tile-sub">${tile.object.name}</span>
        <span class="tile-icon">${tile.object.icon}</span>
      </button>`;
    }

    const info = {
      treasure: ["SCHATZTRUHE", "Benötigt 1 Schlüssel", "🧰"],
      trap: ["FALLE", "Optional", "⚠️"],
      shrine: ["HEILIGTUM", "Kostenlos heilen", "🏛️"],
      fountain: ["BRUNNEN", "HP und AP auffüllen", "⛲"],
      merchant: ["HÄNDLER", "Handeln", "🛒"],
      empty: ["LEER", "Optional", "·"]
    }[tile.type] || ["FELD", "", ""];

    return `<button class="tile ${tile.type}" style="${this.tileGridStyle(tile)}" data-tile="${tile.id}" ${this.player.defeated ? "disabled" : ""}>
      <span class="tile-title">${info[0]}</span>
      <span class="tile-sub">${info[1]}</span>
      <span class="tile-icon">${info[2]}</span>
    </button>`;
  }

  renderEnemyHealthBars(enemy, barCount) {
    const bars = [];
    const remainingBars = this.remainingHealthBars(enemy);

    for (let index = 0; index < barCount; index += 1) {
      const barStart = index * 100;
      const barHp = Math.max(
        0,
        Math.min(100, enemy.hp - barStart)
      );
      const fill = barHp / 100;
      const active = index < remainingBars;
      const color = this.enemyBarColor(
        index,
        barCount,
        remainingBars,
        enemy
      );

      const isCurrentBar =
        active &&
        index === Math.max(0, remainingBars - 1);

      bars.push(`
        <span class="enemy-health-segment ${active ? "active" : "empty"} ${isCurrentBar ? "current-layer" : ""}">
          <span
            class="enemy-health-fill"
            style="
              transform:scaleX(${fill});
              background:${color};
            ">
          </span>
        </span>
      `);
    }

    // Höchste Lebensschicht wird oben angezeigt.
    return `
      <div
        class="enemy-health-stack"
        style="--health-bars:${barCount}">
        ${bars.reverse().join("")}
      </div>
    `;
  }

  remainingHealthBars(enemy) {
    return Math.max(0, Math.ceil(enemy.hp / 100));
  }

  enemyBarColor(index, barCount, remainingBars, enemy) {
    const baseHue = enemy.boss ? 2 : enemy.elite ? 28 : 24;
    const visibleLayer = Math.max(0, remainingBars - 1);
    const layerRatio =
      barCount <= 1
        ? 0
        : visibleLayer / (barCount - 1);

    // Viele verbleibende Lebensleisten sind dunkler.
    // Je näher der Gegner dem Tod kommt, desto heller wird die aktive Farbe.
    const lightness = Math.round(68 - layerRatio * 30);
    const saturation = enemy.boss ? 84 : 78;

    return `hsl(${baseHue} ${saturation}% ${lightness}%)`;
  }

  renderRightPanel() {
    const selected = this.player.inventory[this.selectedItem] || null;
    return `
      <aside class="right-panel box">
        <div class="equipment-slots expanded-slots">
          ${this.equipmentSlots().map(slot => this.equipmentSlot(slot.id, slot.label)).join("")}
        </div>
        <div class="tabs">
          <button class="tab ${this.activeTab === "equipment" ? "active" : ""}" data-tab="equipment">AUSRÜSTUNG</button>
          <button class="tab ${this.activeTab === "inventory" ? "active" : ""}" data-tab="inventory">ITEMS</button>
        </div>
        <div class="inventory-pane">
          <div class="item-info">
            ${selected ? selected.slot ? this.renderEquipmentComparison(selected)
              : this.renderConsumableDetails(selected)
              : `<p>Wähle einen Gegenstand.</p>`}
          </div>
          <div class="item-grid">
            ${this.player.inventory.map((item, index) => `
              <button class="item-cell ${index === this.selectedItem ? "selected" : ""}"
                data-item="${index}">
                <span class="big">${item.icon}</span>
                <span>${this.escape(item.name)}</span>
              </button>`).join("")}
          </div>
        </div>
        <div class="bottom-actions inventory-actions">
          <button class="action-btn use" id="useBtn" ${!selected || selected.type !== "potion" ? "disabled" : ""}>BENUTZEN</button>
          <button class="action-btn primary" id="equipBtn" ${!selected || !selected.slot ? "disabled" : ""}>AUSRÜSTEN</button>
          <button class="action-btn sell" id="sellBtn" ${!selected ? "disabled" : ""}>VERKAUFEN</button>
        </div>
      </aside>
    `;
  }

  renderEquipmentComparison(selected) {
    const equipped = this.player.equipment[selected.slot] || null;
    return `<section class="comparison-card">
      <div class="comparison-heading">
        <div>
          <span class="comparison-kicker">ILVL ${selected.itemLevel || 1} · POWER ${selected.power || 0}</span>
          <h3 class="comparison-item-name rarity-${selected.rarity || "common"}">${this.escape(selected.name)}</h3>
          <span class="comparison-rarity">${selected.rarityLabel || "Gewöhnlich"}</span>
        </div>
        <span class="comparison-value">${selected.value || 0} G</span>
      </div>
      <div class="comparison-table">
        ${this.comparisonRow("Angriff", selected.attack || 0, equipped?.attack || 0)}
        ${this.comparisonRow("Verteidigung", selected.defense || 0, equipped?.defense || 0)}
        ${this.comparisonRow("HP", selected.hp || 0, equipped?.hp || 0)}
        ${this.comparisonRow("Krit", selected.critChance || 0, equipped?.critChance || 0)}
        ${this.comparisonRow("Erholung", selected.recovery || 0, equipped?.recovery || 0)}
      </div>
      <div class="affix-list">
        ${(selected.affixes || []).map(a => `<span>${this.escape(a)}</span>`).join("")}
      </div>
    </section>`;
  }

  renderConsumableDetails(item) {
    return `<section class="comparison-card">
      <h3 class="comparison-item-name">${this.escape(item.name)}</h3>
      <p>${item.heal ? `Heilt ${item.heal} HP.` : "Spezialgegenstand."}</p>
    </section>`;
  }

  comparisonRow(label, selected, equipped) {
    const diff = selected - equipped;
    const cls = diff > 0 ? "better" : diff < 0 ? "worse" : "equal";
    return `<div class="comparison-row ${cls}">
      <span class="comparison-stat">${label}</span>
      <span>${equipped}</span><span>→</span><span>${selected}</span>
      <span class="comparison-difference">${diff > 0 ? "+" : ""}${diff}</span>
    </div>`;
  }

  bind() {
    document.querySelectorAll("[data-tile]").forEach(button => {
      button.onclick = () => this.actOnTile(Number(button.dataset.tile));
    });
    document.querySelectorAll("[data-map-room]").forEach(button => {
      button.onclick = () => this.moveToRoom(Number(button.dataset.mapRoom));
    });
    document.querySelectorAll("[data-item]").forEach(button => {
      button.onclick = () => {
        this.selectedItem = Number(button.dataset.item);
        this.render();
      };
    });
    document.querySelectorAll("[data-tab]").forEach(button => {
      button.onclick = () => {
        this.activeTab = button.dataset.tab;
        this.render();
      };
    });
    document.querySelectorAll("[data-stat]").forEach(button => {
      button.onclick = () => this.spendTalentPoint(button.dataset.stat);
    });

    document.getElementById("stairsBtn")?.addEventListener("click", () => this.descendFloor());
    document.getElementById("useBtn")?.addEventListener("click", () => this.useSelectedItem());
    document.getElementById("equipBtn")?.addEventListener("click", () => this.equipSelected());
    document.getElementById("sellBtn")?.addEventListener("click", () => this.sellSelected());
    document.getElementById("meditationBtn")?.addEventListener("click", () => this.toggleMeditation());
    document.getElementById("questsBtn")?.addEventListener("click", () => this.openOverlay("quests"));
    document.getElementById("collectionBtn")?.addEventListener("click", () => this.openOverlay("collection"));
    document.getElementById("soundBtn")?.addEventListener("click", () => {
      this.audio.toggle();
      this.render();
    });
    document.getElementById("saveBtn")?.addEventListener("click", () => this.save());
    document.getElementById("resetBtn")?.addEventListener("click", () => this.reset());

    document.querySelectorAll("[data-buy]").forEach(button => {
      button.onclick = () => this.buyMerchantItem(Number(button.dataset.buy));
    });
    document.querySelectorAll("[data-upgrade]").forEach(button => {
      button.onclick = () => this.upgradeItem(Number(button.dataset.upgrade));
    });
    document.querySelectorAll("[data-dismantle]").forEach(button => {
      button.onclick = () => this.dismantleItem(Number(button.dataset.dismantle));
    });
    document.querySelectorAll("[data-brew]").forEach(button => {
      button.onclick = () => this.brewPotion(button.dataset.brew);
    });
    document.querySelectorAll("[data-claim-quest]").forEach(button => {
      button.onclick = () => this.claimQuest(Number(button.dataset.claimQuest));
    });
    document.getElementById("overlayClose")?.addEventListener("click", () => {
      this.activeOverlay = null;
      this.render();
    });
  }

  actOnTile(id) {
    if (!this.canAct()) return;
    if (this.state.meditation.active) this.state.meditation.active = false;

    const tile = this.currentTiles.find(tile => tile.id === id);
    if (!tile || tile.completed) return;

    if (tile.type === "explore") return this.explore(tile);
    if (tile.type === "enemy" || tile.type === "boss") return this.attackEnemy(tile);
    if (tile.type === "object") return this.attackObject(tile);

    if (tile.type === "treasure") {
      if (this.state.silverKeys <= 0) {
        this.state.message = "Die Truhe benötigt einen silbernen Schlüssel.";
        this.audio.play("error");
        return this.render();
      }
      this.state.silverKeys -= 1;
      const item = this.createEquipmentReward("chest");
      this.player.inventory.push(item);
      this.registerItem(item);
      this.state.stats.chestsOpened += 1;
      this.updateQuest("chest", 1);
      return this.finishTile(tile, `Schatztruhe: ${item.name} gefunden.`);
    }

    if (tile.type === "trap") {
      const damage = 8 + this.state.floor * 2;
      this.player.hp -= damage;
      if (this.player.hp <= 0) return this.handleDefeat();
      return this.finishTile(tile, `Falle ausgelöst: ${damage} Schaden.`);
    }

    if (tile.type === "shrine") {
      const heal = Math.min(25, this.player.maxHp - this.player.hp);
      this.player.hp += heal;

      const removedPenalty =
        this.state.defeatPenalty.active ||
        this.state.defeatPenalty.pending;

      if (removedPenalty) {
        this.clearDefeatPenalty();
      }

      return this.finishTile(
        tile,
        removedPenalty
          ? `Heiligtum: +${heal} HP. Der Niederlagenmalus wurde entfernt.`
          : `Heiligtum: +${heal} HP.`
      );
    }

    if (tile.type === "fountain") {
      this.player.hp = this.player.maxHp;
      this.player.ap = this.player.maxAp;
      return this.finishTile(tile, "Brunnen: HP und AP vollständig aufgefüllt.");
    }

    if (tile.type === "merchant") {
      this.activeOverlay = "merchant";
      return this.render();
    }

    return this.finishTile(tile, "Feld abgeschlossen.");
  }

  explore(tile) {
    if (!this.spendAp(ACTION_AP_COST)) return;
    tile.progress = Math.min(100, tile.progress + 20 + Math.random() * 8);
    this.state.stats.exploredTiles += 1;
    this.updateQuest("explore", 1);
    this.state.message = `Erkundung: ${Math.floor(tile.progress)} %.`;

    if (tile.progress >= 100) {
      const outcomes = ["enemy", "enemy", "object", "treasure", "trap", "empty"];
      tile.type = outcomes[Math.floor(Math.random() * outcomes.length)];
      tile.discovered = true;
      tile.locked = tile.type === "treasure";
      if (tile.type === "enemy") tile.enemy = this.makeEnemy(false, false);
      if (tile.type === "object") {
        const hp = 18 + this.state.floor * 2;
        const vase = Math.random() < 0.5;
        tile.object = { name: vase ? "Vase" : "Kiste", icon: vase ? "🏺" : "📦", hp, maxHp: hp };
      }
    }
    this.render();
  }

  attackEnemy(tile) {
    if (!this.spendAp(ACTION_AP_COST)) return;
    const enemy = tile.enemy;
    const critical = Math.random() * 100 < this.totalCritChance;
    let damage = this.damage(this.attack, enemy.defense);
    if (critical) damage *= 2;

    enemy.hp = Math.max(0, enemy.hp - damage);
    tile.lastHitAt = performance.now();
    this.state.lastCombatAt = performance.now();

    if (enemy.hp > 0) {
      const retaliation = this.damage(enemy.attack, this.defense);
      this.player.hp -= retaliation;
      this.state.message =
        `${critical ? "KRITISCH! " : ""}${enemy.name}: -${damage} HP · Du: -${retaliation} HP.`;
      if (this.player.hp <= 0) return this.handleDefeat();
      return this.render();
    }

    this.state.gold += enemy.reward;
    this.gainXp(enemy.xp);
    this.registerEnemy(enemy);
    this.state.stats.enemiesKilled += 1;
    this.updateQuest("kill", 1);

    if (enemy.boss) {
      this.state.stats.bossesKilled += 1;
      this.updateQuest("boss", 1);
    }

    const dropChance = enemy.boss ? 1 : enemy.elite ? 1 : 0.12;
    let message = `${enemy.name} besiegt. +${enemy.reward} Gold, +${enemy.xp} XP.`;

    if (Math.random() < dropChance) {
      const item = this.createEquipmentReward(enemy.boss ? "boss" : enemy.elite ? "elite" : "normal");
      this.player.inventory.push(item);
      this.registerItem(item);
      message += ` Beute: ${item.name}.`;
    }

    if (Math.random() < (enemy.boss ? 0.85 : enemy.elite ? 0.45 : 0.14)) {
      this.state.silverKeys += 1;
      message += " Schlüssel gefunden.";
    }

    this.finishTile(tile, message);
  }

  attackObject(tile) {
    const damage = Math.max(1, this.attack);
    tile.object.hp = Math.max(0, tile.object.hp - damage);
    if (tile.object.hp > 0) {
      this.state.message = `${tile.object.name}: -${damage} Haltbarkeit.`;
      return this.render();
    }

    const roll = Math.random();
    if (roll < 0.18) {
      this.state.silverKeys += 1;
      return this.finishTile(tile, `${tile.object.name}: Schlüssel gefunden.`);
    }
    if (roll < 0.50) {
      const potion = structuredClone(BASE_ITEMS.find(item => item.type === "potion"));
      this.player.inventory.push(potion);
      return this.finishTile(tile, `${tile.object.name}: Heiltrank gefunden.`);
    }

    const gold = 8 + Math.floor(Math.random() * 20);
    this.state.gold += gold;
    this.finishTile(tile, `${tile.object.name}: ${gold} Gold gefunden.`);
  }

  finishTile(tile, message) {
    tile.completed = true;
    this.state.message = message;
    this.checkRoomCompletion(this.currentRoom.id);
    this.render();
  }

  checkRoomCompletion(roomId) {
    const room = this.state.dungeon.rooms.find(room => room.id === roomId);
    const enemies = room.tiles.filter(tile => tile.type === "enemy" || tile.type === "boss");
    room.completed = enemies.length === 0 || enemies.every(tile => tile.completed);

    if (this.state.dungeon.rooms.every(room => room.completed)) {
      this.state.dungeon.exitUnlocked = true;
      this.state.message = "Etage gesichert. Der Abstieg ist freigeschaltet.";
    }
  }

  moveToRoom(roomId) {
    if (!this.canAct()) return;
    const room = this.state.dungeon.rooms.find(room => room.id === roomId);
    if (!room) return;
    room.visited = true;
    room.revealed = true;
    this.revealAdjacentRooms(this.state.dungeon.rooms, room.id);
    this.state.currentRoomId = room.id;
    this.checkRoomCompletion(room.id);
    this.render();
  }

  revealAdjacentRooms(rooms, roomId) {
    const room = rooms.find(room => room.id === roomId);
    if (!room) return;
    room.revealed = true;
    for (const id of Object.values(room.neighbors)) {
      const neighbor = rooms.find(room => room.id === id);
      if (neighbor) neighbor.revealed = true;
    }
  }

  descendFloor() {
    if (!this.state.dungeon.exitUnlocked || !this.canAct()) return;
    const next = this.state.floor + 1;
    this.stageTransition = { from: this.state.floor, to: next };
    this.render();

    setTimeout(() => {
      this.state.floor = next;
      this.state.stats.highestFloor = Math.max(this.state.stats.highestFloor, next);
      this.state.dungeon = this.createDungeon();
      this.state.currentRoomId = 0;
      if (this.state.floor >= this.state.merchant.refreshFloor + 3) {
        this.state.merchant.stock = this.createMerchantStock();
        this.state.merchant.refreshFloor = this.state.floor;
      }
      this.stageTransition = null;
      this.state.message = `${this.currentBiome().name} · Etage ${next}.`;
      this.render();
    }, 1200);
  }

  renderExitTile() {
    if (!this.state.dungeon.exitUnlocked) return "";
    return `<button class="tile stairs" style="grid-column:7 / span 2;grid-row:7 / span 2" id="stairsBtn">
      <span class="tile-title">ABSTIEG</span>
      <span class="tile-sub">Zur nächsten Etage</span>
      <span class="tile-icon">🪜</span>
    </button>`;
  }

  openOverlay(type) {
    this.activeOverlay = type;
    this.render();
  }

  renderOverlay() {
    if (!this.activeOverlay) return "";

    const content = {
      merchant: this.renderMerchant(),
      smith: this.renderSmith(),
      alchemist: this.renderAlchemist(),
      quests: this.renderQuests(),
      collection: this.renderCollection()
    }[this.activeOverlay] || "";

    return `<div class="overlay">
      <div class="modal large-modal">
        <button class="modal-close" id="overlayClose">✕</button>
        ${content}
      </div>
    </div>`;
  }

  renderMerchant() {
    return `<h2>Händler</h2>
      <div class="shop-grid">
        ${this.state.merchant.stock.map((item, index) => `
          <div class="shop-item">
            <span class="shop-icon">${item.icon}</span>
            <strong>${this.escape(item.name)}</strong>
            <span>${item.value || 0} Gold</span>
            <button data-buy="${index}">KAUFEN</button>
          </div>`).join("")}
      </div>
      <div class="service-links">
        <button onclick="void(0)" data-open-service="smith">Schmied</button>
        <button onclick="void(0)" data-open-service="alchemist">Alchemist</button>
      </div>`;
  }

  renderSmith() {
    return `<h2>Schmied</h2>
      <p>Materialien: ${this.state.materials.iron} Eisen · ${this.state.materials.essence} Essenz</p>
      <div class="service-list">
        ${this.player.inventory.filter(item => item.slot).map(item => {
          const index = this.player.inventory.indexOf(item);
          return `<div class="service-item">
            <strong>${this.escape(item.name)}</strong>
            <span>Power ${item.power || 0}</span>
            <button data-upgrade="${index}">VERBESSERN</button>
            <button data-dismantle="${index}">ZERLEGEN</button>
          </div>`;
        }).join("") || "<p>Keine Ausrüstung vorhanden.</p>"}
      </div>`;
  }

  renderAlchemist() {
    return `<h2>Alchemist</h2>
      <p>Essenz: ${this.state.materials.essence}</p>
      <div class="shop-grid">
        <div class="shop-item">
          <span class="shop-icon">🧪</span>
          <strong>Heiltrank</strong>
          <span>2 Essenz</span>
          <button data-brew="heal">BRAUEN</button>
        </div>
        <div class="shop-item">
          <span class="shop-icon">🎯</span>
          <strong>Präzisionstrank</strong>
          <span>4 Essenz</span>
          <button data-brew="crit">BRAUEN</button>
        </div>
        <div class="shop-item">
          <span class="shop-icon">✨</span>
          <strong>Erfahrungselixier</strong>
          <span>5 Essenz</span>
          <button data-brew="xp">BRAUEN</button>
        </div>
      </div>`;
  }

  renderQuests() {
    return `<h2>Aufgaben</h2>
      <div class="quest-list">
        ${this.state.quests.map((quest, index) => `
          <div class="quest-item">
            <strong>${quest.label}</strong>
            <span>${quest.progress}/${quest.target}</span>
            <span>${quest.rewardGold} Gold · ${quest.rewardGems} 💎</span>
            <button data-claim-quest="${index}"
              ${quest.progress < quest.target || quest.claimed ? "disabled" : ""}>
              ${quest.claimed ? "ABGEHOLT" : "BELOHNUNG"}
            </button>
          </div>`).join("")}
      </div>`;
  }

  renderCollection() {
    return `<h2>Sammlung</h2>
      <div class="collection-columns">
        <section>
          <h3>Bestiarium</h3>
          ${Object.entries(this.state.collection.enemies).map(([name, count]) =>
            `<p>${this.escape(name)} · ${count} besiegt</p>`).join("") || "<p>Noch leer.</p>"}
        </section>
        <section>
          <h3>Gegenstände</h3>
          ${Object.entries(this.state.collection.items).map(([name, count]) =>
            `<p>${this.escape(name)} · ${count} gefunden</p>`).join("") || "<p>Noch leer.</p>"}
        </section>
      </div>`;
  }

  buyMerchantItem(index) {
    const item = this.state.merchant.stock[index];
    if (!item || this.state.gold < item.value) {
      this.state.message = "Nicht genug Gold.";
      return this.render();
    }

    this.state.gold -= item.value;
    if (item.type === "merchant-key") this.state.silverKeys += 1;
    else this.player.inventory.push(structuredClone(item));
    this.state.message = `${item.name} gekauft.`;
    this.render();
  }

  upgradeItem(index) {
    const item = this.player.inventory[index];
    if (!item?.slot || this.state.materials.iron < 3) return;
    this.state.materials.iron -= 3;
    item.attack = Math.round((item.attack || 0) * 1.1);
    item.defense = Math.round((item.defense || 0) * 1.1);
    item.hp = Math.round((item.hp || 0) * 1.1);
    item.itemLevel = (item.itemLevel || 1) + 1;
    item.power = this.itemPower(item);
    this.render();
  }

  dismantleItem(index) {
    const item = this.player.inventory[index];
    if (!item?.slot) return;
    const iron = Math.max(1, Math.ceil((item.itemLevel || 1) / 3));
    const essence = ["rare", "epic", "legendary", "mythic"].includes(item.rarity) ? 1 : 0;
    this.state.materials.iron += iron;
    this.state.materials.essence += essence;
    this.player.inventory.splice(index, 1);
    this.selectedItem = 0;
    this.render();
  }

  brewPotion(type) {
    const costs = { heal: 2, crit: 4, xp: 5 };
    if (this.state.materials.essence < costs[type]) return;
    this.state.materials.essence -= costs[type];

    if (type === "heal") {
      this.player.inventory.push(structuredClone(BASE_ITEMS.find(item => item.type === "potion")));
    } else if (type === "crit") {
      this.player.critChance = Math.min(50, this.player.critChance + 1);
    } else if (type === "xp") {
      this.gainXp(Math.round(this.player.xpNext * 0.2));
    }
    this.render();
  }

  updateQuest(id, amount) {
    for (const quest of this.state.quests.filter(q => q.id === id && !q.claimed)) {
      quest.progress = Math.min(quest.target, quest.progress + amount);
    }
  }

  claimQuest(index) {
    const quest = this.state.quests[index];
    if (!quest || quest.claimed || quest.progress < quest.target) return;
    quest.claimed = true;
    this.state.gold += quest.rewardGold;
    this.state.gems += quest.rewardGems;
    this.render();
  }

  registerEnemy(enemy) {
    this.state.collection.enemies[enemy.name] =
      (this.state.collection.enemies[enemy.name] || 0) + 1;
  }

  registerItem(item) {
    this.state.collection.items[item.name] =
      (this.state.collection.items[item.name] || 0) + 1;
    this.state.stats.itemsFound += 1;
  }

  useSelectedItem() {
    const item = this.player.inventory[this.selectedItem];
    if (!item || item.type !== "potion") return;
    const healed = Math.min(item.heal, this.player.maxHp - this.player.hp);
    this.player.hp += healed;
    this.player.inventory.splice(this.selectedItem, 1);
    this.selectedItem = 0;
    this.state.message = `${item.name}: +${healed} HP.`;
    this.render();
  }

  equipSelected() {
    const item = this.player.inventory[this.selectedItem];
    if (!item?.slot) return;

    let slot = item.slot;
    if (slot === "ring1" && this.player.equipment.ring1) {
      slot = this.player.equipment.ring2 ? "ring1" : "ring2";
    }

    const old = this.player.equipment[slot];
    this.player.equipment[slot] = item;
    this.player.inventory.splice(this.selectedItem, 1);
    if (old) this.player.inventory.push(old);
    this.selectedItem = 0;
    this.render();
  }

  sellSelected() {
    const item = this.player.inventory[this.selectedItem];
    if (!item) return;
    this.state.gold += item.value || 5;
    this.player.inventory.splice(this.selectedItem, 1);
    this.selectedItem = 0;
    this.render();
  }

  spendTalentPoint(stat) {
    if (this.player.talentPoints <= 0) return;

    if (stat === "hp") {
      this.player.maxHp += 10;
      this.player.hp += 10;
    } else if (stat === "ap") {
      this.player.maxAp += 5;
      this.player.ap += 5;
    } else if (stat === "attack") {
      this.player.baseAttack += 1;
    } else if (stat === "defense") {
      this.player.baseDefense += 1;
    } else if (stat === "crit") {
      this.player.critChance = Math.min(50, this.player.critChance + 1);
    } else if (stat === "recovery") {
      this.player.recovery += 1;
    } else return;

    this.player.talentPoints -= 1;
    this.render();
  }

  gainXp(amount, announce = true) {
    this.player.xp += amount;
    this.xpDisplay.whiteXp = this.player.xp;
    if (this.xpDisplay.blueXp === null) {
      this.xpDisplay.blueXp = Math.max(0, this.player.xp - amount);
    }

    while (this.player.xp >= this.player.xpNext) {
      this.player.xp -= this.player.xpNext;
      this.player.level += 1;
      this.player.talentPoints += 1;
      this.player.xpNext = Math.round(this.player.xpNext * 1.35);
      this.xpDisplay.blueXp = 0;
      this.xpDisplay.whiteXp = this.player.xp;
    }

    if (announce) this.state.message = `+${amount} Erfahrung.`;
    this.render();
    setTimeout(() => this.animateXpCatchup(), 250);
  }

  xpMainPercent() {
    const value = this.xpDisplay.blueXp ?? this.player.xp;
    return Math.min(100, value / this.player.xpNext * 100);
  }

  xpGainPercent() {
    const value = this.xpDisplay.whiteXp ?? this.player.xp;
    return Math.min(100, value / this.player.xpNext * 100);
  }

  animateXpCatchup() {
    const start = this.xpDisplay.blueXp ?? this.player.xp;
    const target = this.player.xp;
    const started = performance.now();

    const frame = now => {
      const p = Math.min(1, (now - started) / 800);
      const eased = 1 - Math.pow(1 - p, 3);
      this.xpDisplay.blueXp = start + (target - start) * eased;
      const bar = document.getElementById("xpMainBar");
      if (bar) {
        bar.style.width =
          `${Math.min(100, this.xpDisplay.blueXp / this.player.xpNext * 100)}%`;
      }
      if (p < 1) requestAnimationFrame(frame);
      else this.xpDisplay.blueXp = target;
    };

    requestAnimationFrame(frame);
  }

  renderDefeatPenaltyCard() {
    if (
      !this.state.defeatPenalty.active &&
      !this.state.defeatPenalty.pending
    ) {
      return "";
    }

    if (this.state.defeatPenalty.pending) {
      return `
        <div class="defeat-penalty-card pending">
          <strong>NIEDERLAGE</strong>
          <span>Malus beginnt nach vollständiger Genesung.</span>
        </div>
      `;
    }

    return `
      <div class="defeat-penalty-card">
        <div>
          <strong>GESCHWÄCHT</strong>
          <span>Angriff −30 % · Verteidigung −30 %</span>
        </div>
        <span
          class="defeat-penalty-time"
          id="defeatPenaltyTime">
          ${this.formatPenaltyTime()}
        </span>
      </div>
    `;
  }

  formatPenaltyTime() {
    if (!this.state.defeatPenalty.active) return "";

    const remaining = Math.max(
      0,
      this.state.defeatPenalty.expiresAt - Date.now()
    );
    const totalSeconds = Math.ceil(remaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }

  updateDefeatPenaltyDisplay() {
    const element = document.getElementById("defeatPenaltyTime");

    if (element && this.state.defeatPenalty.active) {
      element.textContent = this.formatPenaltyTime();
    }
  }

  clearDefeatPenalty(message = "") {
    const wasActive =
      this.state.defeatPenalty.active ||
      this.state.defeatPenalty.pending;

    this.state.defeatPenalty.active = false;
    this.state.defeatPenalty.pending = false;
    this.state.defeatPenalty.expiresAt = 0;

    if (wasActive && message) {
      this.state.message = message;
      this.render();
    }
  }

  toggleMeditation() {
    if (this.player.defeated) return;
    this.state.meditation.active = !this.state.meditation.active;
    this.render();
  }

  spendAp(cost) {
    if (this.player.ap < cost) {
      this.state.message = "Nicht genug Ausdauer.";
      this.render();
      return false;
    }
    this.player.ap -= cost;
    return true;
  }

  canAct() {
    if (!this.player.defeated) return true;
    this.state.message = "Du bist besiegt und musst dich vollständig erholen.";
    this.render();
    return false;
  }

  handleDefeat() {
    this.player.hp = 0;
    this.player.defeated = true;
    this.state.meditation.active = false;
    this.state.defeatPenalty.active = false;
    this.state.defeatPenalty.pending = true;
    this.state.defeatPenalty.expiresAt = 0;

    for (const room of this.state.dungeon.rooms) {
      for (const tile of room.tiles) {
        if (tile.enemy && !tile.completed && tile.enemy.hp > 0) {
          tile.enemy.hp = tile.enemy.maxHp;
        }
      }
    }

    this.state.message =
      "Besiegt. Alle lebenden Gegner wurden geheilt. Nach der Genesung erhältst du vorübergehend einen Angriffs- und Verteidigungsmalus.";
    this.render();
  }

  updateDynamicBars() {
    const hpBar = document.getElementById("hpBar");
    const apBar = document.getElementById("apBar");
    const hpValue = document.querySelector('[data-stat-value="hpBar"]');
    const apValue = document.querySelector('[data-stat-value="apBar"]');

    if (hpBar) hpBar.style.width = `${this.player.hp / this.player.maxHp * 100}%`;
    if (apBar) apBar.style.width = `${this.player.ap / this.player.maxAp * 100}%`;
    if (hpValue) hpValue.textContent = `${Math.floor(this.player.hp)}/${this.player.maxHp}`;
    if (apValue) apValue.textContent = `${Math.floor(this.player.ap)}/${this.player.maxAp}`;
  }

  statCard(icon, name, value, max, fillClass, id = "", statKey = "") {
    const unboundedStats = new Set(["attack", "defense", "recovery"]);
    const isUnbounded = unboundedStats.has(statKey);
    const percentage = isUnbounded
      ? 100
      : Math.max(4, Math.min(100, value / max * 100));

    return `<div class="stat-card ${isUnbounded ? "unbounded-stat" : ""}">
      <div class="stat-row">
        <div class="stat-icon">${icon}</div>
        <div>
          <div class="stat-name">${name}</div>
          <div class="stat-bar">
            <div id="${id}" class="stat-fill ${fillClass}" style="width:${percentage}%"></div>
            <div class="stat-value" data-stat-value="${id}">
              ${name === "HP" || name === "AP"
                ? `${Math.floor(value)}/${max}`
                : Math.floor(value)}
            </div>
          </div>
        </div>
        <button class="stat-plus" data-stat="${statKey}"
          ${!statKey || this.player.talentPoints <= 0 ? "disabled" : ""}>+</button>
      </div>
    </div>`;
  }

  equipmentSlot(slot, label) {
    const item = this.player.equipment[slot];
    return `<div class="slot">
      <span class="slot-icon">${item?.icon || "—"}</span>
      <span class="slot-name">${item ? this.escape(item.name) : label}</span>
    </div>`;
  }

  resource(icon, value) {
    return `<div class="resource"><span>${icon}</span><span>${value}</span></div>`;
  }

  roomTypeInfo(type) {
    return {
      start: { icon: "◆", label: "Start" },
      normal: { icon: "⚔", label: "Kampf" },
      explore: { icon: "?", label: "Erkundung" },
      elite: { icon: "★", label: "Elite" },
      boss: { icon: "☠", label: "Boss" },
      treasure: { icon: "▣", label: "Schatz" },
      merchant: { icon: "¤", label: "Händler" },
      fountain: { icon: "◉", label: "Brunnen" },
      shrine: { icon: "✦", label: "Heiligtum" },
      event: { icon: "!", label: "Ereignis" }
    }[type] || { icon: "·", label: "Raum" };
  }

  completedLabel(tile) {
    return {
      enemy: "Gegner",
      boss: "Boss",
      explore: "Erkundung",
      object: "Objekt",
      treasure: "Schatz",
      trap: "Falle",
      shrine: "Heiligtum",
      fountain: "Brunnen",
      merchant: "Händler"
    }[tile.type] || "Feld";
  }

  damage(attack, defense) {
    return Math.max(
      1,
      Math.round((attack - defense * 0.55) * (0.85 + Math.random() * 0.3))
    );
  }

  renderStageTransition() {
    if (!this.stageTransition) return "";
    return `<div class="stage-transition">
      <div class="stage-transition-card">
        <div class="stage-complete">ETAGE ${this.stageTransition.from} ABGESCHLOSSEN</div>
        <div class="stage-arrow">↓</div>
        <div class="stage-next">ETAGE ${this.stageTransition.to}</div>
      </div>
    </div>`;
  }

  save() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(this.state));
    this.state.message = "Spiel gespeichert.";
    this.render();
  }

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  reset() {
    localStorage.clear();
    this.state = this.createState();
    this.selectedItem = 0;
    this.activeOverlay = null;
    this.render();
  }

  escape(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[character]);
  }
}
