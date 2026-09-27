/**
 * Procedural sound palette (Web Audio). Every sound is built from a
 * transient, a body and a tail, sits in one shared reverb, is tuned to D
 * major pentatonic, and varies in pitch on every play. Spatial sounds use an
 * HRTF panner at their position on the table so the player can turn toward
 * them. Buses: effects, ambience and UI into a master limiter.
 */
import { SCALE, TUNING } from './tuning.js';

export interface Pos {
  x: number;
  y: number;
  z: number;
}

export type SoundName =
  | 'footstep'
  | 'doorCreak'
  | 'shimmer'
  | 'incident'
  | 'clatter'
  | 'snap'
  | 'miss'
  | 'knock'
  | 'windowClick'
  | 'dawn'
  | 'verdictRight'
  | 'verdictWrong'
  | 'owl'
  | 'cricket';

export interface SoundProbe {
  name: SoundName;
  peak: number;
  rms: number;
  /** Time from the first to the last sample above -50 dBFS, in ms. */
  audibleMs: number;
  /** Zero crossings per second over the audible span: a rough brightness. */
  crossingsPerSec: number;
}

export class NightAudio {
  private ctx: BaseAudioContext | null = null;
  private offline = false;
  private master!: GainNode;
  private sfx!: GainNode;
  private amb!: GainNode;
  private ui!: GainNode;
  private reverbIn!: GainNode;
  private noise!: AudioBuffer;
  private windFilter: BiquadFilterNode | null = null;
  private windGain: GainNode | null = null;
  private nextCricket = 0;
  private nextOwl = 8;
  private nextBird = 0;
  private windTimer = 0;
  private ambienceOn = false;
  private day = false;
  private readonly center: Pos = { x: 0, y: 1, z: -0.5 };

  /** Creates or resumes the context. Call from a user gesture. */
  unlock(): void {
    if (this.ctx == null) this.build();
    if (this.ctx instanceof AudioContext) void this.ctx.resume();
  }

  suspend(): void {
    if (this.ctx instanceof AudioContext) void this.ctx.suspend();
  }

  get running(): boolean {
    return this.offline || this.ctx?.state === 'running';
  }

  private build(offline?: BaseAudioContext): void {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = offline ?? new Ctx({ latencyHint: 'interactive' });
    this.ctx = ctx;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -12;
    limiter.knee.value = 6;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.25;
    limiter.connect(ctx.destination);
    this.master = ctx.createGain();
    this.master.gain.value = TUNING.masterGain;
    this.master.connect(limiter);
    this.sfx = this.bus(TUNING.sfxGain);
    this.amb = this.bus(TUNING.ambienceGain);
    this.ui = this.bus(TUNING.uiGain);

    // One shared room: a convolver fed with a decaying stereo noise impulse.
    const reverb = ctx.createConvolver();
    reverb.buffer = this.impulse(TUNING.reverbSeconds);
    this.reverbIn = ctx.createGain();
    const reverbOut = ctx.createGain();
    reverbOut.gain.value = 0.8;
    this.reverbIn.connect(reverb);
    reverb.connect(reverbOut);
    reverbOut.connect(this.master);

    this.noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }

  private bus(gain: number): GainNode {
    const g = this.ctx!.createGain();
    g.gain.value = gain;
    g.connect(this.master);
    return g;
  }

