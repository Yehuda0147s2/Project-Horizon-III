/**
 * Procedural Web Audio API sound synthesizer
 * Zero external mp3/wav files. Lazy initialized on first user gesture.
 * Safe under private mode or restricted autoplay policies.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private initialized: boolean = false;

  public init(): void {
    if (this.initialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        if (this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        this.initialized = true;
      }
    } catch {
      // AudioContext unavailable or blocked
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playChop(): void {
    if (this.isMuted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.08);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.1);
    } catch {
      // Ignore audio failure
    }
  }

  public playPickaxe(): void {
    if (this.isMuted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(420, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.02);
      osc.frequency.exponentialRampToValueAtTime(220, t + 0.08);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.1);
    } catch {
      // Ignore audio failure
    }
  }

  public playCrystal(): void {
    if (this.isMuted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      [659.25, 987.77, 1318.51].forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + i * 0.02);
        gain.gain.setValueAtTime(0.12, t + i * 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28 + i * 0.02);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + i * 0.02);
        osc.stop(t + 0.3 + i * 0.02);
      });
    } catch {
      // Ignore
    }
  }

  public playPlace(): void {
    if (this.isMuted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(520, t + 0.1);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.18);
    } catch {
      // Ignore
    }
  }

  public playFootstep(): void {
    if (this.isMuted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(65, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.04);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.06);
    } catch {
      // Ignore
    }
  }

  public playWhoosh(): void {
    if (this.isMuted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.exponentialRampToValueAtTime(700, t + 0.06);
      osc.frequency.exponentialRampToValueAtTime(200, t + 0.14);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      osc.start(t);
      osc.stop(t + 0.16);
    } catch {
      // Ignore
    }
  }

  public playCraft(): void {
    if (this.isMuted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      // Anvil clink followed by rising harmony
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(587.33, t); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, t + 0.08); // A5
      gain1.gain.setValueAtTime(0.2, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(t);
      osc1.stop(t + 0.2);

      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, t + 0.08);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, t + 0.25); // D6
      gain2.gain.setValueAtTime(0.22, t + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(t + 0.08);
      osc2.stop(t + 0.36);
    } catch {
      // Ignore
    }
  }

  public playError(): void {
    if (this.isMuted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.setValueAtTime(120, t + 0.06);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.16);
    } catch {
      // Ignore
    }
  }

  public playEquip(): void {
    if (this.isMuted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(640, t + 0.07);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.11);
    } catch {
      // Ignore
    }
  }
}

export const sound = new SoundManager();
