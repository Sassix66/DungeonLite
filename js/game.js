import { Player } from "./player.js";
import { potion, equipment } from "./items.js";
import { createDungeon, unlockNext, isDungeonComplete } from "./dungeon.js";
import { enemyFor } from "./enemies.js";
import { save, load, exists } from "./save.js";

export class Game {
  constructor(root) {
    this.root = root;
    this.player = null;
    this.dungeon = null;
    this.enemy = null;
    this.activeRoom = null;
    this.log = [];
    this.message = "";
  }

  start() {
    this.menu();
  }

  newGame() {
    this.player = new Player({ inventory: [potion()] });
    this.dungeon = createDungeon(1);
    this.message = "Betritt die verfügbaren Felder und räume den Dungeon.";
    this.map();
  }

  loadGame() {
    const data = load();
    if (!data) return this.menu("Kein gültiger Spielstand gefunden.");

    this.player = new Player(data.player);
    this.dungeon = data.dungeon || createDungeon(1);
    this.message = "Spielstand geladen.";
    this.map();
  }

  menu(message = "") {
    this.root.innerHTML = `
      <section class="screen">
        <div class="brand">
          <h1>DungeonLite</h1>
          <p>Felder öffnen · Gefahren bezwingen · Schätze bergen</p>
        </div>
        <div class="panel">
          ${message ? `<div class="notice">${this.esc(message)}</div>` : ""}
          <div class="menu">
            <button class="btn" id="new">Neues Abenteuer</button>
            <button class="btn secondary" id="load" ${exists() ? "" : "disabled"}>Fortsetzen</button>
          </div>
        </div>
        <footer>Version 0.3 · Kachel-Dungeon</footer>
      </section>`;

    this.$("new").onclick = () => this.newGame();
    this.$("load").onclick = () => this.loadGame();
  }

  map() {
    const p = this.player;
    const hp = this.pct(p.hp, p.totalMaxHp);
    const xp = this.pct(p.xp, p.xpNext);

    this.root.innerHTML = `
      <section class="screen">
        <div class="topbar">
          <div>
            <h2>${this.esc(p.name)}</h2>
            <div class="muted tiny">Ruinenpfad · Abschnitt ${this.dungeon.stage}</div>
          </div>
          <button class="btn secondary" id="menu">Menü</button>
        </div>

        <div class="panel">
          ${this.message ? `<div class="notice">${this.esc(this.message)}</div>` : ""}

          <div class="stats">
            ${this.stat("Level", p.level)}
            ${this.stat("Gold", p.gold)}
            ${this.stat("Angriff", p.attack)}
            ${this.stat("Abwehr", p.defense)}
          </div>

          <div class="bars">
            <div class="bar-box">
              <b>HP ${p.hp}/${p.totalMaxHp}</b>
              <div class="bar"><div class="fill hp" style="width:${hp}%"></div></div>
            </div>
            <div class="bar-box">
              <b>XP ${p.xp}/${p.xpNext}</b>
              <div class="bar"><div class="fill xp" style="width:${xp}%"></div></div>
            </div>
          </div>

          <div class="dungeon-title">
            <div>
              <h3>Dungeonfelder</h3>
              <div class="muted tiny">Nur goldene Felder können geöffnet werden.</div>
            </div>
            <div class="tiny muted">${this.dungeon.clearedCount}/${this.dungeon.rooms.length}</div>
          </div>

          <div class="room-board">
            ${this.dungeon.rooms.map((room, index) => this.tile(room, index)).join("")}
          </div>

          <div class="actions two" style="margin-top:12px">
            <button class="btn secondary" id="inventory">Inventar (${p.inventory.length})</button>
            <button class="btn secondary" id="save">Speichern</button>
          </div>
        </div>
      </section>`;

    this.$("menu").onclick = () => this.menu();
    this.$("inventory").onclick = () => this.inventory();
    this.$("save").onclick = () => {
      save({ player: p, dungeon: this.dungeon });
      this.message = "Spiel gespeichert.";
      this.map();
    };

    document.querySelectorAll("[data-room]").forEach(button => {
      button.onclick = () => this.openRoom(Number(button.dataset.room));
    });
  }

