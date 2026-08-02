import { ITEMS, ENEMIES, BOSSES } from "./data.js";
import { AudioManager } from "./audio.js";

const SAVE_KEY = "dungeonlite.v08";
const ENEMY_REGEN_DELAY = 1800;
const ENEMY_REGEN_PER_SECOND = 4;
const PLAYER_REGEN_DELAY = 5000;

export class Game {
  constructor(root) {
    this.root = root;
    this.selectedItem = 0;
    this.activeTab = "equipment";
    this.audio = new AudioManager();
    this.tileEffect = null;
    this.stageTransition = null;
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
      message: "Schließe alle Kacheln ab, um die nächste Etappe zu erreichen.",
      lastCombatAt: 0,
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
    const stage = this.state?.stage || 1;

    // Je weiter die Etappe, desto wahrscheinlicher sind größere Dungeons.
    const baseCount = 3;
    const guaranteedGrowth = Math.floor((stage - 1) / 3);
    const bonusChance = Math.min(0.85, 0.18 + stage * 0.06);
    let visibleCount = baseCount + guaranteedGrowth;

    for (let i = 0; i < 5; i += 1) {
      if (Math.random() < bonusChance) visibleCount += 1;
    }

    visibleCount = Math.max(3, Math.min(12, visibleCount));

    const pool = [
      "explore", "explore", "explore", "explore",
      "enemy", "enemy", "enemy",
      "object", "object",
      "shrine",
      "shop"
    ];

    // Ab späteren Etappen können Bossfelder direkt vorkommen.
    if (stage >= 3) pool.push("boss");

    const chosenTypes = Array.from({ length: visibleCount }, () => {
      return pool[Math.floor(Math.random() * pool.length)];
    });

    if (!chosenTypes.some(type => type === "enemy" || type === "boss")) {
      chosenTypes[0] = "enemy";
    }

    const slots = [...Array(25).keys()]
      .sort(() => Math.random() - 0.5)
      .slice(0, visibleCount);

    const rooms = Array.from({ length: 25 }, (_, id) => ({
      id,
      type: "empty",
      visible: false,
      discovered: true,
      progress: 100,
      destroyed: false,
      used: false,
      completed: false,
      lastHitAt: 0
    }));

    slots.forEach((slotId, index) => {
      const type = chosenTypes[index];
      const room = rooms[slotId];

      room.type = type;
      room.visible = true;
      room.discovered = type !== "explore";
      room.progress = type === "explore" ? 0 : 100;

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
          hp: 18 + stage * 2,
          maxHp: 18 + stage * 2
        };
      }
    });

    return { rooms };
  }

  makeEnemy(boss) {
    const stage = this.state?.stage || 1;
    const pool = boss ? BOSSES : ENEMIES;
    const baseIndex = Math.min(pool.length - 1, Math.floor((stage - 1) / 2));
    const base = structuredClone(pool[baseIndex]);
    const scale = 1 + (stage - 1) * (boss ? 0.22 : 0.16);

    base.hp = Math.round(base.hp * scale);
    base.attack = Math.round(base.attack * scale);
    base.defense = Math.round(base.defense * (1 + (stage - 1) * 0.1));
    base.reward = Math.round(base.reward * (1 + (stage - 1) * 0.18));
    base.xp = Math.round(base.xp * (1 + (stage - 1) * 0.2));
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

    this.player.ap = Math.min(
      this.player.maxAp,
      this.player.ap + this.player.recovery * dt
    );

    const outOfCombatFor = now - (this.state.lastCombatAt || 0);
    if (
      this.state.lastCombatAt > 0 &&
      outOfCombatFor > PLAYER_REGEN_DELAY &&
      this.player.hp < this.player.maxHp
    ) {
      this.player.hp = Math.min(
        this.player.maxHp,
        this.player.hp + this.player.recovery * dt
      );
    }

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
      ${this.renderTileEffect()}
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
          <div class="stage-title">ETAPPE ${this.state.stage} · RUINEN</div>
        </div>

        <div class="top-actions box">
          <button type="button" class="icon-btn" id="soundBtn" title="Sound">${this.audio.enabled ? "🔊" : "🔇"}</button>
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
          <div class="talent-points">Talentpunkte: <strong>${this.player.talentPoints}</strong></div>
        </div>

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
    if (!room.visible) {
      return `<div class="tile-spacer" aria-hidden="true"></div>`;
    }

    if (room.completed) {
      return `
        <button type="button" class="tile completed" disabled>
          <div class="tile-content">
            <span class="tile-title">ERLEDIGT</span>
            <span class="tile-sub">${this.escape(this.completedLabel(room))}</span>
            <span class="tile-icon">✓</span>
          </div>
        </button>
      `;
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
      treasure: ["SCHATZTRUHE", "Öffnen", "🧰"],
      trap: ["FALLE", "Gefährlich", "⚠️"],
      shop: ["LADEN", "Bald verfügbar", "🏪"]
    }[room.type] || ["LEER", "", ""];

    return `
      <button type="button" class="tile ${room.type}" data-room="${room.id}" ${room.completed ? "disabled" : ""}>
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

    document.getElementById("soundBtn")?.addEventListener("click", event => {
      event.preventDefault();
      this.audio.toggle();
      this.render();
    });

    document.getElementById("saveBtn")?.addEventListener("click", event => {
      event.preventDefault();
      this.save();
    });

    document.getElementById("resetBtn")?.addEventListener("click", event => {
      event.preventDefault();
      this.reset();
    });

    document.querySelectorAll("[data-stat]").forEach(button => {
      button.addEventListener("click", event => {
        event.preventDefault();
        this.spendTalentPoint(button.dataset.stat);
      });
    });
  }

  actOnRoom(id) {
    const room = this.state.dungeon.rooms[id];
    if (!room || !room.visible || room.completed) return;

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
      this.audio.play("shrine");
      const heal = Math.min(25, this.player.maxHp - this.player.hp);
      this.player.hp += heal;
      this.finishRoom(room, `Heiligtum: +${heal} HP.`);
      return;
    }

    if (room.type === "treasure") {
      if (!this.spendAp(3)) return;

      this.audio.play("treasure");
      const roll = Math.random();
      if (roll < 0.5) {
        const gold = 10 + Math.floor(Math.random() * (18 + this.state.stage * 3));
        this.state.gold += gold;
        this.audio.play("gold");
        this.finishRoom(room, `Schatztruhe geöffnet: ${gold} Gold.`);
      } else {
        this.player.inventory.push(structuredClone(ITEMS[4]));
        this.audio.play("potion");
        this.finishRoom(room, "Schatztruhe geöffnet: Heiltrank gefunden.");
      }
      return;
    }

    if (room.type === "trap") {
      if (!this.spendAp(2)) return;

      this.audio.play("trap");
      const damage = 8 + this.state.stage * 2;
      this.player.hp = Math.max(1, this.player.hp - damage);
      this.finishRoom(room, `Falle ausgelöst: ${damage} Schaden.`);
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

    this.audio.play("explore");
    room.progress = Math.min(100, room.progress + 20 + Math.random() * 8);
    this.state.message = `Erkundung: ${Math.floor(room.progress)}%.`;

    if (room.progress >= 100) {
      room.discovered = true;
      const outcomes = [
        "enemy", "enemy",
        "object",
        "treasure",
        "trap",
        "shrine",
        "empty"
      ];
      room.type = outcomes[Math.floor(Math.random() * outcomes.length)];

      if (room.type === "enemy") {
        room.enemy = this.makeEnemy(false);
      }

      if (room.type === "object") {
        const isVase = Math.random() < 0.5;
        room.object = {
          name: isVase ? "Vase" : "Kiste",
          icon: isVase ? "🏺" : "📦",
          hp: 18 + this.state.stage * 2,
          maxHp: 18 + this.state.stage * 2
        };
      }

      this.audio.play("reveal");
      this.state.message = `Das Feld wurde aufgedeckt: ${this.completedLabel(room)}.`;
    }

    this.render();
  }

  attackEnemy(room) {
    if (room.enemy.hp <= 0) return;

    const enemy = room.enemy;
    this.audio.play("attack");
    this.state.lastCombatAt = performance.now();
    const damage = this.damage(this.attack, enemy.defense);
    enemy.hp = Math.max(0, enemy.hp - damage);
    room.lastHitAt = performance.now();

    const retaliation = enemy.hp > 0 ? this.damage(enemy.attack, this.defense) : 0;
    if (retaliation > 0) {
      this.audio.play("playerHit");
      this.player.hp = Math.max(1, this.player.hp - retaliation);
    }

    this.state.message = `${enemy.name}: -${damage} HP${retaliation ? ` · Du: -${retaliation} HP` : ""}.`;

    if (enemy.hp <= 0) {
      this.audio.play(room.type === "boss" ? "bossDefeat" : "enemyDefeat");
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
    this.audio.play(room.object.name === "Vase" ? "vase" : "crate");
    room.object.hp = Math.max(0, room.object.hp - damage);
    this.state.message = `${room.object.name}: -${damage} Haltbarkeit.`;

    if (room.object.hp <= 0) {
      room.destroyed = true;
      const roll = Math.random();

      if (roll < .45) {
        this.player.inventory.push(structuredClone(ITEMS[4]));
        this.audio.play("potion");
        this.finishRoom(room, `${room.object.name} zerstört: Heiltrank gefunden.`);
      } else {
        const gold = 8 + Math.floor(Math.random() * 18);
        this.state.gold += gold;
        this.audio.play("gold");
        this.finishRoom(room, `${room.object.name} zerstört: ${gold} Gold gefunden.`);
      }
      return;
    }

    this.render();
  }

  finishRoom(room, message) {
    if (room.completed) return;

    room.completed = true;
    room.used = true;
    this.state.message = message;
    this.playTileEffect(room);

    window.setTimeout(() => {
      this.checkDungeonCompletion();
    }, 720);

    this.render();
  }

  checkDungeonCompletion() {
    const activeRooms = this.state.dungeon.rooms.filter(room => room.visible);
    const allCompleted = activeRooms.length > 0 && activeRooms.every(room => room.completed);

    if (!allCompleted) {
      this.render();
      return;
    }

    const nextStage = this.state.stage + 1;
    this.audio.play("stageComplete");
    this.stageTransition = {
      from: this.state.stage,
      to: nextStage
    };
    this.render();

    window.setTimeout(() => {
      this.state.stage = nextStage;
      this.audio.play("stageStart");
      this.state.dungeon = this.createDungeon();
      this.state.message = `Etappe ${this.state.stage} beginnt.`;
      this.stageTransition = null;
      this.tileEffect = null;
      this.render();
    }, 1450);
  }

  spendAp(cost) {
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
      if (!room.enemy || !room.visible || room.completed) continue;

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
    this.audio.play("equip");
    this.state.message = `${item.name} ausgerüstet.`;
    this.render();
  }

  sellSelected() {
    const item = this.player.inventory[this.selectedItem];
    if (!item) return;

    this.state.gold += item.value || 5;
    this.audio.play("sell");
    this.player.inventory.splice(this.selectedItem, 1);
    this.selectedItem = 0;
    this.state.message = `${item.name} verkauft.`;
    this.render();
  }

  gainXp(amount) {
    this.player.xp += amount;

    while (this.player.xp >= this.player.xpNext) {
      this.player.xp -= this.player.xpNext;
      this.player.level += 1;
      this.player.talentPoints += 1;
      this.audio.play("levelUp");
      this.player.xpNext = Math.round(this.player.xpNext * 1.35);
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + 10);
    }
  }

  resource(icon, value) {
    return `<div class="resource"><span>${icon}</span><span>${value}</span></div>`;
  }

  statCard(icon, name, value, max, fillClass, id = "", statKey = "") {
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
          <button type="button" class="stat-plus" data-stat="${statKey}" ${!statKey || this.player.talentPoints <= 0 ? "disabled" : ""}>+</button>
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

  playTileEffect(room) {
    const effectMap = {
      enemy: "blood",
      boss: "blood-heavy",
      object: room.object?.name === "Vase" ? "shards" : "splinters",
      treasure: "gold",
      trap: "smoke",
      shrine: "light",
      explore: "spark",
      empty: "dust",
      shop: "spark"
    };

    this.tileEffect = {
      roomId: room.id,
      type: effectMap[room.type] || "spark",
      icon: room.object?.icon || ""
    };

    window.setTimeout(() => {
      this.tileEffect = null;
      this.render();
    }, 700);
  }

  renderTileEffect() {
    if (!this.tileEffect) return "";

    const particles = Array.from({ length: 14 }, (_, index) => {
      const angle = (360 / 14) * index;
      const distance = 34 + (index % 4) * 9;
      return `<span style="--angle:${angle}deg;--distance:${distance}px"></span>`;
    }).join("");

    return `
      <div class="tile-effect-layer" aria-hidden="true">
        <div class="tile-effect ${this.tileEffect.type}">
          ${particles}
        </div>
      </div>
    `;
  }

  renderStageTransition() {
    if (!this.stageTransition) return "";

    return `
      <div class="stage-transition" aria-live="polite">
        <div class="stage-transition-card">
          <div class="stage-complete">ETAPPE ${this.stageTransition.from} ABGESCHLOSSEN</div>
          <div class="stage-arrow">↓</div>
          <div class="stage-next">ETAPPE ${this.stageTransition.to}</div>
          <div class="stage-loading">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    `;
  }

  spendTalentPoint(stat) {
    if (this.player.talentPoints <= 0) return;

    switch (stat) {
      case "hp":
        this.player.maxHp += 10;
        this.player.hp += 10;
        break;
      case "ap":
        this.player.maxAp += 5;
        this.player.ap += 5;
        break;
      case "attack":
        this.player.baseAttack += 1;
        break;
      case "defense":
        this.player.baseDefense += 1;
        break;
      case "recovery":
        this.player.recovery += 1;
        break;
      default:
        return;
    }

    this.player.talentPoints -= 1;
    this.audio.play("talent");
    this.state.message = "Talentpunkt verteilt.";
    this.render();
  }

  completedLabel(room) {
    const labels = {
      explore: "Erkundung",
      enemy: "Gegner",
      boss: "Boss",
      object: "Objekt",
      shrine: "Heiligtum",
      treasure: "Schatztruhe",
      trap: "Falle",
      shop: "Laden",
      empty: "Leeres Feld"
    };

    return labels[room.type] || "Feld";
  }

  damage(attack, defense) {
    return Math.max(1, Math.round((attack - defense * .55) * (.85 + Math.random() * .3)));
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
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem("dungeonlite.v07");
    localStorage.removeItem("dungeonlite.v06");
    localStorage.removeItem("dungeonlite.v054");
    localStorage.removeItem("dungeonlite.v053");
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
