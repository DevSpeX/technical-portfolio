/**
 * Pure TypeScript procedural Web Audio synthesizer for subtle, tactile
 * hardware-inspired UI feedback. Zero external audio assets; SSR-safe.
 */

interface WindowWithWebkitAudio extends Window {
  readonly webkitAudioContext?: typeof AudioContext;
}

const HOVER_COOLDOWN_MS = 38;

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private muted: boolean;
  private lastHoverAt = 0;

  constructor(initialMuted = true) {
    this.muted = initialMuted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 1, now, 0.012);
    }
  }

  /**
   * Lazily creates and unlocks the browser AudioContext.
   * Should be invoked from a user gesture when unmuting or playing audio.
   */
  public unlock(): AudioContext | null {
    return this.ensureContext();
  }

  /**
   * Barely perceptible, damped high-pass micro-click (~12ms, very quiet).
   */
  public playHover(): void {
    if (this.muted) {
      return;
    }

    const nowMs =
      typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (nowMs - this.lastHoverAt < HOVER_COOLDOWN_MS) {
      return;
    }
    this.lastHoverAt = nowMs;

    const ctx = this.ensureContext();
    const master = this.masterGain;
    if (!ctx || !master) {
      return;
    }

    const t = ctx.currentTime;
    const duration = 0.012;

    // Ultra-short high-pass filtered noise transient
    const noise = this.createNoiseSource(ctx);
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(2800, t);
    highpass.Q.setValueAtTime(0.8, t);

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(6200, t);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(0.022, t + 0.0015);
    env.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    noise.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(env);
    env.connect(master);

    noise.start(t);
    noise.stop(t + duration + 0.004);
  }

  /**
   * Crisp, weighty tactile hardware impulse for buttons and filter tabs.
   */
  public playClick(): void {
    if (this.muted) {
      return;
    }

    const ctx = this.ensureContext();
    const master = this.masterGain;
    if (!ctx || !master) {
      return;
    }

    const t = ctx.currentTime;

    // Layer 1: Damped mechanical body thock (pitch-swept triangle)
    const bodyOsc = ctx.createOscillator();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(230, t);
    bodyOsc.frequency.exponentialRampToValueAtTime(92, t + 0.026);

    const bodyFilter = ctx.createBiquadFilter();
    bodyFilter.type = 'lowpass';
    bodyFilter.frequency.setValueAtTime(950, t);

    const bodyEnv = ctx.createGain();
    bodyEnv.gain.setValueAtTime(0.0001, t);
    bodyEnv.gain.linearRampToValueAtTime(0.075, t + 0.002);
    bodyEnv.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);

    bodyOsc.connect(bodyFilter);
    bodyFilter.connect(bodyEnv);
    bodyEnv.connect(master);

    bodyOsc.start(t);
    bodyOsc.stop(t + 0.034);

    // Layer 2: Crisp contact snap (bandpass-filtered transient)
    const snapNoise = this.createNoiseSource(ctx);
    const snapFilter = ctx.createBiquadFilter();
    snapFilter.type = 'bandpass';
    snapFilter.frequency.setValueAtTime(2100, t);
    snapFilter.Q.setValueAtTime(1.5, t);

    const snapEnv = ctx.createGain();
    snapEnv.gain.setValueAtTime(0.0001, t);
    snapEnv.gain.linearRampToValueAtTime(0.042, t + 0.0012);
    snapEnv.gain.exponentialRampToValueAtTime(0.0001, t + 0.015);

    snapNoise.connect(snapFilter);
    snapFilter.connect(snapEnv);
    snapEnv.connect(master);

    snapNoise.start(t);
    snapNoise.stop(t + 0.018);
  }

  /**
   * Two-stage ascending frequency sweep for opening Command Palette / Case-Study Modal.
   */
  public playCommandOpen(): void {
    if (this.muted) {
      return;
    }

    const ctx = this.ensureContext();
    const master = this.masterGain;
    if (!ctx || !master) {
      return;
    }

    const t = ctx.currentTime;

    // Stage 1: Warm foundational sweep
    this.scheduleToneSweep(ctx, master, {
      startTime: t,
      duration: 0.068,
      fromFreq: 300,
      toFreq: 520,
      peakGain: 0.048,
      type: 'sine',
      filterFreq: 1900,
    });

    // Stage 2: Harmonic upper confirmation sweep
    this.scheduleToneSweep(ctx, master, {
      startTime: t + 0.034,
      duration: 0.078,
      fromFreq: 540,
      toFreq: 860,
      peakGain: 0.038,
      type: 'triangle',
      filterFreq: 2400,
    });
  }

  /**
   * Two-stage descending frequency sweep for closing Command Palette / Case-Study Modal.
   */
  public playCommandClose(): void {
    if (this.muted) {
      return;
    }

    const ctx = this.ensureContext();
    const master = this.masterGain;
    if (!ctx || !master) {
      return;
    }

    const t = ctx.currentTime;

    // Stage 1: Upper release sweep
    this.scheduleToneSweep(ctx, master, {
      startTime: t,
      duration: 0.056,
      fromFreq: 680,
      toFreq: 420,
      peakGain: 0.042,
      type: 'triangle',
      filterFreq: 1800,
    });

    // Stage 2: Grounding settle sweep
    this.scheduleToneSweep(ctx, master, {
      startTime: t + 0.028,
      duration: 0.068,
      fromFreq: 430,
      toFreq: 235,
      peakGain: 0.046,
      type: 'sine',
      filterFreq: 1400,
    });
  }

  /**
   * Technical telemetry ping for toggling Architecture X-Ray Inspector Mode.
   */
  public playInspectorToggle(activating = true): void {
    if (this.muted) {
      return;
    }

    const ctx = this.ensureContext();
    const master = this.masterGain;
    if (!ctx || !master) {
      return;
    }

    const t = ctx.currentTime;

    if (activating) {
      // Crisp telemetry lock-on: resonant fundamental + octave harmonic ping
      this.scheduleToneSweep(ctx, master, {
        startTime: t,
        duration: 0.055,
        fromFreq: 520,
        toFreq: 680,
        peakGain: 0.044,
        type: 'sine',
        filterFreq: 2600,
      });

      this.scheduleToneSweep(ctx, master, {
        startTime: t + 0.036,
        duration: 0.115,
        fromFreq: 1040,
        toFreq: 1080,
        peakGain: 0.04,
        type: 'sine',
        filterFreq: 3200,
      });
    } else {
      // Telemetry stand-down: descending precision double-ping
      this.scheduleToneSweep(ctx, master, {
        startTime: t,
        duration: 0.055,
        fromFreq: 880,
        toFreq: 640,
        peakGain: 0.04,
        type: 'sine',
        filterFreq: 2400,
      });

      this.scheduleToneSweep(ctx, master, {
        startTime: t + 0.035,
        duration: 0.095,
        fromFreq: 540,
        toFreq: 360,
        peakGain: 0.042,
        type: 'sine',
        filterFreq: 1800,
      });
    }
  }

  public dispose(): void {
    if (this.ctx) {
      const current = this.ctx;
      this.ctx = null;
      this.masterGain = null;
      this.noiseBuffer = null;
      void current.close().catch(() => {
        // Ignore close errors if context is already closed.
      });
    }
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') {
      return null;
    }

    if (!this.ctx) {
      const AudioCtor =
        window.AudioContext ??
        (window as WindowWithWebkitAudio).webkitAudioContext;

      if (!AudioCtor) {
        return null;
      }

      try {
        const ctx = new AudioCtor();
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(this.muted ? 0 : 1, ctx.currentTime);
        masterGain.connect(ctx.destination);

        this.ctx = ctx;
        this.masterGain = masterGain;
      } catch {
        return null;
      }
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {
        // Browser blocked resume outside user gesture; silently ignore.
      });
    }

    return this.ctx;
  }

  private createNoiseSource(ctx: AudioContext): AudioBufferSourceNode {
    if (!this.noiseBuffer || this.noiseBuffer.sampleRate !== ctx.sampleRate) {
      const length = Math.max(1, Math.floor(ctx.sampleRate * 0.05));
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const channel = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) {
        channel[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buffer;
    }

    const source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    return source;
  }

  private scheduleToneSweep(
    ctx: AudioContext,
    destination: AudioNode,
    params: {
      readonly startTime: number;
      readonly duration: number;
      readonly fromFreq: number;
      readonly toFreq: number;
      readonly peakGain: number;
      readonly type: OscillatorType;
      readonly filterFreq: number;
    },
  ): void {
    const osc = ctx.createOscillator();
    osc.type = params.type;
    osc.frequency.setValueAtTime(params.fromFreq, params.startTime);
    osc.frequency.exponentialRampToValueAtTime(
      params.toFreq,
      params.startTime + params.duration,
    );

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(params.filterFreq, params.startTime);
    filter.Q.setValueAtTime(0.7, params.startTime);

    const env = ctx.createGain();
    const attack = Math.min(0.006, params.duration * 0.25);
    env.gain.setValueAtTime(0.0001, params.startTime);
    env.gain.linearRampToValueAtTime(
      params.peakGain,
      params.startTime + attack,
    );
    env.gain.exponentialRampToValueAtTime(
      0.0001,
      params.startTime + params.duration,
    );

    osc.connect(filter);
    filter.connect(env);
    env.connect(destination);

    osc.start(params.startTime);
    osc.stop(params.startTime + params.duration + 0.008);
  }
}
