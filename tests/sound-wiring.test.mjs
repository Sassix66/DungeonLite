import assert from "node:assert/strict";
import { installTestGlobals } from "./helpers/test-env.mjs";

const { flushTimers } = installTestGlobals();

const { Game } = await import("../js/game.js");
const game = new Game({});
game.render = () => {};
game.ensureStateShape();

// audio.play() durch einen Spion ersetzen, der nur die Namen aufzeichnet,
// statt echten Audiocode auszuführen (kein AudioContext in Node vorhanden).
const playedSounds = [];
game.audio.play = name => playedSounds.push(name);

function played(name) {
  return playedSounds.includes(name);
}

// --- Ausrüsten ---
const sword = { id: "s1", name: "Testschwert", slot: "weapon", attack: 5, value: 10 };
game.player.inventory = [sword];
game.ensureStateShape();
game.selectedItemUid = sword.uid;
game.equipSelected();
assert.ok(played("equip"), "Ausrüsten muss einen Sound auslösen");

// --- Heiltrank benutzen ---
playedSounds.length = 0;
const potion = { id: "p1", name: "Heiltrank", type: "potion", heal: 20, value: 5 };
game.player.inventory = [potion];
game.ensureStateShape();
game.player.hp = 50;
game.selectedItemUid = potion.uid;
game.useSelectedItem();
assert.ok(played("potion"), "Heiltrank benutzen muss einen Sound auslösen");

// --- Verkaufen ---
playedSounds.length = 0;
const junk = { id: "j1", name: "Kram", value: 3 };
game.player.inventory = [junk];
game.ensureStateShape();
game.selectedItemUid = junk.uid;
game.sellSelected();
assert.ok(played("sell"), "Verkaufen muss einen Sound auslösen");

// --- Talentpunkt ausgeben ---
playedSounds.length = 0;
game.player.talentPoints = 1;
game.spendTalentPoint("attack");
assert.ok(played("talent"), "Talentpunkt ausgeben muss einen Sound auslösen");

// --- Speichern ---
playedSounds.length = 0;
game.save();
assert.ok(played("save"), "Speichern muss einen Sound auslösen");

// --- Level-Up ---
playedSounds.length = 0;
game.player.xp = 0;
game.player.xpNext = 10;
game.gainXp(10, false);
assert.ok(played("levelUp"), "Level-Up muss einen Sound auslösen");

playedSounds.length = 0;
game.gainXp(1, false);
assert.ok(!played("levelUp"), "Ohne Level-Up darf kein Level-Up-Sound ausgelöst werden");

// --- Etage gesichert (nur beim Übergang gesperrt -> freigeschaltet) ---
playedSounds.length = 0;
game.state.dungeon = {
  rooms: [{ id: 0, type: "start", visited: true, revealed: true, completed: false, neighbors: {}, tiles: [] }],
  exitUnlocked: false
};
game.checkRoomCompletion(0);
assert.ok(played("stageComplete"), "Erstmaliges Freischalten des Abstiegs muss einen Sound auslösen");

playedSounds.length = 0;
game.checkRoomCompletion(0);
assert.ok(!played("stageComplete"), "Bereits freigeschalteter Abstieg darf den Sound nicht erneut auslösen");

// --- Neue Etage betreten ---
playedSounds.length = 0;
game.state.dungeon.exitUnlocked = true;
game.state.floor = 1;
game.descendFloor();
flushTimers();
assert.ok(played("stageStart"), "Das Betreten einer neuen Etage muss einen Sound auslösen");

// --- Kampf: Treffer, Fehlschlag, Gegner besiegt, Boss besiegt ---
function makeTileWithEnemy(overrides = {}) {
  return {
    id: "tile-1",
    type: "enemy",
    completed: false,
    enemy: { name: "Testgegner", hp: 5, maxHp: 5, attack: 3, defense: 0, armorPenetration: 0, critChance: 0, reward: 1, xp: 1, boss: false, ...overrides }
  };
}

game.state.dungeon = {
  rooms: [{ id: 0, type: "normal", visited: true, revealed: true, completed: false, neighbors: {}, tiles: [] }],
  exitUnlocked: false
};
game.state.currentRoomId = 0;
game.player.ap = 50;
game.player.hp = 100;

const originalRandom = game.random.bind(game);

// Erzwungener Treffer (kein kritischer Treffer) mit tödlichem Schaden, um
// "enemyDefeat" zu erzeugen.
game.random = () => 0; // niedriger Wert = garantierter Treffer
const tile1 = makeTileWithEnemy({ hp: 1, maxHp: 1 });
game.currentRoom.tiles = [tile1];
playedSounds.length = 0;
game.attackEnemy(tile1);
assert.ok(played("attack"), "Ein Treffer muss einen Angriffs-Sound auslösen");
assert.ok(played("enemyDefeat"), "Ein besiegter normaler Gegner muss einen Sound auslösen");

// Boss besiegt.
const tile2 = makeTileWithEnemy({ hp: 1, maxHp: 1, boss: true });
tile2.type = "boss";
game.currentRoom.tiles = [tile2];
playedSounds.length = 0;
game.attackEnemy(tile2);
assert.ok(played("bossDefeat"), "Ein besiegter Boss muss einen eigenen Sound auslösen");

game.random = originalRandom;

console.log(
  "Sound-Verdrahtungs-Test erfolgreich: Ausrüsten, Verkaufen, Heiltrank, Talent, Speichern, Level-Up, Etagenwechsel und Kampf lösen jetzt hörbare Sounds aus."
);
