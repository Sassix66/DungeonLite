import { CanvasLayer } from "./CanvasLayer.js";
import { Camera } from "./Camera.js";

const LAYERS = [
  ["floor", 0],
  ["walls", 1],
  ["decorations", 2],
  ["objects", 3],
  ["enemies", 4],
  ["effects", 5],
  ["damage", 6],
  ["overlay", 7]
];

export class CanvasRenderer {
  constructor(options = {}) {
    this.canvas = options.canvas;
    this.context = this.canvas.getContext("2d", {
      alpha: false,
      desynchronized: true
    });
    this.camera = new Camera();
    this.layers = new Map(
      LAYERS.map(([name, zIndex]) => [
        name,
        new CanvasLayer(name, zIndex)
      ])
    );
    this.pixelRatio = Math.max(1, window.devicePixelRatio || 1);
    this.width = 0;
    this.height = 0;
    this.drawCalls = 0;
    this.lastRoomId = null;
    this.lastTemplateId = null;
  }

  resize(cssWidth, cssHeight) {
    const width = Math.max(1, Math.floor(cssWidth * this.pixelRatio));
    const height = Math.max(1, Math.floor(cssHeight * this.pixelRatio));

    if (this.canvas.width === width && this.canvas.height === height) {
      return;
    }

    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.style.width = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;

    this.width = cssWidth;
    this.height = cssHeight;

    this.context.setTransform(
      this.pixelRatio, 0, 0, this.pixelRatio, 0, 0
    );
    this.context.imageSmoothingEnabled = false;
  }

  render(room, frameState = {}) {
    if (!room) return;

    this.drawCalls = 0;
    this.lastRoomId = room.id;
    this.lastTemplateId = room.templateId || "unknown";

    for (const layer of this.layers.values()) {
      layer.clear();
    }

    this.buildFloor(room, frameState);
    this.buildWalls(room, frameState);
    this.buildDecorations(room, frameState);
    this.buildTiles(room, frameState);
    this.buildOverlay(room, frameState);

    const ctx = this.context;
    ctx.save();
    ctx.setTransform(
      this.pixelRatio, 0, 0, this.pixelRatio, 0, 0
    );
    ctx.clearRect(0, 0, this.width, this.height);
    this.camera.apply(ctx);

    const ordered = [...this.layers.values()]
      .sort((a, b) => a.zIndex - b.zIndex);

    for (const layer of ordered) {
      layer.draw(ctx, frameState);
    }

    ctx.restore();
  }

  cellRect(grid) {
    const gap = 6;
    const padding = 12;
    const usableWidth = this.width - padding * 2;
    const usableHeight = this.height - padding * 2;
    const cellWidth = usableWidth / 8;
    const cellHeight = usableHeight / 8;

    return {
      x: padding + (grid.column - 1) * cellWidth + gap / 2,
      y: padding + (grid.row - 1) * cellHeight + gap / 2,
      width: grid.width * cellWidth - gap,
      height: grid.height * cellHeight - gap
    };
  }

