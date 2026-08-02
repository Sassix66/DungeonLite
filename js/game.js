import { ITEM_DATA, ENEMIES, BOSSES } from "./data.js";

const SAVE_KEY = "dungeonlite.ui.v04";

export class Game {
  constructor(root) {
    this.root = root;
    this.state = null;
    this.selectedItem = 0;
    this.activeTab = "equipment";
    this.modal = null;
  }

  start() {
    const saved = this.load();
    this.state = saved || this.createState();
    this.render();
  }

  createState() {
    return {
      stage: 1,
      gems: 12,
      gold: 66,
      silverKeys: 2,
      goldKeys: 1,
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
          weapon: structuredClone(ITEM_DATA[0]),
          helmet: null,
          armor: null,
          ring: null
        },
        inventory: [
          structuredClone(ITEM_DATA[5]),
          structuredClone(ITEM_DATA[2]),
          structuredClone(ITEM_DATA[4]),
          structuredClone(ITEM_DATA[6]),
          structuredClone(ITEM_DATA[7]),
          structuredClone(ITEM_DATA[8])
        ]
      },
      dungeon: this.createDungeon(1),
      message: "Öffne ein gelb markiertes Feld."
    };
  }

  createDungeon(stage) {
    const types = [
      "hidden","hidden","hidden","hidden","elite",
      "treasure","enemy","shrine","enemy","hidden",
      "trap","enemy","shop","enemy","shrine",
      "hidden","shrine","enemy","treasure","hidden",
      "hidden","hidden","hidden","hidden","boss"
    ];

    const rooms = types.map((type, index) => ({
      id: index,
      type,
      state: type === "hidden" ? "hidden" : "locked",
      explored: 0,
      done: false
    }));

    // Start with a small cross-like revealed area.
    [6,7,8,11,12,13,16,17,18].forEach(i => {
      rooms[i].state = "revealed";
    });
    rooms[7].state = "available";

    return { stage, rooms };
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
      ${this.modal ? this.renderModal() : ""}
    `;

    this.bind();
  }

  renderTopbar() {
    return `
      <header class="topbar">
        <div class="level-badge">
          <div class="label">LEVEL</div>
          <div class="value">${this.player.level}</div>
        </div>

        <div class="top-resources">
          ${this.resource("💎", this.state.gems)}
          ${this.resource("🪙", this.state.gold)}
          ${this.resource("🗝️", this.state.silverKeys)}
          ${this.resource("🔑", this.state.goldKeys)}
          <div class="stage-title">ETAPPE ${this.state.stage} · RUINEN</div>
        </div>

        <div class="top-actions">
          <button class="icon-btn" id="helpBtn" title="Hilfe">📖</button>
          <button class="icon-btn" id="saveBtn" title="Speichern">💾</button>
          <button class="icon-btn danger" id="resetBtn" title="Neustart">⏻</button>
        </div>
      </header>
    `;
  }

  renderSidebar() {
    return `
      <aside class="sidebar">
        <button class="shop-btn" id="shopBtn">🏪 LADEN</button>

        ${this.statCard("❤️", "HP", this.player.hp, this.player.maxHp, "hp-fill")}
        ${this.statCard("⚡", "AP", this.player.ap, this.player.maxAp, "ap-fill")}
        ${this.statCard("🗡️", "ANGRIFF", this.attack, 100, "atk-fill")}
        ${this.statCard("🛡️", "VERTEIDIGUNG", this.defense, 100, "def-fill")}
        ${this.statCard("💧", "ERHOLUNG", this.player.recovery, 100, "rcv-fill", false)}

        <div class="minimap-box">
          <div class="minimap-title">DUNGEON-MAP</div>
          <div class="minimap">
            ${this.state.dungeon.rooms.map(room => {
              const classes = ["mini-tile"];
              if (room.state !== "hidden") classes.push("open");
              if (room.state === "available") classes.push("current");
              if (room.type === "boss") classes.push("boss");
              return `<div class="${classes.join(" ")}"></div>`;
            }).join("")}
          </div>
        </div>
      </aside>
    `;
  }

  renderCenter() {
    return `
      <section class="center-panel">
        ${this.state.message ? `<div class="notice">${this.escape(this.state.message)}</div>` : ""}

        <div class="board-wrap">
          <div class="dungeon-board">
            ${this.state.dungeon.rooms.map(room => this.renderTile(room)).join("")}
          </div>
        </div>

        <div class="legend">
          ${this.legend("enemy", "Kampf")}
          ${this.legend("treasure", "Schatz")}
          ${this.legend("shrine", "Heiligtum")}
          ${this.legend("shop", "Laden")}
          ${this.legend("elite", "Elite")}
          ${this.legend("boss", "Boss")}
          ${this.legend("trap", "Falle")}
        </div>
      </section>
    `;
  }

  renderRightPanel() {
    const selected = this.player.inventory[this.selectedItem] || null;

    return `
      <aside class="right-panel">
        <div class="equipment-slots">
          ${this.equipmentSlot("weapon", "Waffe")}
          ${this.equipmentSlot("helmet", "Helm")}
          ${this.equipmentSlot("armor", "Rüstung")}
          ${this.equipmentSlot("ring", "Ring")}
        </div>

        <div class="tabs">
          <button class="tab ${this.activeTab === "equipment" ? "active" : ""}" data-tab="equipment">AUSRÜSTUNG</button>
          <button class="tab ${this.activeTab === "inventory" ? "active" : ""}" data-tab="inventory">ITEMS</button>
        </div>

        <div class="inventory-pane">
          ${this.activeTab === "equipment"
            ? this.renderEquipmentDetail(selected)
            : this.renderInventoryOnly()}
        </div>

        <div class="bottom-actions">
          <button class="action-btn primary" id="equipBtn" ${!selected || selected.type ? "disabled" : ""}>AUSRÜSTEN</button>
          <button class="action-btn sell" id="sellBtn" ${!selected ? "disabled" : ""}>VERKAUFEN</button>
        </div>
      </aside>
    `;
  }

  renderEquipmentDetail(selected) {
    return `
      <div class="item-detail">
        <div class="item-info">
          ${selected ? `
            <h3>${this.escape(selected.name)}</h3>
            <p>${this.rarityLabel(selected.rarity)}</p>
            ${selected.attack ? `<p>ANGRIFF +${selected.attack}</p>` : ""}
            ${selected.defense ? `<p>VERTEIDIGUNG +${selected.defense}</p>` : ""}
            ${selected.hp ? `<p>HP +${selected.hp}</p>` : ""}
            ${selected.heal ? `<p>HEILUNG ${selected.heal}</p>` : ""}
          ` : `<p class="muted">Wähle einen Gegenstand.</p>`}
        </div>

        <div class="item-grid">
          ${this.player.inventory.map((item, index) => `
            <button class="item-cell ${index === this.selectedItem ? "selected" : ""}" data-item="${index}">
              <span class="big">${item.icon}</span>
              <span class="tiny">${this.escape(item.name)}</span>
            </button>
          `).join("")}
        </div>
      </div>
    `;
  }

  renderInventoryOnly() {
    return `
      <div class="item-grid">
        ${this.player.inventory.map((item, index) => `
          <button class="item-cell ${index === this.selectedItem ? "selected" : ""}" data-item="${index}">
            <span class="big">${item.icon}</span>
            <span class="tiny">${this.escape(item.name)}</span>
          </button>
        `).join("")}
      </div>
    `;
  }

  renderTile(room) {
    if (room.state === "hidden") {
      return `<button class="tile hidden" disabled>?</button>`;
    }

    const tileInfo = this.tileInfo(room);
    const classes = ["tile", tileInfo.className];
    if (room.done) classes.push("cleared");
    if (room.state === "available") classes.push("available");

    return `
      <button class="${classes.join(" ")}" data-room="${room.id}" ${room.state !== "available" || room.done ? "disabled" : ""}>
        <span class="tile-title">${tileInfo.title}</span>
        <span class="tile-sub">${tileInfo.sub}</span>
        <span class="tile-icon">${tileInfo.icon}</span>
      </button>
    `;
  }

  tileInfo(room) {
    const map = {
      enemy: { className: "enemy", title: "KAMPF", sub: "Gegner bezwingen", icon: "⚔️" },
      boss: { className: "boss", title: "BOSS", sub: "Endgegner", icon: "👹" },
      elite: { className: "enemy", title: "ELITE", sub: "Starker Gegner", icon: "😈" },
      treasure: { className: "treasure", title: "SCHATZ", sub: "Truhe öffnen", icon: "🧰" },
      shrine: { className: "shrine", title: "HEILIGTUM", sub: "HP regenerieren", icon: "🏛️" },
      shop: { className: "shop", title: "LADEN", sub: "Ausrüstung kaufen", icon: "🏪" },
      trap: { className: "shrine", title: "FALLE", sub: "Vorsicht", icon: "⚠️" },
      door: { className: "door", title: "TÜR", sub: "Schlüssel nötig", icon: "🚪" },
      upgrade: { className: "upgrade", title: "VERSTÄRKEN", sub: "+1 Wert", icon: "✨" },
      hidden: { className: "hidden", title: "?", sub: "", icon: "" }
    };

    return map[room.type] || { className: "empty", title: "ERKUNDEN", sub: "Neues Feld", icon: "🔎" };
  }

  bind() {
    document.querySelectorAll("[data-room]").forEach(btn => {
      btn.addEventListener("click", () => this.openRoom(Number(btn.dataset.room)));
    });

    document.querySelectorAll("[data-item]").forEach(btn => {
      btn.addEventListener("click", () => {
        this.selectedItem = Number(btn.dataset.item);
        this.render();
      });
    });

    document.querySelectorAll("[data-tab]").forEach(btn => {
      btn.addEventListener("click", () => {
        this.activeTab = btn.dataset.tab;
        this.render();
      });
    });

    document.getElementById("equipBtn")?.addEventListener("click", () => this.equipSelected());
    document.getElementById("sellBtn")?.addEventListener("click", () => this.sellSelected());
    document.getElementById("saveBtn")?.addEventListener("click", () => this.save());
    document.getElementById("resetBtn")?.addEventListener("click", () => this.reset());
    document.getElementById("shopBtn")?.addEventListener("click", () => this.openShop());
    document.getElementById("helpBtn")?.addEventListener("click", () => {
      this.modal = { type: "info", title: "Spielhilfe", text: "Öffne gelb markierte Felder. Kämpfe, finde Beute und erreiche den Boss." };
      this.render();
    });

    document.getElementById("modalClose")?.addEventListener("click", () => {
      this.modal = null;
      this.render();
    });

    document.getElementById("combatAttack")?.addEventListener("click", () => this.combatTurn());
    document.getElementById("combatPotion")?.addEventListener("click", () => this.usePotion());
  }

  openRoom(id) {
    const room = this.state.dungeon.rooms[id];
    if (!room || room.state !== "available" || room.done) return;

    switch (room.type) {
      case "enemy":
      case "elite":
      case "boss":
        this.startCombat(room);
        return;
      case "treasure":
        this.findTreasure(room);
        return;
      case "shrine":
        this.useShrine(room);
        return;
      case "trap":
        this.triggerTrap(room);
        return;
      case "shop":
        this.openShop(room);
        return;
      default:
        this.completeRoom(room, "Feld erkundet.");
    }
  }

  startCombat(room) {
    const pool = room.type === "boss" ? BOSSES : ENEMIES;
    const base = structuredClone(pool[Math.min(pool.length - 1, Math.floor((this.state.stage - 1) / 2))]);
    const scale = room.type === "elite" ? 1.5 : 1;
    base.hp = Math.round(base.hp * scale);
    base.maxHp = base.hp;
    base.attack = Math.round(base.attack * scale);
    base.defense = Math.round(base.defense * scale);

    this.modal = {
      type: "combat",
      roomId: room.id,
      enemy: base,
      log: [`${base.name} erscheint.`]
    };
    this.render();
  }

  combatTurn() {
    const combat = this.modal;
    const enemy = combat.enemy;

    const dealt = this.damage(this.attack, enemy.defense);
    enemy.hp -= dealt;
    combat.log.push(`Du verursachst ${dealt} Schaden.`);

    if (enemy.hp <= 0) {
      this.state.gold += enemy.reward;
      this.gainXp(enemy.xp);
      const room = this.state.dungeon.rooms[combat.roomId];
      this.modal = null;
      this.completeRoom(room, `${enemy.name} besiegt. +${enemy.reward} Gold.`);
      return;
    }

    const received = this.damage(enemy.attack, this.defense);
    this.player.hp -= received;
    combat.log.push(`${enemy.name} verursacht ${received} Schaden.`);

    if (this.player.hp <= 0) {
      this.player.hp = Math.max(1, Math.round(this.player.maxHp * .4));
      this.state.gold = Math.max(0, this.state.gold - 10);
      this.modal = null;
      this.state.message = "Du wurdest besiegt und verlierst 10 Gold.";
    }

    this.render();
  }

  usePotion() {
    const index = this.player.inventory.findIndex(item => item.type === "potion");
    if (index < 0) return;

    const item = this.player.inventory[index];
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + item.heal);
    this.player.inventory.splice(index, 1);
    this.modal.log.push(`Heiltrank: +${item.heal} HP.`);
    this.selectedItem = 0;
    this.render();
  }

  findTreasure(room) {
    const candidates = ITEM_DATA.filter(item => item.slot);
    const item = structuredClone(candidates[Math.floor(Math.random() * candidates.length)]);
    this.player.inventory.push(item);
    this.state.gold += 20;
    this.completeRoom(room, `Schatz gefunden: ${item.name} und 20 Gold.`);
  }

  useShrine(room) {
    const amount = Math.min(35, this.player.maxHp - this.player.hp);
    this.player.hp += amount;
    this.completeRoom(room, `Heiligtum: ${amount} HP wiederhergestellt.`);
  }

  triggerTrap(room) {
    const damage = 12;
    this.player.hp = Math.max(1, this.player.hp - damage);
    this.completeRoom(room, `Falle ausgelöst: ${damage} Schaden.`);
  }

  openShop(room = null) {
    this.modal = {
      type: "info",
      title: "Laden",
      text: "Der Händler wird in der nächsten Version vollständig umgesetzt."
    };

    if (room) {
      room.done = true;
      this.unlockAround(room.id);
    }

    this.render();
  }

  completeRoom(room, message) {
    room.done = true;
    room.state = "revealed";
    this.unlockAround(room.id);
    this.state.message = message;

    if (room.type === "boss") {
      this.state.stage += 1;
      this.state.dungeon = this.createDungeon(this.state.stage);
      this.state.message = `Boss besiegt. Etappe ${this.state.stage} beginnt.`;
    }

    this.render();
  }

  unlockAround(id) {
    const cols = 5;
    const candidates = [id - 1, id + 1, id - cols, id + cols];

    candidates.forEach(index => {
      const room = this.state.dungeon.rooms[index];
      if (!room) return;

      const sameRow = Math.floor(index / cols) === Math.floor(id / cols);
      const vertical = Math.abs(index - id) === cols;
      const horizontal = Math.abs(index - id) === 1 && sameRow;

      if (horizontal || vertical) {
        if (room.state === "hidden") room.state = "revealed";
        if (!room.done) room.state = "available";
      }
    });
  }

  equipSelected() {
    const item = this.player.inventory[this.selectedItem];
    if (!item || !item.slot) return;

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

  renderModal() {
    if (this.modal.type === "combat") {
      const e = this.modal.enemy;
      return `
        <div class="overlay">
          <div class="modal">
            <h2>Kampf</h2>
            <div class="combat-row">
              <div class="combatant">
                <div class="portrait">🧭</div>
                <b>Held</b>
                <div class="tiny">HP ${this.player.hp}/${this.player.maxHp}</div>
              </div>
              <div>VS</div>
              <div class="combatant">
                <div class="portrait">${e.icon}</div>
                <b>${this.escape(e.name)}</b>
                <div class="tiny">HP ${Math.max(0, e.hp)}/${e.maxHp}</div>
              </div>
            </div>
            <div class="log">${this.modal.log.map(line => `${this.escape(line)}<br>`).join("")}</div>
            <div class="modal-actions">
              <button class="action-btn sell" id="combatAttack">ANGREIFEN</button>
              <button class="action-btn primary" id="combatPotion">HEILTRANK</button>
            </div>
          </div>
        </div>
      `;
    }

    return `
      <div class="overlay">
        <div class="modal">
          <h2>${this.escape(this.modal.title)}</h2>
          <p>${this.escape(this.modal.text)}</p>
          <button class="action-btn primary" id="modalClose">SCHLIESSEN</button>
        </div>
      </div>
    `;
  }

  resource(icon, value) {
    return `<div class="resource"><span class="icon">${icon}</span><span>${value}</span></div>`;
  }

  statCard(icon, name, value, max, fillClass, plus = true) {
    const pct = Math.min(100, Math.max(5, value / max * 100));
    return `
      <div class="stat-card">
        <div class="stat-row">
          <div class="stat-icon">${icon}</div>
          <div>
            <div class="stat-name">${name}</div>
            <div class="stat-bar">
              <div class="stat-fill ${fillClass}" style="width:${pct}%">${value}${name === "HP" || name === "AP" ? `/${max}` : ""}</div>
            </div>
          </div>
          ${plus ? `<button class="stat-plus">+</button>` : `<div></div>`}
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

  legend(type, label) {
    const colors = {
      enemy: "#b88345",
      treasure: "#4d8fcc",
      shrine: "#8cc16f",
      shop: "#9a6ad6",
      elite: "#9c3c2f",
      boss: "#9a6ad6",
      trap: "#6ca85f"
    };
    return `<span><i style="background:${colors[type]}"></i>${label}</span>`;
  }

  rarityLabel(rarity) {
    return {
      common: "Gewöhnlich",
      rare: "Selten",
      epic: "Episch",
      legendary: "Legendär"
    }[rarity] || "";
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
