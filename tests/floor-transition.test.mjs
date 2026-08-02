import assert from "node:assert/strict";
import { installTestGlobals } from "./helpers/test-env.mjs";

const { flushTimers } = installTestGlobals();

const { Game } = await import("../js/game.js");
const game = new Game({});
game.render = () => {};

function twoRoomDungeon() {
  return {
    rooms: [
      {
        id: 0,
        type: "start",
        visited: true,
        revealed: true,
        completed: true,
        neighbors: { right: 1 },
        tiles: []
      },
      {
        id: 1,
        type: "normal",
        visited: false,
        revealed: true,
        completed: true,
        neighbors: { left: 0 },
        tiles: []
      }
    ],
    exitUnlocked: true
  };
}

// --- Raumwechsel: nur zu direkt benachbarten Räumen ---
game.state.currentRoomId = 0;
game.state.dungeon = twoRoomDungeon();

// Raum 1 ist nicht direkt benachbart (kein Nachbar in room 0), Wechsel muss
// ohne Wirkung bleiben.
game.state.dungeon.rooms[0].neighbors = {};
game.moveToRoom(1);
assert.equal(game.state.currentRoomId, 0, "Wechsel zu nicht benachbartem Raum darf nicht stattfinden");
assert.equal(game.activeRoomTransition, null);

// --- Raumwechsel: Mehrfachklick-Schutz ---
game.state.dungeon = twoRoomDungeon();
game.state.currentRoomId = 0;

game.moveToRoom(1);
assert.equal(game.state.currentRoomId, 1, "Wechsel zu direkt benachbartem Raum muss funktionieren");
assert.notEqual(game.activeRoomTransition, null, "Während des Übergangs muss activeRoomTransition gesetzt sein");

// Ein weiterer Klick während des laufenden Übergangs darf keinen erneuten
// Wechsel auslösen.
const transitionBeforeSecondClick = game.activeRoomTransition;
game.moveToRoom(0);
assert.equal(game.state.currentRoomId, 1, "Klicks während des Übergangs müssen ignoriert werden");
assert.equal(game.activeRoomTransition, transitionBeforeSecondClick);

flushTimers();
assert.equal(game.activeRoomTransition, null, "Nach Ablauf des Übergangs muss activeRoomTransition zurückgesetzt sein");

// --- Etagenabstieg: nur wenn freigeschaltet ---
game.state.dungeon = twoRoomDungeon();
game.state.dungeon.exitUnlocked = false;
game.state.floor = 1;
game.descendFloor();
assert.equal(game.state.floor, 1, "Abstieg ohne Freischaltung darf nicht funktionieren");
assert.equal(game.stageTransition, null);

// --- Etagenabstieg: Mehrfachklick-Schutz + tatsächlicher Wechsel ---
game.state.dungeon = twoRoomDungeon();
game.state.dungeon.exitUnlocked = true;
game.state.floor = 1;
const dungeonBeforeDescend = game.state.dungeon;

game.descendFloor();
assert.notEqual(game.stageTransition, null, "Während des Etagenübergangs muss stageTransition gesetzt sein");
assert.equal(game.state.floor, 1, "Die Etage wechselt erst nach Ablauf des Übergangs");

// Ein zweiter Klick während des laufenden Übergangs muss wirkungslos bleiben.
const stageTransitionBeforeSecondClick = game.stageTransition;
game.descendFloor();
assert.equal(game.stageTransition, stageTransitionBeforeSecondClick);

flushTimers();
assert.equal(game.state.floor, 2, "Nach Ablauf des Übergangs muss die Etage gewechselt haben");
assert.equal(game.stageTransition, null);
assert.equal(game.state.currentRoomId, 0, "Neue Etage startet im ersten Raum");
assert.notEqual(game.state.dungeon, dungeonBeforeDescend, "Für die neue Etage muss ein neuer Dungeon erzeugt werden");
assert.equal(game.state.dungeon.exitUnlocked, false, "Der Abstieg der neuen Etage ist zu Beginn gesperrt");
assert.equal(game.state.stats.highestFloor, 2);

console.log(
  "Etagenwechsel-Test erfolgreich: Raum- und Etagenwechsel funktionieren, Nachbarschaftsregel und Mehrfachklick-Schutz greifen."
);
