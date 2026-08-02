import {
  BIOMES,
  BASE_ITEMS,
  PREFIXES,
  SUFFIXES,
  RARITIES,
  QUEST_TEMPLATES,
  ROOM_TEMPLATES,
  BIOME_DECORATIONS
} from "./data.js";
import { AudioManager } from "./audio.js";
import { RuntimeContext } from "./engine/RuntimeContext.js";
import { StatisticsSystem } from "./systems/StatisticsSystem.js";
import { DebugPanel } from "./engine/DebugPanel.js";
import { RenderEngine } from "./renderer/RenderEngine.js";
import {
  GLOBAL_BALANCE,
  getZoneBalance
} from "./config/balance.js";
import {
  LEGACY_SAVE_KEYS,
  SAVE_KEY
} from "./config/version.js";
const ACTION_AP_COST = GLOBAL_BALANCE.actionApCost;
const ENEMY_REGEN_DELAY = GLOBAL_BALANCE.enemyRegenDelayMs;
const ENEMY_REGEN_PER_SECOND = GLOBAL_BALANCE.enemyRegenPerSecond;
const PLAYER_REGEN_DELAY = GLOBAL_BALANCE.playerRegenDelayMs;
const DEFEAT_REGEN_MULTIPLIER = 6;
const DEFEAT_REGEN_BONUS = 4;
const DEFEAT_PENALTY_DURATION = GLOBAL_BALANCE.defeatPenaltyDurationMs;
const DEFEAT_ATTACK_MULTIPLIER = GLOBAL_BALANCE.defeatAttackMultiplier;
const DEFEAT_DEFENSE_MULTIPLIER = GLOBAL_BALANCE.defeatDefenseMultiplier;

export class Game {
  constructor(root) {
    this.root = root;
    this.audio = new AudioManager();
    this.context = new RuntimeContext({
      seed: localStorage.getItem("dungeonlite.seed") || Date.now()
    });
    this.statisticsSystem = new StatisticsSystem(
      this.context,
      () => this.state
    );
    this.statisticsSystem.start();
    this.debugPanel = new DebugPanel(this);
    this.renderEngine = null;
    this.selectedItemUid = null;
    this.activeTab = "equipment";
    this.inventoryFilter = "all";
    this.inventorySort = "power-desc";
    this.activeOverlay = null;
    this.activeRoomTransition = null;
    this.tileEffect = null;
    this.combatFloater = null;
    this.stageTransition = null;
    this.lastTick = performance.now();
    this.xpDisplay = { blueXp: null, whiteXp: null, catchupActive: false };
    this.state = this.load() || this.createState();
    this.loop = this.loop.bind(this);
    this.handleGlobalKeydown =
      this.handleGlobalKeydown.bind(this);
    this.globalEventsBound = false;
  }

