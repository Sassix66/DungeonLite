import assert from "node:assert/strict";
import { installTestGlobals } from "./helpers/test-env.mjs";

installTestGlobals();

const { Game } = await import("../js/game.js");
const { GAME_VERSION } = await import("../js/config/version.js");

const game = new Game({});
game.render = () => {};
game.ensureStateShape();

// --- Versionsanzeige im Topbar ---
const topbarHtml = game.renderTopbar();
assert.ok(
  topbarHtml.includes(`v${GAME_VERSION}`),
  "Die Spielversion muss sichtbar im Topbar angezeigt werden"
);

// --- Abstiegs-Button ist ein echtes Element unterhalb des Canvas, kein Canvas-Hit mehr ---
game.state.dungeon = {
  rooms: [{ id: 0, type: "start", visited: true, revealed: true, completed: false, neighbors: {}, tiles: [] }],
  exitUnlocked: false
};

let centerHtml = game.renderCenter();
assert.ok(centerHtml.includes('id="stairsBtn"'), "Der Abstiegs-Button muss im HTML vorhanden sein");
assert.ok(
  /id="stairsBtn"[^>]*disabled/.test(centerHtml),
  "Der Abstiegs-Button muss deaktiviert sein, solange die Etage nicht gesichert ist"
);

game.state.dungeon.exitUnlocked = true;
centerHtml = game.renderCenter();
assert.ok(
  !/id="stairsBtn"[^>]*disabled/.test(centerHtml),
  "Der Abstiegs-Button muss aktiv sein, sobald die Etage gesichert ist"
);

console.log(
  "Versions-/Abstiegs-Button-Test erfolgreich: Version wird angezeigt, Abstieg ist ein eigenständiger Button unterhalb des Canvas."
);
