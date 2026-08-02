import assert from "node:assert/strict";
import { installTestGlobals } from "./helpers/test-env.mjs";

installTestGlobals();

const { Game } = await import("../js/game.js");
const game = new Game({});
game.render = () => {};

// Regressionstest: Bosse erscheinen ausschließlich auf Meilenstein-Etagen
// (jede 5. Etage). Der Meilenstein-Bonus (+20%) darf sich deshalb nicht
// zusätzlich zum eigenen Boss-Bonus (HP/Angriff) aufsummieren – sonst wird
// jeder Boss im Spiel unbeabsichtigt überproportional stark.
//
// pickEnemyForFloor() wählt den Basis-Gegnertyp per this.random(). Für
// Vergleiche zwischen zwei makeEnemy()-Aufrufen wird random() deshalb auf
// einen festen Wert gesetzt, damit beide Aufrufe denselben Basistyp
// erhalten – sonst wäre der Vergleich durch zufällig unterschiedliche
// Basiswerte verfälscht (verschiedene Gegnertypen haben unterschiedliche
// Basis-HP).
function withFixedRandom(fn) {
  const originalRandom = game.random.bind(game);
  game.random = () => 0;
  try {
    return fn();
  } finally {
    game.random = originalRandom;
  }
}

// --- Boss auf Etage 5 (erster Bosskampf im Spiel) ---
game.state.floor = 5;
const bossFloor5 = game.makeEnemy(true, false);
const normalFloor5 = withFixedRandom(() => game.makeEnemy(false, false));

// Der erste Boss im Spiel muss realistisch besiegbar sein: deutlich unter
// dem alten (fehlerhaften) Wert von 1175 HP, aber immer noch klar stärker
// als ein normaler Gegner.
assert.ok(
  bossFloor5.hp < 700,
  `Boss-HP auf Etage 5 zu hoch (${bossFloor5.hp}) – Meilenstein- und Boss-Bonus stapeln sich vermutlich wieder`
);
assert.ok(
  bossFloor5.hp > normalFloor5.hp * 5,
  "Ein Boss muss weiterhin deutlich stärker als ein normaler Gegner sein"
);
assert.ok(
  bossFloor5.attack < 35,
  `Boss-Angriff auf Etage 5 zu hoch (${bossFloor5.attack})`
);

// --- Nicht-Boss-Gegner (normal & elite) behalten den Meilenstein-Bonus ---
const eliteFloor5 = withFixedRandom(() => game.makeEnemy(false, true));
assert.ok(
  eliteFloor5.hp > normalFloor5.hp,
  "Elite-Gegner müssen bei gleichem Basistyp stärker als normale Gegner sein"
);

game.state.floor = 4;
const normalFloor4 = withFixedRandom(() => game.makeEnemy(false, false));
game.state.floor = 5;

assert.ok(
  normalFloor5.hp > normalFloor4.hp,
  "Normale Gegner müssen auf Etage 5 (Meilenstein) weiterhin stärker sein als auf Etage 4"
);

// --- Kein doppelter Meilenstein-Sprung auf weiteren Boss-Etagen ---
game.state.floor = 10;
const bossFloor10 = game.makeEnemy(true, false);
assert.ok(
  bossFloor10.hp < 1100,
  `Boss-HP auf Etage 10 zu hoch (${bossFloor10.hp})`
);

console.log(
  "Boss-Skalierungs-Test erfolgreich: Bosse erhalten keinen doppelten Meilenstein-Bonus mehr und sind auf frühen Etagen realistisch besiegbar."
);
