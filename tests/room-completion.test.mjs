import assert from "node:assert/strict";
import { installTestGlobals } from "./helpers/test-env.mjs";

installTestGlobals();

const { Game } = await import("../js/game.js");
const game = new Game({});
game.render = () => {};

// Kontrollierter Zwei-Raum-Dungeon statt zufälliger Erzeugung, damit der
// Test unabhängig von den Zufallswerten der Dungeon-Generierung ist.
game.state.currentRoomId = 0;
game.state.dungeon = {
  rooms: [
    {
      id: 0,
      type: "start",
      visited: true,
      revealed: true,
      completed: false,
      neighbors: { right: 1 },
      tiles: []
    },
    {
      id: 1,
      type: "normal",
      visited: false,
      revealed: true,
      completed: false,
      neighbors: { left: 0 },
      tiles: [
        { id: "r1-enemy", type: "enemy", completed: false }
      ]
    }
  ],
  exitUnlocked: false
};

// Ein Raum ohne Gegner gilt sofort als abgeschlossen.
game.checkRoomCompletion(0);
assert.equal(game.state.dungeon.rooms[0].completed, true);
assert.equal(game.state.dungeon.exitUnlocked, false);

// Solange Raum 1 einen lebenden Gegner enthält, bleibt er offen und der
// Abstieg gesperrt.
game.checkRoomCompletion(1);
assert.equal(game.state.dungeon.rooms[1].completed, false);
assert.equal(game.state.dungeon.exitUnlocked, false);

// Nach Besiegen des letzten Gegners schließt sich der Raum, und da damit
// alle Räume der Etage abgeschlossen sind, wird der Abstieg freigeschaltet.
game.state.dungeon.rooms[1].tiles[0].completed = true;
game.checkRoomCompletion(1);
assert.equal(game.state.dungeon.rooms[1].completed, true);
assert.equal(game.state.dungeon.exitUnlocked, true);
assert.equal(
  game.state.message,
  "Etage gesichert. Der Abstieg ist freigeschaltet."
);

console.log(
  "Raumabschluss-Test erfolgreich: Räume schließen korrekt ab, Abstieg wird erst nach vollständiger Etage freigeschaltet."
);
