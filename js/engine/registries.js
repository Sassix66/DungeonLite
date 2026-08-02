import {
  BIOMES,
  BASE_ITEMS,
  ROOM_TEMPLATES
} from "../data.js";
import { Registry } from "../core/Registry.js";

export function createRegistries() {
  const zones = new Registry("ZoneRegistry");
  const items = new Registry("ItemRegistry");
  const rooms = new Registry("RoomRegistry");
  const enemies = new Registry("EnemyRegistry");
  const bosses = new Registry("BossRegistry");

  zones.registerMany(BIOMES);
  items.registerMany(BASE_ITEMS);

  for (const [category, templates] of Object.entries(ROOM_TEMPLATES)) {
    for (const template of templates) {
      rooms.register(template.id, {
        ...template,
        category
      });
    }
  }

  for (const biome of BIOMES) {
    for (const enemy of biome.enemies) {
      const id =
        `${biome.id}:${enemy.name}`
          .toLowerCase()
          .replace(/[^a-z0-9äöüß]+/g, "-");

      enemies.register(id, {
        ...enemy,
        id,
        zone: biome.id
      });
    }

    const bossId =
      `${biome.id}:${biome.boss.name}`
        .toLowerCase()
        .replace(/[^a-z0-9äöüß]+/g, "-");

    bosses.register(bossId, {
      ...biome.boss,
      id: bossId,
      zone: biome.id
    });
  }

  return {
    zones,
    items,
    rooms,
    enemies,
    bosses
  };
}
