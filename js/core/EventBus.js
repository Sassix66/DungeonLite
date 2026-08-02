export class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(eventName, handler) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }

    this.listeners.get(eventName).add(handler);

    return () => this.off(eventName, handler);
  }

  off(eventName, handler) {
    const handlers = this.listeners.get(eventName);

    if (!handlers) return;

    handlers.delete(handler);

    if (handlers.size === 0) {
      this.listeners.delete(eventName);
    }
  }

  emit(eventName, payload = {}) {
    const handlers = this.listeners.get(eventName);

    if (!handlers) return;

    for (const handler of [...handlers]) {
      try {
        handler(payload);
      } catch (error) {
        console.error(
          `[EventBus] Fehler in "${eventName}"`,
          error
        );
      }
    }
  }

  clear() {
    this.listeners.clear();
  }
}
