import Phaser from 'phaser';
import { GROUND_Y } from '../content';
import { GameState } from '../systems/GameState';
import { sfx, tone } from '../audio/sfx';
import type { World } from './types';
import type { Phases } from './Phases';

const TOUCH = 60;
const NOTES = [72, 74, 76, 79, 81, 84, 86, 88];
const LINE = 0xffffff;
/** Above the night sky overlay (19) and water (20): the stars are the point of the night. */
const DEPTH = 22;

/**
 * Constellations: a star sign shows a shape; she flies to touch its stars in
 * order, and lines draw between them. A wrong star just shows the shape again
 * (no fail). In an area with day and night, the stars only shine at night.
 */
export class Constellations {
  private checks: (() => void)[] = [];

  constructor(private w: World, private phases: Phases, private onSolved: (id: string) => void) {}

  build() {
    for (const def of this.w.level.constellations ?? []) this.buildOne(def);
  }

  /** Is she touching a star? */
  update() {
    for (const check of this.checks) check();
  }

  private buildOne(def: NonNullable<World['level']['constellations']>[number]) {
    const s = this.w.view;
    let done = GameState.hasFlag(`puzzle:${def.id}`);
    let next = done ? def.stars.length : 0;
    let misses = 0;
    let lastOops = -Infinity;
    let visible = true;

    const sign = s.add.image(def.x, GROUND_Y + 4, s.textures.exists('star-sign') ? 'star-sign' : 'pedestal').setOrigin(0.5, 1).setDepth(5);
    const lines = s.add.graphics().setDepth(DEPTH);
    const preview = s.add.graphics().setDepth(DEPTH).setAlpha(0);
    const stars = def.stars.map((p, i) => {
      // Its own twinkle (not the golden-star collectible), so it never looks like something to pick up.
      const tex = s.textures.exists('constellation-star') ? 'constellation-star' : 'gold-star';
      const img = s.add.image(p.x, p.y, tex).setScale(tex === 'gold-star' ? 0.75 : 0.9).setDepth(DEPTH + 1).setTint(done ? 0xfff6a0 : 0xe6ecff).setAlpha(done ? 1 : 0.9);
      s.tweens.add({ targets: img, angle: { from: -8, to: 8 }, duration: 1300 + i * 70, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      return img;
    });
    const glow = s.add.image(def.stars[0].x, def.stars[0].y, 'fx-light').setScale(1.1).setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH).setAlpha(0);

    const drawLines = (g: Phaser.GameObjects.Graphics, upTo: number, alpha: number) => {
      g.clear().lineStyle(7, LINE, alpha);
      for (let i = 1; i < upTo; i++) g.lineBetween(def.stars[i - 1].x, def.stars[i - 1].y, def.stars[i].x, def.stars[i].y);
    };
    if (done) drawLines(lines, def.stars.length, 0.9);

    // The next star to touch glows (always the first one, at the start).
    const pointAt = () => {
      if (done) return glow.setAlpha(0);
      const p = def.stars[next];
      glow.setPosition(p.x, p.y);
      s.tweens.killTweensOf(glow);
      glow.setAlpha(0.5);
      s.tweens.add({ targets: glow, alpha: 0.15, duration: 700, yoyo: true, repeat: -1 });
    };
    pointAt();

    /** Show the whole shape for a while (longer while she's finding it hard). */
    const showShape = () => {
      drawLines(preview, def.stars.length, 1);
      s.tweens.killTweensOf(preview);
      preview.setAlpha(0.55);
      s.tweens.add({ targets: preview, alpha: misses >= 2 ? 0.25 : 0, delay: 3500, duration: 1200 });
    };

    // Night-only stars, in an area with day and night.
    this.phases.onChange((p) => {
      visible = !this.phases.active || p === 'night';
      for (const img of stars) img.setVisible(visible);
      lines.setVisible(visible);
      preview.setVisible(visible);
      glow.setVisible(visible);
    });

    const win = () => {
      if (done) return;
      done = true;
      next = def.stars.length;
      GameState.setFlag(`puzzle:${def.id}`);
      GameState.recordPuzzle('memory', { firstTry: misses === 0, misses });
      drawLines(lines, def.stars.length, 0.9);
      stars.forEach((img) => img.setTint(0xfff6a0).setAlpha(1));
      pointAt();
      preview.setAlpha(0);
      s.time.delayedCall(300, () => {
        sfx.yay();
        const c = def.stars.reduce((a, p) => ({ x: a.x + p.x / def.stars.length, y: a.y + p.y / def.stars.length }), { x: 0, y: 0 });
        this.w.confetti(c.x, c.y, 70);
        this.w.hint('constellation-win');
        this.onSolved(def.id);
      });
    };
    this.w.registerSolver?.(def.x, win, () => ({ id: def.id, next, stars: def.stars.length, done }));

    this.w.addSpot({
      x: def.x, y: GROUND_Y, verb: 'to look at the star sign', promptY: GROUND_Y - sign.displayHeight - 60,
      enabled: () => !done,
      use: () => {
        if (this.phases.active && this.phases.phase !== 'night') return this.w.hint('constellation-day');
        showShape();
        this.w.hint('constellation-look');
      },
    });

    this.checks.push(() => {
      if (done || !visible) return;
      const pl = this.w.player;
      def.stars.forEach((p, i) => {
        if (i < next || Phaser.Math.Distance.Between(pl.x, pl.y - 30, p.x, p.y) > TOUCH) return;
        if (i === next) {
          next++;
          tone(NOTES[i % NOTES.length], 0, 0.4, 'triangle', 0.16);
          stars[i].setTint(0xfff6a0).setAlpha(1);
          s.tweens.add({ targets: stars[i], scale: 0.8, duration: 160, yoyo: true });
          drawLines(lines, next, 0.9);
          if (next === def.stars.length) win();
          else pointAt();
        } else if (s.time.now - lastOops > 2500) {
          // Not that one yet: show the shape again, and point at the right star.
          lastOops = s.time.now;
          misses++;
          sfx.soft();
          s.tweens.add({ targets: stars[i], x: p.x + 6, duration: 60, yoyo: true, repeat: 3 });
          showShape();
          this.w.hint('constellation-oops');
        }
      });
    });
  }
}
