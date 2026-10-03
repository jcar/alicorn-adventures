import Phaser from 'phaser';
import { GROUND_Y } from '../data/levels';
import { GameState } from '../systems/GameState';
import { sfx, tone } from '../audio/sfx';
import type { World } from './types';

const COLORS = [0xff7eb9, 0xffc93c, 0x5ec8ff, 0x6fe36f, 0xa77bff, 0xff9a4c];
const NOTES = [72, 74, 76, 79, 81, 84]; // pentatonic, so any tune sounds sweet
const STEP_MS = 700;

type State = 'idle' | 'demo' | 'turn' | 'done';

/**
 * Pattern crystals: they chime a little tune, then you press ↓ at each
 * crystal in the same order. Tunes get longer in later areas.
 */
export class Patterns {
  constructor(private w: World, private onSolved: (id: string) => void) {}

  build() {
    for (const def of this.w.level.patterns ?? []) this.buildOne(def);
  }

  private buildOne(def: NonNullable<World['level']['patterns']>[number]) {
    const s = this.w.view;
    let state: State = GameState.hasFlag(`puzzle:${def.id}`) ? 'done' : 'idle';
    let pos = 0;

    s.add.image(def.x, GROUND_Y + 4, 'pedestal').setOrigin(0.5, 1).setDepth(5);
    const crystals = def.crystals.map((c, i) => {
      const img = s.add.image(c.x, c.y, 'crystal').setTint(COLORS[i % COLORS.length]).setDepth(6).setAlpha(state === 'done' ? 1 : 0.7);
      s.tweens.add({ targets: img, y: c.y - 8, duration: 1100 + i * 90, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      return img;
    });

    // The same tune every time for this puzzle, so it can be practiced.
    const rnd = new Phaser.Math.RandomDataGenerator([def.id]);
    const tune: number[] = [];
    while (tune.length < def.length) {
      const n = rnd.between(0, crystals.length - 1);
      if (n !== tune[tune.length - 1]) tune.push(n);
    }

    const flash = (i: number) => {
      const img = crystals[i];
      tone(NOTES[i % NOTES.length], 0, 0.5, 'triangle', 0.16);
      img.setAlpha(1);
      s.tweens.add({ targets: img, scale: 1.35, duration: 160, yoyo: true, onComplete: () => { if (state !== 'done') img.setAlpha(0.7); } });
      s.add.particles(img.x, img.y, 'fx-star', {
        speed: { min: 40, max: 140 }, lifespan: 500, scale: { start: 0.8, end: 0 }, tint: COLORS[i % COLORS.length], emitting: false,
      }).setDepth(8).explode(10);
    };

    const demo = () => {
      state = 'demo';
      pos = 0;
      tune.forEach((n, k) => s.time.delayedCall(600 + k * STEP_MS, () => flash(n)));
      s.time.delayedCall(600 + tune.length * STEP_MS + 200, () => {
        if (state === 'done') return;
        state = 'turn';
        this.w.hint('pattern-turn');
      });
    };

    const win = () => {
      if (state === 'done') return;
      state = 'done';
      GameState.setFlag(`puzzle:${def.id}`);
      crystals.forEach((c) => c.setAlpha(1));
      s.time.delayedCall(400, () => {
        sfx.yay();
        this.w.confetti(def.x, GROUND_Y - 200, 60);
        this.w.hint('pattern-win');
        this.onSolved(def.id);
      });
    };
    this.w.registerSolver?.(def.x, win);

    this.w.addSpot({
      x: def.x, y: GROUND_Y, verb: 'to play', promptY: GROUND_Y - 150,
      enabled: () => state === 'idle' || state === 'turn',
      use: () => {
        this.w.hint('pattern-start');
        s.time.delayedCall(2400, demo);
        state = 'demo';
      },
    });

    crystals.forEach((_img, i) =>
      this.w.addSpot({
        x: def.crystals[i].x, y: def.crystals[i].y, verb: 'to chime', promptY: def.crystals[i].y - 70,
        reachX: 55, reachY: 170,
        enabled: () => state === 'turn',
        use: () => {
          flash(i);
          if (tune[pos] !== i) {
            state = 'demo';
            sfx.soft();
            this.w.hint('pattern-oops');
            s.time.delayedCall(1800, demo);
            return;
          }
          pos++;
          if (pos < tune.length) return;
          win();
        },
      }),
    );
  }
}
