export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.zoom = 1;
    this.enabled = true;
  }

  apply(context) {
    if (!this.enabled) return;
    context.translate(this.x, this.y);
    context.scale(this.zoom, this.zoom);
  }

  reset() {
    this.x = 0;
    this.y = 0;
    this.zoom = 1;
  }
}
