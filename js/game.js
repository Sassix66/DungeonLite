import { ITEMS, ENEMIES, BOSSES } from "./data.js";

const SAVE_KEY = "dungeonlite.v053";
const AP_REGEN_PER_SECOND = 1;
const ENEMY_REGEN_DELAY = 1800;
const ENEMY_REGEN_PER_SECOND = 4;

export class Game {
  constructor(root) {
    this.root = root;
    this.selectedItem = 0;
    this.activeTab = "equipment";
    this.lastTick = performance.now();
    this.state = this.load() || this.createState();
    this.loop = this.loop.bind(this);
  }

  start() {
    this.render();
    requestAnimationFrame(this.loop);
  }

  createState() {
    return {
      stage: 1,
      gems: 0,
      gold: 0,
      silverKeys: 0,
      goldKeys: 0,
      message: "Alle sichtbaren Felder können frei ausgewählt werden.",
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
        recovery: 8,
        equipment: {
          weapon: null,
          helmet: null,
          armor: null,
          ring: null
        },
        inventory: []
      },
      dungeon: this.createDungeon()
    };
  }

  createDungeon() {
    const pool = [
      "explore", "explore", "explore", "explore",
      "enemy", "enemy", "enemy",
      "object", "object",
      "shrine",
      "shop",
      "boss"
    ];

    const rooms = Array.from({ length: 25 }, (_, id) => {
      const type = pool[Math.floor(Math.random() * pool.length)];
      const room = {
        id,
        type,
        visible: false,
        discovered: type !== "explore",
        progress: type === "explore" ? 0 : 100,
        destroyed: false,
        used: false,
        removed: false,
        lastHitAt: 0
      };

      if (type === "enemy") {
        room.enemy = this.makeEnemy(false);
      }

      if (type === "boss") {
        room.enemy = this.makeEnemy(true);
      }

      if (type === "object") {
        const isVase = Math.random() < 0.5;
        room.object = {
          name: isVase ? "Vase" : "Kiste",
          icon: isVase ? "🏺" : "📦",
          hp: 18,
          maxHp: 18
        };
      }

      return room;
    });

    // Zu Beginn sind nur drei oder vier zufällige Felder sichtbar.
    const initialCount = 3 + Math.floor(Math.random() * 2);
    const shuffled = [...rooms].sort(() => Math.random() - 0.5);

    shuffled.slice(0, initialCount).forEach(room => {
      room.visible = true;
    });

    return { rooms };
  }

  makeEnemy(boss) {
    const base = structuredClone(boss ? BOSSES[0] : ENEMIES[Math.floor(Math.random() * ENEMIES.length)]);
    base.maxHp = base.hp;
    return base;
  }

  get player() {
    return this.state.player;
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

    this.player.ap = Math.min(this.player.maxAp, this.player.ap + AP_REGEN_PER_SECOND * dt);

    let dirty = false;

    for (const room of this.state.dungeon.rooms) {
      if (!room.enemy || room.enemy.hp <= 0) continue;

      const sinceHit = now - room.lastHitAt;
      if (room.lastHitAt > 0 && sinceHit > ENEMY_REGEN_DELAY && room.enemy.hp < room.enemy.maxHp) {
        room.enemy.hp = Math.min(room.enemy.maxHp, room.enemy.hp + ENEMY_REGEN_PER_SECOND * dt);
        dirty = true;
      }
    }

    this.updateDynamicBars();

    if (dirty) {
      this.updateEnemyTiles();
    }

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
          <div class="stage-title">ETAPPE ${this.state.stage} · RUINEN</div>
        </div>

        <div class="top-actions box">
          <button type="button" class="icon-btn" id="saveBtn">💾</button>
          <button type="button" class="icon-btn danger" id="resetBtn">⏻</button>
        </div>
      </header>
    `;
  }

  renderSidebar() {
    return `
      <aside class="sidebar box">
        ${this.statCard("❤️", "HP", this.player.hp, this.player.maxHp, "hp-fill", "hpBar")}
        ${this.statCard("⚡", "AP", this.player.ap, this.player.maxAp, "ap-fill", "apBar")}
        ${this.statCard("🗡️", "ANGRIFF", this.attack, 100, "atk-fill")}
        ${this.statCard("🛡️", "VERTEIDIGUNG", this.defense, 100, "def-fill")}
        ${this.statCard("💧", "ERHOLUNG", this.player.recovery, 100, "rcv-fill")}

        <div class="minimap-box">
          <div class="minimap-title">DUNGEON-MAP</div>
          <div class="minimap">
            ${this.state.dungeon.rooms.map(room => `
              <div class="mini ${room.visible && !room.removed ? "revealed" : ""} ${room.type}"></div>
            `).join("")}
          </div>
        </div>
      </aside>
    `;
  }

  renderCenter() {
    return `
      <section class="center-panel box">
        <div class="notice">${this.escape(this.state.message)}</div>

        <div class="board-wrap">
          <div class="dungeon-board">
            ${this.state.dungeon.rooms.map(room => this.renderTile(room)).join("")}
          </div>
        </div>

        <div class="legend">
          <span><i style="background:#5acb9d"></i>Erkunden</span>
          <span><i style="background:#d78a3c"></i>Gegner</span>
          <span><i style="background:#4e8ec9"></i>Objekt</span>
          <span><i style="background:#76a85f"></i>Heiligtum</span>
          <span><i style="background:#9b67d4"></i>Laden</span>
          <span><i style="background:#e14938"></i>Boss</span>
        </div>
      </section>
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
          <button type="button" class="tab ${this.activeTab === "equipment" ? "active" : ""}" data-tab="equipment">AUSRÜSTUNG</button>
          <button type="button" class="tab ${this.activeTab === "inventory" ? "active" : ""}" data-tab="inventory">ITEMS</button>
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
          <button type="button" class="action-btn primary" id="equipBtn" ${!selected || !selected.slot ? "disabled" : ""}>AUSRÜSTEN</button>
          <button type="button" class="action-btn sell" id="sellBtn" ${!selected ? "disabled" : ""}>VERKAUFEN</button>
        </div>
      </aside>
    `;
  }

  renderTile(room) {
    if (!room.visible || room.removed) {
      return `<div class="tile-spacer" aria-hidden="true"></div>`;
    }

    if (room.type === "explore" && !room.discovered) {
      return `
        <button type="button" class="tile explore" data-room="${room.id}">
          <div class="progress-layer" style="transform:scaleX(${room.progress / 100})"></div>
          <div class="tile-content">
            <span class="tile-title">${Math.floor(room.progress)}%</span>
            <span class="tile-sub">ERKUNDEN</span>
            <span class="tile-icon">🔎</span>
          </div>
        </button>
      `;
    }

    if (room.type === "enemy" || room.type === "boss") {
      const enemy = room.enemy;
      const pct = Math.max(0, enemy.hp / enemy.maxHp);
      return `
        <button type="button" class="tile ${room.type}" data-room="${room.id}" ${enemy.hp <= 0 ? "disabled" : ""}>
          <div class="health-layer ${room.type === "boss" ? "boss-fill" : "enemy-fill"}" style="transform:scaleX(${pct})"></div>
          <div class="tile-content">
            <span class="tile-title">${this.escape(enemy.name)}</span>
            <span class="tile-sub">HP ${Math.ceil(enemy.hp)}/${enemy.maxHp} · STÄRKE ${enemy.attack}</span>
            <span class="tile-icon">${enemy.icon}</span>
          </div>
        </button>
      `;
    }

    if (room.type === "object") {
      const object = room.object;
      const pct = Math.max(0, object.hp / object.maxHp);
      return `
        <button type="button" class="tile object" data-room="${room.id}" ${room.destroyed ? "disabled" : ""}>
          <div class="health-layer enemy-fill" style="transform:scaleX(${pct})"></div>
          <div class="tile-content">
            <span class="tile-title">${room.destroyed ? "ZERSTÖRT" : `${Math.ceil(object.hp)}/${object.maxHp}`}</span>
            <span class="tile-sub">${this.escape(object.name)}</span>
            <span class="tile-icon">${object.icon}</span>
          </div>
        </button>
      `;
    }

    const info = {
      shrine: [room.used ? "VERBRAUCHT" : "HEILIGTUM", room.used ? "Nicht erneut nutzbar" : "HP regenerieren", "🏛️"],
      shop: ["LADEN", "Bald verfügbar", "🏪"]
    }[room.type] || ["LEER", "", ""];

    return `
      <button type="button" class="tile ${room.type}" data-room="${room.id}" ${room.type === "shrine" && room.used ? "disabled" : ""}>
        <div class="tile-content">
          <span class="tile-title">${info[0]}</span>
          <span class="tile-sub">${info[1]}</span>
          <span class="tile-icon">${info[2]}</span>
        </div>
      </button>
    `;
  }

  bind() {
    const board = document.querySelector(".dungeon-board");

    board?.addEventListener("click", event => {
      const button = event.target.closest("[data-room]");
      if (!button || button.disabled) return;

      event.preventDefault();
      this.actOnRoom(Number(button.dataset.room));
    });

    document.querySelectorAll("[data-item]").forEach(btn => {
      btn.addEventListener("click", event => {
        event.preventDefault();
        this.selectedItem = Number(btn.dataset.item);
        this.render();
      });
    });

    document.querySelectorAll("[data-tab]").forEach(btn => {
      btn.addEventListener("click", event => {
        event.preventDefault();
        this.activeTab = btn.dataset.tab;
        this.render();
      });
    });

    document.getElementById("equipBtn")?.addEventListener("click", event => {
      event.preventDefault();
      this.equipSelected();
    });

    document.getElementById("sellBtn")?.addEventListener("click", event => {
      event.preventDefault();
      this.sellSelected();
    });

    document.getElementById("saveBtn")?.addEventListener("click", event => {
      event.preventDefault();
      this.save();
    });

    document.getElementById("resetBtn")?.addEventListener("click", event => {
      event.preventDefault();
      this.reset();
    });
  }

  actOnRoom(id) {
    const room = this.state.dungeon.rooms[id];
    if (!room || !room.visible || room.removed) return;

    // Jede aktuell sichtbare Kachel ist jederzeit direkt auswählbar.

    if (room.type === "explore") {
      this.explore(room);
      return;
    }

    if (room.type === "enemy" || room.type === "boss") {
      this.attackEnemy(room);
      return;
    }

    if (room.type === "object") {
      this.attackObject(room);
      return;
    }

    if (room.type === "shrine") {
      if (room.used) return;
      if (!this.spendAp(5)) return;

      room.used = true;
      const heal = Math.min(25, this.player.maxHp - this.player.hp);
      this.player.hp += heal;
      this.finishRoom(room, `Heiligtum: +${heal} HP.`);
      return;
    }

    if (room.type === "shop") {
      this.finishRoom(room, "Der Laden wird später ausgebaut.");
      return;
    }

    if (room.type === "empty") {
      if (!this.spendAp(2)) return;
      this.finishRoom(room, "Leeres Feld abgeschlossen.");
    }
  }

  explore(room) {
    if (!this.spendAp(4)) return;

    room.progress = Math.min(100, room.progress + 20 + Math.random() * 8);
    this.state.message = `Erkundung: ${Math.floor(room.progress)}%.`;

    if (room.progress >= 100) {
      room.discovered = true;
      const outcomes = ["enemy", "object", "shrine", "empty"];
      room.type = outcomes[Math.floor(Math.random() * outcomes.length)];

      if (room.type === "enemy") room.enemy = this.makeEnemy(false);
      if (room.type === "object") {
        room.object = {
          name: Math.random() < .5 ? "Vase" : "Kiste",
          icon: Math.random() < .5 ? "🏺" : "📦",
          hp: 18,
          maxHp: 18
        };
      }

      this.state.message = `Das Feld wurde aufgedeckt: ${room.type}.`;
    }

    this.render();
  }

  attackEnemy(room) {
    if (room.enemy.hp <= 0) return;
    if (!this.spendAp(room.type === "boss" ? 7 : 5)) return;

    const enemy = room.enemy;
    const damage = this.damage(this.attack, enemy.defense);
    enemy.hp = Math.max(0, enemy.hp - damage);
    room.lastHitAt = performance.now();

    const retaliation = enemy.hp > 0 ? this.damage(enemy.attack, this.defense) : 0;
    if (retaliation > 0) {
      this.player.hp = Math.max(1, this.player.hp - retaliation);
    }

    this.state.message = `${enemy.name}: -${damage} HP${retaliation ? ` · Du: -${retaliation} HP` : ""}.`;

    if (enemy.hp <= 0) {
      this.state.gold += enemy.reward;
      this.gainXp(enemy.xp);
      this.finishRoom(room, `${enemy.name} besiegt. +${enemy.reward} Gold.`);
      return;
    }

    this.render();
  }

  attackObject(room) {
    if (room.destroyed) return;
    if (!this.spendAp(3)) return;

    const damage = Math.max(1, this.attack);
    room.object.hp = Math.max(0, room.object.hp - damage);
    this.state.message = `${room.object.name}: -${damage} Haltbarkeit.`;

    if (room.object.hp <= 0) {
      room.destroyed = true;
      const roll = Math.random();

      if (roll < .45) {
        this.player.inventory.push(structuredClone(ITEMS[4]));
        this.finishRoom(room, `${room.object.name} zerstört: Heiltrank gefunden.`);
      } else {
        const gold = 8 + Math.floor(Math.random() * 18);
        this.state.gold += gold;
        this.finishRoom(room, `${room.object.name} zerstört: ${gold} Gold gefunden.`);
      }
      return;
    }

    this.render();
  }

  finishRoom(room, message) {
    room.removed = true;
    room.visible = false;
    this.state.message = message;
    this.revealReplacement();
    this.render();
  }

  revealReplacement() {
    const hidden = this.state.dungeon.rooms.filter(room => !room.visible && !room.removed);
    if (hidden.length === 0) return;

    const target = hidden[Math.floor(Math.random() * hidden.length)];
    target.visible = true;
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

  updateDynamicBars() {
    const apBar = document.getElementById("apBar");
    const hpBar = document.getElementById("hpBar");

    if (apBar) {
      apBar.style.width = `${this.player.ap / this.player.maxAp * 100}%`;
      apBar.textContent = `${Math.floor(this.player.ap)}/${this.player.maxAp}`;
    }

    if (hpBar) {
      hpBar.style.width = `${this.player.hp / this.player.maxHp * 100}%`;
      hpBar.textContent = `${Math.floor(this.player.hp)}/${this.player.maxHp}`;
    }
  }

  updateEnemyTiles() {
    for (const room of this.state.dungeon.rooms) {
      if (!room.enemy || !room.visible || room.removed) continue;

      const button = document.querySelector(`[data-room="${room.id}"]`);
      if (!button) continue;

      const layer = button.querySelector(".health-layer");
      const subtitle = button.querySelector(".tile-sub");

      if (layer) {
        layer.style.transform = `scaleX(${Math.max(0, room.enemy.hp / room.enemy.maxHp)})`;
      }

      if (subtitle) {
        subtitle.textContent = `HP ${Math.ceil(room.enemy.hp)}/${room.enemy.maxHp} · STÄRKE ${room.enemy.attack}`;
      }
    }
  }

  equipSelected() {
    const item = this.player.inventory[this.selectedItem];
    if (!item?.slot) return;

    const old = this.player.equipment[item.slot];
    this.player.equipment[item.slot] = item;
    this.player.inventory.splice(this.selectedItem, 1);

    if (old) this.player.inventory.push(old);

    this.selectedItem = 0;
    this.state.message = `${item.name} ausgerüstet.`;
    this.render();
  }

  sellSelected() {
    const item = this.player.inventory[this.selectedItem];
    if (!item) return;

    this.state.gold += item.value || 5;
    this.player.inventory.splice(this.selectedItem, 1);
    this.selectedItem = 0;
    this.state.message = `${item.name} verkauft.`;
    this.render();
  }

  gainXp(amount) {
    this.player.xp += amount;

    if (this.player.xp >= this.player.xpNext) {
      this.player.xp -= this.player.xpNext;
      this.player.level += 1;
      this.player.xpNext = Math.round(this.player.xpNext * 1.35);
      this.player.maxHp += 15;
      this.player.hp = this.player.maxHp;
      this.player.baseAttack += 3;
      this.player.baseDefense += 2;
    }
  }

  resource(icon, value) {
    return `<div class="resource"><span>${icon}</span><span>${value}</span></div>`;
  }

  statCard(icon, name, value, max, fillClass, id = "") {
    const pct = Math.max(5, Math.min(100, value / max * 100));

    return `
      <div class="stat-card">
        <div class="stat-row">
          <div class="stat-icon">${icon}</div>
          <div>
            <div class="stat-name">${name}</div>
            <div class="stat-bar">
              <div id="${id}" class="stat-fill ${fillClass}" style="width:${pct}%">
                ${name === "HP" || name === "AP" ? `${Math.floor(value)}/${max}` : Math.floor(value)}
              </div>
            </div>
          </div>
          <button type="button" class="stat-plus">+</button>
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
    return Math.max(1, Math.round((attack - defense * .55) * (.85 + Math.random() * .3)));
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
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem("dungeonlite.v052");
    localStorage.removeItem("dungeonlite.v05");
    localStorage.removeItem("dungeonlite.ui.v04");
    localStorage.removeItem("dungeonlite.save.v03");
    localStorage.removeItem("dungeonlite.save.v02");
    localStorage.removeItem("dungeonlite.save.v01");
    this.state = this.createState();
    this.selectedItem = 0;
    this.activeTab = "equipment";
    this.render();
  }

  escape(value) {
    return String(value).replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[c]);
  }
}
