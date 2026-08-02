import { Player } from "./player.js";
import { createPotion, createEquipment } from "./items.js";
import { createEnemy } from "./enemies.js";
import { saveGame, loadGame, hasSave } from "./save.js";

export class Game {
  constructor(container) {
    this.container = container;
    this.player = null;
    this.enemy = null;
    this.floor = 1;
    this.log = [];
  }

  start() {
    this.showMenu();
  }

  newGame() {
    this.player = new Player({
      inventory: [createPotion()]
    });
    this.enemy = null;
    this.floor = 1;
    this.log = [];
    this.showHub("Dein Abenteuer beginnt.");
  }

  loadSavedGame() {
    const data = loadGame();

    if (!data) {
      this.showMenu("Der Spielstand konnte nicht geladen werden.");
      return;
    }

    this.player = new Player(data.player);
    this.floor = Math.max(1, Number(data.floor) || 1);
    this.enemy = null;
    this.log = [];
    this.showHub("Spielstand geladen.");
  }

  save() {
    saveGame({
      player: this.player,
      floor: this.floor
    });

    this.showHub("Spiel gespeichert.");
  }

  showMenu(message = "") {
    this.container.innerHTML = `
      <section class="screen">
        <div class="brand">
          <h1>DungeonLite</h1>
          <p>Ein eigenständiges minimalistisches Dungeon-RPG</p>
        </div>
        <div class="panel">
          ${message ? `<div class="notice">${this.escape(message)}</div>` : ""}
          <div class="menu">
            <button class="btn" id="new-game">Neues Spiel</button>
            <button class="btn secondary" id="load-game" ${hasSave() ? "" : "disabled"}>Spiel laden</button>
          </div>
        </div>
        <footer>Version 0.2 · Ausrüstung und Loot</footer>
      </section>
    `;

    document.getElementById("new-game").onclick = () => this.newGame();
    document.getElementById("load-game").onclick = () => this.loadSavedGame();
  }

  showHub(message = "") {
    const p = this.player;
    const hpPct = this.percent(p.hp, p.totalMaxHp);
    const xpPct = this.percent(p.xp, p.xpNext);

    this.container.innerHTML = `
      <section class="screen">
        <div class="topbar">
          <div>
            <h2>${this.escape(p.name)}</h2>
            <div class="muted tiny">Dungeon-Etage ${this.floor}</div>
          </div>
          <button class="btn secondary" id="menu">Menü</button>
        </div>

        <div class="panel">
          ${message ? `<div class="notice">${this.escape(message)}</div>` : ""}

          <div class="stats">
            ${this.statCard("Level", p.level)}
            ${this.statCard("Gold", p.gold)}
            ${this.statCard("Angriff", p.attack)}
            ${this.statCard("Verteidigung", p.defense)}
          </div>

          <div class="stat">
            <b>HP ${p.hp} / ${p.totalMaxHp}</b>
            <span>Lebenspunkte</span>
            <div class="bar"><div class="fill hp" style="width:${hpPct}%"></div></div>
          </div>

          <div class="stat" style="margin-top:10px">
            <b>XP ${p.xp} / ${p.xpNext}</b>
            <span>Erfahrung</span>
            <div class="bar"><div class="fill xp" style="width:${xpPct}%"></div></div>
          </div>

          <div class="actions two" style="margin-top:14px">
            <button class="btn" id="dungeon">Dungeon betreten</button>
            <button class="btn gold" id="inventory">Inventar (${p.inventory.length})</button>
            <button class="btn secondary" id="equipment">Ausrüstung</button>
            <button class="btn secondary" id="save">Speichern</button>
            <button class="btn secondary" id="rest" ${p.gold < 10 || p.hp >= p.totalMaxHp ? "disabled" : ""}>Rasten (10 Gold)</button>
          </div>
        </div>
      </section>
    `;

    document.getElementById("menu").onclick = () => this.showMenu();
    document.getElementById("dungeon").onclick = () => this.startFight();
    document.getElementById("inventory").onclick = () => this.showInventory();
    document.getElementById("equipment").onclick = () => this.showEquipment();
    document.getElementById("save").onclick = () => this.save();
    document.getElementById("rest").onclick = () => this.rest();
  }

