export class AnimationController {
  constructor() {
    this.states = new Map();
  }

  set(id, state, duration = 300, data = {}) {
    this.states.set(id, {
      state,
      startedAt: performance.now(),
      duration,
      data
    });
  }

  get(id, now = performance.now()) {
    const entry = this.states.get(id);

    if (!entry) {
      return {
        state: "idle",
        progress: 0,
        data: {}
      };
    }

    const progress = Math.min(
      1,
      Math.max(0, (now - entry.startedAt) / entry.duration)
    );

    if (progress >= 1) {
      this.states.delete(id);
      return {
        state: "idle",
        progress: 0,
        data: {}
      };
    }

    return {
      state: entry.state,
      progress,
      data: entry.data
    };
  }

  clear(id) {
    this.states.delete(id);
  }

  clearAll() {
    this.states.clear();
  }

  count() {
    return this.states.size;
  }
}
