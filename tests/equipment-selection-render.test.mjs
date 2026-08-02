import assert from "node:assert/strict";
import { installTestGlobals } from "./helpers/test-env.mjs";

installTestGlobals();

const { Game } = await import("../js/game.js");
const game = new Game({});
game.render = () => {};
game.ensureStateShape();

// Regressionstest: Sobald ein Ausrüstungsgegenstand ausgewählt wurde, rief
// renderEquipmentComparison() die nicht existierende Methode
// equipmentSlotLabel() auf. render() (bzw. renderRightPanel()) warf dadurch
// bei jedem folgenden Aufruf einen Fehler, wodurch die Seite eingefroren
// wirkte und keine weiteren Aktionen (Angriff, Raumwechsel) mehr sichtbar
// wurden.
const sword = {
  id: "test-sword",
  name: "Testschwert",
  slot: "weapon",
  attack: 12,
  value: 20,
  rarity: "rare"
};
game.player.inventory = [sword];
game.ensureStateShape();
game.selectedItemUid = sword.uid;

let html;
assert.doesNotThrow(() => {
  html = game.renderRightPanel();
}, "Die Auswahl eines Ausrüstungsgegenstands darf render() nicht zum Absturz bringen");

assert.ok(
  html.includes("Waffe"),
  "Der Slot-Name (z. B. \"Waffe\") muss im Vergleichspanel erscheinen"
);

// Nach dem erfolgreichen Rendern muss das Spiel weiterhin normal auf
// Zustandsänderungen reagieren (Angriff/Raumwechsel dürfen nicht blockiert
// bleiben).
game.state.dungeon = {
  rooms: [
    { id: 0, type: "start", visited: true, revealed: true, completed: true, neighbors: { right: 1 }, tiles: [] },
    { id: 1, type: "normal", visited: false, revealed: true, completed: true, neighbors: { left: 0 }, tiles: [] }
  ],
  exitUnlocked: true
};
game.state.currentRoomId = 0;
game.moveToRoom(1);
assert.equal(game.state.currentRoomId, 1, "Raumwechsel muss nach Item-Auswahl weiterhin funktionieren");

console.log(
  "Regressionstest erfolgreich: Auswahl eines Ausrüstungsgegenstands friert das Spiel nicht mehr ein."
);
