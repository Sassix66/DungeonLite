export class Player {
  constructor(data = {}) {
    Object.assign(this, {
      name: "Wanderer",
      level: 1,
      xp: 0,
      xpNext: 50,
      hp: 100,
      maxHp: 100,
      baseAttack: 12,
      baseDefense: 5,
      gold: 0,
      inventory: [],
      equipment: {
        weapon: null,
        armor: null,
        accessory: null
      }
    }, data);

    this.inventory = Array.isArray(this.inventory) ? this.inventory : [];
    this.equipment = {
      weapon: this.equipment?.weapon ?? null,
      armor: this.equipment?.armor ?? null,
      accessory: this.equipment?.accessory ?? null
    };
  }

  get attack() {
    return this.baseAttack + Object.values(this.equipment)
      .filter(Boolean)
      .reduce((sum, item) => sum + (item.attack || 0), 0);
  }

  get defense() {
    return this.baseDefense + Object.values(this.equipment)
      .filter(Boolean)
      .reduce((sum, item) => sum + (item.defense || 0), 0);
  }

  get bonusHp() {
    return Object.values(this.equipment)
      .filter(Boolean)
      .reduce((sum, item) => sum + (item.hp || 0), 0);
  }

  get totalMaxHp() {
    return this.maxHp + this.bonusHp;
  }

  gainExperience(amount) {
    this.xp += amount;
    let levels = 0;

    while (this.xp >= this.xpNext) {
      this.xp -= this.xpNext;
      this.level += 1;
      this.xpNext = Math.round(this.xpNext * 1.35);
      this.maxHp += 16;
      this.hp = this.totalMaxHp;
      this.baseAttack += 3;
      this.baseDefense += 2;
      levels += 1;
    }

    return levels;
  }

  equip(item) {
    const slot = item.slot;
    if (!["weapon", "armor", "accessory"].includes(slot)) return false;

    const old = this.equipment[slot];
    this.equipment[slot] = item;

    if (old) this.inventory.push(old);
    this.hp = Math.min(this.hp, this.totalMaxHp);
    return true;
  }
}
