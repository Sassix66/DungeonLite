import { EventBus } from "../core/EventBus.js";
import { SeedManager } from "../core/SeedManager.js";
import { createRegistries } from "./registries.js";

export class RuntimeContext {
  constructor(options = {}) {
    this.events = new EventBus();
    this.seed = new SeedManager(
      options.seed || Date.now()
    );
    this.registries = createRegistries();
    this.debug = {
      enabled: Boolean(options.debug),
      showSeed: false,
      showTemplateIds: false
    };
  }

  random() {
    return this.seed.next();
  }

  pick(values) {
    return this.seed.pick(values);
  }

  integer(min, max) {
    return this.seed.integer(min, max);
  }

  chance(percent) {
    return this.seed.chance(percent);
  }

  snapshot() {
    return {
      seed: this.seed.snapshot()
    };
  }

  restore(snapshot) {
    this.seed.restore(snapshot?.seed);
  }
}
