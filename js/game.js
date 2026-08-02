import { ITEMS, ENEMIES, BOSSES } from "./data.js";
import { AudioManager } from "./audio.js";

const SAVE_KEY = "dungeonlite.v11";
const ENEMY_REGEN_DELAY = 1800;
const ENEMY_REGEN_PER_SECOND = 4;
const PLAYER_REGEN_DELAY = 5000;
const DEFEAT_REGEN_MULTIPLIER = 6;
const DEFEAT_REGEN_BONUS = 4;

export class Game {
  constructor(root) {
    this.root = root;
    this.audio = new AudioManager();
    this.selectedItem = 0;
    this.activeTab = "equipment";
    this.tileEffect = null;
    this.stageTransition = null;
    this.lastTick = performance.now();
    this.state = this.load() || this.createState();
    this.loop = this.loop.bind(this);
  }

  start() {
    if (
      this.state.currentRoomId === null ||
      this.state.currentRoomId === undefined
    ) {
      this.state.currentRoomId = 0;
    }

    const room = this.currentRoom;
    const requiredEnemies = room.tiles.filter(
      tile => tile.type === "enemy" || tile.type === "boss"
    );

    if (
      requiredEnemies.length === 0 ||
      requiredEnemies.every(tile => tile.completed)
    ) {
      room.completed = true;
    }
    room.revealed = true;
    this.revealAdjacentRooms(this.state.dungeon.rooms, room.id);

    this.render();
    requestAnimationFrame(this.loop);
  }

  createState() {
    const state = {
      floor: 1,
      gems: 0,
      gold: 0,
      silverKeys: 0,
      goldKeys: 0,
      lastCombatAt: 0,
      meditation: {
        active: false,
        xpBuffer: 0
      },
      message: "Schließe den aktuellen Raum ab und benutze Türen, um die Etage zu erkunden.",
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
        talentPoints: 0,
        defeated: false,
        equipment: {
          weapon: null,
          helmet: null,
          armor: null,
          ring: null
        },
        inventory: []
      },
      dungeon: null,
      currentRoomId: 0
    };

