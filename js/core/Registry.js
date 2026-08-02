export class Registry {
  constructor(name) {
    this.name = name;
    this.entries = new Map();
  }

  register(id, value) {
    if (!id) {
      throw new Error(`[${this.name}] Eine ID ist erforderlich.`);
    }

    if (this.entries.has(id)) {
      throw new Error(
        `[${this.name}] Doppelte Registrierung: ${id}`
      );
    }

    this.entries.set(id, value);
    return value;
  }

  registerMany(values, idSelector = value => value.id) {
    for (const value of values) {
      this.register(idSelector(value), value);
    }

    return this;
  }

  get(id) {
    return this.entries.get(id) || null;
  }

  require(id) {
    const value = this.get(id);

    if (!value) {
      throw new Error(
        `[${this.name}] Unbekannte ID: ${id}`
      );
    }

    return value;
  }

  has(id) {
    return this.entries.has(id);
  }

  values() {
    return [...this.entries.values()];
  }

  ids() {
    return [...this.entries.keys()];
  }

  random(rng = Math.random) {
    const values = this.values();

    if (values.length === 0) return null;

    return values[
      Math.floor(rng() * values.length)
    ];
  }

  filter(predicate) {
    return this.values().filter(predicate);
  }
}
