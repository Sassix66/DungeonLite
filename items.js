export function createPotion() {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    name: "Heiltrank",
    type: "potion",
    heal: 35
  };
}
