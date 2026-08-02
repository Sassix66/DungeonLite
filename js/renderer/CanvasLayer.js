export class CanvasLayer {
  constructor(name, zIndex) {
    this.name = name;
    this.zIndex = zIndex;
    this.visible = true;
    this.items = [];
  }

  clear() {
    this.items.length = 0;
  }

  add(drawCommand) {
    this.items.push(drawCommand);
  }

  draw(context, frameState) {
    if (!this.visible) return;

    for (const command of this.items) {
      command(context, frameState);
    }
  }
}
