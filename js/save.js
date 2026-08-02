const KEY = "dungeonlite.save.v03";

export function save(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function load() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); }
  catch { return null; }
}

export function exists() {
  return Boolean(localStorage.getItem(KEY));
}
