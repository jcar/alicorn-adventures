/**
 * Tiny synthesized sound effects. No files needed and they play instantly.
 * Everything is soft and bell-like, with nothing harsh or scary.
 */
let ctx: AudioContext | undefined;
let master: GainNode | undefined;
let muted = false;

export function audio(): { ctx: AudioContext; out: GainNode } | undefined {
  if (!ctx) {
    try {
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    } catch {
      return undefined;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return { ctx, out: master! };
}

export function setMuted(m: boolean) {
  muted = m;
  if (master) master.gain.value = m ? 0 : 0.5;
}
export const isMuted = () => muted;

const midiHz = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

export function tone(note: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.25, dest?: AudioNode) {
  const a = audio();
  if (!a) return;
  const t = a.ctx.currentTime + start;
  const osc = a.ctx.createOscillator();
  const g = a.ctx.createGain();
  osc.type = type;
  osc.frequency.value = midiHz(note);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(dest ?? a.out);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

// Major pentatonic steps, so every combination of notes sounds nice.
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
let chimeStep = 0;
let lastChime = 0;

export const sfx = {
  /** Stardust pickup. Pitch climbs when you grab several in a row. */
  chime() {
    const now = performance.now();
    chimeStep = now - lastChime < 600 ? Math.min(chimeStep + 1, PENTA.length - 1) : 0;
    lastChime = now;
    const n = 79 + PENTA[chimeStep];
    tone(n, 0, 0.35, 'sine', 0.18);
    tone(n + 12, 0.02, 0.25, 'triangle', 0.06);
  },
  flap() {
    const a = audio();
    if (!a) return;
    const t = a.ctx.currentTime;
    const buf = a.ctx.createBuffer(1, a.ctx.sampleRate * 0.15, a.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = a.ctx.createBufferSource();
    src.buffer = buf;
    const f = a.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.setValueAtTime(600, t);
    f.frequency.linearRampToValueAtTime(1400, t + 0.12);
    const g = a.ctx.createGain();
    g.gain.value = 0.18;
    src.connect(f).connect(g).connect(a.out);
    src.start(t);
  },
  magic() {
    [0, 4, 7, 12, 16].forEach((s, i) => tone(84 + s, i * 0.05, 0.4, 'triangle', 0.1));
  },
  bloom() {
    [0, 7, 12].forEach((s, i) => tone(72 + s, i * 0.08, 0.5, 'sine', 0.15));
  },
  bounce() {
    const a = audio();
    if (!a) return;
    const t = a.ctx.currentTime;
    const osc = a.ctx.createOscillator();
    const g = a.ctx.createGain();
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(520, t + 0.18);
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    osc.connect(g).connect(a.out);
    osc.start(t);
    osc.stop(t + 0.35);
  },
  item() {
    tone(76, 0, 0.2, 'square', 0.06);
    tone(83, 0.08, 0.3, 'square', 0.06);
  },
  yay() {
    [60, 64, 67, 72, 76, 79, 84].forEach((n, i) => tone(n, i * 0.07, 0.6, 'triangle', 0.12));
    tone(72, 0.55, 1.2, 'sine', 0.12);
    tone(76, 0.55, 1.2, 'sine', 0.1);
    tone(79, 0.55, 1.2, 'sine', 0.1);
  },
  whoosh() {
    [67, 71, 74, 79].forEach((n, i) => tone(n, i * 0.04, 0.3, 'sine', 0.1));
  },
  select() {
    tone(88, 0, 0.12, 'sine', 0.12);
  },
  soft() {
    tone(64, 0, 0.25, 'sine', 0.12);
  },
};
