import { CanvasLayer } from "./CanvasLayer.js";
import { Camera } from "./Camera.js";
import { AnimationController } from "../animation/AnimationController.js";
import { ParticleSystem } from "../particles/ParticleSystem.js";
import { DamageNumberSystem } from "../particles/DamageNumberSystem.js";
import { LightingSystem } from "../lighting/LightingSystem.js";

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
    this.getGameState = options.getGameState || (() => null);
    this.context = this.canvas.getContext("2d", {
      alpha: false,
      desynchronized: true
    });
    this.camera = new Camera();
    this.animations = new AnimationController();
    this.particles = new ParticleSystem();
    this.damageNumbers = new DamageNumberSystem();
    this.lighting = new LightingSystem();
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
    this.hitRegions = [];
    this.hoveredHit = null;
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
    this.hitRegions = [];
    this.lastRoomId = room.id;
    this.lastTemplateId = room.templateId || "unknown";

    for (const layer of this.layers.values()) {
      layer.clear();
    }

    this.buildFloor(room, frameState);
    this.buildWalls(room, frameState);
    this.buildDecorations(room, frameState);
    this.buildTiles(room, frameState);
    this.buildExit(room, frameState);
    this.particles.update(frameState.deltaTime || 16);
    this.damageNumbers.update(frameState.deltaTime || 16);

    this.buildEffects(room, frameState);
    this.buildDamageNumbers(room, frameState);
    this.buildLighting(room, frameState);
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

  buildFloor(room, frameState = {}) {
    const layer = this.layers.get("floor");
    const state = this.getGameState();
    const mine = state?.floor <= 10;

    layer.add((ctx) => {
      const gradient = ctx.createLinearGradient(
        0, 0, 0, this.height
      );

      if (mine) {
        gradient.addColorStop(0, "#30291f");
        gradient.addColorStop(1, "#17130f");
      } else {
        gradient.addColorStop(0, "#2a2b2f");
        gradient.addColorStop(1, "#15171b");
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.width, this.height);

      const padding = 12;
      const cellWidth = (this.width - padding * 2) / 8;
      const cellHeight = (this.height - padding * 2) / 8;

      ctx.strokeStyle = mine
        ? "rgba(193,156,101,.075)"
        : "rgba(255,255,255,.035)";
      ctx.lineWidth = 1;

      for (let row = 0; row < 8; row += 1) {
        for (let column = 0; column < 8; column += 1) {
          const x = padding + column * cellWidth;
          const y = padding + row * cellHeight;

          ctx.fillStyle =
            (row + column) % 2 === 0
              ? "rgba(255,255,255,.018)"
              : "rgba(0,0,0,.025)";
          ctx.fillRect(x, y, cellWidth, cellHeight);

          ctx.strokeRect(x, y, cellWidth, cellHeight);
          this.drawCalls += 2;
        }
      }

      if (mine) {
        this.drawMineRails(ctx, padding, cellWidth, cellHeight);
      }
    });
  }

  drawMineRails(ctx, padding, cellWidth, cellHeight) {
    const centerY = padding + cellHeight * 6.5;
    const left = padding + cellWidth * 0.55;
    const right = this.width - padding - cellWidth * 0.55;

    ctx.save();
    ctx.strokeStyle = "#514434";
    ctx.lineWidth = Math.max(2, cellHeight * 0.055);

    for (const offset of [-cellHeight * 0.10, cellHeight * 0.10]) {
      ctx.beginPath();
      ctx.moveTo(left, centerY + offset);
      ctx.lineTo(right, centerY + offset);
      ctx.stroke();
    }

    ctx.strokeStyle = "#725f45";
    ctx.lineWidth = Math.max(2, cellHeight * 0.045);

    for (let x = left; x <= right; x += cellWidth * 0.42) {
      ctx.beginPath();
      ctx.moveTo(x, centerY - cellHeight * 0.17);
      ctx.lineTo(x, centerY + cellHeight * 0.17);
      ctx.stroke();
    }

    ctx.restore();
    this.drawCalls += 20;
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
        ctx.globalAlpha = 0.58;

        const bob = Math.sin(
          time * 0.0015 + decoration.row + decoration.column
        ) * 1.5;

        this.drawDecorationPlaceholder(
          ctx,
          decoration,
          rect,
          bob
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

      const rect = this.cellRect(tile.grid);
      this.hitRegions.push({
        type: "tile",
        roomId: room.id,
        tileId: tile.id,
        rect
      });

      this.layers.get(targetLayer).add((ctx) => {
        this.drawTile(ctx, tile, frameState);
      });
    }
  }

  drawTile(ctx, tile, frameState) {
    const rect = this.cellRect(tile.grid);
    const completed = tile.completed;
    const isEnemy = tile.type === "enemy" || tile.type === "boss";
    const hovered =
      this.hoveredHit?.type === "tile" &&
      this.hoveredHit.tileId === tile.id;

    ctx.save();

    const animation = this.animations.get(
      `tile:${tile.id}`,
      frameState.time || performance.now()
    );

    if (animation.state !== "idle") {
      const centerX = rect.x + rect.width / 2;
      const centerY = rect.y + rect.height / 2;

      ctx.translate(centerX, centerY);

      if (animation.state === "hit") {
        const shake = Math.sin(animation.progress * Math.PI * 8) *
          (1 - animation.progress) * 5;
        ctx.translate(shake, 0);
      } else if (animation.state === "destroy") {
        const scale = Math.max(0.75, 1 - animation.progress * 0.25);
        ctx.scale(scale, scale);
        ctx.globalAlpha = 1 - animation.progress;
      } else if (animation.state === "open") {
        const pulse = 1 + Math.sin(animation.progress * Math.PI) * 0.08;
        ctx.scale(pulse, pulse);
      } else if (animation.state === "explore") {
        const pulse = 1 + Math.sin(animation.progress * Math.PI) * 0.05;
        ctx.scale(pulse, pulse);
      }

      ctx.translate(-centerX, -centerY);
    }

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
      : hovered
        ? "rgba(255,226,159,.92)"
        : "rgba(226,198,151,.3)";
    ctx.lineWidth = hovered ? 3 : 1;

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
    const time = frameState.time || 0;

    ctx.fillStyle = "#f2f5f8";
    ctx.font = `700 ${Math.max(8, Math.min(12, rect.width * 0.075))}px sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(
      label,
      rect.x + 7,
      rect.y + 7 + (isEnemy ? 10 : 0),
      Math.max(20, rect.width - 14)
    );

    this.drawPixelPlaceholder(
      ctx,
      tile,
      rect,
      time
    );

    ctx.restore();
    this.drawCalls += 4;
  }

  drawPixelPlaceholder(ctx, tile, rect, time) {
    const size = Math.max(
      12,
      Math.min(rect.width, rect.height) * 0.34
    );
    const centerX = rect.x + rect.width - size * 0.72;
    const centerY = rect.y + rect.height - size * 0.68;
    const bob =
      tile.type === "enemy" || tile.type === "boss"
        ? Math.sin(time * 0.002 + tile.id) * 1.5
        : 0;

    ctx.save();
    ctx.translate(centerX, centerY + bob);
    ctx.imageSmoothingEnabled = false;

    if (tile.type === "enemy" || tile.type === "boss") {
      this.drawEnemyPlaceholder(
        ctx,
        tile.enemy,
        size,
        tile.type === "boss"
      );
    } else if (tile.type === "object") {
      const vase = tile.object?.name === "Vase";

      if (vase) {
        ctx.fillStyle = "#9cc2d6";
        ctx.fillRect(-size * .22, -size * .34, size * .44, size * .16);
        ctx.fillRect(-size * .32, -size * .18, size * .64, size * .42);
        ctx.fillStyle = "#6a879b";
        ctx.fillRect(-size * .12, -size * .44, size * .24, size * .12);
      } else {
        ctx.fillStyle = "#7f552f";
        ctx.fillRect(-size * .38, -size * .28, size * .76, size * .56);
        ctx.fillStyle = "#b58445";
        ctx.fillRect(-size * .34, -size * .22, size * .68, size * .12);
        ctx.fillStyle = "#d4aa55";
        ctx.fillRect(-size * .06, -size * .10, size * .12, size * .20);
      }
    } else if (tile.type === "treasure") {
      ctx.fillStyle = "#8c5a2f";
      ctx.fillRect(-size * .40, -size * .22, size * .80, size * .48);
      ctx.fillStyle = "#d8ad4e";
      ctx.fillRect(-size * .36, -size * .16, size * .72, size * .10);
      ctx.fillRect(-size * .07, -size * .04, size * .14, size * .22);
    } else if (tile.type === "fountain") {
      ctx.fillStyle = "#567788";
      ctx.fillRect(-size * .42, size * .08, size * .84, size * .18);
      ctx.fillStyle = "#73c8e1";
      ctx.fillRect(-size * .08, -size * .36, size * .16, size * .42);
      ctx.fillRect(-size * .30, -size * .02, size * .60, size * .12);
    } else if (tile.type === "shrine") {
      ctx.fillStyle = "#dbe7a5";
      ctx.fillRect(-size * .08, -size * .42, size * .16, size * .72);
      ctx.fillRect(-size * .32, -size * .10, size * .64, size * .16);
      ctx.fillStyle = "rgba(219,231,165,.22)";
      ctx.fillRect(-size * .46, -size * .48, size * .92, size * .92);
    } else if (tile.type === "merchant") {
      ctx.fillStyle = "#7b4a2d";
      ctx.fillRect(-size * .34, -size * .28, size * .68, size * .56);
      ctx.fillStyle = "#d8b86a";
      ctx.fillRect(-size * .22, -size * .38, size * .44, size * .16);
      ctx.fillStyle = "#5b7c55";
      ctx.fillRect(-size * .12, -size * .08, size * .24, size * .24);
    } else if (tile.type === "explore") {
      ctx.strokeStyle = "#8ce0bf";
      ctx.lineWidth = Math.max(2, size * .08);
      ctx.beginPath();
      ctx.arc(0, 0, size * .24, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(size * .16, size * .16);
      ctx.lineTo(size * .36, size * .36);
      ctx.stroke();
    } else if (tile.type === "trap") {
      ctx.fillStyle = "#d99a55";
      ctx.beginPath();
      ctx.moveTo(0, -size * .42);
      ctx.lineTo(size * .42, size * .34);
      ctx.lineTo(-size * .42, size * .34);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#241819";
      ctx.fillRect(-size * .04, -size * .16, size * .08, size * .28);
    } else {
      ctx.fillStyle = "#77818c";
      ctx.fillRect(-size * .22, -size * .22, size * .44, size * .44);
    }

    ctx.restore();
  }

  drawEnemyPlaceholder(ctx, enemy, size, boss = false) {
    const archetype = enemy?.archetype || "humanoid";
    const elite = Boolean(enemy?.elite);
    const outline = "#181417";
    const base =
      boss ? "#9b3340" :
      elite ? "#c27a36" :
      "#8c5633";

    ctx.fillStyle = outline;

    if (archetype === "rat") {
      ctx.fillRect(-size * .38, -size * .12, size * .62, size * .34);
      ctx.fillRect(size * .12, -size * .20, size * .28, size * .28);
      ctx.fillStyle = "#7f6a59";
      ctx.fillRect(-size * .30, -size * .07, size * .50, size * .24);
      ctx.fillRect(size * .15, -size * .16, size * .18, size * .18);
      ctx.strokeStyle = "#8d7562";
      ctx.lineWidth = Math.max(1, size * .05);
      ctx.beginPath();
      ctx.moveTo(-size * .34, size * .04);
      ctx.quadraticCurveTo(-size * .62, size * .14, -size * .56, size * .30);
      ctx.stroke();
      return;
    }

    if (archetype === "bat") {
      ctx.fillStyle = "#503f55";
      ctx.beginPath();
      ctx.moveTo(0, -size * .14);
      ctx.lineTo(-size * .52, -size * .34);
      ctx.lineTo(-size * .30, size * .24);
      ctx.lineTo(0, size * .08);
      ctx.lineTo(size * .30, size * .24);
      ctx.lineTo(size * .52, -size * .34);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#c85a55";
      ctx.fillRect(-size * .12, -size * .12, size * .07, size * .07);
      ctx.fillRect(size * .05, -size * .12, size * .07, size * .07);
      return;
    }

    if (archetype === "slime") {
      ctx.fillStyle = "#4e7b52";
      ctx.beginPath();
      ctx.arc(0, size * .06, size * .34, Math.PI, 0);
      ctx.lineTo(size * .34, size * .26);
      ctx.lineTo(-size * .34, size * .26);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#d8e8bd";
      ctx.fillRect(-size * .15, 0, size * .08, size * .08);
      ctx.fillRect(size * .07, 0, size * .08, size * .08);
      return;
    }

    if (archetype === "spider") {
      ctx.fillStyle = "#58433a";
      ctx.fillRect(-size * .22, -size * .18, size * .44, size * .38);
      ctx.strokeStyle = "#302521";
      ctx.lineWidth = Math.max(1, size * .055);
      for (const side of [-1, 1]) {
        for (let index = 0; index < 4; index += 1) {
          const y = -size * .14 + index * size * .10;
          ctx.beginPath();
          ctx.moveTo(side * size * .16, y);
          ctx.lineTo(side * size * (.34 + index * .035), y + (index - 1.5) * size * .05);
          ctx.stroke();
        }
      }
      return;
    }

    if (archetype === "beetle") {
      ctx.fillStyle = "#42463d";
      ctx.beginPath();
      ctx.ellipse(0, 0, size * .34, size * .40, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#747b63";
      ctx.lineWidth = Math.max(1, size * .04);
      ctx.beginPath();
      ctx.moveTo(0, -size * .36);
      ctx.lineTo(0, size * .34);
      ctx.stroke();
      return;
    }

    if (archetype === "crystal") {
      ctx.fillStyle = "#5ca6b8";
      ctx.beginPath();
      ctx.moveTo(0, -size * .48);
      ctx.lineTo(size * .30, size * .02);
      ctx.lineTo(size * .16, size * .38);
      ctx.lineTo(-size * .20, size * .30);
      ctx.lineTo(-size * .32, -size * .02);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#b7edf2";
      ctx.fillRect(-size * .05, -size * .28, size * .10, size * .30);
      return;
    }

    if (archetype === "golem") {
      ctx.fillStyle = "#5a5650";
      ctx.fillRect(-size * .34, -size * .30, size * .68, size * .62);
      ctx.fillStyle = "#81786d";
      ctx.fillRect(-size * .25, -size * .22, size * .20, size * .18);
      ctx.fillRect(size * .05, -size * .22, size * .20, size * .18);
      ctx.fillStyle = "#d6b65e";
      ctx.fillRect(-size * .05, size * .02, size * .10, size * .10);
      return;
    }

    if (archetype === "worm") {
      ctx.fillStyle = "#72533e";
      for (let index = 0; index < 5; index += 1) {
        ctx.beginPath();
        ctx.arc(
          -size * .28 + index * size * .14,
          Math.sin(index) * size * .08,
          size * .13,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      return;
    }

    if (archetype === "drill-boss") {
      ctx.fillStyle = outline;
      ctx.fillRect(-size * .44, -size * .34, size * .88, size * .68);
      ctx.fillStyle = "#7f3a35";
      ctx.fillRect(-size * .36, -size * .26, size * .72, size * .52);
      ctx.fillStyle = "#caa85d";
      ctx.beginPath();
      ctx.moveTo(size * .10, -size * .18);
      ctx.lineTo(size * .52, 0);
      ctx.lineTo(size * .10, size * .18);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#f2d57d";
      ctx.fillRect(-size * .20, -size * .08, size * .12, size * .12);
      return;
    }

    // Miner, bandit and generic humanoids.
    ctx.fillStyle = outline;
    ctx.fillRect(-size * .34, -size * .38, size * .68, size * .76);
    ctx.fillStyle = base;
    ctx.fillRect(-size * .27, -size * .28, size * .54, size * .56);
    ctx.fillStyle = "#d6b66f";
    ctx.fillRect(-size * .28, -size * .40, size * .56, size * .12);
    ctx.fillStyle = "#e7d1ad";
    ctx.fillRect(-size * .16, -size * .16, size * .10, size * .08);
    ctx.fillRect(size * .06, -size * .16, size * .10, size * .08);
  }

  drawDecorationPlaceholder(ctx, decoration, rect, bob) {
    const size = Math.max(
      8,
      Math.min(rect.width, rect.height) * 0.24
    );
    const x = rect.x + rect.width / 2;
    const y = rect.y + rect.height / 2 + bob;

    ctx.translate(x, y);

    const kind = decoration.className;

    if (["torch", "flame", "candle", "lava"].includes(kind)) {
      ctx.fillStyle = "#6d4a2d";
      ctx.fillRect(-size * .10, 0, size * .20, size * .44);
      ctx.fillStyle = "#f2a348";
      ctx.fillRect(-size * .18, -size * .34, size * .36, size * .34);
      ctx.fillStyle = "#ffd36a";
      ctx.fillRect(-size * .08, -size * .26, size * .16, size * .20);
      return;
    }

    if (["crystal", "magma-crystal", "ice"].includes(kind)) {
      ctx.fillStyle = kind === "magma-crystal" ? "#dd6948" : "#79cde8";
      ctx.beginPath();
      ctx.moveTo(0, -size * .45);
      ctx.lineTo(size * .28, size * .16);
      ctx.lineTo(0, size * .44);
      ctx.lineTo(-size * .28, size * .16);
      ctx.closePath();
      ctx.fill();
      return;
    }

    if (["web", "roots"].includes(kind)) {
      ctx.strokeStyle = "#aeb7bb";
      ctx.lineWidth = 1;
      for (let index = 0; index < 4; index += 1) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(
          Math.cos(index * Math.PI / 2) * size * .45,
          Math.sin(index * Math.PI / 2) * size * .45
        );
        ctx.stroke();
      }
      return;
    }

    if (["bone", "grave", "urn"].includes(kind)) {
      ctx.fillStyle = "#bcb4a2";
      ctx.fillRect(-size * .28, -size * .18, size * .56, size * .36);
      return;
    }

    if (["mushroom"].includes(kind)) {
      ctx.fillStyle = "#c66d67";
      ctx.fillRect(-size * .30, -size * .22, size * .60, size * .24);
      ctx.fillStyle = "#d9c6a3";
      ctx.fillRect(-size * .08, 0, size * .16, size * .32);
      return;
    }

    ctx.fillStyle = "#6d7276";
    ctx.fillRect(-size * .30, -size * .18, size * .60, size * .38);
  }

  buildExit(room, frameState) {
    const state = this.getGameState();

    if (!state?.dungeon?.exitUnlocked) return;

    const grid = {
      column: 7,
      row: 7,
      width: 2,
      height: 2
    };
    const rect = this.cellRect(grid);
    const hovered = this.hoveredHit?.type === "exit";

    this.hitRegions.push({
      type: "exit",
      roomId: room.id,
      rect
    });

    this.layers.get("objects").add((ctx) => {
      ctx.save();

      ctx.fillStyle = hovered ? "#6b5734" : "#4e432c";
      ctx.strokeStyle = hovered
        ? "rgba(255,225,150,.95)"
        : "rgba(219,184,104,.55)";
      ctx.lineWidth = hovered ? 3 : 1;

      this.roundRect(
        ctx,
        rect.x,
        rect.y,
        rect.width,
        rect.height,
        8
      );
      ctx.fill();
      ctx.stroke();

      const stepCount = 5;
      const stepWidth = rect.width * .56;
      const stepHeight = rect.height * .08;

      ctx.fillStyle = "#b9a06a";

      for (let index = 0; index < stepCount; index += 1) {
        const scale = 1 - index * .08;
        ctx.fillRect(
          rect.x + rect.width * .22 + index * rect.width * .025,
          rect.y + rect.height * .24 + index * rect.height * .12,
          stepWidth * scale,
          stepHeight
        );
      }

      ctx.fillStyle = "#f1dfb0";
      ctx.font = `800 ${Math.max(10, rect.width * .08)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(
        "ABSTIEG",
        rect.x + rect.width / 2,
        rect.y + rect.height - 8
      );

      ctx.restore();
      this.drawCalls += 8;
    });
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

  buildEffects(room, frameState) {
    const layer = this.layers.get("effects");

    layer.add((ctx) => {
      this.particles.draw(ctx);
      this.drawCalls += this.particles.count();
    });
  }

  buildDamageNumbers(room, frameState) {
    const layer = this.layers.get("damage");

    layer.add((ctx) => {
      this.damageNumbers.draw(ctx);
      this.drawCalls += this.damageNumbers.count();
    });
  }

  buildLighting(room, frameState) {
    const layer = this.layers.get("overlay");

    layer.add((ctx) => {
      this.lighting.draw(
        ctx,
        room,
        this,
        frameState.time || 0
      );
      this.drawCalls += 1;
    });
  }

  tileCenter(tile) {
    const rect = this.cellRect(tile.grid);

    return {
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2
    };
  }

  triggerTileEffect(tile, type, text = "") {
    if (!tile) return;

    const center = this.tileCenter(tile);

    const animationState = {
      enemy: "hit",
      critical: "hit",
      miss: "hit",
      vase: "hit",
      object: "hit",
      explore: "explore",
      treasure: "open",
      shrine: "open",
      fountain: "open",
      destroy: "destroy"
    }[type] || "hit";

    this.animations.set(
      `tile:${tile.id}`,
      animationState,
      type === "destroy" ? 700 : 320
    );

    const particleType = {
      enemy: "blood",
      critical: "gold",
      miss: "miss",
      vase: "shards",
      object: "dust",
      explore: "dust",
      treasure: "gold",
      shrine: "light",
      fountain: "water",
      destroy: "dust"
    }[type] || "dust";

    this.particles.emit(
      particleType,
      center.x,
      center.y
    );

    if (text) {
      this.damageNumbers.add(
        text,
        center.x,
        center.y,
        type === "critical"
          ? "critical"
          : type === "miss"
            ? "miss"
            : "damage"
      );
    }
  }

  setHoveredHit(hit) {
    this.hoveredHit = hit;
  }

  hitTest(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();

    if (!rect.width || !rect.height) return null;

    const x = (clientX - rect.left) * (this.width / rect.width);
    const y = (clientY - rect.top) * (this.height / rect.height);

    for (let index = this.hitRegions.length - 1; index >= 0; index -= 1) {
      const region = this.hitRegions[index];
      const r = region.rect;

      if (
        x >= r.x &&
        x <= r.x + r.width &&
        y >= r.y &&
        y <= r.y + r.height
      ) {
        return region;
      }
    }

    return null;
  }

  buildOverlay(room, frameState) {
    const layer = this.layers.get("overlay");

    layer.add((ctx) => {
      ctx.save();
      ctx.fillStyle = "rgba(255,255,255,.55)";
      ctx.font = "600 10px sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      const state = this.getGameState();
      const zoneLabel =
        state?.floor <= 10
          ? `VERLASSENE MINE · ETAGE ${state.floor}`
          : `ETAGE ${state?.floor || "?"}`;

      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(235,211,164,.72)";
      ctx.fillText(
        zoneLabel,
        14,
        this.height - 12
      );

      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(255,255,255,.48)";
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
      templateId: this.lastTemplateId,
      particles: this.particles.count(),
      damageNumbers: this.damageNumbers.count(),
      animations: this.animations.count()
    };
  }
}
