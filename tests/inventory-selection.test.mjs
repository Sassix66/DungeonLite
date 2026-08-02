import assert from "node:assert/strict";
import { installTestGlobals } from "./helpers/test-env.mjs";

installTestGlobals();

const { Game } = await import("../js/game.js");
const game = new Game({});
game.render = () => {};

const sword = {
  id: "test-sword",
  name: "Testschwert",
  slot: "weapon",
  attack: 5,
  value: 10
};
const potionA = {
  id: "potion",
  name: "Heiltrank",
  type: "potion",
  heal: 35,
  value: 12
};
const potionB = structuredClone(potionA);

game.player.inventory = [sword, potionA, potionB];
game.ensureStateShape();

assert.equal(new Set(game.player.inventory.map(item => item.uid)).size, 3);

game.selectedItemUid = sword.uid;
game.equipSelected();

assert.equal(game.player.equipment.weapon, sword);
assert.equal(game.player.inventory.includes(sword), false);
assert.equal(game.selectedItemUid, null);

game.player.hp = 40;
const consumedUid = potionB.uid;
game.selectedItemUid = consumedUid;
game.useSelectedItem();

assert.equal(game.player.hp, 75);
assert.equal(game.player.inventory.length, 1);
assert.equal(game.player.inventory.some(item => item.uid === consumedUid), false);
assert.equal(game.selectedItemUid, null);

console.log("Inventartest erfolgreich: Auswahl, Ausrüsten und Verbrauch funktionieren.");
