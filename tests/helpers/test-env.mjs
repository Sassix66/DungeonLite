// Gemeinsame Testumgebung für DungeonLite-Tests.
// Stellt ein Fake-localStorage und eine steuerbare setTimeout-Warteschlange
// bereit, damit Raum- und Etagenübergänge in Tests ohne echte Wartezeit
// und ohne Browser geprüft werden können.

export function createFakeStorage() {
  const store = new Map();
  return {
    getItem: key => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: key => store.delete(key),
    clear: () => store.clear()
  };
}

export function installTestGlobals() {
  const storage = createFakeStorage();
  globalThis.localStorage = storage;

  const pendingTimers = [];
  const fakeSetTimeout = (callback, _delay) => {
    pendingTimers.push(callback);
    return pendingTimers.length;
  };

  // game.js ruft Zeitgeber teils als `window.setTimeout(...)`, teils als
  // bloßes `setTimeout(...)` auf. Beide Schreibweisen müssen auf dieselbe
  // steuerbare Warteschlange umgeleitet werden, sonst laufen manche
  // Übergänge an den Tests vorbei über echte Timer.
  globalThis.setTimeout = fakeSetTimeout;
  globalThis.window = { setTimeout: fakeSetTimeout };

  // Rein visuelle Animationsschleifen (z. B. der XP-Balken-Nachzieheffekt)
  // rufen requestAnimationFrame auf, sobald ihr setTimeout geflusht wird.
  // Für Tests reicht ein No-Op – die Animation selbst ist nicht Teil der
  // geprüften Logik.
  globalThis.requestAnimationFrame = () => 0;

  function flushTimers() {
    while (pendingTimers.length > 0) {
      const callback = pendingTimers.shift();
      callback();
    }
  }

  return { storage, flushTimers };
}
