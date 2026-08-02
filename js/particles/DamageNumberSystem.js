export class DamageNumberSystem {
  constructor() {
    this.entries = [];
  }

  add(text, x, y, type = "damage") {
    this.entries.push({
      text,
      x,
      y,
      type,
      life: 850,
      maxLife: 850,
      driftX: 10 + Math.random() * 10
    });
  }

  update(deltaTimeMs) {
    for (const entry of this.entries) {
      entry.life -= deltaTimeMs;
      const dt = deltaTimeMs / 1000;
      entry.y -= 35 * dt;
      entry.x += entry.driftX * dt;
    }

    this.entries = this.entries.filter(entry => entry.life > 0);
  }

  draw(context) {
    for (const entry of this.entries) {
      const alpha = Math.max(0, entry.life / entry.maxLife);
      const scale = 1 + (1 - alpha) * 0.25;

      context.save();
      context.globalAlpha = alpha;
      context.translate(entry.x, entry.y);
      context.scale(scale, scale);
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.font = `900 ${entry.type === "critical" ? 22 : 17}px sans-serif`;
      context.lineWidth = 4;
      context.strokeStyle = "rgba(0,0,0,.8)";
      context.fillStyle =
        entry.type === "critical"
          ? "#ffe36f"
          : entry.type === "miss"
            ? "#dce7f4"
            : entry.type === "heal"
              ? "#9be6a8"
              : "#fff1f1";

      context.strokeText(entry.text, 0, 0);
      context.fillText(entry.text, 0, 0);
      context.restore();
    }
  }

  count() {
    return this.entries.length;
  }
}
