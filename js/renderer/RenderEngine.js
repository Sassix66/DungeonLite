import { CanvasRenderer } from "./CanvasRenderer.js";
import { AssetManager } from "../assets/AssetManager.js";

export class RenderEngine {
  constructor(options = {}) {
    this.game = options.game;
    this.canvas = options.canvas;
    this.assetManager = new AssetManager();
    this.renderer = new CanvasRenderer({
      canvas: this.canvas
    });
    this.mode = options.mode || "dom";
    this.running = false;
    this.lastTime = performance.now();
    this.fps = 0;
    this.frameTime = 0;
    this.frameCount = 0;
    this.fpsAccumulator = 0;
    this.resizeObserver = null;
    this.boundLoop = this.loop.bind(this);
  }

  start() {
    if (this.running) return;

    this.running = true;
    this.observeSize();
    requestAnimationFrame(this.boundLoop);
  }

  stop() {
    this.running = false;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

  setMode(mode) {
    this.mode = mode === "canvas" ? "canvas" : "dom";
    this.syncVisibility();
  }

  toggleMode() {
    this.setMode(this.mode === "canvas" ? "dom" : "canvas");
    return this.mode;
  }

  observeSize() {
    const host = this.canvas.parentElement;

    if (!host) return;

    const resize = () => {
      const rect = host.getBoundingClientRect();
      this.renderer.resize(rect.width, rect.height);
    };

    resize();

    this.resizeObserver = new ResizeObserver(resize);
    this.resizeObserver.observe(host);
  }

  syncVisibility() {
    const board = document.querySelector(".dungeon-board");

    if (board) {
      board.classList.toggle(
        "renderer-hidden",
        this.mode === "canvas"
      );
    }

    this.canvas.classList.toggle(
      "active",
      this.mode === "canvas"
    );
  }

  loop(now) {
    if (!this.running) return;

    const deltaTime = Math.min(100, now - this.lastTime);
    this.lastTime = now;

    this.frameTime = deltaTime;
    this.frameCount += 1;
    this.fpsAccumulator += deltaTime;

    if (this.fpsAccumulator >= 500) {
      this.fps = Math.round(
        this.frameCount * 1000 / this.fpsAccumulator
      );
      this.frameCount = 0;
      this.fpsAccumulator = 0;
    }

    if (this.mode === "canvas") {
      this.renderer.render(
        this.game.currentRoom,
        {
          time: now,
          deltaTime,
          fps: this.fps
        }
      );
    }

    requestAnimationFrame(this.boundLoop);
  }

  stats() {
    return {
      mode: this.mode,
      fps: this.fps,
      frameTime: this.frameTime,
      ...this.renderer.stats()
    };
  }
}