  tile(room, index) {
    const disabled = room.status !== "available";
    const classes = ["tile", room.status];
    const value = room.type === "rubble"
      ? `${room.cost} Ausdauer`
      : room.status === "locked"
        ? "Unentdeckt"
        : room.status === "cleared"
          ? "Erledigt"
          : "Öffnen";

    return `
      <button class="${classes.join(" ")}" data-room="${room.id}" ${disabled ? "disabled" : ""}>
        <span class="tile-icon">${room.status === "locked" ? "?" : room.icon}</span>
        <span class="tile-label">${room.status === "locked" ? "Verdeckt" : room.label}</span>
        <span class="tile-value">${value}</span>
      </button>`;
  }

  openRoom(id) {
    const room = this.dungeon.rooms[id];
    if (!room || room.status !== "available") return;

    this.activeRoom = room;

    switch (room.type) {
      case "enemy":
        this.beginFight(false);
        break;
      case "boss":
        this.beginFight(true);
        break;
      case "treasure":
        this.treasure();
        break;
      case "shrine":
        this.shrine();
        break;
      case "rubble":
        this.rubble();
        break;
      case "exit":
        this.exit();
        break;
      default:
        this.clearRoom("Der Weg ist frei.");
    }
  }

  beginFight(boss) {
    this.enemy = enemyFor(this.dungeon.stage, boss);
    this.log = [`${this.enemy.name} bewacht dieses Feld.`];
    this.combat();
  }

  combat() {
    const p = this.player;
    const e = this.enemy;

    this.root.innerHTML = `
      <section class="screen">
        <div class="topbar">
          <div>
            <h2>${e.boss ? "Wächterkampf" : "Begegnung"}</h2>
            <div class="muted tiny">Feld ${this.activeRoom.id + 1}</div>
          </div>
          <div class="tiny">HP ${p.hp}/${p.totalMaxHp}</div>
        </div>

        <div class="panel">
          <div class="combatants">
            <div class="combatant">
              <div class="combat-icon">🧭</div>
              <b>${this.esc(p.name)}</b>
              <div class="tiny muted">ANG ${p.attack} · ABW ${p.defense}</div>
            </div>
            <div class="vs">VS</div>
            <div class="combatant">
              <div class="combat-icon">${e.icon}</div>
              <b>${this.esc(e.name)}</b>
              <div class="tiny muted">${Math.max(0,e.hp)}/${e.maxHp} HP</div>
            </div>
          </div>

          <div class="log" id="log">${this.log.map(line => `${this.esc(line)}<br>`).join("")}</div>

          <div class="actions two">
            <button class="btn danger" id="attack">Angreifen</button>
            <button class="btn" id="potion" ${p.inventory.some(i => i.type === "potion") ? "" : "disabled"}>Heiltrank</button>
          </div>
        </div>
      </section>`;

    this.$("attack").onclick = () => this.turn();
    this.$("potion").onclick = () => this.usePotion(true);
    this.$("log").scrollTop = this.$("log").scrollHeight;
  }

  turn() {
    const p = this.player;
    const e = this.enemy;
    const critical = Math.random() < .15;
    let dealt = this.damage(p.attack, e.defense);
    if (critical) dealt *= 2;

    e.hp -= dealt;
    this.log.push(`${critical ? "Kritischer Treffer! " : ""}${dealt} Schaden.`);

    if (e.hp <= 0) return this.victory();

    const received = this.damage(e.attack, p.defense);
    p.hp -= received;
    this.log.push(`${e.name} trifft dich für ${received}.`);

    if (p.hp <= 0) {
      p.hp = Math.max(1, Math.round(p.totalMaxHp * .45));
      p.gold = Math.max(0, p.gold - Math.round(p.gold * .12));
      this.dungeon = createDungeon(Math.max(1, this.dungeon.stage));
      this.message = "Du wurdest zurück zum Eingang getragen.";
      return this.map();
    }

    this.combat();
  }

  victory() {
    const p = this.player;
    const e = this.enemy;
    p.gold += e.gold;
    const levels = p.gainXp(e.xp);
    let msg = `${e.name} besiegt: +${e.gold} Gold, +${e.xp} XP.`;

    if (Math.random() < (e.boss ? .9 : .38)) {
      const item = equipment(this.dungeon.stage);
      p.inventory.push(item);
      msg += ` Beute: ${item.rarityLabel} – ${item.name}.`;
    } else if (Math.random() < .45) {
      p.inventory.push(potion());
      msg += " Du findest einen Heiltrank.";
    }

    if (levels) msg += ` Level ${p.level} erreicht.`;
    this.clearRoom(msg);
  }

