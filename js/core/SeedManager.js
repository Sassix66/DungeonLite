export class SeedManager {
  constructor(seed = Date.now()) {
    this.setSeed(seed);
  }

  setSeed(seed) {
    const normalized =
      typeof seed === "number"
        ? String(Math.floor(seed))
        : String(seed || Date.now());

    this.seed = normalized;
    this.state = this.hash(normalized) || 1;

    return this.seed;
  }

  hash(value) {
    let hash = 2166136261;

    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
  }

  next() {
    let state = this.state;

    state += 0x6d2b79f5;

    let result = state;

    result = Math.imul(
      result ^ (result >>> 15),
      result | 1
    );

    result ^= result +
      Math.imul(
        result ^ (result >>> 7),
        result | 61
      );

    this.state = state >>> 0;

    return (
      (result ^ (result >>> 14)) >>> 0
    ) / 4294967296;
  }

  integer(min, max) {
    const low = Math.ceil(min);
    const high = Math.floor(max);

    return Math.floor(
      this.next() * (high - low + 1)
    ) + low;
  }

  chance(percent) {
    return this.next() * 100 < percent;
  }

  pick(values) {
    if (!values?.length) return null;

    return values[
      this.integer(0, values.length - 1)
    ];
  }

  shuffle(values) {
    const result = [...values];

    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = this.integer(0, index);

      [result[index], result[swapIndex]] =
        [result[swapIndex], result[index]];
    }

    return result;
  }

  snapshot() {
    return {
      seed: this.seed,
      state: this.state
    };
  }

  restore(snapshot) {
    if (!snapshot) return;

    this.seed = String(snapshot.seed);
    this.state = Number(snapshot.state) >>> 0;
  }
}