  buildFloor(room) {
    const layer = this.layers.get("floor");

    layer.add((ctx) => {
      const gradient = ctx.createLinearGradient(
        0, 0, 0, this.height
      );
      gradient.addColorStop(0, "#2a2b2f");
      gradient.addColorStop(1, "#15171b");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.strokeStyle = "rgba(255,255,255,.035)";
      ctx.lineWidth = 1;

      const padding = 12;
      const cellWidth = (this.width - padding * 2) / 8;
      const cellHeight = (this.height - padding * 2) / 8;

      for (let i = 0; i <= 8; i += 1) {
        const x = padding + i * cellWidth;
        const y = padding + i * cellHeight;

        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, this.height - padding);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(this.width - padding, y);
        ctx.stroke();
      }

      this.drawCalls += 17;
    });
  }

  buildWalls() {
    const layer = this.layers.get("walls");

    layer.add((ctx) => {
      ctx.save();
      ctx.strokeStyle = "rgba(196,168,121,.28)";
      ctx.lineWidth = 10;
      ctx.strokeRect(
        5, 5, this.width - 10, this.height - 10
      );

      ctx.strokeStyle = "rgba(0,0,0,.55)";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        10, 10, this.width - 20, this.height - 20
      );
      ctx.restore();
      this.drawCalls += 2;
    });
  }

  buildDecorations(room, frameState) {
    const layer = this.layers.get("decorations");
    const time = frameState.time || 0;

    for (const decoration of room.decorations || []) {
      layer.add((ctx) => {
        const rect = this.cellRect({
          column: decoration.column,
          row: decoration.row,
          width: 1,
          height: 1
        });

        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.font = `${Math.max(14, rect.height * 0.34)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const bob = Math.sin(
          time * 0.0015 + decoration.row + decoration.column
        ) * 1.5;

        ctx.fillText(
          decoration.icon,
          rect.x + rect.width / 2,
          rect.y + rect.height / 2 + bob
        );
        ctx.restore();
        this.drawCalls += 1;
      });
    }
  }

  buildTiles(room, frameState) {
    for (const tile of room.tiles || []) {
      if (tile.hiddenByCapacity) continue;

      const targetLayer =
        tile.type === "enemy" || tile.type === "boss"
          ? "enemies"
          : tile.type === "object" ||
            tile.type === "treasure" ||
            tile.type === "fountain" ||
            tile.type === "shrine" ||
            tile.type === "merchant"
            ? "objects"
            : "overlay";

      this.layers.get(targetLayer).add((ctx) => {
        this.drawTile(ctx, tile, frameState);
      });
    }
  }

  drawTile(ctx, tile, frameState) {
    const rect = this.cellRect(tile.grid);
    const completed = tile.completed;
    const isEnemy = tile.type === "enemy" || tile.type === "boss";

    ctx.save();

    const background = completed
      ? "#4a4d50"
      : tile.type === "boss"
        ? "#4d1f28"
        : isEnemy
          ? "#5a3c27"
          : tile.type === "explore"
            ? "#2d5d4f"
            : tile.type === "treasure"
              ? "#31556d"
              : tile.type === "shrine"
                ? "#52633d"
                : tile.type === "fountain"
                  ? "#2f5d69"
                  : "#3a4149";

    ctx.fillStyle = background;
    ctx.strokeStyle = completed
      ? "rgba(255,255,255,.08)"
      : "rgba(226,198,151,.3)";
    ctx.lineWidth = 1;

    this.roundRect(
      ctx,
      rect.x,
      rect.y,
      rect.width,
      rect.height,
      7
    );
    ctx.fill();
    ctx.stroke();

    if (completed) {
      ctx.strokeStyle = "rgba(18,20,22,.75)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rect.x + rect.width * 0.25, rect.y + rect.height * 0.35);
      ctx.lineTo(rect.x + rect.width * 0.58, rect.y + rect.height * 0.52);
      ctx.lineTo(rect.x + rect.width * 0.43, rect.y + rect.height * 0.72);
      ctx.stroke();
      ctx.restore();
      this.drawCalls += 2;
      return;
    }

    if (isEnemy && tile.enemy) {
      this.drawEnemyHealth(ctx, tile.enemy, rect);
    }

    const label = this.tileLabel(tile);
    const icon = this.tileIcon(tile);
    const time = frameState.time || 0;
    const pulse = isEnemy
      ? Math.sin(time * 0.002 + tile.id) * 1.5
      : 0;

    ctx.fillStyle = "#f2f5f8";
    ctx.font = `700 ${Math.max(9, Math.min(13, rect.width * 0.08))}px sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(
      label,
      rect.x + 7,
      rect.y + 7 + (isEnemy ? 10 : 0)
    );

    ctx.font = `${Math.max(16, Math.min(30, rect.height * 0.35))}px sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText(
      icon,
      rect.x + rect.width - 7,
      rect.y + rect.height - 5 + pulse
    );

    ctx.restore();
    this.drawCalls += 3;
  }

  drawEnemyHealth(ctx, enemy, rect) {
    const layered = Boolean(enemy.elite || enemy.boss);

    if (!layered) {
      const percent = Math.max(0, enemy.hp / enemy.maxHp);
      ctx.fillStyle = "rgba(10,10,12,.8)";
      ctx.fillRect(rect.x + 6, rect.y + 5, rect.width - 12, 6);
      ctx.fillStyle = "#8f4b32";
      ctx.fillRect(
        rect.x + 6,
        rect.y + 5,
        (rect.width - 12) * percent,
        6
      );
      this.drawCalls += 2;
      return;
    }

    const count = Math.max(1, Math.ceil(enemy.maxHp / 100));
    const availableHeight = Math.min(34, rect.height * 0.35);
    const barHeight = Math.max(3, availableHeight / count - 2);

    for (let index = 0; index < count; index += 1) {
      const start = index * 100;
      const capacity = Math.max(
        1,
        Math.min(100, enemy.maxHp - start)
      );
      const current = Math.max(
        0,
        Math.min(capacity, enemy.hp - start)
      );
      const percent = current / capacity;
      const remaining = Math.max(0, Math.ceil(enemy.hp / 100));
      const ratio = count <= 1 ? 0 : (remaining - 1) / (count - 1);
      const lightness = Math.round(68 - ratio * 30);

      const y =
        rect.y + 5 + (count - 1 - index) * (barHeight + 2);

      ctx.fillStyle = "rgba(10,10,12,.82)";
      ctx.fillRect(rect.x + 6, y, rect.width - 12, barHeight);
      ctx.fillStyle = `hsl(2 82% ${lightness}%)`;
      ctx.fillRect(
        rect.x + 6,
        y,
        (rect.width - 12) * percent,
        barHeight
      );
      this.drawCalls += 2;
    }
  }

  buildOverlay(room, frameState) {
    const layer = this.layers.get("overlay");

    layer.add((ctx) => {
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,.55)";
      ctx.font = "600 10px sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillText(
        `Raum ${room.id + 1} · ${room.templateId || "unknown"}`,
        this.width - 14,
        this.height - 12
      );
      ctx.restore();
      this.drawCalls += 1;
    });
  }

  tileLabel(tile) {
    if (tile.type === "enemy" || tile.type === "boss") {
      return tile.enemy?.name || "Gegner";
    }

    if (tile.type === "object") {
      return tile.object?.name || "Objekt";
    }

    return {
      explore: `${Math.floor(tile.progress || 0)}% Erkunden`,
      treasure: "Schatztruhe",
      shrine: "Heiligtum",
      fountain: "Brunnen",
      merchant: "Händler",
      trap: "Falle",
      empty: "Leer"
    }[tile.type] || tile.type;
  }

  tileIcon(tile) {
    if (tile.type === "enemy" || tile.type === "boss") {
      return tile.enemy?.icon || "●";
    }

    if (tile.type === "object") {
      return tile.object?.icon || "◆";
    }

    return {
      explore: "⌕",
      treasure: "▣",
      shrine: "✦",
      fountain: "◉",
      merchant: "¤",
      trap: "!",
      empty: "·"
    }[tile.type] || "·";
  }

  roundRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  stats() {
    return {
      drawCalls: this.drawCalls,
      width: this.width,
      height: this.height,
      roomId: this.lastRoomId,
      templateId: this.lastTemplateId
    };
  }
}
