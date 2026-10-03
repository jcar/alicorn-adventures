import { audio, tone } from './sfx';

/**
 * A gentle music box that makes itself up as it plays. It's used when a
 * level has no generated music file. Pentatonic, so it never sounds wrong.
 */
const SCALE = [0, 2, 4, 7, 9];
const PROGRESSION = [0, 5, 3, 4]; // I - vi - IV - V, as scale-degree roots in a major key
const CHORD_ROOT = [0, 9, 5, 7];

let timer: number | undefined;
let bus: GainNode | undefined;

export function playGeneratedMusic(bpm: number, root: number) {
  stopGeneratedMusic();
  const a = audio();
  if (!a) return;
  bus = a.ctx.createGain();
  bus.gain.value = 0.35;
  bus.connect(a.out);
  const beat = 60 / bpm;
  let step = 0;
  let prev = 2;
  const tick = () => {
    if (!bus) return;
    const bar = Math.floor(step / 8) % PROGRESSION.length;
    const chord = root + CHORD_ROOT[bar];
    if (step % 8 === 0) {
      tone(chord - 12, 0, beat * 7, 'sine', 0.12, bus);
      tone(chord - 5, 0, beat * 7, 'sine', 0.05, bus);
    }
    // Wander up or down the scale by small steps, with the odd rest.
    if (Math.random() > 0.2) {
      prev = Math.max(0, Math.min(9, prev + Math.floor(Math.random() * 5) - 2));
      const note = root + 12 + SCALE[prev % 5] + 12 * Math.floor(prev / 5);
      tone(note, 0, beat * 1.6, 'triangle', 0.06, bus);
    }
    step++;
  };
  tick();
  timer = window.setInterval(tick, (beat * 1000) / 2);
}

export function stopGeneratedMusic() {
  if (timer !== undefined) window.clearInterval(timer);
  timer = undefined;
  if (bus) {
    const b = bus;
    const a = audio();
    if (a) b.gain.linearRampToValueAtTime(0, a.ctx.currentTime + 0.5);
    setTimeout(() => b.disconnect(), 600);
  }
  bus = undefined;
}
