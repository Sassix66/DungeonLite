export class AudioManager {
  constructor() {
    this.context = null;
    this.enabled = true;
    this.masterVolume = 0.28;
  }

  ensureContext() {
    if (!this.enabled) return null;

    if (!this.context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      this.context = new AudioContextClass();
    }

    if (this.context.state === "suspended") {
      this.context.resume().catch(() => {});
    }

    return this.context;
  }

  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled && this.context?.state === "running") {
      this.context.suspend().catch(() => {});
    }
    return this.enabled;
  }

  tone({
    frequency = 440,
    endFrequency = frequency,
    duration = 0.12,
    volume = 0.25,
    type = "sine",
    delay = 0
  } = {}) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const start = ctx.currentTime + delay;
    const end = start + duration;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(20, frequency), start);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(20, endFrequency),
      end
    );

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, volume * this.masterVolume),
      start + 0.012
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(end + 0.02);
  }

  noise({
    duration = 0.12,
    volume = 0.22,
    delay = 0,
    filterFrequency = 1200
  } = {}) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const sampleCount = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < sampleCount; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / sampleCount);
    }

    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    const start = ctx.currentTime + delay;

    source.buffer = buffer;
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(filterFrequency, start);

    gain.gain.setValueAtTime(volume * this.masterVolume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(start);
  }

  play(name) {
    if (!this.enabled) return;

    switch (name) {
      case "attack":
        this.noise({ duration: 0.055, volume: 0.3, filterFrequency: 1800 });
        this.tone({ frequency: 220, endFrequency: 95, duration: 0.09, volume: 0.32, type: "sawtooth" });
        break;

      case "playerHit":
        this.tone({ frequency: 130, endFrequency: 70, duration: 0.16, volume: 0.35, type: "square" });
        this.noise({ duration: 0.11, volume: 0.25, filterFrequency: 700 });
        break;

      case "enemyDefeat":
        this.tone({ frequency: 250, endFrequency: 80, duration: 0.28, volume: 0.3, type: "sawtooth" });
        this.noise({ duration: 0.22, volume: 0.2, filterFrequency: 900 });
        break;

      case "bossDefeat":
        this.tone({ frequency: 160, endFrequency: 45, duration: 0.55, volume: 0.42, type: "sawtooth" });
        this.noise({ duration: 0.4, volume: 0.32, filterFrequency: 600 });
        this.tone({ frequency: 420, endFrequency: 620, duration: 0.28, volume: 0.2, type: "triangle", delay: 0.25 });
        break;

      case "explore":
        this.tone({ frequency: 380, endFrequency: 520, duration: 0.11, volume: 0.2, type: "triangle" });
        break;

      case "reveal":
        this.tone({ frequency: 420, endFrequency: 760, duration: 0.2, volume: 0.24, type: "sine" });
        this.tone({ frequency: 620, endFrequency: 940, duration: 0.18, volume: 0.16, type: "triangle", delay: 0.06 });
        break;

      case "vase":
        this.noise({ duration: 0.18, volume: 0.34, filterFrequency: 2600 });
        this.tone({ frequency: 900, endFrequency: 280, duration: 0.16, volume: 0.18, type: "square" });
        break;

      case "crate":
        this.noise({ duration: 0.2, volume: 0.34, filterFrequency: 950 });
        this.tone({ frequency: 180, endFrequency: 90, duration: 0.17, volume: 0.23, type: "triangle" });
        break;

      case "treasure":
        [520, 660, 820].forEach((frequency, index) => {
          this.tone({
            frequency,
            endFrequency: frequency * 1.04,
            duration: 0.17,
            volume: 0.22,
            type: "sine",
            delay: index * 0.08
          });
        });
        break;

      case "gold":
        [1000, 1300, 1600].forEach((frequency, index) => {
          this.tone({
            frequency,
            duration: 0.07,
            volume: 0.14,
            type: "square",
            delay: index * 0.045
          });
        });
        break;

      case "potion":
        this.tone({ frequency: 440, endFrequency: 720, duration: 0.22, volume: 0.22, type: "sine" });
        this.tone({ frequency: 680, endFrequency: 900, duration: 0.18, volume: 0.13, type: "triangle", delay: 0.08 });
        break;

      case "trap":
        this.noise({ duration: 0.24, volume: 0.38, filterFrequency: 1700 });
        this.tone({ frequency: 260, endFrequency: 70, duration: 0.25, volume: 0.3, type: "square" });
        break;

      case "shrine":
        [330, 440, 660].forEach((frequency, index) => {
          this.tone({
            frequency,
            endFrequency: frequency * 1.1,
            duration: 0.45,
            volume: 0.13,
            type: "sine",
            delay: index * 0.09
          });
        });
        break;

      case "levelUp":
        [440, 554, 659, 880].forEach((frequency, index) => {
          this.tone({
            frequency,
            duration: 0.22,
            volume: 0.2,
            type: "triangle",
            delay: index * 0.09
          });
        });
        break;

      case "stageComplete":
        [220, 330, 440, 660].forEach((frequency, index) => {
          this.tone({
            frequency,
            endFrequency: frequency * 1.04,
            duration: 0.38,
            volume: 0.2,
            type: "triangle",
            delay: index * 0.12
          });
        });
        break;

      case "stageStart":
        this.tone({ frequency: 260, endFrequency: 520, duration: 0.36, volume: 0.22, type: "sine" });
        this.tone({ frequency: 390, endFrequency: 780, duration: 0.32, volume: 0.15, type: "triangle", delay: 0.1 });
        break;

      case "equip":
        this.tone({ frequency: 300, endFrequency: 480, duration: 0.12, volume: 0.2, type: "square" });
        this.tone({ frequency: 720, duration: 0.08, volume: 0.12, type: "triangle", delay: 0.08 });
        break;

      case "sell":
        this.play("gold");
        break;

      case "save":
        this.tone({ frequency: 620, duration: 0.09, volume: 0.14, type: "square" });
        this.tone({ frequency: 820, duration: 0.1, volume: 0.16, type: "square", delay: 0.08 });
        break;

      case "error":
        this.tone({ frequency: 170, endFrequency: 130, duration: 0.18, volume: 0.22, type: "square" });
        break;

      case "talent":
        this.tone({ frequency: 480, endFrequency: 760, duration: 0.18, volume: 0.18, type: "triangle" });
        break;

      default:
        break;
    }
  }
}
