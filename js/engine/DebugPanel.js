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

    panel.innerHTML = `
      <header>
        <strong>DEBUG 3.0.1</strong>
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

      <div class="debug-actions">
        <button id="debugGold">+1000 Gold</button>
        <button id="debugXp">+100 XP</button>
        <button id="debugNextFloor">Nächste Etage</button>
        <button id="debugReroll">Raum neu würfeln</button>
      </div>
    `;

    panel.querySelector("#debugClose").onclick =
      () => this.toggle();

    panel.querySelector("#debugGold").onclick = () => {
      this.game.state.gold += 1000;
      this.game.render();
      this.render();
    };

    panel.querySelector("#debugXp").onclick = () => {
      this.game.gainXp(100);
      this.render();
    };

    panel.querySelector("#debugNextFloor").onclick = () => {
      this.game.state.dungeon.exitUnlocked = true;
      this.game.descendFloor();
      this.render();
    };

    panel.querySelector("#debugReroll").onclick = () => {
      const room = this.game.currentRoom;
      room.tiles = this.game.createRoomTiles(room.type);
      room.decorations = room.tiles.decorations || [];
      room.templateId = room.tiles.templateId || "unknown";
      this.game.render();
      this.render();
    };
  }
}