  createState() {
    const state = {
      floor: 1,
      seed: this.context.seed.seed,
      rngState: this.context.snapshot(),
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
    this.bindGlobalEvents();
    this.ensureStateShape();

    if (this.state.rngState) {
      this.context.restore(this.state.rngState);
    } else if (this.state.seed) {
      this.context.seed.setSeed(this.state.seed);
    }

    this.render();
    this.initializeRenderEngine();
    requestAnimationFrame(this.loop);
  }

  bindGlobalEvents() {
    if (this.globalEventsBound) return;

    document.addEventListener(
      "keydown",
      this.handleGlobalKeydown
    );

    this.globalEventsBound = true;
  }

  handleGlobalKeydown(event) {
    if (event.key !== "F2") return;

    event.preventDefault();
    this.debugPanel.toggle();
  }

  ensureStateShape() {
    this.state.seed ??= this.context.seed.seed;
    this.state.rngState ??= this.context.snapshot();

    const p = this.state.player;
    p.critChance ??= 5;
    p.talentPoints ??= 0;
    p.defeated ??= false;
    p.equipment ??= {};
    for (const slot of this.equipmentSlots()) {
      p.equipment[slot.id] ??= null;
    }

    const inventoryUids = new Set();
    for (const item of p.inventory || []) {
      this.ensureInventoryItemUid(item, inventoryUids);
    }

    this.state.defeatPenalty ??= {
      active: false,
      pending: false,
      expiresAt: 0
    };

    for (const room of this.state.dungeon?.rooms || []) {
      for (const tile of room.tiles || []) {
        // Ältere Versionen speicherten performance.now()-Werte.
        // Diese sind nach einem Neuladen nicht mehr vergleichbar.
        if (tile.lastHitAt > 0 && tile.lastHitAt < 1000000000000) {
          tile.lastHitAt = Date.now();
        }
      }
    }

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

  random() {
    return this.context.random();
  }

  pick(values) {
    return this.context.pick(values);
  }

  integer(min, max) {
    return this.context.integer(min, max);
  }

  chance(percent) {
    return this.context.chance(percent);
  }

  currentZoneBalance() {
    return getZoneBalance(this.currentBiome().id);
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
      const origin = positions[Math.floor(this.random() * positions.length)];
      const direction = directions[Math.floor(this.random() * directions.length)];
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
      room.templateId = room.tiles.templateId || "unknown";
      room.decorations = room.tiles.decorations || [];
    }

    this.revealAdjacentRooms(rooms, 0);
    return { rooms, exitUnlocked: false };
  }

  randomRoomType() {
    const roll = this.random();
    if (roll < 0.52) return "normal";
    if (roll < 0.70) return "explore";
    if (roll < 0.80) return "treasure";
    if (roll < 0.88) return "event";
    if (roll < 0.94) return "merchant";
    if (roll < 0.975) return "fountain";
    return "shrine";
  }

  createRoomTiles(roomType) {
    const templates =
      ROOM_TEMPLATES[roomType] ||
      ROOM_TEMPLATES.normal;

    const template =
      templates[Math.floor(this.random() * templates.length)];

    const tiles = [];
    let id = 0;

    const addTile = (type, row, column, width = 1, height = 1) => {
      const tile = {
        id: id++,
        type,
        progress: type === "explore" ? 0 : 100,
        discovered: type !== "explore",
        completed: false,
        locked: type === "treasure",
        lastHitAt: 0,
        grid: {
          row: row + 1,
          column: column + 1,
          width,
          height
        }
      };

      if (type === "enemy") {
        tile.enemy = this.makeEnemy(false, false);
      }

      if (type === "elite") {
        tile.type = "enemy";
        tile.elite = true;
        tile.enemy = this.makeEnemy(false, true);
      }

      if (type === "boss") {
        tile.enemy = this.makeEnemy(true, false);
      }

      if (type === "object") {
        const isVase = this.random() < 0.62;
        const hp = 18 + this.state.floor * 2;

        tile.object = {
          name: isVase ? "Vase" : "Kiste",
          icon: isVase ? "🏺" : "📦",
          hp,
          maxHp: hp
        };
      }

      tiles.push(tile);
    };

    const consumed = new Set();

    for (let row = 0; row < 8; row += 1) {
      for (let column = 0; column < 8; column += 1) {
        const key = `${row},${column}`;

        if (consumed.has(key)) continue;

        const symbol = template.layout[row]?.[column] || ".";

        if (symbol === "E") {
          addTile("enemy", row, column, 2, 1);
          consumed.add(`${row},${column + 1}`);
        } else if (symbol === "L") {
          addTile("elite", row, column, 2, 1);
          consumed.add(`${row},${column + 1}`);
        } else if (symbol === "B") {
          addTile("boss", row, column, 2, 2);
          consumed.add(`${row},${column + 1}`);
          consumed.add(`${row + 1},${column}`);
          consumed.add(`${row + 1},${column + 1}`);
        } else if (symbol === "H") {
          addTile("shrine", row, column, 2, 2);
          consumed.add(`${row},${column + 1}`);
          consumed.add(`${row + 1},${column}`);
          consumed.add(`${row + 1},${column + 1}`);
        } else if (symbol === "V") {
          addTile("object", row, column);
        } else if (symbol === "C") {
          addTile("treasure", row, column);
        } else if (symbol === "W") {
          addTile("fountain", row, column);
        } else if (symbol === "M") {
          addTile("merchant", row, column);
        } else if (symbol === "?") {
          addTile("explore", row, column);
        }
      }
    }

    // Mit steigender Etage werden zusätzliche Gegner und Objekte ergänzt.
    const additionalCount = Math.min(
      6,
      Math.floor((this.state.floor - 1) / 4)
    );

    for (let index = 0; index < additionalCount; index += 1) {
      const free = this.findFreeTemplateCell(tiles, index % 2 === 0 ? 2 : 1);

      if (!free) break;

      if (index % 2 === 0) {
        addTile("enemy", free.row, free.column, 2, 1);
      } else {
        addTile("object", free.row, free.column, 1, 1);
      }
    }

    tiles.templateId = template.id;
    tiles.decorations = this.createRoomDecorations(tiles);

    return tiles;
  }

  findFreeTemplateCell(tiles, width = 1, height = 1) {
    const occupied = Array.from(
      { length: 8 },
      () => Array(8).fill(false)
    );

    for (const tile of tiles) {
      const grid = tile.grid;

      for (
        let row = grid.row - 1;
        row < grid.row - 1 + grid.height;
        row += 1
      ) {
        for (
          let column = grid.column - 1;
          column < grid.column - 1 + grid.width;
          column += 1
        ) {
          if (row >= 0 && row < 8 && column >= 0 && column < 8) {
            occupied[row][column] = true;
          }
        }
      }
    }

    const candidates = [];

    for (let row = 0; row <= 8 - height; row += 1) {
      for (let column = 0; column <= 8 - width; column += 1) {
        let available = true;

        for (let y = row; y < row + height; y += 1) {
          for (let x = column; x < column + width; x += 1) {
            if (occupied[y][x]) {
              available = false;
              break;
            }
          }
          if (!available) break;
        }

        if (available) {
          candidates.push({ row, column });
        }
      }
    }

    return candidates.length
      ? candidates[Math.floor(this.random() * candidates.length)]
      : null;
  }

  createRoomDecorations(tiles) {
    const decorations =
      BIOME_DECORATIONS[this.currentBiome().id] ||
      BIOME_DECORATIONS.mine;

    const count = 5 + Math.floor(this.random() * 5);
    const result = [];

    for (let index = 0; index < count; index += 1) {
      const free = this.findFreeDecorationCell(tiles, result);

      if (!free) break;

      const decoration =
        decorations[Math.floor(this.random() * decorations.length)];

      result.push({
        id: `decor-${index}`,
        row: free.row + 1,
        column: free.column + 1,
        icon: decoration.icon,
        className: decoration.className
      });
    }

    return result;
  }

  findFreeDecorationCell(tiles, decorations) {
    const occupied = new Set();

    for (const tile of tiles) {
      const grid = tile.grid;

      for (
        let row = grid.row - 1;
        row < grid.row - 1 + grid.height;
        row += 1
      ) {
        for (
          let column = grid.column - 1;
          column < grid.column - 1 + grid.width;
          column += 1
        ) {
          occupied.add(`${row},${column}`);
        }
      }
    }

    for (const decoration of decorations) {
      occupied.add(
        `${decoration.row - 1},${decoration.column - 1}`
      );
    }

    const candidates = [];

    for (let row = 0; row < 8; row += 1) {
      for (let column = 0; column < 8; column += 1) {
        const key = `${row},${column}`;

        if (!occupied.has(key)) {
          candidates.push({ row, column });
        }
      }
    }

    return candidates.length
      ? candidates[Math.floor(this.random() * candidates.length)]
      : null;
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
          fallback[Math.floor(this.random() * fallback.length)];

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
        candidates[Math.floor(this.random() * candidates.length)];

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

  pickEnemyForFloor(biome) {
    const enemies = biome.enemies || [];

    if (biome.id !== "mine" || enemies.length <= 3) {
      return enemies[Math.floor(this.random() * enemies.length)];
    }

    const localFloor = Math.max(1, this.state.floor - biome.floorFrom + 1);
    const unlockedCount = Math.min(
      enemies.length,
      3 + Math.floor((localFloor - 1) * 0.9)
    );

    const pool = enemies.slice(0, Math.max(3, unlockedCount));

    // Rarely allow one enemy slightly ahead of the current progression.
    if (
      unlockedCount < enemies.length &&
      this.random() < 0.12
    ) {
      pool.push(enemies[unlockedCount]);
    }

    return pool[Math.floor(this.random() * pool.length)];
  }

  makeEnemy(boss = false, elite = false) {
    const biome = this.currentBiome();
    const base = structuredClone(
      boss
        ? biome.boss
        : this.pickEnemyForFloor(biome)
    );

    const floorIndex = Math.max(0, this.state.floor - 1);
    const zoneBalance = this.currentZoneBalance();

    // Kontinuierliche Etagenskalierung:
    // HP +8 %, Angriff +6 %, Verteidigung +5 %, Belohnungen +5 %.
    const hpScale = Math.pow(1.08, floorIndex);
    const attackScale = Math.pow(1.06, floorIndex);
    const defenseScale = Math.pow(1.05, floorIndex);
    const rewardScale = Math.pow(1.05, floorIndex);

    // Jede fünfte Etage erhält einen zusätzlichen Schwierigkeitsaufschlag.
    const milestoneMultiplier =
      this.state.floor % 5 === 0 ? 1.20 : 1;

    const eliteHpMultiplier = elite ? 1.40 : 1;
    const eliteAttackMultiplier = elite ? 1.20 : 1;

    const bossHpMultiplier = boss ? 4.00 : 1;
    const bossAttackMultiplier = boss ? 1.60 : 1;

    const defense = Math.max(
      1,
      Math.round(
        base.defense *
        defenseScale *
        milestoneMultiplier *
        zoneBalance.enemyDefense
      )
    );

    const hp = Math.max(
      1,
      Math.round(
        base.hp *
        hpScale *
        milestoneMultiplier *
        zoneBalance.enemyHp *
        eliteHpMultiplier *
        bossHpMultiplier
      )
    );

    const attack = Math.max(
      1,
      Math.round(
        base.attack *
        attackScale *
        milestoneMultiplier *
        zoneBalance.enemyAttack *
        eliteAttackMultiplier *
        bossAttackMultiplier
      )
    );

    return {
      ...base,
      hp,
      maxHp: hp,
      attack,
      defense,
      boss,
      elite,
      armorPenetration: this.enemyArmorPenetration(),
      critChance: boss ? 10 : elite ? 5 : 2,
      reward: Math.max(
        1,
        Math.round(
          base.reward *
          rewardScale *
          zoneBalance.gold *
          (boss ? 2.3 : elite ? 1.6 : 1)
        )
      ),
      xp: Math.max(
        1,
        Math.round(
          base.xp *
          rewardScale *
          zoneBalance.xp *
          (boss ? 2.3 : elite ? 1.6 : 1)
        )
      )
    };
  }

  enemyArmorPenetration() {
    if (this.state.floor >= 81) return 0.40;
    if (this.state.floor >= 61) return 0.30;
    if (this.state.floor >= 41) return 0.20;
    if (this.state.floor >= 21) return 0.10;
    return 0;
  }

  createEquipmentReward(source = "normal") {
    const base = structuredClone(
      BASE_ITEMS.filter(item => item.slot)[
        Math.floor(this.random() * BASE_ITEMS.filter(item => item.slot).length)
      ]
    );

    const itemLevel = Math.max(1, this.state.floor + Math.floor(this.random() * 3) - 1);
    let roll = this.random();
    const sourceMultiplier = {
      boss: 0.12,
      elite: 0.34,
      chest: 0.62,
      merchant: 0.78,
      normal: 1
    }[source] || 1;
    roll *= sourceMultiplier;

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
    ];

    const shuffledAffixPool =
      this.context.seed.shuffle(affixPool);

    const affixes = shuffledAffixPool.slice(0, rarity.affixes);
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
    base.uid = crypto.randomUUID?.() || `${Date.now()}-${this.random()}`;
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
    const potionPool = BASE_ITEMS.filter(item => item.type === "potion");

    return [
      this.createEquipmentReward("merchant"),
      this.createEquipmentReward("merchant"),
      this.createEquipmentReward("merchant"),
      structuredClone(
        this.state.floor >= 15
          ? potionPool.find(item => item.id === "greater-potion")
          : potionPool.find(item => item.id === "potion")
      ),
      {
        id: "merchant-key",
        name: "Silberschlüssel",
        icon: "🗝️",
        type: "merchant-key",
        value: 45 + this.state.floor * 2
      }
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

    const wallTime = Date.now();
    let enemyHealthChanged = false;

    for (const room of this.state.dungeon.rooms) {
      for (const tile of room.tiles) {
        if (!tile.enemy || tile.completed || tile.enemy.hp <= 0) continue;

        if (
          tile.lastHitAt > 0 &&
          wallTime - tile.lastHitAt > ENEMY_REGEN_DELAY &&
          tile.enemy.hp < tile.enemy.maxHp
        ) {
          tile.enemy.hp = Math.min(
            tile.enemy.maxHp,
            tile.enemy.hp + ENEMY_REGEN_PER_SECOND * dt
          );
          enemyHealthChanged = true;
        }
      }
    }

    if (enemyHealthChanged) {
      this.updateEnemyHealthDisplay();
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

  initializeRenderEngine() {
    if (this.renderEngine) return;

    const canvas = document.getElementById("dungeonCanvas");

    if (!canvas) return;

    this.renderEngine = new RenderEngine({
      game: this,
      canvas
    });

    this.renderEngine.start();
  }

  render() {
    const biome = this.currentBiome();
    document.documentElement.style.setProperty("--biome-accent", biome.accent);

    this.root.innerHTML = `
      <div class="game-shell biome-${biome.id}">
        ${this.renderTopbar()}
        <div class="main-grid">
          ${this.renderSidebar()}
          ${this.renderCenter()}
          ${this.renderRightPanel()}
        </div>
      </div>
      ${this.renderOverlay()}
      ${this.renderRoomTransition()}
      ${this.renderStageTransition()}
    `;
    this.bind();

    if (this.renderEngine) {
      this.renderEngine.stop();
      this.renderEngine = null;
    }

    this.initializeRenderEngine();
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
        <div class="board-wrap canvas-only-board">
          <canvas
            id="dungeonCanvas"
            class="dungeon-canvas active"
            aria-label="Interaktiver Dungeonraum">
          </canvas>
        </div>
      </section>
    `;
  }

  renderRoomDecorations() {
    return (this.currentRoom.decorations || [])
      .map(decoration => `
        <span
          class="room-decoration decor-${decoration.className}"
          style="
            grid-column:${decoration.column};
            grid-row:${decoration.row};
          ">
          ${decoration.icon}
        </span>
      `)
      .join("");
  }

  renderTile(tile) {
    if (tile.completed) {
      return `<button
        class="tile completed cracked-tile"
        style="${this.tileGridStyle(tile)}"
        disabled
        aria-label="Erledigte Kachel">
        <span class="completion-crack crack-one"></span>
        <span class="completion-crack crack-two"></span>
        <span class="completion-crack crack-three"></span>
        ${this.renderTileEffect(tile.id)}
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
        ${this.renderTileEffect(tile.id)}
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
            · KRIT ${enemy.critChance}%
            · DURCHDR. ${Math.round(enemy.armorPenetration * 100)}%
            · ${ACTION_AP_COST} AP
          </span>
          <span class="tile-icon">${enemy.icon}</span>
        </div>
        ${this.renderCombatFloater(tile.id)}
        ${this.renderTileEffect(tile.id)}
      </button>`;
    }

    if (tile.type === "object") {
      return `<button class="tile object" style="${this.tileGridStyle(tile)}" data-tile="${tile.id}" ${this.player.defeated ? "disabled" : ""}>
        <span class="tile-title">${Math.ceil(tile.object.hp)}/${tile.object.maxHp}</span>
        <span class="tile-sub">${tile.object.name}</span>
        <span class="tile-icon">${tile.object.icon}</span>
        ${this.renderCombatFloater(tile.id)}
        ${this.renderTileEffect(tile.id)}
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
      ${this.renderTileEffect(tile.id)}
    </button>`;
  }

  renderEnemyHealthBars(enemy, barCount) {
    // Normale Gegner zeigen immer genau eine prozentuale Lebensleiste.
    if (!enemy.elite && !enemy.boss) {
      const fill = Math.max(
        0,
        Math.min(1, enemy.hp / enemy.maxHp)
      );

      const color = this.enemyBarColor(
        0,
        1,
        enemy.hp > 0 ? 1 : 0,
        enemy
      );

      return `
        <div
          class="enemy-health-stack normal-health-stack"
          style="--health-bars:1">
          <span class="enemy-health-segment active current-layer">
            <span
              class="enemy-health-fill"
              style="
                transform:scaleX(${fill});
                background:${color};
              ">
            </span>
          </span>
        </div>
      `;
    }

    // Elite- und Bossgegner behalten gestapelte 100-HP-Leisten.
    const bars = [];
    const remainingBars = this.remainingHealthBars(enemy);

    for (let index = 0; index < barCount; index += 1) {
      const barStart = index * 100;
      const segmentCapacity = Math.max(
        1,
        Math.min(100, enemy.maxHp - barStart)
      );
      const barHp = Math.max(
        0,
        Math.min(
          segmentCapacity,
          enemy.hp - barStart
        )
      );
      const fill = barHp / segmentCapacity;
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
        <span
          class="enemy-health-segment
            ${active ? "active" : "empty"}
            ${isCurrentBar ? "current-layer" : ""}">
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

  filteredInventoryEntries() {
    const entries = this.player.inventory.map((item, index) => ({
      item,
      index,
      uid: this.ensureInventoryItemUid(item)
    }));

    const filtered = entries.filter(({ item }) => {
      if (this.inventoryFilter === "all") return true;
      if (this.inventoryFilter === "equipment") return Boolean(item.slot);
      if (this.inventoryFilter === "consumables") return item.type === "potion";
      if (this.inventoryFilter === "weapons") return item.slot === "weapon";
      if (this.inventoryFilter === "armor") {
        return ["offhand", "helmet", "armor", "gloves", "pants", "boots"].includes(item.slot);
      }
      if (this.inventoryFilter === "jewelry") {
        return ["ring1", "ring2", "amulet"].includes(item.slot);
      }
      return true;
    });

    const rarityRank = {
      common: 0, uncommon: 1, rare: 2,
      epic: 3, legendary: 4, mythic: 5
    };

    filtered.sort((a, b) => {
      if (this.inventorySort === "power-desc") {
        return (b.item.power || 0) - (a.item.power || 0);
      }
      if (this.inventorySort === "rarity-desc") {
        return (rarityRank[b.item.rarity] || 0) -
               (rarityRank[a.item.rarity] || 0);
      }
      if (this.inventorySort === "value-desc") {
        return (b.item.value || 0) - (a.item.value || 0);
      }
      if (this.inventorySort === "name-asc") {
        return String(a.item.name).localeCompare(String(b.item.name), "de");
      }
      return a.index - b.index;
    });

    return filtered;
  }

  inventoryFilterLabel(filter) {
    return {
      all: "Alle",
      equipment: "Ausrüstung",
      weapons: "Waffen",
      armor: "Rüstung",
      jewelry: "Schmuck",
      consumables: "Tränke"
    }[filter] || "Alle";
  }

  weaponTypeLabel(type) {
    return {
      sword: "Schwert",
      dagger: "Dolch",
      heavy: "Schwere Waffe",
      ranged: "Fernkampf",
      magic: "Magisch"
    }[type] || "Waffe";
  }

  renderRightPanel() {
    const selectedEntry = this.selectedInventoryEntry();
    const selected = selectedEntry?.item || null;
    const entries = this.filteredInventoryEntries();

    return `
      <aside class="right-panel box">
        <div class="equipment-slots expanded-slots">
          ${this.equipmentSlots().map(slot =>
            this.equipmentSlot(slot.id, slot.label)).join("")}
        </div>

        <div class="tabs">
          <button class="tab ${this.activeTab === "equipment" ? "active" : ""}"
            data-tab="equipment">AUSRÜSTUNG</button>
          <button class="tab ${this.activeTab === "inventory" ? "active" : ""}"
            data-tab="inventory">ITEMS</button>
        </div>

        <div class="inventory-toolbar">
          <select id="inventoryFilter">
            ${["all","equipment","weapons","armor","jewelry","consumables"]
              .map(filter => `<option value="${filter}"
                ${this.inventoryFilter === filter ? "selected" : ""}>
                ${this.inventoryFilterLabel(filter)}
              </option>`).join("")}
          </select>

          <select id="inventorySort">
            <option value="power-desc"
              ${this.inventorySort === "power-desc" ? "selected" : ""}>Power ↓</option>
            <option value="rarity-desc"
              ${this.inventorySort === "rarity-desc" ? "selected" : ""}>Seltenheit ↓</option>
            <option value="value-desc"
              ${this.inventorySort === "value-desc" ? "selected" : ""}>Wert ↓</option>
            <option value="name-asc"
              ${this.inventorySort === "name-asc" ? "selected" : ""}>Name A–Z</option>
          </select>
        </div>

        <div class="inventory-pane">
          <div class="item-info">
            ${selected
              ? selected.slot
                ? this.renderEquipmentComparison(selected)
                : this.renderConsumableDetails(selected)
              : `<p>Wähle einen Gegenstand.</p>`}
          </div>

          <div class="item-grid">
            ${entries.map(({ item, uid }) => `
              <button class="item-cell rarity-border-${item.rarity || "common"}
                ${uid === this.selectedItemUid ? "selected" : ""}"
                data-item-uid="${uid}">
                <span class="item-level">${item.itemLevel ? `IL ${item.itemLevel}` : ""}</span>
                <span class="big">${item.icon}</span>
                <span class="item-cell-name">${this.escape(item.name)}</span>
                <span class="item-cell-power">${item.power ? `PWR ${item.power}` : ""}</span>
              </button>`).join("") ||
              `<div class="inventory-empty">Keine passenden Gegenstände.</div>`}
          </div>
        </div>

        <div class="bottom-actions inventory-actions">
          <button class="action-btn use" id="useBtn"
            ${!selected || selected.type !== "potion" ? "disabled" : ""}>BENUTZEN</button>
          <button class="action-btn primary" id="equipBtn"
            ${!selected || !selected.slot ? "disabled" : ""}>AUSRÜSTEN</button>
          <button class="action-btn sell" id="sellBtn"
            ${!selected ? "disabled" : ""}>VERKAUFEN</button>
        </div>
      </aside>
    `;
  }

  renderEquipmentComparison(selected) {
    const equipped = this.player.equipment[selected.slot] || null;
    const selectedPower = selected.power || this.itemPower(selected);
    const equippedPower = equipped ? (equipped.power || this.itemPower(equipped)) : 0;
    const powerDifference = selectedPower - equippedPower;

    return `<section class="comparison-card">
      <div class="comparison-heading">
        <div>
          <span class="comparison-kicker">
            ${this.equipmentSlotLabel(selected.slot)} · ILVL ${selected.itemLevel || 1}
          </span>
          <h3 class="comparison-item-name rarity-${selected.rarity || "common"}">
            ${this.escape(selected.name)}
          </h3>
          <span class="comparison-rarity">
            ${selected.rarityLabel || "Gewöhnlich"}
            ${selected.weaponType ? ` · ${this.weaponTypeLabel(selected.weaponType)}` : ""}
          </span>
        </div>
        <span class="comparison-value">${selected.value || 0} G</span>
      </div>

      <div class="item-power-summary">
        <span>ITEM-POWER</span>
        <strong>${selectedPower}</strong>
        <em class="${powerDifference >= 0 ? "better" : "worse"}">
          ${powerDifference > 0 ? "+" : ""}${powerDifference}
        </em>
      </div>

      <div class="comparison-table">
        ${this.comparisonRow("Angriff", selected.attack || 0, equipped?.attack || 0)}
        ${this.comparisonRow("Verteidigung", selected.defense || 0, equipped?.defense || 0)}
        ${this.comparisonRow("HP", selected.hp || 0, equipped?.hp || 0)}
        ${this.comparisonRow("Krit", selected.critChance || 0, equipped?.critChance || 0)}
        ${this.comparisonRow("Erholung", selected.recovery || 0, equipped?.recovery || 0)}
      </div>

      <div class="affix-list">
        ${(selected.affixes || []).map(a => `<span>${this.escape(a)}</span>`).join("") ||
          `<span class="no-affix">Keine Affixe</span>`}
      </div>

      <div class="equipped-reference">
        <span>Aktuell ausgerüstet:</span>
        <strong>${equipped ? this.escape(equipped.name) : "Nichts"}</strong>
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
    document.querySelectorAll("[data-item-uid]").forEach(button => {
      button.onclick = () => {
        this.selectedItemUid = button.dataset.itemUid;
        this.render();
      };
    });

    document.getElementById("inventoryFilter")?.addEventListener(
      "change",
      event => {
        this.inventoryFilter = event.target.value;
        this.selectedItemUid = null;
        this.render();
      }
    );

    document.getElementById("inventorySort")?.addEventListener(
      "change",
      event => {
        this.inventorySort = event.target.value;
        this.selectedItemUid = null;
        this.render();
      }
    );
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
    if (this.activeRoomTransition || this.stageTransition) return;
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
      this.context.events.emit("chest:opened", {
        floor: this.state.floor,
        roomId: this.currentRoom.id
      });
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

    this.playTileActionEffect(tile, "explore");
    tile.progress = Math.min(
      100,
      tile.progress + 20 + this.random() * 8
    );

    this.context.events.emit("tile:explored", {
      tileId: tile.id,
      roomId: this.currentRoom.id
    });
    this.updateQuest("explore", 1);
    this.state.message =
      `Erkundung: ${Math.floor(tile.progress)} %.`;

    if (tile.progress >= 100) {
      const outcomes = [
        "enemy",
        "enemy",
        "object",
        "treasure",
        "trap",
        "empty"
      ];

      tile.type =
        outcomes[Math.floor(this.random() * outcomes.length)];
      tile.discovered = true;
      tile.locked = tile.type === "treasure";

      if (tile.type === "enemy") {
        tile.enemy = this.makeEnemy(false, false);
      }

      if (tile.type === "object") {
        const hp = 18 + this.state.floor * 2;
        const vase = this.random() < 0.5;

        tile.object = {
          name: vase ? "Vase" : "Kiste",
          icon: vase ? "🏺" : "📦",
          hp,
          maxHp: hp
        };
      }

      if (tile.type === "trap") {
        const damage = 8 + this.state.floor * 2;
        this.player.hp -= damage;
        tile.completed = true;

        this.playTileActionEffect(
          tile,
          "trap",
          `-${damage}`
        );

        this.state.message =
          `Falle aufgedeckt und sofort ausgelöst: ` +
          `-${damage} HP.`;

        if (this.player.hp <= 0) {
          return this.handleDefeat();
        }

        this.checkRoomCompletion(this.currentRoom.id);
      }
    }

    this.render();
  }

  currentWeaponProfile() {
    const weapon = this.player.equipment.weapon;
    const explicitType = weapon?.weaponType;
    const name = String(weapon?.name || "").toLowerCase();

    if (explicitType === "heavy" || name.includes("axt") ||
        name.includes("hammer") || name.includes("kolben")) {
      return { type: "heavy", label: "Schwere Waffe", hitChance: 78 };
    }

    if (explicitType === "dagger" || name.includes("dolch") ||
        name.includes("messer")) {
      return { type: "dagger", label: "Dolch", hitChance: 94 };
    }

    if (explicitType === "ranged" || name.includes("bogen") ||
        name.includes("armbrust")) {
      return { type: "ranged", label: "Fernkampfwaffe", hitChance: 86 };
    }

    if (explicitType === "magic" || name.includes("stab") ||
        name.includes("zepter")) {
      return { type: "magic", label: "Magische Waffe", hitChance: 90 };
    }

    if (explicitType === "sword" || name.includes("schwert")) {
      return { type: "sword", label: "Schwert", hitChance: 88 };
    }

    return {
      type: "unarmed",
      label: weapon ? "Waffe" : "Unbewaffnet",
      hitChance: weapon ? 86 : 82
    };
  }

  rollPlayerHit() {
    const profile = this.currentWeaponProfile();
    const chance = Math.max(45, Math.min(98, profile.hitChance));

    return {
      hit: this.random() * 100 < chance,
      chance,
      profile
    };
  }

  playTileActionEffect(tile, type, text = "") {
    const canvasType = {
      "enemy-hit": "enemy",
      "critical": "critical",
      "miss": "miss",
      "vase-hit": "vase",
      "vase-break": "destroy",
      "object-hit": "object",
      "object-break": "destroy",
      "explore": "explore",
      "trap": "object",
      "treasure": "treasure",
      "shrine": "shrine",
      "fountain": "fountain",
      "enemy-defeat": "destroy",
      "boss-defeat": "destroy",
      "complete": "destroy"
    }[type] || type;

    this.renderEngine?.triggerTileEffect(
      tile,
      canvasType,
      text
    );

    this.tileEffect = {
      tileId: tile.id,
      type,
      nonce: Date.now()
    };

    if (text) {
      this.combatFloater = {
        tileId: tile.id,
        text,
        type,
        nonce: Date.now()
      };
    }

    window.setTimeout(() => {
      if (this.tileEffect?.tileId === tile.id) {
        this.tileEffect = null;
      }

      if (this.combatFloater?.tileId === tile.id) {
        this.combatFloater = null;
      }

      this.render();
    }, 760);
  }

  renderTileEffect(tileId) {
    if (!this.tileEffect || this.tileEffect.tileId !== tileId) {
      return "";
    }

    const particles = Array.from({ length: 12 }, (_, index) => {
      const angle = index * 30;
      const distance = 22 + (index % 4) * 8;

      return `
        <span style="
          --particle-angle:${angle}deg;
          --particle-distance:${distance}px;">
        </span>
      `;
    }).join("");

    return `
      <span class="action-effect effect-${this.tileEffect.type}">
        ${particles}
      </span>
    `;
  }

  renderCombatFloater(tileId) {
    if (!this.combatFloater ||
        this.combatFloater.tileId !== tileId) {
      return "";
    }

    return `
      <span class="combat-floater floater-${this.combatFloater.type}">
        ${this.escape(this.combatFloater.text)}
      </span>
    `;
  }

  attackEnemy(tile) {
    if (!this.spendAp(ACTION_AP_COST)) return;

    const enemy = tile.enemy;
    const hitRoll = this.rollPlayerHit();

    tile.lastHitAt = Date.now();
    this.state.lastCombatAt = performance.now();

    if (!hitRoll.hit) {
      const enemyCritical =
        this.random() * 100 < enemy.critChance;

      let retaliation = this.damage(
        enemy.attack,
        this.defense,
        enemy.armorPenetration,
        0.15
      );

      if (enemyCritical) {
        retaliation *= 2;
      }

      this.player.hp -= retaliation;

      this.playTileActionEffect(tile, "miss", "MISS");
      this.state.message =
        `Fehlschlag mit ${hitRoll.profile.label} ` +
        `(${hitRoll.chance}% Trefferchance). ` +
        `${enemyCritical ? "GEGNER-KRIT! " : ""}` +
        `${enemy.name} schlägt zurück: -${retaliation} HP.`;

      if (this.player.hp <= 0) {
        return this.handleDefeat();
      }

      return this.render();
    }

    const critical =
      this.random() * 100 < this.totalCritChance;

    let damage = this.damage(this.attack, enemy.defense);

    if (critical) {
      damage *= 2;
    }

    enemy.hp = Math.max(0, enemy.hp - damage);

    this.playTileActionEffect(
      tile,
      critical ? "critical" : "enemy-hit",
      `-${damage}`
    );

    if (enemy.hp > 0) {
      const enemyCritical =
        this.random() * 100 < enemy.critChance;

      let retaliation = this.damage(
        enemy.attack,
        this.defense,
        enemy.armorPenetration,
        0.15
      );

      if (enemyCritical) {
        retaliation *= 2;
      }

      this.player.hp -= retaliation;

      this.state.message =
        `${critical ? "KRITISCH! " : ""}` +
        `${enemy.name}: -${damage} HP · ` +
        `${enemyCritical ? "GEGNER-KRIT! " : ""}` +
        `Du: -${retaliation} HP.`;

      if (this.player.hp <= 0) {
        return this.handleDefeat();
      }

      return this.render();
    }

    this.state.gold += enemy.reward;
    this.gainXp(enemy.xp);
    this.registerEnemy(enemy);
    this.context.events.emit("enemy:defeated", {
      enemy,
      floor: this.state.floor,
      roomId: this.currentRoom.id
    });
    this.updateQuest("kill", 1);

    if (enemy.boss) {
      this.updateQuest("boss", 1);
    }

    const dropChance =
      enemy.boss ? 1 :
      enemy.elite ? 1 :
      0.12;

    let message =
      `${enemy.name} besiegt. ` +
      `+${enemy.reward} Gold, +${enemy.xp} XP.`;

    if (this.random() < dropChance) {
      const item = this.createEquipmentReward(
        enemy.boss
          ? "boss"
          : enemy.elite
            ? "elite"
            : "normal"
      );

      this.player.inventory.push(item);
      this.registerItem(item);
      message += ` Beute: ${item.name}.`;
    }

    if (
      this.random() <
      (enemy.boss ? 0.85 : enemy.elite ? 0.45 : 0.14)
    ) {
      this.state.silverKeys += 1;
      message += " Schlüssel gefunden.";
    }

    this.finishTile(tile, message);
  }

  attackObject(tile) {
    const damage = Math.max(1, this.attack);
    tile.object.hp = Math.max(0, tile.object.hp - damage);

    this.playTileActionEffect(
      tile,
      tile.object.name === "Vase" ? "vase-hit" : "object-hit",
      `-${damage}`
    );

    if (tile.object.hp > 0) {
      this.state.message =
        `${tile.object.name}: -${damage} Haltbarkeit.`;
      return this.render();
    }

    const roll = this.random();

    if (roll < 0.18) {
      this.state.silverKeys += 1;
      return this.finishTile(
        tile,
        `${tile.object.name}: Schlüssel gefunden.`
      );
    }

    if (roll < 0.50) {
      const potion = structuredClone(
        BASE_ITEMS.find(item => item.type === "potion")
      );
      this.player.inventory.push(potion);

      return this.finishTile(
        tile,
        `${tile.object.name}: Heiltrank gefunden.`
      );
    }

    const gold = 8 + Math.floor(this.random() * 20);
    this.state.gold += gold;

    this.finishTile(
      tile,
      `${tile.object.name}: ${gold} Gold gefunden.`
    );
  }

  finishTile(tile, message) {
    tile.completed = true;
    this.state.message = message;

    if (!this.tileEffect || this.tileEffect.tileId !== tile.id) {
      const effectType =
        tile.type === "boss"
          ? "boss-defeat"
          : tile.type === "enemy"
            ? "enemy-defeat"
            : tile.type === "object"
              ? tile.object?.name === "Vase"
                ? "vase-break"
                : "object-break"
              : tile.type === "treasure"
                ? "treasure"
                : tile.type === "shrine"
                  ? "shrine"
                  : "complete";

      this.playTileActionEffect(tile, effectType);
    }

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
    if (this.activeRoomTransition || this.stageTransition) return;
    if (!this.canAct()) return;
    if (roomId === this.currentRoom.id) return;

    const room = this.state.dungeon.rooms.find(room => room.id === roomId);
    if (!room) return;

    const adjacentRoomIds = Object.values(this.currentRoom.neighbors);
    if (!adjacentRoomIds.includes(roomId)) return;

    room.visited = true;
    room.revealed = true;
    this.revealAdjacentRooms(this.state.dungeon.rooms, room.id);
    this.activeRoomTransition = {
      biome: this.currentBiome().name,
      room: room.id + 1,
      type: this.roomTypeInfo(room.type).label
    };

    this.state.currentRoomId = room.id;
    this.checkRoomCompletion(room.id);
    this.render();

    window.setTimeout(() => {
      this.activeRoomTransition = null;
      this.render();
    }, 620);
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
    if (this.activeRoomTransition || this.stageTransition) return;
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
    return "";
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
    else {
      const purchasedItem = structuredClone(item);
      purchasedItem.uid = this.createInventoryItemUid();
      this.player.inventory.push(purchasedItem);
    }
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
    this.selectedItemUid = null;
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
    this.context.events.emit("item:found", {
      item
    });
  }

  useSelectedItem() {
    const selected = this.selectedInventoryEntry();
    const item = selected?.item;
    if (!item || item.type !== "potion") return;
    const healed = Math.min(item.heal, this.player.maxHp - this.player.hp);
    this.player.hp += healed;
    this.player.inventory.splice(selected.index, 1);
    this.selectedItemUid = null;
    this.state.message = `${item.name}: +${healed} HP.`;
    this.render();
  }

  equipSelected() {
    const selected = this.selectedInventoryEntry();
    const item = selected?.item;
    if (!item?.slot) return;

    let slot = item.slot;
    if (slot === "ring1" && this.player.equipment.ring1) {
      slot = this.player.equipment.ring2 ? "ring1" : "ring2";
    }

    const old = this.player.equipment[slot];
    this.player.equipment[slot] = item;
    this.player.inventory.splice(selected.index, 1);
    if (old) this.player.inventory.push(old);
    this.selectedItemUid = null;
    this.render();
  }

  sellSelected() {
    const selected = this.selectedInventoryEntry();
    const item = selected?.item;
    if (!item) return;
    this.state.gold += item.value || 5;
    this.player.inventory.splice(selected.index, 1);
    this.selectedItemUid = null;
    this.render();
  }

  createInventoryItemUid() {
    return crypto.randomUUID?.() ||
      `item-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  }

  ensureInventoryItemUid(item, usedUids = null) {
    if (!item.uid || usedUids?.has(item.uid)) {
      item.uid = this.createInventoryItemUid();
    }

    usedUids?.add(item.uid);

    return item.uid;
  }

  selectedInventoryEntry() {
    if (!this.selectedItemUid) return null;

    const index = this.player.inventory.findIndex(
      item => this.ensureInventoryItemUid(item) === this.selectedItemUid
    );

    return index < 0
      ? null
      : { item: this.player.inventory[index], index };
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

    this.state.meditation.active =
      !this.state.meditation.active;

    this.state.message = this.state.meditation.active
      ? "Meditation begonnen. Gegnerregeneration läuft unabhängig davon normal weiter."
      : "Meditation beendet.";

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

  updateEnemyHealthDisplay() {
    for (const tile of this.currentTiles) {
      if (!tile.enemy || tile.completed) continue;

      const button = document.querySelector(
        `[data-tile="${tile.id}"]`
      );
      if (!button) continue;

      const enemy = tile.enemy;
      const layered = Boolean(enemy.elite || enemy.boss);
      const barCount = layered
        ? Math.max(1, Math.ceil(enemy.maxHp / 100))
        : 1;

      const oldStack = button.querySelector(".enemy-health-stack");

      if (oldStack) {
        oldStack.outerHTML =
          this.renderEnemyHealthBars(enemy, barCount);
      }

      const subtitle = button.querySelector(".tile-sub");

      if (subtitle) {
        subtitle.textContent =
          `HP ${Math.ceil(enemy.hp)}/${enemy.maxHp}` +
          ` · ST ${enemy.attack}` +
          ` · KRIT ${enemy.critChance}%` +
          ` · DURCHDR. ${Math.round(enemy.armorPenetration * 100)}%` +
          ` · ${ACTION_AP_COST} AP`;
      }

      const count = button.querySelector(".enemy-bar-count");

      if (count) {
        count.textContent = layered
          ? `${this.remainingHealthBars(enemy)}/${barCount} LEISTEN`
          : "";
      }
    }
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
    const unboundedStats = new Set([
      "attack",
      "defense",
      "crit",
      "recovery"
    ]);
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

  damage(
    attack,
    defense,
    armorPenetration = 0,
    minimumRatio = GLOBAL_BALANCE.minimumEnemyDamageRatio
  ) {
    const effectiveDefense = Math.max(
      0,
      defense * (1 - armorPenetration)
    );

    const reduction =
      effectiveDefense /
      (effectiveDefense + GLOBAL_BALANCE.defenseConstant);

    const variance =
      0.90 + this.random() * 0.20;

    const reducedDamage =
      attack *
      (1 - reduction) *
      variance;

    const minimumDamage =
      attack * minimumRatio;

    return Math.max(
      1,
      Math.round(
        Math.max(reducedDamage, minimumDamage)
      )
    );
  }

  renderRoomTransition() {
    if (!this.activeRoomTransition) return "";

    return `
      <div class="room-transition">
        <div class="room-transition-card">
          <span>${this.escape(this.activeRoomTransition.biome)}</span>
          <strong>
            ${this.escape(this.activeRoomTransition.type)}
            · Raum ${this.activeRoomTransition.room}
          </strong>
        </div>
      </div>
    `;
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
    this.state.rngState = this.context.snapshot();
    this.state.seed = this.context.seed.seed;
    localStorage.setItem(
      "dungeonlite.seed",
      this.context.seed.seed
    );
    localStorage.setItem(SAVE_KEY, JSON.stringify(this.state));
    this.state.message = "Spiel gespeichert.";
    this.render();
  }

  load() {
    const keys = [
      SAVE_KEY,
      ...LEGACY_SAVE_KEYS
    ];

    for (const key of keys) {
      const raw = localStorage.getItem(key);

      if (!raw) continue;

      try {
        const state = JSON.parse(raw);

        if (key !== SAVE_KEY) {
          localStorage.setItem(
            SAVE_KEY,
            JSON.stringify(state)
          );
        }

        return state;
      } catch {
        // Beschädigte Spielstände werden übersprungen.
      }
    }

    return null;
  }

  reset() {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem("dungeonlite.seed");
    for (const legacyKey of LEGACY_SAVE_KEYS) {
      localStorage.removeItem(legacyKey);
    }
    this.context.seed.setSeed(Date.now());
    this.state = this.createState();
    this.selectedItemUid = null;
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
