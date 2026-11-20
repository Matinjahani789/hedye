// Optional, synthesized interface sounds (no audio files, no microphone, muted by default).
// Audio only starts after an explicit tap on the sound toggle.

class Sfx {
  private ctx: AudioContext | null = null;
  enabled = false;

  setEnabled(on: boolean) {
    this.enabled = on;
    if (on) {
      try {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AC) { this.enabled = false; return; }
        this.ctx = this.ctx ?? new AC();
        void this.ctx.resume();
        this.tone(660, 0.18, "sine", 0.05);
      } catch {
        this.enabled = false;
      }
    }
  }

  private tone(freq: number, dur: number, type: OscillatorType = "sine", gain = 0.05, delay = 0) {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  tap() { this.tone(520, 0.12, "triangle", 0.035); }
  pop() { this.tone(880, 0.09, "sine", 0.04); this.tone(1320, 0.12, "sine", 0.025, 0.05); }
  chime() { [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.5, "sine", 0.035, i * 0.09)); }
  whoosh() { this.tone(240, 0.35, "sine", 0.03); this.tone(360, 0.3, "sine", 0.02, 0.08); }
  flip() { this.tone(300, 0.08, "triangle", 0.03); }
}

export const sfx = new Sfx();