  private impulse(seconds: number): AudioBuffer {
    const ctx = this.ctx!;
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buffer.getChannelData(c);
      for (let i = 0; i < length; i++) {
        const decay = Math.pow(1 - i / length, 3.2);
        d[i] = (Math.random() * 2 - 1) * decay * (i < 200 ? i / 200 : 1);
      }
    }
    return buffer;
  }

  private get t(): number {
    return this.ctx!.currentTime;
  }

  private jitter(): number {
    return 1 + (Math.random() * 2 - 1) * TUNING.pitchJitter;
  }

  /** A voice output: gain, optional 3D panner, bus and reverb send. */
  private out(pos: Pos | null, bus: GainNode, send: number, gain: number): GainNode {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    g.gain.value = gain;
    let tail: AudioNode = g;
    if (pos) {
      const p = ctx.createPanner();
      p.panningModel = 'HRTF';
      p.distanceModel = 'inverse';
      p.refDistance = 0.35;
      p.rolloffFactor = 1.1;
      p.positionX.value = pos.x;
      p.positionY.value = pos.y;
      p.positionZ.value = pos.z;
      g.connect(p);
      tail = p;
    }
    tail.connect(bus);
    if (send > 0) {
      const s = ctx.createGain();
      s.gain.value = send;
      tail.connect(s);
      s.connect(this.reverbIn);
    }
    return g;
  }

  private envelope(param: AudioParam, t0: number, attack: number, peak: number, decay: number): void {
    param.setValueAtTime(0.0001, t0);
    param.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t0 + attack);
    param.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
  }

  private noiseBurst(
    dest: AudioNode,
    t0: number,
    type: BiquadFilterType,
    freq: number,
    q: number,
    peak: number,
    decay: number,
    freqEnd?: number,
    attack = 0.002,
  ): void {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(freq, t0);
    if (freqEnd) filter.frequency.exponentialRampToValueAtTime(freqEnd, t0 + attack + decay);
    filter.Q.value = q;
    const g = ctx.createGain();
    this.envelope(g.gain, t0, attack, peak, decay);
    src.connect(filter).connect(g).connect(dest);
    const offset = Math.random() * 1.5;
    src.start(t0, offset);
    src.stop(t0 + attack + decay + 0.05);
  }

  private tone(
    dest: AudioNode,
    t0: number,
    type: OscillatorType,
    freq: number,
    peak: number,
    attack: number,
    decay: number,
    freqEnd?: number,
  ): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t0 + attack + decay);
    const g = ctx.createGain();
    this.envelope(g.gain, t0, attack, peak, decay);
    osc.connect(g).connect(dest);
    osc.start(t0);
    osc.stop(t0 + attack + decay + 0.05);
  }

  /** Two-operator FM: bright attack decaying to a pure tail (bells, tin). */
  private fm(dest: AudioNode, t0: number, freq: number, ratio: number, index: number, peak: number, decay: number): void {
    const ctx = this.ctx!;
    const carrier = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const modGain = ctx.createGain();
    carrier.frequency.value = freq;
    mod.frequency.value = freq * ratio;
    modGain.gain.setValueAtTime(freq * ratio * index, t0);
    modGain.gain.exponentialRampToValueAtTime(freq * 0.01, t0 + decay * 0.6);
    mod.connect(modGain).connect(carrier.frequency);
    const g = ctx.createGain();
    this.envelope(g.gain, t0, 0.003, peak, decay);
    carrier.connect(g).connect(dest);
    carrier.start(t0);
    mod.start(t0);
    carrier.stop(t0 + decay + 0.1);
    mod.stop(t0 + decay + 0.1);
  }

  private creak(dest: AudioNode, t0: number, freq: number, peak: number, length: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t0);
    osc.frequency.linearRampToValueAtTime(freq * 1.25, t0 + length);
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 9 + Math.random() * 5;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = freq * 0.15;
    lfo.connect(lfoGain).connect(osc.frequency);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 900;
    filter.Q.value = 3;
    const g = ctx.createGain();
    this.envelope(g.gain, t0, 0.04, peak, length);
    osc.connect(filter).connect(g).connect(dest);
    osc.start(t0);
    lfo.start(t0);
    osc.stop(t0 + length + 0.1);
    lfo.stop(t0 + length + 0.1);
  }

  setListener(pos: Pos, forward: Pos, up: Pos): void {
    const ctx = this.ctx;
    if (ctx == null) return;
    const l = ctx.listener;
    const t = ctx.currentTime;
    if (l.positionX) {
      l.positionX.setTargetAtTime(pos.x, t, 0.02);
      l.positionY.setTargetAtTime(pos.y, t, 0.02);
      l.positionZ.setTargetAtTime(pos.z, t, 0.02);
      l.forwardX.setTargetAtTime(forward.x, t, 0.02);
      l.forwardY.setTargetAtTime(forward.y, t, 0.02);
      l.forwardZ.setTargetAtTime(forward.z, t, 0.02);
      l.upX.setTargetAtTime(up.x, t, 0.02);
      l.upY.setTargetAtTime(up.y, t, 0.02);
      l.upZ.setTargetAtTime(up.z, t, 0.02);
    } else {
      l.setPosition(pos.x, pos.y, pos.z);
      l.setOrientation(forward.x, forward.y, forward.z, up.x, up.y, up.z);
    }
  }

  setCenter(pos: Pos): void {
    this.center.x = pos.x;
    this.center.y = pos.y;
    this.center.z = pos.z;
  }

  // ---- The palette -------------------------------------------------------

  footstep(pos: Pos): void {
    if (!this.running) return;
    const o = this.out(pos, this.sfx, 0.06, 0.7);
    const j = this.jitter();
    this.noiseBurst(o, this.t, 'bandpass', 2300 * j, 1.3, 0.7, 0.03);
    this.tone(o, this.t, 'sine', 430 * j, 0.3, 0.002, 0.04, 220 * j);
  }

  doorCreak(pos: Pos): void {
    if (!this.running) return;
    const o = this.out(pos, this.sfx, 0.25, 0.85);
    this.creak(o, this.t, 170 * this.jitter(), 0.5, 0.32);
    this.noiseBurst(o, this.t + 0.3, 'lowpass', 900, 0.7, 0.35, 0.05);
  }

  shimmer(pos: Pos, degree: number): void {
    if (!this.running) return;
    const o = this.out(pos, this.sfx, 0.35, 0.32);
    const f = SCALE[5 + (degree % 5)] * (1 + (Math.random() - 0.5) * 0.004);
    this.fm(o, this.t, f, 2, 1.1, 0.5, 1.1);
    this.fm(o, this.t + 0.012, f * 2.003, 2, 0.5, 0.18, 0.6);
  }

  incident(pos: Pos): void {
    if (!this.running) return;
    const t0 = this.t;
    const o = this.out(pos, this.sfx, 0.34, 1);
    this.creak(o, t0, 150 * this.jitter(), 0.35, 0.42);
    this.noiseBurst(o, t0 + 0.18, 'bandpass', 1800, 6, 0.45, 0.3, 4200);
    this.noiseBurst(o, t0 + 0.22, 'highpass', 3000, 0.7, 0.55, 0.008);
    this.fm(o, t0 + 0.22, 1320 * this.jitter(), 2.76, 2.2, 0.42, 0.75);
    this.fm(o, t0 + 0.31, 1480 * this.jitter(), 2.76, 1.8, 0.26, 0.5);
    this.tone(o, t0 + 0.22, 'sine', 150, 0.28, 0.003, 0.14, 85);
    this.duck();
  }

  clatter(pos: Pos): void {
    if (!this.running) return;
    const t0 = this.t;
    const o = this.out(pos, this.sfx, 0.3, 1.5);
    const hits = [0, 0.09, 0.2, 0.33];
    hits.forEach((dt, i) => {
      this.fm(o, t0 + dt, (700 + Math.random() * 420) * this.jitter(), 3.1, 3, 0.32 * (1 - i * 0.18), 0.26);
      this.noiseBurst(o, t0 + dt, 'lowpass', 3500, 0.7, 0.4 * (1 - i * 0.15), 0.05);
    });
    this.noiseBurst(o, t0 + 0.38, 'bandpass', 1200, 2, 0.16, 0.5, 450);
    this.duck();
  }

  /** Tag snap; `step` climbs the scale with each mark in a night. */
  snap(pos: Pos, step: number): void {
    if (!this.running) return;
    const o = this.out(pos, this.sfx, 0.18, 2.4);
    const f = SCALE[Math.min(5 + step, SCALE.length - 1)];
    this.noiseBurst(o, this.t, 'highpass', 2600, 0.7, 0.6, 0.012);
    this.tone(o, this.t + 0.004, 'triangle', f, 0.34, 0.003, 0.28);
    this.tone(o, this.t + 0.004, 'sine', f * 2, 0.1, 0.003, 0.15);
  }

  /** A soft wooden "nothing there" when a pinch finds no one in the light. */
  miss(pos: Pos): void {
    if (!this.running) return;
    const o = this.out(pos, this.ui, 0.1, 1.0);
    this.tone(o, this.t, 'sine', 240 * this.jitter(), 0.25, 0.003, 0.09, 170);
    this.noiseBurst(o, this.t, 'bandpass', 1100, 1.5, 0.2, 0.02);
  }

  knock(pos: Pos, index: number): void {
    if (!this.running) return;
    const o = this.out(pos, this.ui, 0.12, 2.4);
    const f = SCALE[2 + index * 2] * 2;
    this.tone(o, this.t, 'sine', f * this.jitter(), 0.3, 0.002, 0.07, f * 0.8);
    this.noiseBurst(o, this.t, 'bandpass', 1600, 1.4, 0.3, 0.012);
  }

  windowClick(pos: Pos): void {
    if (!this.running) return;
    const o = this.out(pos, this.sfx, 0.12, 1.25);
    this.noiseBurst(o, this.t, 'bandpass', 3200 * this.jitter(), 2, 0.5, 0.03);
    this.tone(o, this.t, 'sine', 980 * this.jitter(), 0.14, 0.002, 0.06);
  }

  dawn(): void {
    if (!this.running) return;
    const ctx = this.ctx!;
    const t0 = this.t;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(250, t0);
    filter.frequency.exponentialRampToValueAtTime(2400, t0 + 2.4);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.07, t0 + 1.1);
    g.gain.setValueAtTime(0.07, t0 + 2.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 5);
    const o = this.out(null, this.sfx, 0.3, 1);
    filter.connect(g).connect(o);
    for (const f of [SCALE[0] / 2, 220, SCALE[0], SCALE[2]]) {
      for (const cents of [-6, 6]) {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = f;
        osc.detune.value = cents;
        osc.connect(filter);
        osc.start(t0);
        osc.stop(t0 + 5.1);
      }
    }
    for (const dt of [1.2, 1.45, 2.3]) this.bird(t0 + dt);
    this.day = true;
  }

  private bird(t0: number): void {
    const pos = {
      x: this.center.x + (Math.random() - 0.5) * 1.2,
      y: this.center.y + 0.3,
      z: this.center.z - 0.3 - Math.random() * 0.4,
    };
    const o = this.out(pos, this.amb, 0.3, 0.45);
    const f = 3200 * this.jitter();
    this.tone(o, t0, 'sine', f, 0.14, 0.005, 0.06, f * 1.35);
    this.tone(o, t0 + 0.09, 'sine', f * 1.1, 0.1, 0.005, 0.05, f * 1.5);
  }

  verdict(correct: boolean): void {
    if (!this.running) return;
    const t0 = this.t;
    const o = this.out(null, this.sfx, 0.35, 0.9);
    if (correct) {
      [5, 7, 8, 10].forEach((deg, i) => this.fm(o, t0 + i * 0.09, SCALE[deg], 2, 1.4, 0.3, 1.2));
      this.tone(o, t0 + 0.36, 'triangle', SCALE[0], 0.12, 0.05, 1.4);
      this.tone(o, t0 + 0.36, 'triangle', SCALE[3], 0.08, 0.05, 1.4);
    } else {
      const muffle = this.ctx!.createBiquadFilter();
      muffle.type = 'lowpass';
      muffle.frequency.value = 900;
      muffle.connect(o);
      this.tone(muffle, t0, 'triangle', SCALE[3], 0.3, 0.004, 0.35);
      this.tone(muffle, t0 + 0.22, 'triangle', SCALE[2], 0.3, 0.004, 0.5);
      this.tone(o, t0, 'sine', 110, 0.32, 0.004, 0.25, 55);
    }
    this.duck();
  }

  private owl(t0: number): void {
    const pos = {
      x: this.center.x + (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.4),
      y: this.center.y + 0.35,
      z: this.center.z - 0.4 - Math.random() * 0.3,
    };
    const o = this.out(pos, this.amb, 0.45, 1.0);
    const f = 400 * this.jitter();
    for (const [dt, mul] of [
      [0, 1],
      [0.46, 0.93],
    ] as const) {
      const ctx = this.ctx!;
      const osc = ctx.createOscillator();
      osc.frequency.value = f * mul;
      const vib = ctx.createOscillator();
      vib.frequency.value = 5;
      const vibGain = ctx.createGain();
      vibGain.gain.value = 6;
      vib.connect(vibGain).connect(osc.frequency);
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 900;
      const g = ctx.createGain();
      this.envelope(g.gain, t0 + dt, 0.06, 0.13, 0.32);
      osc.connect(lp).connect(g).connect(o);
      osc.start(t0 + dt);
      vib.start(t0 + dt);
      osc.stop(t0 + dt + 0.45);
      vib.stop(t0 + dt + 0.45);
    }
  }

  private cricket(t0: number): void {
    const angle = Math.random() * Math.PI * 2;
    const r = 0.35 + Math.random() * 0.5;
    const pos = {
      x: this.center.x + Math.cos(angle) * r,
      y: this.center.y - 0.05 + Math.random() * 0.2,
      z: this.center.z + Math.sin(angle) * r * 0.7,
    };
    const o = this.out(pos, this.amb, 0.15, 0.6);
    const f = 4300 + Math.random() * 600;
    const pulses = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < pulses; i++) {
      this.tone(o, t0 + i * 0.045, 'sine', f, 0.25, 0.003, 0.018, f * 0.97);
      this.tone(o, t0 + i * 0.045, 'sine', f * 2.01, 0.05, 0.003, 0.012);
    }
  }

  /** Starts the night ambience (wind bed plus scheduled crickets and owls). */
  startNight(): void {
    if (this.ctx == null) return;
    this.day = false;
    this.ambienceOn = true;
    this.nextCricket = 0;
    if (this.windGain == null) {
      const ctx = this.ctx;
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      src.loop = true;
      this.windFilter = ctx.createBiquadFilter();
      this.windFilter.type = 'lowpass';
      this.windFilter.frequency.value = 420;
      this.windFilter.Q.value = 0.8;
      this.windGain = ctx.createGain();
      this.windGain.gain.value = 0.0001;
      src.connect(this.windFilter).connect(this.windGain).connect(this.amb);
      src.start();
    }
    this.windGain.gain.setTargetAtTime(0.07, this.t, 1.5);
    this.amb.gain.setTargetAtTime(TUNING.ambienceGain, this.t, 0.5);
  }

  stopAmbience(): void {
    this.ambienceOn = false;
    if (this.ctx && this.windGain) this.windGain.gain.setTargetAtTime(0.0001, this.t, 0.8);
  }

  /** Lowers the ambience briefly so a major event stands alone. */
  duck(): void {
    if (this.ctx == null) return;
    const g = this.amb.gain;
    const t = this.t;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(TUNING.ambienceGain * TUNING.duckAmount, t + 0.03);
    g.linearRampToValueAtTime(TUNING.ambienceGain, t + 0.03 + TUNING.duckSeconds);
  }

  /** Schedules ambience events; call every frame with the frame time. */
  tick(dt: number, nightProgress: number): void {
    if (this.ctx == null || !this.running || !this.ambienceOn) return;
    const t = this.t;
    this.windTimer -= dt;
    if (this.windTimer <= 0 && this.windFilter && this.windGain) {
      // The wind wanders: new filter and level targets every few seconds.
      this.windTimer = 3 + Math.random() * 5;
      this.windFilter.frequency.setTargetAtTime(260 + Math.random() * 520, t, 2.2);
      this.windGain.gain.setTargetAtTime(this.day ? 0.02 : 0.035 + Math.random() * 0.06, t, 2.5);
    }
    if (this.day) {
      this.nextBird -= dt;
      if (this.nextBird <= 0) {
        this.nextBird = 1.2 + Math.random() * 3;
        this.bird(t + 0.02);
      }
      return;
    }
    // Crickets thicken in the middle of the night and thin toward dawn.
    const density = 0.5 + Math.sin(Math.min(1, nightProgress) * Math.PI) * 0.8;
    this.nextCricket -= dt;
    if (this.nextCricket <= 0) {
      this.nextCricket = (0.35 + Math.random() * 1.2) / density;
      this.cricket(t + 0.02);
    }
    this.nextOwl -= dt;
    if (this.nextOwl <= 0) {
      this.nextOwl = 18 + Math.random() * 16;
      this.owl(t + 0.02);
    }
  }
}

