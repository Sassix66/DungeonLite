import { GAME_VERSION } from "../config/version.js";

export class DebugPanel {
  constructor(game) {
    this.game = game;
    this.visible = false;
  }

  toggle() {
    this.visible = !this.visible;
    this.render();
  }

  render() {
    let panel = document.getElementById("debugPanel");

    if (!this.visible) {
      panel?.remove();
      return;
    }

    if (!panel) {
      panel = document.createElement("section");
      panel.id = "debugPanel";
      panel.className = "debug-panel";
      document.body.appendChild(panel);
    }

    const context = this.game.context;

    const renderStats =
      this.game.renderEngine?.stats() || {
        mode: "canvas",
        fps: 0,
        frameTime: 0,
        drawCalls: 0,
        width: 0,
        height: 0,
        particles: 0,
        damageNumbers: 0,
        animations: 0
      };

    panel.innerHTML = `
      <header>
        <strong>DEBUG ${GAME_VERSION}</strong>
        <button id="debugClose">×</button>
      </header>

      <div class="debug-row">
        <span>Seed</span>
        <code>${context.seed.seed}</code>
      </div>

      <div class="debug-row">
        <span>Etage</span>
        <strong>${this.game.state.floor}</strong>
      </div>

      <div class="debug-row">
        <span>Raumvorlagen</span>
        <strong>${context.registries.rooms.values().length}</strong>
      </div>

      <div class="debug-row">
        <span>Items</span>
        <strong>${context.registries.items.values().length}</strong>
      </div>

      <div class="debug-row">
        <span>Gegner</span>
        <strong>${context.registries.enemies.values().length}</strong>
      </div>

      <div class="debug-row">
        <span>Renderer</span>
        <strong>${renderStats.mode.toUpperCase()}</strong>
      </div>

      <div class="debug-row">
        <span>FPS</span>
        <strong>${renderStats.fps}</strong>
      </div>

      <div class="debug-row">
        <span>Framezeit</span>
        <strong>${renderStats.frameTime.toFixed(1)} ms</strong>
      </div>

      <div class="debug-row">
        <span>Draw Calls</span>
        <strong>${renderStats.drawCalls}</strong>
      </div>

      <div class="debug-row">
        <span>Canvas</span>
        <strong>${Math.round(renderStats.width)}×${Math.round(renderStats.height)}</strong>
      </div>

      <div class="debug-row">
        <span>Partikel</span>
        <strong>${renderStats.particles || 0}</strong>
      </div>

      <div class="debug-row">
        <span>Schadenszahlen</span>
        <strong>${renderStats.damageNumbers || 0}</strong>
      </div>

      <div class="debug-row">
        <span>Animationen</span>
        <strong>${renderStats.animations || 0}</strong>
      </div>

      <div class="debug-row">
        <span>Vorlage</span>
        <code>${this.game.currentRoom?.templateId || "unknown"}</code>
      </div>

      <div class="debug-actions">
        <button id="debugGold">+1000 Gold</button>
        <button id="debugXp">+100 XP</button>
        <button id="debugNextFloor">Nächste Etage</button>
        <button id="debugReroll">Raum neu würfeln</button>

      </div>
    `;

    const bindClick = (selector, handler) => {
      const element = panel.querySelector(selector);

      if (element) {
        element.onclick = handler;
      }
    };

    bindClick("#debugClose", () => this.toggle());

    bindClick("#debugGold", () => {
      this.game.state.gold += 1000;
      this.game.render();
      this.render();
    });

    bindClick("#debugXp", () => {
      this.game.gainXp(100);
      this.render();
    });

    bindClick("#debugNextFloor", () => {
      this.game.state.dungeon.exitUnlocked = true;
      this.game.descendFloor();
      this.render();
    });

    bindClick("#debugReroll", () => {
      const room = this.game.currentRoom;
      room.tiles = this.game.createRoomTiles(room.type);
      room.decorations = room.tiles.decorations || [];
      room.templateId = room.tiles.templateId || "unknown";
      this.game.render();
      this.render();
    });
  }
}