    this.state = state;
    state.dungeon = this.createDungeon();
    return state;
  }

  createDungeon() {
    const floor = this.state?.floor || 1;

    // Mit fortschreitender Etage werden größere Karten wahrscheinlicher.
    const minimumRooms = 4 + Math.floor((floor - 1) / 3);
    const randomBonus = Math.floor(
      Math.random() * Math.min(6, 2 + Math.floor(floor / 2))
    );
    const roomCount = Math.max(4, Math.min(15, minimumRooms + randomBonus));

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
      const direction =
        directions[Math.floor(Math.random() * directions.length)];
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

    const farthestIndex = positions.reduce((bestIndex, position, index) => {
      const distance = Math.abs(position.x) + Math.abs(position.y);
      const best = positions[bestIndex];
      const bestDistance = Math.abs(best.x) + Math.abs(best.y);
      return distance > bestDistance ? index : bestIndex;
    }, 0);

    const rooms = positions.map((position, index) => {
      let type = "normal";

      if (index === 0) {
        type = "start";
      } else if (index === farthestIndex) {
        type = floor % 3 === 0 ? "boss" : "elite";
      } else {
        type = this.randomRoomType(floor);
      }

      return {
        id: index,
        x: position.x,
        y: position.y,
        visited: index === 0,
        revealed: index === 0,
        completed: false,
        type,
        neighbors: {},
        tiles: []
      };
    });

    const byPosition = new Map(
      rooms.map(room => [`${room.x},${room.y}`, room.id])
    );

    for (const room of rooms) {
      const options = {
        up: { dx: 0, dy: -1 },
        down: { dx: 0, dy: 1 },
        left: { dx: -1, dy: 0 },
        right: { dx: 1, dy: 0 }
      };

      for (const [direction, offset] of Object.entries(options)) {
        const neighborId = byPosition.get(
          `${room.x + offset.dx},${room.y + offset.dy}`
        );

        if (neighborId !== undefined) {
          room.neighbors[direction] = neighborId;
        }
      }

      room.tiles = this.createRoomTiles(room.type);
    }

    // Direkt angrenzende Räume sind auf der Karte erkennbar.
    this.revealAdjacentRooms(rooms, 0);

    return {
      rooms,
      exitUnlocked: false
    };
  }

  randomRoomType(floor) {
    const roll = Math.random();

    // Spezialräume bleiben wertvoll und relativ selten.
    if (floor >= 4 && roll < 0.07) return "elite";
    if (roll < 0.50) return "normal";
    if (roll < 0.68) return "explore";
    if (roll < 0.78) return "treasure";
    if (roll < 0.86) return "event";
    if (roll < 0.92) return "fountain";
    if (roll < 0.97) return "merchant";
    return "shrine";
  }

  createRoomTiles(roomType) {
    // Normale Räume besitzen immer mindestens einen Gegner. Andere Inhalte
    // sind optional und blockieren den Raumabschluss nicht.
    const templates = {
      start: ["enemy", "explore", "object"],
      normal: ["enemy", "explore", "object"],
      explore: ["enemy", "explore", "explore", "object"],
      elite: ["elite", "object", "treasure"],
      boss: ["boss", "object", "treasure"],
      treasure: ["enemy", "treasure", "object", "object"],
      event: ["enemy", "explore", "trap"],
      fountain: ["enemy", "fountain", "object"],
      merchant: ["enemy", "merchant", "object"],
      shrine: ["enemy", "shrine", "explore"]
    };

    const source = templates[roomType] || templates.normal;
    const extraTiles = Math.min(
      4,
      Math.floor((this.state.floor - 1) / 4) +
      (Math.random() < 0.45 ? 1 : 0)
    );
    const count = Math.min(10, source.length + extraTiles);

    return Array.from({ length: count }, (_, id) => {
      const type = source[id % source.length];
      const tile = {
        id,
        type,
        progress: type === "explore" ? 0 : 100,
        discovered: type !== "explore",
        completed: false,
        used: false,
        lastHitAt: 0
      };

      if (type === "enemy") tile.enemy = this.makeEnemy(false);
      if (type === "elite") {
        tile.type = "enemy";
        tile.enemy = this.makeEnemy(false, true);
      }
      if (type === "boss") tile.enemy = this.makeEnemy(true);

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
  }

  revealAdjacentRooms(rooms = this.state.dungeon.rooms, roomId) {
    const room = rooms.find(candidate => candidate.id === roomId);
    if (!room) return;

    room.revealed = true;

    for (const neighborId of Object.values(room.neighbors || {})) {
      const neighbor = rooms.find(candidate => candidate.id === neighborId);
      if (neighbor) neighbor.revealed = true;
    }
  }

  makeEnemy(boss, elite = false) {
    const floor = this.state?.floor || 1;
    const pool = boss ? BOSSES : ENEMIES;
    const tier = Math.min(pool.length - 1, Math.floor((floor - 1) / 5));
    const base = structuredClone(pool[tier]);
    const defense = Math.max(
      1,
      Math.round(base.defense * (1 + (floor - 1) * 0.035))
    );
    const targetClicks = boss
      ? 9 + Math.floor(floor / 4)
      : elite
        ? 7 + Math.floor(floor / 5)
        : 4 + Math.floor(floor / 6);
    const expectedDamage = Math.max(1, this.attack - defense * 0.55);
    const hp = Math.max(base.hp, Math.round(expectedDamage * targetClicks));
    const desiredDamage = this.player.maxHp * (
      boss ? 0.115 : elite ? 0.10 : 0.075
    );
    const attack = Math.max(
      base.attack,
      Math.round(desiredDamage + this.defense * 0.55)
    );

    return {
      ...base,
      hp,
      maxHp: hp,
      attack,
      defense,
      reward: Math.round(
        base.reward *
        (1 + (floor - 1) * 0.11) *
        (boss ? 2.2 : elite ? 1.6 : 1)
      ),
      xp: Math.round(
        base.xp *
        (1 + (floor - 1) * 0.13) *
        (boss ? 2.2 : elite ? 1.6 : 1)
      ),
      elite
    };
  }

  get player() {
    return this.state.player;
  }

  get currentRoom() {
    return this.state.dungeon.rooms.find(
      room => room.id === this.state.currentRoomId
    );
  }

  get currentTiles() {
    return this.currentRoom?.tiles || [];
  }

  get attack() {
    return this.player.baseAttack + Object.values(this.player.equipment)
      .filter(Boolean)
      .reduce((sum, item) => sum + (item.attack || 0), 0);
  }

  get defense() {
    return this.player.baseDefense + Object.values(this.player.equipment)
      .filter(Boolean)
      .reduce((sum, item) => sum + (item.defense || 0), 0);
  }

  loop(now) {
    const dt = Math.min(1, (now - this.lastTick) / 1000);
    this.lastTick = now;

    this.player.ap = Math.min(
      this.player.maxAp,
      this.player.ap + this.player.recovery * dt
    );

    const outOfCombatFor = now - (this.state.lastCombatAt || 0);

    if (this.player.defeated) {
      const defeatRegen =
        this.player.recovery * DEFEAT_REGEN_MULTIPLIER +
        DEFEAT_REGEN_BONUS;

      this.player.hp = Math.min(
        this.player.maxHp,
        this.player.hp + defeatRegen * dt
      );

      if (this.player.hp >= this.player.maxHp) {
        this.player.hp = this.player.maxHp;
        this.player.defeated = false;
        this.state.message = "Du bist vollständig genesen und kannst wieder handeln.";
        this.render();
      }
    } else if (
      this.state.lastCombatAt > 0 &&
      outOfCombatFor > PLAYER_REGEN_DELAY &&
      this.player.hp < this.player.maxHp
    ) {
      this.player.hp = Math.min(
        this.player.maxHp,
        this.player.hp + this.player.recovery * dt
      );
    }

    if (this.state.meditation.active && !this.player.defeated) {
      const rate =
        0.35 +
        this.player.recovery * 0.25 +
        this.state.floor * 0.04;

      this.state.meditation.xpBuffer += rate * dt;

      if (this.state.meditation.xpBuffer >= 1) {
        const xp = Math.floor(this.state.meditation.xpBuffer);
        this.state.meditation.xpBuffer -= xp;
        this.gainXp(xp, false);
      }
    }

    let enemyChanged = false;

    for (const room of this.state.dungeon.rooms) {
      for (const tile of room.tiles) {
        if (!tile.enemy || tile.enemy.hp <= 0 || tile.completed) continue;

        if (
          tile.lastHitAt > 0 &&
          now - tile.lastHitAt > ENEMY_REGEN_DELAY &&
          tile.enemy.hp < tile.enemy.maxHp
        ) {
          tile.enemy.hp = Math.min(
            tile.enemy.maxHp,
            tile.enemy.hp + ENEMY_REGEN_PER_SECOND * dt
          );
          enemyChanged = true;
        }
      }
    }

    this.updateDynamicBars();
    if (enemyChanged) this.updateEnemyTiles();

    requestAnimationFrame(this.loop);
  }

  render() {
    this.root.innerHTML = `
      <div class="game-shell">
        ${this.renderTopbar()}
        <div class="main-grid">
          ${this.renderSidebar()}
          ${this.renderCenter()}
          ${this.renderRightPanel()}
        </div>
      </div>
      ${this.renderStageTransition()}
    `;

    this.bind();
  }

  renderTopbar() {
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
          ${this.resource("🔑", this.state.goldKeys)}
          <div class="stage-title">
            ETAGE ${this.state.floor} ·
            ${this.roomTypeInfo(this.currentRoom.type).icon}
            ${this.roomTypeInfo(this.currentRoom.type).label.toUpperCase()}
            · RAUM ${this.currentRoom.id + 1}
          </div>
        </div>

        <div class="top-actions box">
          <button type="button" class="icon-btn" id="soundBtn">
            ${this.audio.enabled ? "🔊" : "🔇"}
          </button>
          <button type="button" class="icon-btn" id="saveBtn">💾</button>
          <button type="button" class="icon-btn danger" id="resetBtn">⏻</button>
        </div>
      </header>
    `;
  }

  renderSidebar() {
    return `
      <aside class="sidebar box">
        ${this.statCard("❤️", "HP", this.player.hp, this.player.maxHp, "hp-fill", "hpBar", "hp")}
        ${this.statCard("⚡", "AP", this.player.ap, this.player.maxAp, "ap-fill", "apBar", "ap")}
        ${this.statCard("🗡️", "ANGRIFF", this.attack, 100, "atk-fill", "", "attack")}
        ${this.statCard("🛡️", "VERTEIDIGUNG", this.defense, 100, "def-fill", "", "defense")}
        ${this.statCard("💧", "ERHOLUNG", this.player.recovery, 100, "rcv-fill", "", "recovery")}

        <div class="xp-card">
          <div class="xp-head">
            <span>ERFAHRUNG</span>
            <strong>${Math.floor(this.player.xp)}/${this.player.xpNext}</strong>
          </div>
          <div class="xp-track">
            <div class="xp-fill" style="width:${Math.min(100, this.player.xp / this.player.xpNext * 100)}%"></div>
          </div>
          <div class="talent-points">
            Talentpunkte: <strong>${this.player.talentPoints}</strong>
          </div>
        </div>

        <button type="button"
          class="meditation-btn ${this.state.meditation.active ? "active" : ""}"
          id="meditationBtn"
          ${this.player.defeated ? "disabled" : ""}>
          ${this.player.defeated
            ? "MEDITATION GESPERRT"
            : this.state.meditation.active
              ? "MEDITATION BEENDEN"
              : "MEDITIEREN"}
        </button>

        <div class="meditation-status">
          ${this.player.defeated
            ? "Nach einer Niederlage ist Meditation gesperrt, bis deine HP wieder vollständig gefüllt sind."
            : this.state.meditation.active
              ? `Passive XP: ${(
                  0.35 +
                  this.player.recovery * 0.25 +
                  this.state.floor * 0.04
                ).toFixed(2)}/Sek. · HP und AP regenerieren weiter.`
              : "Während der Meditation werden passiv Erfahrungspunkte gesammelt. HP und AP regenerieren weiter."}
        </div>

        <div class="minimap-box">
          <div class="minimap-title">ETAGEN-KARTE</div>
          ${this.renderDungeonMap()}
        </div>
      </aside>
    `;
  }

  renderDungeonMap() {
    const rooms = this.state.dungeon.rooms;
    const visibleRooms = rooms.filter(room => room.revealed || room.visited);
    const minX = Math.min(...visibleRooms.map(room => room.x));
    const maxX = Math.max(...visibleRooms.map(room => room.x));
    const minY = Math.min(...visibleRooms.map(room => room.y));
    const maxY = Math.max(...visibleRooms.map(room => room.y));
    const gridWidth = (maxX - minX + 1) * 2 - 1;
    const gridHeight = (maxY - minY + 1) * 2 - 1;
    const cells = Array.from(
      { length: gridWidth * gridHeight },
      () => `<div class="map-space"></div>`
    );

    const setCell = (x, y, html) => {
      const index = y * gridWidth + x;
      if (index >= 0 && index < cells.length) cells[index] = html;
    };

    for (const room of visibleRooms) {
      const gx = (room.x - minX) * 2;
      const gy = (room.y - minY) * 2;
      const classes = ["map-room"];

      if (room.visited) classes.push("visited");
      if (room.completed) classes.push("completed");
      if (room.id === this.currentRoom.id) classes.push("current");
      if (!room.visited) classes.push("unvisited");

      const icon = this.roomTypeInfo(room.type).icon;
      const disabled =
        room.id === this.currentRoom.id ||
        this.player.defeated ||
        !room.revealed;

      setCell(gx, gy, `
        <button
          type="button"
          class="${classes.join(" ")}"
          data-map-room="${room.id}"
          title="${this.escape(this.roomTypeInfo(room.type).label)} · Raum ${room.id + 1}"
          ${disabled ? "disabled" : ""}>
          ${room.id === this.currentRoom.id ? "●" : room.completed ? "✓" : icon}
        </button>
      `);

      if (room.neighbors.right !== undefined) {
        const target = rooms.find(item => item.id === room.neighbors.right);
        if (target?.revealed) {
          setCell(gx + 1, gy, `<div class="map-corridor horizontal"></div>`);
        }
      }

      if (room.neighbors.down !== undefined) {
        const target = rooms.find(item => item.id === room.neighbors.down);
        if (target?.revealed) {
          setCell(gx, gy + 1, `<div class="map-corridor vertical"></div>`);
        }
      }
    }

    return `
      <div
        class="zelda-map connected-map"
        style="
          grid-template-columns:repeat(${gridWidth}, 24px);
          grid-template-rows:repeat(${gridHeight}, 24px);
        ">
        ${cells.join("")}
      </div>
      <div class="map-room-key">
        ${["normal", "elite", "treasure", "merchant", "fountain", "shrine", "boss"]
          .map(type => {
            const info = this.roomTypeInfo(type);
            return `<span>${info.icon} ${info.label}</span>`;
          })
          .join("")}
      </div>
    `;
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

  renderCenter() {
    return `
      <section class="center-panel box">
        <div class="notice ${this.player.defeated ? "defeat-notice" : ""}">
          ${this.escape(this.state.message)}
        </div>
        ${this.player.defeated ? `
          <div class="defeat-panel">
            <strong>BESIEGT</strong>
            <span>Keine Aktionen möglich, bis deine HP vollständig regeneriert sind.</span>
            <span>Regeneration: ${this.player.recovery * DEFEAT_REGEN_MULTIPLIER + DEFEAT_REGEN_BONUS} HP/Sek.</span>
          </div>
        ` : ""}

        <div class="board-wrap">
          <div class="dungeon-board">
            ${this.currentTiles.map(tile => this.renderTile(tile)).join("")}
            ${this.renderExitTile()}
          </div>
        </div>

        <div class="legend">
          <span><i style="background:#5acb9d"></i>Erkunden</span>
          <span><i style="background:#d78a3c"></i>Gegner</span>
          <span><i style="background:#4e8ec9"></i>Objekt</span>
          <span><i style="background:#76a85f"></i>Heiligtum</span>
          <span><i style="background:#5c4c1c"></i>Aktueller Raum</span>
          <span><i style="background:#294b35"></i>Abgeschlossener Raum</span>
          <span><i style="background:#a77e39"></i>Treppe</span>
          <span><i style="background:#6b7280"></i>Nur Gegner sind verpflichtend</span>
        </div>
      </section>
    `;
  }

  renderExitTile() {
    if (!this.state.dungeon.exitUnlocked) return "";

    return `
      <button
        type="button"
        class="tile stairs"
        id="stairsBtn"
        ${this.player.defeated ? "disabled" : ""}>
        <span class="tile-title">TREPPENABGANG</span>
        <span class="tile-sub">Zur nächsten Etage</span>
        <span class="tile-icon">🪜</span>
      </button>
    `;
  }

  renderRightPanel() {
    const selected = this.player.inventory[this.selectedItem] || null;

    return `
      <aside class="right-panel box">
        <div class="equipment-slots">
          ${this.equipmentSlot("weapon", "Waffe")}
          ${this.equipmentSlot("helmet", "Helm")}
          ${this.equipmentSlot("armor", "Rüstung")}
          ${this.equipmentSlot("ring", "Ring")}
        </div>

        <div class="tabs">
          <button type="button" class="tab ${this.activeTab === "equipment" ? "active" : ""}" data-tab="equipment">
            AUSRÜSTUNG
          </button>
          <button type="button" class="tab ${this.activeTab === "inventory" ? "active" : ""}" data-tab="inventory">
            ITEMS
          </button>
        </div>

        <div class="inventory-pane">
          <div class="item-detail">
            <div class="item-info">
              ${selected ? `
                <h3>${this.escape(selected.name)}</h3>
                ${selected.attack ? `<p>ANGRIFF +${selected.attack}</p>` : ""}
                ${selected.defense ? `<p>VERTEIDIGUNG +${selected.defense}</p>` : ""}
                ${selected.hp ? `<p>HP +${selected.hp}</p>` : ""}
                ${selected.heal ? `<p>HEILUNG ${selected.heal}</p>` : ""}
              ` : `<p>Wähle einen Gegenstand.</p>`}
            </div>

            <div class="item-grid">
              ${this.player.inventory.map((item, index) => `
                <button type="button" class="item-cell ${index === this.selectedItem ? "selected" : ""}" data-item="${index}">
                  <span class="big">${item.icon}</span>
                  <span>${this.escape(item.name)}</span>
                </button>
              `).join("")}
            </div>
          </div>
        </div>

        <div class="bottom-actions">
          <button type="button" class="action-btn primary" id="equipBtn" ${this.player.defeated || !selected || !selected.slot ? "disabled" : ""}>
            AUSRÜSTEN
          </button>
          <button type="button" class="action-btn sell" id="sellBtn" ${this.player.defeated || !selected ? "disabled" : ""}>
            VERKAUFEN
          </button>
        </div>
      </aside>
    `;
  }

  renderTile(tile) {
    if (tile.completed) {
      return `
        <button type="button" class="tile completed" disabled>
          <span class="tile-title">ERLEDIGT</span>
          <span class="tile-sub">${this.escape(this.completedLabel(tile))}</span>
          <span class="tile-icon">✓</span>
          ${this.renderTileEffect(tile.id)}
        </button>
      `;
    }

    if (tile.type === "explore" && !tile.discovered) {
      return `
        <button type="button" class="tile explore" data-tile="${tile.id}" ${this.player.defeated ? "disabled" : ""}>
          <div class="progress-layer" style="transform:scaleX(${tile.progress / 100})"></div>
          <div class="tile-content">
            <span class="tile-title">${Math.floor(tile.progress)}%</span>
            <span class="tile-sub">ERKUNDEN</span>
            <span class="tile-icon">🔎</span>
          </div>
          ${this.renderTileEffect(tile.id)}
        </button>
      `;
    }

    if (tile.type === "enemy" || tile.type === "boss") {
      const enemy = tile.enemy;
      const percentage = Math.max(0, enemy.hp / enemy.maxHp);

      return `
        <button type="button" class="tile ${tile.type}" data-tile="${tile.id}" ${this.player.defeated ? "disabled" : ""}>
          <div class="health-layer ${tile.type === "boss" ? "boss-fill" : "enemy-fill"}" style="transform:scaleX(${percentage})"></div>
          <div class="tile-content">
            <span class="tile-title">${this.escape(enemy.name)}</span>
            <span class="tile-sub">HP ${Math.ceil(enemy.hp)}/${enemy.maxHp} · STÄRKE ${enemy.attack}</span>
            <span class="tile-icon">${enemy.icon}</span>
          </div>
          ${this.renderTileEffect(tile.id)}
        </button>
      `;
    }

    if (tile.type === "object") {
      const object = tile.object;
      const percentage = Math.max(0, object.hp / object.maxHp);

      return `
        <button type="button" class="tile object" data-tile="${tile.id}" ${this.player.defeated ? "disabled" : ""}>
          <div class="health-layer enemy-fill" style="transform:scaleX(${percentage})"></div>
          <div class="tile-content">
            <span class="tile-title">${Math.ceil(object.hp)}/${object.maxHp}</span>
            <span class="tile-sub">${this.escape(object.name)}</span>
            <span class="tile-icon">${object.icon}</span>
          </div>
          ${this.renderTileEffect(tile.id)}
        </button>
      `;
    }

    const info = {
      shrine: ["HEILIGTUM", "HP regenerieren", "🏛️"],
      treasure: ["SCHATZTRUHE", "Öffnen", "🧰"],
      trap: ["FALLE", "Optional · Gefährlich", "⚠️"],
      fountain: ["BRUNNEN", "HP und AP auffüllen", "⛲"],
      merchant: ["HÄNDLER", "Spezialraum", "🛒"],
      empty: ["LEER", "Abschließen", "·"]
    }[tile.type] || ["LEER", "", ""];

    return `
      <button type="button" class="tile ${tile.type} ${tile.type === "trap" ? "optional-tile" : ""}" data-tile="${tile.id}" ${this.player.defeated ? "disabled" : ""}>
        <span class="tile-title">${info[0]}</span>
        <span class="tile-sub">${info[1]}</span>
        <span class="tile-icon">${info[2]}</span>
        ${this.renderTileEffect(tile.id)}
      </button>
    `;
  }

  bind() {
    document.querySelectorAll("[data-tile]").forEach(button => {
      button.addEventListener("click", event => {
        event.preventDefault();
        this.actOnTile(Number(button.dataset.tile));
      });
    });

    document.querySelectorAll("[data-map-room]").forEach(button => {
      button.addEventListener("click", event => {
        event.preventDefault();
        this.moveToRoom(Number(button.dataset.mapRoom));
      });
    });

    document.getElementById("stairsBtn")?.addEventListener("click", event => {
      event.preventDefault();
      this.descendFloor();
    });

    document.querySelectorAll("[data-item]").forEach(button => {
      button.addEventListener("click", event => {
        event.preventDefault();
        this.selectedItem = Number(button.dataset.item);
        this.render();
      });
    });

    document.querySelectorAll("[data-tab]").forEach(button => {
      button.addEventListener("click", event => {
        event.preventDefault();
        this.activeTab = button.dataset.tab;
        this.render();
      });
    });

    document.querySelectorAll("[data-stat]").forEach(button => {
      button.addEventListener("click", event => {
        event.preventDefault();
        this.spendTalentPoint(button.dataset.stat);
      });
    });

    document.getElementById("equipBtn")?.addEventListener("click", () => this.equipSelected());
    document.getElementById("sellBtn")?.addEventListener("click", () => this.sellSelected());
    document.getElementById("meditationBtn")?.addEventListener("click", () => this.toggleMeditation());
    document.getElementById("soundBtn")?.addEventListener("click", () => {
      this.audio.toggle();
      this.render();
    });
    document.getElementById("saveBtn")?.addEventListener("click", () => this.save());
    document.getElementById("resetBtn")?.addEventListener("click", () => this.reset());
  }

  actOnTile(id) {
    if (!this.canAct()) return;

    const tile = this.currentTiles.find(item => item.id === id);
    if (!tile || tile.completed) return;

    if (this.state.meditation.active) {
      this.state.meditation.active = false;
      this.state.message = "Meditation beendet.";
    }

    if (tile.type === "explore") return this.explore(tile);
    if (tile.type === "enemy" || tile.type === "boss") return this.attackEnemy(tile);
    if (tile.type === "object") return this.attackObject(tile);

    if (tile.type === "shrine") {
      this.audio.play("shrine");
      const heal = Math.min(25, this.player.maxHp - this.player.hp);
      this.player.hp += heal;
      this.finishTile(tile, `Heiligtum: +${heal} HP.`);
      return;
    }

    if (tile.type === "treasure") {
      this.audio.play("treasure");

      if (Math.random() < 0.5) {
        const gold = 10 + Math.floor(Math.random() * (18 + this.state.floor * 3));
        this.state.gold += gold;
        this.audio.play("gold");
        this.finishTile(tile, `Schatztruhe geöffnet: ${gold} Gold.`);
      } else {
        this.player.inventory.push(structuredClone(ITEMS[4]));
        this.audio.play("potion");
        this.finishTile(tile, "Schatztruhe geöffnet: Heiltrank gefunden.");
      }
      return;
    }

    if (tile.type === "trap") {
      this.audio.play("trap");
      const damage = 8 + this.state.floor * 2;
      this.player.hp -= damage;

      if (this.player.hp <= 0) {
        this.handleDefeat();
        return;
      }

      this.finishTile(tile, `Falle ausgelöst: ${damage} Schaden.`);
      return;
    }

    if (tile.type === "fountain") {
      this.audio.play("shrine");
      this.player.hp = this.player.maxHp;
      this.player.ap = this.player.maxAp;
      this.finishTile(tile, "Der Brunnen stellt HP und AP vollständig wieder her.");
      return;
    }

    if (tile.type === "merchant") {
      this.finishTile(tile, "Der Händlerraum ist gesichert. Der vollständige Handel folgt in v1.2.");
      return;
    }

    if (tile.type === "empty") {
      this.finishTile(tile, "Leeres Feld abgeschlossen.");
    }
  }

  explore(tile) {
    if (!this.spendAp(4)) return;

    this.audio.play("explore");
    tile.progress = Math.min(100, tile.progress + 20 + Math.random() * 8);
    this.state.message = `Erkundung: ${Math.floor(tile.progress)}%.`;

    if (tile.progress >= 100) {
      const outcomes = [
        "enemy", "enemy", "object", "treasure",
        "trap", "shrine", "empty"
      ];

      tile.discovered = true;
      tile.type = outcomes[Math.floor(Math.random() * outcomes.length)];

      if (tile.type === "enemy") tile.enemy = this.makeEnemy(false);

      if (tile.type === "object") {
        const isVase = Math.random() < 0.5;
        const hp = 18 + this.state.floor * 2;
        tile.object = {
          name: isVase ? "Vase" : "Kiste",
          icon: isVase ? "🏺" : "📦",
          hp,
          maxHp: hp
        };
      }

      this.audio.play("reveal");
      this.state.message = `Aufgedeckt: ${this.completedLabel(tile)}.`;
    }

    this.render();
  }

  attackEnemy(tile) {
    const enemy = tile.enemy;
    if (!enemy || enemy.hp <= 0) return;

    const ACTION_AP_COST = 4;
    if (!this.spendAp(ACTION_AP_COST)) return;

    this.audio.play("attack");
    this.state.lastCombatAt = performance.now();

    const damage = this.damage(this.attack, enemy.defense);
    enemy.hp = Math.max(0, enemy.hp - damage);
    tile.lastHitAt = performance.now();

    const retaliation = enemy.hp > 0
      ? this.damage(enemy.attack, this.defense)
      : 0;

    if (retaliation > 0) {
      this.audio.play("playerHit");
      this.player.hp -= retaliation;

      if (this.player.hp <= 0) {
        this.handleDefeat();
        return;
      }
    }

    this.state.message =
      `${enemy.name}: -${damage} HP` +
      `${retaliation ? ` · Du: -${retaliation} HP` : ""}.`;

    if (enemy.hp <= 0) {
      this.audio.play(tile.type === "boss" ? "bossDefeat" : "enemyDefeat");
      this.state.gold += enemy.reward;
      this.gainXp(enemy.xp);
      this.finishTile(tile, `${enemy.name} besiegt. +${enemy.reward} Gold.`);
      return;
    }

    this.render();
  }

  attackObject(tile) {
    if (!tile.object || tile.object.hp <= 0) return;

    const damage = Math.max(1, this.attack);
    this.audio.play(tile.object.name === "Vase" ? "vase" : "crate");
    tile.object.hp = Math.max(0, tile.object.hp - damage);
    this.state.message = `${tile.object.name}: -${damage} Haltbarkeit.`;

    if (tile.object.hp <= 0) {
      if (Math.random() < 0.45) {
        this.player.inventory.push(structuredClone(ITEMS[4]));
        this.audio.play("potion");
        this.finishTile(tile, `${tile.object.name} zerstört: Heiltrank gefunden.`);
      } else {
        const gold = 8 + Math.floor(Math.random() * 18);
        this.state.gold += gold;
        this.audio.play("gold");
        this.finishTile(tile, `${tile.object.name} zerstört: ${gold} Gold gefunden.`);
      }
      return;
    }

    this.render();
  }

  finishTile(tile, message) {
    if (tile.completed) return;

    const roomId = this.currentRoom.id;

    tile.completed = true;
    tile.used = true;
    this.state.message = message;
    this.playTileEffect(tile);

    // Der Abschluss wird an den konkreten Raum gebunden. Dadurch bleibt
    // der Check korrekt, selbst wenn der Spieler während der Animation
    // bereits durch eine Tür in einen anderen Raum wechselt.
    window.setTimeout(() => {
      this.checkRoomCompletion(roomId);
    }, 720);

    this.render();
  }

  checkRoomCompletion(roomId = this.currentRoom.id) {
    const room = this.state.dungeon.rooms.find(
      dungeonRoom => dungeonRoom.id === roomId
    );

    if (!room) return;

    const requiredEnemies = room.tiles.filter(
      tile => tile.type === "enemy" || tile.type === "boss"
    );
    const complete =
      requiredEnemies.length === 0 ||
      requiredEnemies.every(tile => tile.completed);

    if (!complete) {
      this.render();
      return;
    }

    room.completed = true;

    if (this.currentRoom.id === room.id) {
      this.state.message =
        requiredEnemies.length === 0
          ? `Raum ${room.id + 1} enthält keine Gegner und gilt als gesichert.`
          : `Raum ${room.id + 1} gesichert. Alle Gegner wurden besiegt.`;
    }

    if (this.state.dungeon.rooms.every(item => item.completed)) {
      this.state.dungeon.exitUnlocked = true;
      this.state.message =
        "Alle Räume gesichert. Die Treppe ist freigeschaltet.";
    }

    this.render();
  }

  moveToRoom(roomId) {
    if (!this.canAct()) return;

    const target = this.state.dungeon.rooms.find(room => room.id === roomId);
    if (!target) return;

    target.visited = true;
    target.revealed = true;
    this.revealAdjacentRooms(this.state.dungeon.rooms, roomId);
    this.state.currentRoomId = roomId;

    const requiredEnemies = target.tiles.filter(
      tile => tile.type === "enemy" || tile.type === "boss"
    );
    const alreadyComplete =
      requiredEnemies.length === 0 ||
      requiredEnemies.every(tile => tile.completed);

    if (alreadyComplete) {
      target.completed = true;
      this.state.message = `Raum ${target.id + 1} ist bereits gesichert.`;

      if (this.state.dungeon.rooms.every(item => item.completed)) {
        this.state.dungeon.exitUnlocked = true;
        this.state.message =
          "Alle Räume abgeschlossen. Die Treppe ist freigeschaltet.";
      }
    } else {
      this.state.message = `Raum ${target.id + 1} betreten.`;
    }

    this.render();
  }

  descendFloor() {
    if (!this.canAct()) return;
    if (!this.state.dungeon.exitUnlocked) return;

    const nextFloor = this.state.floor + 1;
    this.audio.play("stageComplete");
    this.stageTransition = {
      from: this.state.floor,
      to: nextFloor
    };
    this.render();

    window.setTimeout(() => {
      this.state.floor = nextFloor;
      this.audio.play("stageStart");
      this.state.dungeon = this.createDungeon();
      this.state.currentRoomId = 0;
      this.state.message = `Etage ${this.state.floor} beginnt.`;
      this.stageTransition = null;
      this.tileEffect = null;
      this.render();
    }, 1450);
  }

  canAct() {
    if (!this.player.defeated) return true;

    this.state.message = "Du bist besiegt und musst warten, bis deine HP vollständig regeneriert sind.";
    this.audio.play("error");
    this.render();
    return false;
  }

  handleDefeat() {
    this.player.hp = 0;
    this.player.defeated = true;
    this.state.meditation.active = false;
    this.state.meditation.xpBuffer = 0;
    this.state.lastCombatAt = performance.now();

    this.healAllLivingEnemies();

    this.audio.play("playerHit");
    this.state.message =
      "Du wurdest besiegt. Alle lebenden Gegner wurden vollständig geheilt. " +
      "Deine Regeneration ist vorübergehend stark erhöht.";

    this.render();
  }

  healAllLivingEnemies() {
    for (const room of this.state.dungeon.rooms) {
      for (const tile of room.tiles) {
        if (
          tile.enemy &&
          !tile.completed &&
          tile.enemy.hp > 0 &&
          tile.enemy.hp < tile.enemy.maxHp
        ) {
          tile.enemy.hp = tile.enemy.maxHp;
          tile.lastHitAt = 0;
        }
      }
    }
  }

  spendAp(cost) {
    if (!this.canAct()) return false;

    if (this.player.ap < cost) {
      this.audio.play("error");
      this.state.message = "Nicht genug Ausdauer.";
      this.render();
      return false;
    }

    this.player.ap -= cost;
    return true;
  }

  updateDynamicBars() {
    const apBar = document.getElementById("apBar");
    const hpBar = document.getElementById("hpBar");

    const apValue = document.querySelector('[data-stat-value="apBar"]');
    const hpValue = document.querySelector('[data-stat-value="hpBar"]');

    if (apBar) {
      apBar.style.width = `${this.player.ap / this.player.maxAp * 100}%`;
    }

    if (apValue) {
      apValue.textContent =
        `${Math.floor(this.player.ap)}/${this.player.maxAp}`;
    }

    if (hpBar) {
      hpBar.style.width = `${this.player.hp / this.player.maxHp * 100}%`;
    }

    if (hpValue) {
      hpValue.textContent =
        `${Math.floor(this.player.hp)}/${this.player.maxHp}`;
    }
  }

  updateEnemyTiles() {
    for (const tile of this.currentTiles) {
      if (!tile.enemy || tile.completed) continue;

      const button = document.querySelector(`[data-tile="${tile.id}"]`);
      if (!button) continue;

      const layer = button.querySelector(".health-layer");
      const subtitle = button.querySelector(".tile-sub");

      if (layer) {
        layer.style.transform =
          `scaleX(${Math.max(0, tile.enemy.hp / tile.enemy.maxHp)})`;
      }

      if (subtitle) {
        subtitle.textContent =
          `HP ${Math.ceil(tile.enemy.hp)}/${tile.enemy.maxHp} · STÄRKE ${tile.enemy.attack}`;
      }
    }
  }

  toggleMeditation() {
    if (this.player.defeated) {
      this.state.message = "Meditation ist gesperrt, bis du vollständig geheilt bist.";
      this.audio.play("error");
      this.render();
      return;
    }

    this.state.meditation.active = !this.state.meditation.active;

    if (this.state.meditation.active) {
      this.state.lastCombatAt = 0;
      this.audio.play("shrine");
      this.state.message = "Meditation begonnen. Aktionen beenden die Meditation.";
    } else {
      this.state.message = "Meditation beendet.";
    }

    this.render();
  }

  spendTalentPoint(stat) {
    if (!this.canAct()) return;
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
    } else if (stat === "recovery") {
      this.player.recovery += 1;
    } else {
      return;
    }

    this.player.talentPoints -= 1;
    this.audio.play("talent");
    this.state.message = "Talentpunkt verteilt.";
    this.render();
  }

  gainXp(amount, announce = true) {
    this.player.xp += amount;
    let leveled = false;

    while (this.player.xp >= this.player.xpNext) {
      this.player.xp -= this.player.xpNext;
      this.player.level += 1;
      this.player.talentPoints += 1;
      this.player.xpNext = Math.round(this.player.xpNext * 1.35);
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 10);
      this.audio.play("levelUp");
      leveled = true;
    }

    if (leveled && announce) {
      this.state.message =
        `Level ${this.player.level} erreicht. Talentpunkt erhalten.`;
    }
  }

  equipSelected() {
    if (!this.canAct()) return;

    const item = this.player.inventory[this.selectedItem];
    if (!item?.slot) return;

    const old = this.player.equipment[item.slot];
    this.player.equipment[item.slot] = item;
    this.player.inventory.splice(this.selectedItem, 1);

    if (old) this.player.inventory.push(old);

    this.selectedItem = 0;
    this.audio.play("equip");
    this.state.message = `${item.name} ausgerüstet.`;
    this.render();
  }

  sellSelected() {
    if (!this.canAct()) return;

    const item = this.player.inventory[this.selectedItem];
    if (!item) return;

    this.state.gold += item.value || 5;
    this.player.inventory.splice(this.selectedItem, 1);
    this.selectedItem = 0;
    this.audio.play("sell");
    this.state.message = `${item.name} verkauft.`;
    this.render();
  }

  playTileEffect(tile) {
    const effects = {
      enemy: "blood",
      boss: "blood-heavy",
      treasure: "gold",
      trap: "smoke",
      shrine: "light",
      explore: "spark",
      empty: "dust"
    };

    this.tileEffect = {
      tileId: tile.id,
      type: tile.type === "object"
        ? tile.object?.name === "Vase" ? "shards" : "splinters"
        : effects[tile.type] || "spark"
    };

    window.setTimeout(() => {
      this.tileEffect = null;
      this.render();
    }, 700);
  }

  renderTileEffect(tileId) {
    if (!this.tileEffect || this.tileEffect.tileId !== tileId) return "";

    const particles = Array.from({ length: 14 }, (_, index) => {
      const angle = (360 / 14) * index;
      const distance = 34 + (index % 4) * 9;
      return `<span style="--angle:${angle}deg;--distance:${distance}px"></span>`;
    }).join("");

    return `
      <div class="tile-effect ${this.tileEffect.type}" aria-hidden="true">
        ${particles}
      </div>
    `;
  }

  renderStageTransition() {
    if (!this.stageTransition) return "";

    return `
      <div class="stage-transition">
        <div class="stage-transition-card">
          <div class="stage-complete">
            ETAGE ${this.stageTransition.from} ABGESCHLOSSEN
          </div>
          <div class="stage-arrow">↓</div>
          <div class="stage-next">ETAGE ${this.stageTransition.to}</div>
          <div class="stage-loading">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    `;
  }

  completedLabel(tile) {
    const labels = {
      explore: "Erkundung",
      enemy: "Gegner",
      boss: "Boss",
      object: "Objekt",
      shrine: "Heiligtum",
      treasure: "Schatztruhe",
      trap: "Falle",
      empty: "Leeres Feld"
    };

    return labels[tile.type] || "Feld";
  }

  resource(icon, value) {
    return `<div class="resource"><span>${icon}</span><span>${value}</span></div>`;
  }

  statCard(icon, name, value, max, fillClass, id = "", statKey = "") {
    const percentage = Math.max(5, Math.min(100, value / max * 100));

    return `
      <div class="stat-card">
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
          <button type="button" class="stat-plus" data-stat="${statKey}" ${this.player.defeated || !statKey || this.player.talentPoints <= 0 ? "disabled" : ""}>
            +
          </button>
        </div>
      </div>
    `;
  }

  equipmentSlot(slot, label) {
    const item = this.player.equipment[slot];

    return `
      <div class="slot">
        <span class="slot-icon">${item?.icon || "—"}</span>
        <span class="slot-name">${item ? this.escape(item.name) : label}</span>
      </div>
    `;
  }

  damage(attack, defense) {
    return Math.max(
      1,
      Math.round((attack - defense * 0.55) * (0.85 + Math.random() * 0.3))
    );
  }

  save() {
    this.audio.play("save");
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
    const keys = [
      "dungeonlite.v102", "dungeonlite.v11", "dungeonlite.v107", "dungeonlite.v106", "dungeonlite.v105", "dungeonlite.v104", "dungeonlite.v103", "dungeonlite.v102", "dungeonlite.v101", "dungeonlite.v10", "dungeonlite.v09", "dungeonlite.v08",
      "dungeonlite.v07", "dungeonlite.v06", "dungeonlite.v054",
      "dungeonlite.v053", "dungeonlite.v052", "dungeonlite.v05"
    ];

    keys.forEach(key => localStorage.removeItem(key));
    this.state = this.createState();
    this.selectedItem = 0;
    this.activeTab = "equipment";
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
