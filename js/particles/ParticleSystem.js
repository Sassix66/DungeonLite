export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.maxParticles = 500;
  }

  emit(type, x, y, options = {}) {
    const presets = {
      blood: {
        count: 12,
        color: "#a82d3c",
        size: [2, 5],
        speed: [25, 70],
        life: [350, 700],
        gravity: 70
      },
      shards: {
        count: 10,
        color: "#9db9cb",
        size: [2, 5],
        speed: [30, 85],
        life: [420, 800],
        gravity: 100
      },
      dust: {
        count: 10,
        color: "#a58c70",
        size: [3, 7],
        speed: [10, 35],
        life: [450, 900],
        gravity: -5
      },
      gold: {
        count: 14,
        color: "#f1c654",
        size: [2, 5],
        speed: [25, 75],
        life: [500, 900],
        gravity: 55
      },
      water: {
        count: 12,
        color: "#70c7e6",
        size: [2, 5],
        speed: [18, 55],
        life: [450, 850],
        gravity: 45
      },
      light: {
        count: 14,
        color: "#e6f2b6",
        size: [2, 6],
        speed: [10, 35],
        life: [600, 1100],
        gravity: -15
      },
      miss: {
        count: 8,
        color: "#dce7f4",
        size: [2, 4],
        speed: [20, 50],
        life: [300, 600],
        gravity: -10
      }
    };

    const preset = presets[type] || presets.dust;
    const count = options.count || preset.count;

    for (let index = 0; index < count; index += 1) {
      if (this.particles.length >= this.maxParticles) {
        this.particles.shift();
      }

      const angle = Math.random() * Math.PI * 2;
      const speed = this.randomRange(preset.speed[0], preset.speed[1]);
      const life = this.randomRange(preset.life[0], preset.life[1]);
      const size = this.randomRange(preset.size[0], preset.size[1]);

      this.particles.push({
        type,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: preset.gravity,
        life,
        maxLife: life,
        size,
        color: options.color || preset.color,
        rotation: Math.random() * Math.PI * 2,
        spin: this.randomRange(-4, 4)
      });
    }
  }

  update(deltaTimeMs) {
    const dt = deltaTimeMs / 1000;

    for (const particle of this.particles) {
      particle.life -= deltaTimeMs;
      particle.vy += particle.gravity * dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.rotation += particle.spin * dt;
    }

    this.particles = this.particles.filter(
      particle => particle.life > 0
    );
  }

  draw(context) {
    for (const particle of this.particles) {
      const alpha = Math.max(0, particle.life / particle.maxLife);

      context.save();
      context.globalAlpha = alpha;
      context.translate(particle.x, particle.y);
      context.rotate(particle.rotation);
      context.fillStyle = particle.color;

      if (particle.type === "shards") {
        context.fillRect(
          -particle.size / 2,
          -particle.size,
          particle.size,
          particle.size * 2
        );
      } else {
        context.beginPath();
        context.arc(0, 0, particle.size, 0, Math.PI * 2);
        context.fill();
      }

      context.restore();
    }
  }

  count() {
    return this.particles.length;
  }

  randomRange(min, max) {
    return min + Math.random() * (max - min);
  }
}
