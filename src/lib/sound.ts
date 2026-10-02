/**
 * Synthesized sound effects (Web Audio) — no audio files, no licensing, works offline.
 * The AudioContext must be created from a user gesture (the "Ya, mulai" click).
 */

const MUTE_KEY = 'doorprize.muted';

class SoundFx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private rollTimer: number | null = null;
  muted = readMuted();

  /** Call from a click handler so the browser allows audio. */
  unlock(): void {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.8;
      this.master.connect(this.ctx.destination);
      this.noise = this.makeNoise(this.ctx);
    }
    void this.ctx.resume();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    try {
      localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
    } catch {
      /* storage unavailable */
    }
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.8, this.ctx.currentTime, 0.05);
    }
  }

  /** Short slot-machine click. */
  tick(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1800 + Math.random() * 400, t);
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    osc.connect(gain).connect(this.master!);
    osc.start(t);
    osc.stop(t + 0.04);
  }

  /** Snare roll that builds up until stopDrumroll(). */
  startDrumroll(): void {
    const ctx = this.ready();
    if (!ctx || this.rollTimer !== null) return;
    const started = ctx.currentTime;
    this.rollTimer = window.setInterval(() => {
      const t = ctx.currentTime;
      const intensity = Math.min(1, 0.25 + (t - started) / 6);
      this.noiseHit(t, 0.05 + intensity * 0.18, 0.06, 1800);
    }, 55);
  }

  stopDrumroll(withCymbal = true): void {
    if (this.rollTimer !== null) {
      window.clearInterval(this.rollTimer);
      this.rollTimer = null;
    }
    const ctx = this.ready();
    if (ctx && withCymbal) this.cymbal(ctx.currentTime, 0.35);
  }

  /** Brass-like fanfare: da-da-da-daaa + cymbal. */
  tada(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime;
    const notes: Array<[number, number, number]> = [
      // [frequency Hz, start offset s, duration s]
      [523.25, 0, 0.12], // C5
      [659.25, 0.12, 0.12], // E5
      [783.99, 0.24, 0.12], // G5
      [1046.5, 0.38, 0.9], // C6
    ];
    for (const [freq, offset, dur] of notes) this.brass(freq, t + offset, dur);
    // Supporting chord under the last note
    for (const freq of [523.25, 659.25, 783.99]) this.brass(freq, t + 0.38, 0.9, 0.06);
    this.cymbal(t + 0.38, 0.3);
  }

  /** Rising whistle followed by a crackling burst. */
  firework(delay = 0): void {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(2200, t + 0.45);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.05, t + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    osc.connect(gain).connect(this.master!);
    osc.start(t);
    osc.stop(t + 0.5);
    this.noiseHit(t + 0.45, 0.35, 0.5, 600);
    for (let i = 0; i < 6; i++) this.noiseHit(t + 0.55 + Math.random() * 0.5, 0.08, 0.05, 3000);
  }

  private ready(): AudioContext | null {
    return this.ctx && this.master && this.noise ? this.ctx : null;
  }

  private brass(freq: number, t: number, dur: number, level = 0.12): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 2, t);
    filter.frequency.linearRampToValueAtTime(freq * 5, t + 0.05);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(level, t + 0.03);
    gain.gain.setValueAtTime(level, t + dur * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(filter).connect(gain).connect(this.master!);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  private cymbal(t: number, level: number): void {
    this.noiseHit(t, level, 1.4, 6000, 'highpass');
  }

  private noiseHit(
    t: number,
    level: number,
    decay: number,
    cutoff: number,
    type: BiquadFilterType = 'bandpass',
  ): void {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    src.buffer = this.noise;
    filter.type = type;
    filter.frequency.value = cutoff;
    gain.gain.setValueAtTime(level, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    src.connect(filter).connect(gain).connect(this.master!);
    src.start(t, Math.random() * 0.5);
    src.stop(t + decay + 0.05);
  }

  private makeNoise(ctx: AudioContext): AudioBuffer {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }
}

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export const sfx = new SoundFx();