  startFight() {
    this.enemy = createEnemy(this.floor);
    this.log = [`Etage ${this.floor}: ${this.enemy.name} stellt sich dir entgegen.`];
    this.showFight();
  }

  showFight() {
    const p = this.player;
    const e = this.enemy;
    const enemyPct = this.percent(e.hp, e.maxHp);

    this.container.innerHTML = `
      <section class="screen">
        <div class="topbar">
          <div>
            <h2>Kampf</h2>
            <div class="muted tiny">Etage ${this.floor}</div>
          </div>
          <div class="tiny">Deine HP: ${p.hp}/${p.totalMaxHp}</div>
        </div>

        <div class="panel">
          <div class="enemy">
            <div class="enemy-icon">${e.icon}</div>
            <h3>${this.escape(e.name)}</h3>
            <div class="muted">Angriff ${e.attack} · Verteidigung ${e.defense}</div>
            <div class="bar"><div class="fill hp" style="width:${enemyPct}%"></div></div>
            <div class="tiny muted" style="margin-top:6px">${Math.max(0, e.hp)} / ${e.maxHp} HP</div>
          </div>

          <div class="log" id="log">${this.log.map(line => `${this.escape(line)}<br>`).join("")}</div>

          <div class="actions two">
            <button class="btn danger" id="attack">Angreifen</button>
            <button class="btn gold" id="potion" ${p.inventory.some(item => item.type === "potion") ? "" : "disabled"}>Heiltrank</button>
          </div>
        </div>
      </section>
    `;

    document.getElementById("attack").onclick = () => this.combatTurn();
    document.getElementById("potion").onclick = () => this.usePotionInFight();

    const log = document.getElementById("log");
    log.scrollTop = log.scrollHeight;
  }

  combatTurn() {
    const p = this.player;
    const e = this.enemy;

    const critical = Math.random() < 0.14;
    let hit = this.damage(p.attack, e.defense);
    if (critical) hit *= 2;

    e.hp -= hit;
    this.log.push(`${critical ? "Kritisch! " : ""}Du verursachst ${hit} Schaden.`);

    if (e.hp <= 0) {
      this.winFight();
      return;
    }

    const enemyHit = this.damage(e.attack, p.defense);
    p.hp -= enemyHit;
    this.log.push(`${e.name} verursacht ${enemyHit} Schaden.`);

    if (p.hp <= 0) {
      p.hp = Math.max(1, Math.round(p.totalMaxHp * 0.4));
      p.gold = Math.max(0, p.gold - Math.round(p.gold * 0.15));
      this.floor = 1;
      this.enemy = null;
      this.showHub("Du wurdest besiegt und am Eingang des Dungeons geborgen.");
      return;
    }

    this.showFight();
  }

  winFight() {
    const p = this.player;
    const e = this.enemy;

    p.gold += e.gold;
    const levels = p.gainExperience(e.xp);

    let message = `${e.name} besiegt: +${e.gold} Gold, +${e.xp} XP.`;

    const lootRoll = Math.random();
    if (lootRoll < 0.42) {
      const item = createEquipment(this.floor);
      p.inventory.push(item);
      message += ` Du findest: ${item.rarityLabel} – ${item.name}.`;
    } else if (lootRoll < 0.7) {
      p.inventory.push(createPotion());
      message += " Du findest einen Heiltrank.";
    }

    if (levels > 0) {
      message += ` Level ${p.level} erreicht!`;
    }

    this.floor += 1;
    this.enemy = null;
    this.showHub(message);
  }

  usePotionInFight() {
    const index = this.player.inventory.findIndex(item => item.type === "potion");
    if (index < 0) return;

    const [item] = this.player.inventory.splice(index, 1);
    const healed = Math.min(item.heal, this.player.totalMaxHp - this.player.hp);
    this.player.hp += healed;
    this.log.push(`Du trinkst einen Heiltrank und erhältst ${healed} HP.`);
    this.showFight();
  }

