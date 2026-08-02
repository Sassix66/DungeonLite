export class AssetManager {
  constructor() {
    this.images = new Map();
    this.audio = new Map();
    this.json = new Map();
    this.promises = new Map();
  }

  async loadImage(id, src) {
    if (this.images.has(id)) return this.images.get(id);
    if (this.promises.has(`image:${id}`)) {
      return this.promises.get(`image:${id}`);
    }

    const promise = new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        this.images.set(id, image);
        this.promises.delete(`image:${id}`);
        resolve(image);
      };
      image.onerror = () => {
        this.promises.delete(`image:${id}`);
        reject(new Error(`Bild konnte nicht geladen werden: ${src}`));
      };
      image.src = src;
    });

    this.promises.set(`image:${id}`, promise);
    return promise;
  }

  async loadJson(id, src) {
    if (this.json.has(id)) return this.json.get(id);

    const response = await fetch(src);

    if (!response.ok) {
      throw new Error(`JSON konnte nicht geladen werden: ${src}`);
    }

    const data = await response.json();
    this.json.set(id, data);
    return data;
  }

  getImage(id) {
    return this.images.get(id) || null;
  }

  getJson(id) {
    return this.json.get(id) || null;
  }

  hasImage(id) {
    return this.images.has(id);
  }

  clear() {
    this.images.clear();
    this.audio.clear();
    this.json.clear();
    this.promises.clear();
  }
}
