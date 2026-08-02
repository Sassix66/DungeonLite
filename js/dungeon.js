const TYPES = {
  start: { icon: "🚪", label: "Eingang" },
  enemy: { icon: "⚔️", label: "Gegner" },
  treasure: { icon: "🧰", label: "Truhe" },
  shrine: { icon: "✦", label: "Schrein" },
  rubble: { icon: "🪨", label: "Blockade" },
  boss: { icon: "👑", label: "Wächter" },
  exit: { icon: "⬆️", label: "Ausgang" }
};

function pickType(index, size) {
  if (index === 0) return "start";
  if (index === size - 2) return "boss";
  if (index === size - 1) return "exit";

  const roll = Math.random();
  if (roll < .46) return "enemy";
  if (roll < .67) return "treasure";
  if (roll < .82) return "rubble";
  return "shrine";
}

export function createDungeon(stage = 1) {
  const size = 12;
  const rooms = Array.from({ length: size }, (_, index) => {
    const type = pickType(index, size);

    return {
      id: index,
      type,
      ...TYPES[type],
      status: index === 0 ? "cleared" : "locked",
      cost: type === "rubble" ? 2 + Math.floor(stage / 2) : 0
    };
  });

  rooms[1].status = "available";
  return {
    stage,
    rooms,
    clearedCount: 1
  };
}

export function unlockNext(dungeon, roomId) {
  const next = dungeon.rooms[roomId + 1];
  if (next && next.status === "locked") next.status = "available";
}

export function isDungeonComplete(dungeon) {
  return dungeon.rooms.at(-1)?.status === "cleared";
}