/**
 * Development check: renders one sound of the palette offline and measures
 * it, so the mix can be verified without listening (peak, level, length,
 * brightness).
 */
export async function probeSound(name: SoundName, seconds = 5): Promise<SoundProbe> {
  const rate = 48000;
  const offline = new OfflineAudioContext(2, rate * seconds, rate);
  const audio = new NightAudio();
  (audio as unknown as { offline: boolean }).offline = true;
  (audio as unknown as { build: (c: BaseAudioContext) => void }).build(offline);
  audio.setListener({ x: 0, y: 1.6, z: 0 }, { x: 0, y: 0, z: -1 }, { x: 0, y: 1, z: 0 });
  const pos = { x: 0.15, y: 1.2, z: -0.5 };
  const play: Record<SoundName, () => void> = {
    footstep: () => audio.footstep(pos),
    doorCreak: () => audio.doorCreak(pos),
    shimmer: () => audio.shimmer(pos, 2),
    incident: () => audio.incident(pos),
    clatter: () => audio.clatter(pos),
    snap: () => audio.snap(pos, 2),
    miss: () => audio.miss(pos),
    knock: () => audio.knock(pos, 1),
    windowClick: () => audio.windowClick(pos),
    dawn: () => audio.dawn(),
    verdictRight: () => audio.verdict(true),
    verdictWrong: () => audio.verdict(false),
    owl: () => (audio as unknown as { owl: (t: number) => void }).owl(0.01),
    cricket: () => (audio as unknown as { cricket: (t: number) => void }).cricket(0.01),
  };
  play[name]();
  const buffer = await offline.startRendering();
  const threshold = Math.pow(10, -50 / 20);
  let peak = 0;
  let sumSq = 0;
  let first = -1;
  let last = -1;
  let crossings = 0;
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);
  for (let i = 0; i < left.length; i++) {
    const v = Math.max(Math.abs(left[i]), Math.abs(right[i]));
    peak = Math.max(peak, v);
    sumSq += left[i] * left[i];
    if (v > threshold) {
      if (first < 0) first = i;
      last = i;
    }
    if (i > 0 && (left[i - 1] < 0) !== (left[i] < 0)) crossings++;
  }
  const span = first >= 0 ? (last - first) / rate : 0;
  return {
    name,
    peak: Number(peak.toFixed(3)),
    rms: Number(Math.sqrt(sumSq / left.length).toFixed(4)),
    audibleMs: Math.round(span * 1000),
    crossingsPerSec: span > 0 ? Math.round(crossings / seconds) : 0,
  };
}

/** One engine for the whole app so the 2D page can unlock it on click. */
export const nightAudio = new NightAudio();
