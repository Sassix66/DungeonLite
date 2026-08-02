import assert from "node:assert/strict";
import { installTestGlobals } from "./helpers/test-env.mjs";

installTestGlobals();

const { Game } = await import("../js/game.js");
const { RenderEngine } = await import("../js/renderer/RenderEngine.js");

// Regressionstest: Bisher hat render() bei JEDEM Aufruf die komplette
// RenderEngine (inkl. CanvasRenderer) verworfen und neu erzeugt, weil der
// Canvas über innerHTML neu aufgebaut wird. Da ParticleSystem,
// DamageNumberSystem und AnimationController bisher INNERHALB des
// CanvasRenderer instanziiert wurden, gingen dadurch gerade erst
// ausgelöste Partikel, Schadenszahlen und Kachel-Animationen sofort wieder
// verloren, bevor sie sichtbar wurden.
const game = new Game({});
game.render = () => {};

// Simuliert exakt das, was initializeRenderEngine() beim echten Rendern
// tut: eine neue RenderEngine unter Weitergabe der persistenten Systeme
// erzeugen.
function createFakeRenderEngine() {
  const canvas = {
    getContext: () => ({
      setTransform() {},
      clearRect() {},
      save() {},
      restore() {},
      scale() {}
    }),
    addEventListener() {},
    removeEventListener() {},
    style: {},
    parentElement: null
  };

  return new RenderEngine({
    game,
    canvas,
    particles: game.particles,
    damageNumbers: game.damageNumbers,
    animations: game.animations
  });
}

const firstEngine = createFakeRenderEngine();

// Ein Partikel auslösen, wie es playTileActionEffect() tun würde.
game.particles.emit("blood", 10, 10);
assert.equal(game.particles.count(), 12, "emit() muss Partikel erzeugen");

// Simuliert render(): alte RenderEngine verwerfen, neue erzeugen – wie es
// game.js bei jedem Zustandswechsel tut.
const secondEngine = createFakeRenderEngine();

assert.equal(
  secondEngine.renderer.particles,
  firstEngine.renderer.particles,
  "Das ParticleSystem muss dieselbe Instanz über eine RenderEngine-Neuerstellung hinweg bleiben"
);
assert.equal(
  secondEngine.renderer.particles.count(),
  12,
  "Bereits ausgelöste Partikel dürfen bei einer Neuerstellung nicht verloren gehen"
);
assert.equal(
  secondEngine.renderer.damageNumbers,
  firstEngine.renderer.damageNumbers,
  "Das DamageNumberSystem muss dieselbe Instanz über eine RenderEngine-Neuerstellung hinweg bleiben"
);
assert.equal(
  secondEngine.renderer.animations,
  firstEngine.renderer.animations,
  "Der AnimationController muss dieselbe Instanz über eine RenderEngine-Neuerstellung hinweg bleiben"
);

console.log(
  "Partikel-Persistenz-Test erfolgreich: Effekte überleben eine Neuerstellung der RenderEngine."
);
