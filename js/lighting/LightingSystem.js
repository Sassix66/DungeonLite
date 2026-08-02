export class LightingSystem {
  constructor() {
    this.ambientAlpha = 0.28;
  }

  draw(context, room, renderer, time) {
    context.save();

    context.fillStyle = `rgba(4,6,9,${this.ambientAlpha})`;
    context.fillRect(0, 0, renderer.width, renderer.height);

    context.globalCompositeOperation = "destination-out";

    for (const decoration of room.decorations || []) {
      if (!this.isLightSource(decoration)) continue;

      const rect = renderer.cellRect({
        column: decoration.column,
        row: decoration.row,
        width: 1,
        height: 1
      });

      const flicker =
        0.92 +
        Math.sin(time * 0.007 + decoration.row) * 0.08;

      const radius =
        Math.max(rect.width, rect.height) * 1.15 * flicker;

      const centerX = rect.x + rect.width / 2;
      const centerY = rect.y + rect.height / 2;

      const gradient = context.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        radius
      );

      gradient.addColorStop(0, "rgba(0,0,0,.95)");
      gradient.addColorStop(0.55, "rgba(0,0,0,.42)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");

      context.fillStyle = gradient;
      context.beginPath();
      context.arc(centerX, centerY, radius, 0, Math.PI * 2);
      context.fill();
    }

    for (const tile of room.tiles || []) {
      if (tile.completed) continue;
      if (!["shrine", "fountain", "boss"].includes(tile.type)) continue;

      const rect = renderer.cellRect(tile.grid);
      const centerX = rect.x + rect.width / 2;
      const centerY = rect.y + rect.height / 2;
      const radius = Math.max(rect.width, rect.height) * 0.85;

      const gradient = context.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        radius
      );

      gradient.addColorStop(0, "rgba(0,0,0,.85)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");

      context.fillStyle = gradient;
      context.beginPath();
      context.arc(centerX, centerY, radius, 0, Math.PI * 2);
      context.fill();
    }

    context.restore();
  }

  isLightSource(decoration) {
    return [
      "torch",
      "flame",
      "candle",
      "lava",
      "crystal",
      "magma-crystal",
      "ice"
    ].includes(decoration.className);
  }
}
