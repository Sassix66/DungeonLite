import assert from "node:assert/strict";
import { installTestGlobals } from "./helpers/test-env.mjs";

const { storage } = installTestGlobals();

const { Game } = await import("../js/game.js");
const { SAVE_KEY, LEGACY_SAVE_KEYS } = await import("../js/config/version.js");

// --- Speichern und erneutes Laden unter dem aktuellen Save-Key ---
const gameA = new Game({});
gameA.render = () => {};
gameA.state.gold = 250;
gameA.state.floor = 3;
gameA.save();

const rawSaved = storage.getItem(SAVE_KEY);
assert.notEqual(rawSaved, null, "Speichern muss den aktuellen Save-Key befüllen");
const savedState = JSON.parse(rawSaved);
assert.equal(savedState.gold, 250);
assert.equal(savedState.floor, 3);

const gameB = new Game({});
gameB.render = () => {};
assert.equal(gameB.state.gold, 250, "Neu erzeugtes Spiel muss gespeicherten Stand laden");
assert.equal(gameB.state.floor, 3);

// --- Migration eines älteren Spielstands unter einem Legacy-Save-Key ---
storage.clear();
assert.ok(LEGACY_SAVE_KEYS.length > 0, "Es muss mindestens ein Legacy-Save-Key definiert sein");
const legacyKey = LEGACY_SAVE_KEYS[0];
const legacyState = { gold: 777, floor: 5, player: { level: 4, inventory: [] } };
storage.setItem(legacyKey, JSON.stringify(legacyState));

const gameC = new Game({});
gameC.render = () => {};
assert.equal(gameC.state.gold, 777, "Alter Spielstand aus Legacy-Key muss geladen werden");
assert.equal(gameC.state.floor, 5);

const migrated = storage.getItem(SAVE_KEY);
assert.notEqual(migrated, null, "Alter Spielstand muss beim Laden auf den aktuellen Save-Key migriert werden");
assert.equal(JSON.parse(migrated).gold, 777);

// --- Beschädigter Spielstand wird übersprungen, kein Absturz ---
storage.clear();
storage.setItem(SAVE_KEY, "{ das ist kein gueltiges JSON");
const gameD = new Game({});
gameD.render = () => {};
assert.equal(gameD.state.gold, 0, "Bei beschädigtem Spielstand muss ein frischer Spielstand erzeugt werden");

console.log(
  "Speichern/Laden-Test erfolgreich: aktueller Save-Key, Migration alter Spielstände und Umgang mit beschädigten Daten funktionieren."
);
