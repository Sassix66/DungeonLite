export class Player {
  constructor(data = {}) {
    Object.assign(this, {
      name: "Wanderer",
      level: 1,
      xp: 0,
      xpNext: 50,
      hp: 100,
      maxHp: 100,
      attack: 12,
      defense: 5,
      gold: 0,
      inventory: []
    }, data);
  }

  gainExperience(amount) {
    this.xp += amount;
    let levels = 0;

    while (this.xp >= this.xpNext) {
      this.xp -= this.xpNext;
      this.level += 1;
      this.xpNext = Math.round(this.xpNext * 1.35);
      this.maxHp += 16;
      this.hp = this.maxHp;
      this.attack += 3;
      this.defense += 2;
      levels += 1;
    }

    return levels;
  }
}