  treasure() {
    const gold = 12 + Math.floor(Math.random() * 18) + this.dungeon.stage * 4;
    this.player.gold += gold;

    if (Math.random() < .55) {
      const item = equipment(this.dungeon.stage);
      this.player.inventory.push(item);
      this.clearRoom(`Die Truhe enthält ${gold} Gold und ${item.rarityLabel}: ${item.name}.`);
    } else {
      this.player.inventory.push(potion());
      this.clearRoom(`Die Truhe enthält ${gold} Gold und einen Heiltrank.`);
    }
  }

  shrine() {
    const heal = Math.min(28 + this.dungeon.stage * 3, this.player.totalMaxHp - this.player.hp);
    this.player.hp += heal;
    this.clearRoom(`Der Schrein stellt ${heal} HP wieder her.`);
  }

  rubble() {
    const damage = 3 + this.activeRoom.cost * 2;
    this.player.hp = Math.max(1, this.player.hp - damage);
    this.clearRoom(`Du räumst die Blockade und verlierst ${damage} HP.`);
  }

  exit() {
    if (!this.dungeon.rooms.some(room => room.type === "boss" && room.status === "cleared")) {
      this.message = "Der Ausgang bleibt versiegelt, solange der Wächter lebt.";
      return this.map();
    }

    const next = this.dungeon.stage + 1;
    this.dungeon = createDungeon(next);
    this.player.hp = Math.min(this.player.totalMaxHp, this.player.hp + 20);
    this.message = `Abschnitt ${next} erreicht. Neue Felder warten auf dich.`;
    this.map();
  }

  clearRoom(message) {
    this.activeRoom.status = "cleared";
    this.dungeon.clearedCount += 1;
    unlockNext(this.dungeon, this.activeRoom.id);
    this.enemy = null;
    this.message = message;
    this.map();
  }

  inventory() {
    const p = this.player;
    this.root.innerHTML = `
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
            ${p.inventory.length
              ? p.inventory.map((item, index) => this.item(item, index)).join("")
              : `<p class="muted">Das Inventar ist leer.</p>`}
          </div>
        </div>
      </section>`;

    this.$("back").onclick = () => this.map();

    document.querySelectorAll("[data-use]").forEach(btn => {
      btn.onclick = () => this.usePotion(false, Number(btn.dataset.use));
    });

    document.querySelectorAll("[data-equip]").forEach(btn => {
      btn.onclick = () => {
        const index = Number(btn.dataset.equip);
        const item = p.inventory[index];
        p.inventory.splice(index, 1);
        p.equip(item);
        this.inventory();
      };
    });
  }

  item(item, index) {
    if (item.type === "potion") {
      return `
        <div class="item">
          <div><b>${this.esc(item.name)}</b><div class="tiny muted">Heilt ${item.heal} HP</div></div>
          <button class="btn" data-use="${index}" ${this.player.hp >= this.player.totalMaxHp ? "disabled" : ""}>Benutzen</button>
        </div>`;
    }

    const stats = [
      item.attack ? `+${item.attack} ANG` : "",
      item.defense ? `+${item.defense} ABW` : "",
      item.hp ? `+${item.hp} HP` : ""
    ].filter(Boolean).join(" · ");

    return `
      <div class="item">
        <div>
          <b class="rarity-${item.rarity}">${this.esc(item.rarityLabel)} – ${this.esc(item.name)}</b>
          <div class="tiny muted">${stats}</div>
        </div>
        <button class="btn" data-equip="${index}">Ausrüsten</button>
      </div>`;
  }

  usePotion(inFight, explicitIndex = null) {
    const index = explicitIndex ?? this.player.inventory.findIndex(i => i.type === "potion");
    const item = this.player.inventory[index];
    if (!item) return;

    const healed = Math.min(item.heal, this.player.totalMaxHp - this.player.hp);
    this.player.hp += healed;
    this.player.inventory.splice(index, 1);

    if (inFight) {
      this.log.push(`Heiltrank: +${healed} HP.`);
      this.combat();
    } else {
      this.inventory();
    }
  }

  damage(attack, defense) {
    return Math.max(1, Math.round((attack - defense * .55) * (.86 + Math.random() * .28)));
  }

  stat(label, value) {
    return `<div class="stat"><b>${this.esc(value)}</b><span>${this.esc(label)}</span></div>`;
  }

  pct(value, max) {
    return Math.max(0, Math.min(100, value / max * 100));
  }

  $(id) {
    return document.getElementById(id);
  }

  esc(value) {
    return String(value).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[c]);
  }
}
