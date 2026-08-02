export class Player {
  constructor(data = {}) {
    Object.assign(this, {
      name: "Wanderer",
      level: 1,
      xp: 0,
      xpNext: 45,
      hp: 90,
      maxHp: 90,
      baseAttack: 11,
      baseDefense: 4,
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

  get totalMaxHp() {
    return this.maxHp + Object.values(this.equipment)
      .filter(Boolean)
      .reduce((sum, item) => sum + (item.hp || 0), 0);
  }

  gainXp(amount) {
    this.xp += amount;
    let gained = 0;

    while (this.xp >= this.xpNext) {
      this.xp -= this.xpNext;
      this.level += 1;
      this.xpNext = Math.round(this.xpNext * 1.38);
      this.maxHp += 14;
      this.baseAttack += 3;
      this.baseDefense += 2;
      this.hp = this.totalMaxHp;
      gained += 1;
    }

    return gained;
  }

  equip(item) {
    const old = this.equipment[item.slot];
    this.equipment[item.slot] = item;
    if (old) this.inventory.push(old);
    this.hp = Math.min(this.hp, this.totalMaxHp);
  }
}
