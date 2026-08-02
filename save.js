const SAVE_KEY = "dungeonlite.save.v01";

export function saveGame(data) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

export function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function hasSave() {
  return Boolean(localStorage.getItem(SAVE_KEY));
}
