import { CanvasRenderer } from "./CanvasRenderer.js";
import { AssetManager } from "../assets/AssetManager.js";

export class RenderEngine {
  constructor(options = {}) {
    this.game = options.game;
    this.canvas = options.canvas;
    this.assetManager = new AssetManager();
    this.renderer = new CanvasRenderer({
      canvas: this.canvas,
      getGameState: () => this.game.state
    });
    this.running = false;
    this.lastTime = performance.now();
    this.fps = 0;
    this.frameTime = 0;
    this.frameCount = 0;
    this.fpsAccumulator = 0;
    this.resizeObserver = null;
    this.boundLoop = this.loop.bind(this);
    this.boundPointer = this.handlePointer.bind(this);
    this.boundPointerMove = this.handlePointerMove.bind(this);
    this.boundPointerLeave = this.handlePointerLeave.bind(this);
  }

  start() {
    if (this.running) return;

    this.running = true;
    this.observeSize();
    this.canvas.addEventListener(
      "pointerup",
      this.boundPointer
    );
    this.canvas.addEventListener(
      "pointermove",
      this.boundPointerMove
    );
    this.canvas.addEventListener(
      "pointerleave",
      this.boundPointerLeave
    );
    requestAnimationFrame(this.boundLoop);
  }

  stop() {
    this.running = false;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.canvas.removeEventListener(
      "pointerup",
      this.boundPointer
    );
    this.canvas.removeEventListener(
      "pointermove",
      this.boundPointerMove
    );
    this.canvas.removeEventListener(
      "pointerleave",
      this.boundPointerLeave
    );
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

  handlePointer(event) {
    const hit = this.renderer.hitTest(
      event.clientX,
      event.clientY
    );

    if (!hit) return;

    if (hit.roomId !== this.game.currentRoom?.id) return;

    event.preventDefault();

    if (hit.type === "exit") {
      this.game.descendFloor();
      return;
    }

    if (hit.type === "tile") {
      this.game.actOnTile(hit.tileId);
    }
  }

  handlePointerMove(event) {
    const hit = this.renderer.hitTest(
      event.clientX,
      event.clientY
    );

    this.renderer.setHoveredHit(hit);
    this.canvas.style.cursor = hit ? "pointer" : "default";
  }

  handlePointerLeave() {
    this.renderer.setHoveredHit(null);
    this.canvas.style.cursor = "default";
  }

  triggerTileEffect(tile, type, text = "") {
    this.renderer.triggerTileEffect(tile, type, text);
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

    this.renderer.render(
      this.game.currentRoom,
      {
        time: now,
        deltaTime,
        fps: this.fps
      }
    );

    requestAnimationFrame(this.boundLoop);
  }

  stats() {
    return {
      mode: "canvas",
      fps: this.fps,
      frameTime: this.frameTime,
      ...this.renderer.stats()
    };
  }
}
