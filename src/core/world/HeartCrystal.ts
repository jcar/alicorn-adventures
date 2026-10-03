import Phaser from 'phaser';
import { AREA_COLORS, GROUND_Y, WORLD_HEIGHT } from '../content';
import { SPARK_AREAS } from '../content';
import { GameState } from '../systems/GameState';
import { sfx } from '../audio/sfx';
import type { Friend } from '../objects/Friend';
import type { World } from './types';

/**
 * The Heart Crystal in the Home Glade. Each color spark brings back one
 * color; with all five, plus Pip home safe, the mystery is solved.
 */
export class HeartCrystal {
  private crystal?: Phaser.GameObjects.Image;
  private gems: Phaser.GameObjects.Image[] = [];

  constructor(private w: World, private friends: Friend[]) {}

  build() {
    const station = this.w.level.stations.find((s) => s.kind === 'crystal');
    if (!station) return;
    const s = this.w.view;
    const x = station.x;
    this.crystal = s.add.image(x, GROUND_Y + 4, 'station-crystal').setOrigin(0.5, 1).setDepth(4);
    const top = GROUND_Y - this.crystal.height;
    s.add.text(x, top - 30, 'Heart Crystal', { fontFamily: '"Baloo 2", sans-serif', fontSize: '28px', fontStyle: '800', color: '#ffffff', stroke: '#7a4fd6', strokeThickness: 5 })
      .setOrigin(0.5, 1).setDepth(4);

    SPARK_AREAS.forEach((area, i) => {
      const a = Math.PI + (Math.PI * (i + 0.5)) / SPARK_AREAS.length;
      const gem = s.add.image(x + Math.cos(a) * 120, GROUND_Y - 120 + Math.sin(a) * 120, 'spark').setScale(0.55).setDepth(5);
      this.gems.push(gem);
      if (GameState.hasFlag(`spark:${area}`)) {
        gem.setTint(AREA_COLORS[area]);
        s.tweens.add({ targets: gem, scale: 0.65, duration: 900 + i * 100, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      } else gem.setTint(0x8f86a8).setAlpha(0.5);
    });

    if (GameState.hasFlag('mystery:solved')) this.shine();
    else this.crystal.setTint(0xb8b4c8);

    this.w.addSpot({ x, y: GROUND_Y, verb: 'to look', promptY: top - 90, use: () => this.look() });
  }

  private look() {
    const sparks = SPARK_AREAS.filter((a) => GameState.hasFlag(`spark:${a}`)).length;
    if (GameState.hasFlag('mystery:solved')) return this.w.hint('crystal-done');
    if (sparks < SPARK_AREAS.length) return this.w.hint(`crystal-${sparks}`);
    if (!GameState.hasHelped('pip')) return this.w.hint('crystal-need-pip');
    this.finale();
  }

  private shine() {
    const s = this.w.view;
    this.crystal!.clearTint();
    const glow = s.add.image(this.crystal!.x, GROUND_Y - 120, 'fx-light').setScale(3).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.5).setDepth(3);
    s.tweens.add({ targets: glow, alpha: 0.25, duration: 1400, yoyo: true, repeat: -1 });
    s.add.particles(this.crystal!.x, GROUND_Y - 140, 'fx-star', {
      x: { min: -80, max: 80 }, y: { min: -100, max: 60 }, lifespan: 1600, frequency: 90, speedY: { min: -40, max: -10 },
      scale: { start: 0.8, end: 0 }, tint: Object.values(AREA_COLORS),
    }).setDepth(5);
  }

  private finale() {
    const s = this.w.view;
    const c = this.crystal!;
    GameState.setFlag('mystery:solved');
    s.cameras.main.pan(c.x, WORLD_HEIGHT / 2, 700, 'Sine.easeInOut');
    this.gems.forEach((g, i) =>
      s.tweens.add({ targets: g, x: c.x, y: GROUND_Y - 130, scale: 0.2, duration: 600, delay: i * 250, ease: 'Sine.in' }),
    );
    s.time.delayedCall(1600, () => {
      sfx.yay();
      s.cameras.main.flash(600, 255, 255, 255);
      this.shine();
      const rainbow = s.add.image(c.x, GROUND_Y - 40, 'rainbow').setOrigin(0.5, 1).setDepth(-4).setAlpha(0).setScale(1.4);
      s.tweens.add({ targets: rainbow, alpha: 1, duration: 1500 });
      for (let k = 0; k < 3; k++) s.time.delayedCall(k * 500, () => this.w.confetti(c.x + (k - 1) * 200, GROUND_Y - 300, 90));
      this.friends.forEach((f) => f.celebrate());
      this.w.hint('crystal-finale');
    });
    s.time.delayedCall(4000, () => s.cameras.main.startFollow(this.w.player, true, 0.1, 0.1));
  }
}