  showInventory() {
    const p = this.player;

    this.container.innerHTML = `
      <section class="screen">
        <div class="topbar">
          <div>
            <h2>Inventar</h2>
            <div class="muted tiny">${p.inventory.length} Gegenstände</div>
          </div>
          <button class="btn secondary" id="back">Zurück</button>
        </div>

        <div class="panel">
          <div class="inventory">
            ${p.inventory.length ? p.inventory.map((item, index) => this.renderInventoryItem(item, index)).join("") : `<p class="muted">Dein Inventar ist leer.</p>`}
          </div>
        </div>
      </section>
    `;

    document.getElementById("back").onclick = () => this.showHub();

    document.querySelectorAll("[data-use]").forEach(button => {
      button.onclick = () => this.useInventoryItem(Number(button.dataset.use));
    });

    document.querySelectorAll("[data-equip]").forEach(button => {
      button.onclick = () => this.equipInventoryItem(Number(button.dataset.equip));
    });
  }

  renderInventoryItem(item, index) {
    if (item.type === "potion") {
      return `
        <div class="item">
          <div>
            <div class="item-name">${this.escape(item.name)}</div>
            <div class="muted tiny">Heilt ${item.heal} HP</div>
          </div>
          <button class="btn gold" data-use="${index}" ${this.player.hp >= this.player.totalMaxHp ? "disabled" : ""}>Benutzen</button>
        </div>
      `;
    }

    return `
      <div class="item">
        <div>
          <div class="item-name rarity-${item.rarity}">${this.escape(item.rarityLabel)} – ${this.escape(item.name)}</div>
          <div class="muted tiny">${this.itemStats(item)}</div>
        </div>
        <button class="btn" data-equip="${index}">Ausrüsten</button>
      </div>
    `;
  }

  useInventoryItem(index) {
    const item = this.player.inventory[index];
    if (!item || item.type !== "potion") return;

    this.player.hp += Math.min(item.heal, this.player.totalMaxHp - this.player.hp);
    this.player.inventory.splice(index, 1);
    this.showInventory();
  }

  equipInventoryItem(index) {
    const item = this.player.inventory[index];
    if (!item || item.type !== "equipment") return;

    this.player.inventory.splice(index, 1);
    this.player.equip(item);
    this.showInventory();
  }

  showEquipment() {
    const p = this.player;
    const labels = {
      weapon: "Waffe",
      armor: "Rüstung",
      accessory: "Schmuck"
    };

    this.container.innerHTML = `
      <section class="screen">
        <div class="topbar">
          <div>
            <h2>Ausrüstung</h2>
            <div class="muted tiny">Aktive Werteboni</div>
          </div>
          <button class="btn secondary" id="back">Zurück</button>
        </div>

        <div class="panel">
          <div class="equipment-grid">
            ${Object.entries(labels).map(([slot, label]) => this.renderEquipmentSlot(slot, label, p.equipment[slot])).join("")}
          </div>
        </div>
      </section>
    `;

    document.getElementById("back").onclick = () => this.showHub();
  }

  renderEquipmentSlot(slot, label, item) {
    return `
      <div class="equipment-slot">
        <div>
          <div class="muted tiny">${label}</div>
          ${item ? `
            <div class="item-name rarity-${item.rarity}">${this.escape(item.name)}</div>
            <div class="muted tiny">${this.itemStats(item)}</div>
          ` : `<div class="muted">Leer</div>`}
        </div>
      </div>
    `;
  }

  itemStats(item) {
    const parts = [];
    if (item.attack) parts.push(`+${item.attack} Angriff`);
    if (item.defense) parts.push(`+${item.defense} Verteidigung`);
    if (item.hp) parts.push(`+${item.hp} HP`);
    return parts.join(" · ") || "Keine Boni";
  }

  rest() {
    if (this.player.gold < 10 || this.player.hp >= this.player.totalMaxHp) return;

    this.player.gold -= 10;
    this.player.hp = this.player.totalMaxHp;
    this.showHub("Du hast dich vollständig erholt.");
  }

  damage(attack, defense) {
    const variance = 0.85 + Math.random() * 0.3;
    return Math.max(1, Math.round((attack - defense * 0.55) * variance));
  }

  percent(value, max) {
    return Math.max(0, Math.min(100, (value / max) * 100));
  }

  statCard(label, value) {
    return `<div class="stat"><b>${this.escape(value)}</b><span>${this.escape(label)}</span></div>`;
  }

  escape(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[char]);
  }
}
