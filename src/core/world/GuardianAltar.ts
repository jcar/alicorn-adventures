import Phaser from 'phaser';
import { AREA_COLORS, GROUND_Y, WORLD_HEIGHT, type KingdomDef } from '../content';
import { GameState } from '../systems/GameState';
import { sfx } from '../audio/sfx';
import { titleStyle } from '../ui/style';
import type { World } from './types';

/**
 * A kingdom's Guardian Star altar, in its hub. Each area hides one shard
 * (its color spark); with every shard found, the star shines again: that's
 * the kingdom's finale and one more of Pip's family found.
 */
export class GuardianAltar {
  private altar?: Phaser.GameObjects.Image;
  private shards: Phaser.GameObjects.Image[] = [];

  constructor(private w: World, private kingdom: KingdomDef) {}

  build() {
    const saga = this.kingdom.saga;
    const station = this.w.level.stations.find((s) => s.kind === 'altar');
    if (!saga || !station) return;
    const s = this.w.view;
    const x = station.x;
    this.altar = s.add.image(x, GROUND_Y + 4, saga.altarTexture).setOrigin(0.5, 1).setDepth(4);
    const top = GROUND_Y - this.altar.displayHeight;
    s.add.text(x, top - 30, saga.starName, titleStyle(28)).setOrigin(0.5, 1).setDepth(4);
    saga.shards.forEach((area, i) => {
      const a = Math.PI + (Math.PI * (i + 0.5)) / saga.shards.length;
      const gem = s.add.image(x + Math.cos(a) * 130, GROUND_Y - 130 + Math.sin(a) * 120, 'spark').setScale(0.55).setDepth(5);
      this.shards.push(gem);
      if (GameState.hasFlag(`spark:${area}`)) {
        gem.setTint(AREA_COLORS[area] ?? 0xffffff);
        s.tweens.add({ targets: gem, scale: 0.65, duration: 900 + i * 100, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      } else gem.setTint(0x8f86a8).setAlpha(0.5);
    });
    if (GameState.hasFlag(saga.flag)) this.shine();
    else this.altar.setTint(0xb8b4c8);
    this.w.addSpot({ x, y: GROUND_Y, verb: 'to look', promptY: top - 90, use: () => this.look() });
  }

  private look() {
    const saga = this.kingdom.saga!;
    const found = saga.shards.filter((a) => GameState.hasFlag(`spark:${a}`)).length;
    if (GameState.hasFlag(saga.flag)) return this.w.hint(saga.lines.done);
    if (found < saga.shards.length) return this.w.hint(saga.lines.status[Math.min(found, saga.lines.status.length - 1)]);
    this.finale();
  }

  private shine() {
    const s = this.w.view;
    const a = this.altar!;
    a.clearTint();
    const glow = s.add.image(a.x, GROUND_Y - 140, 'fx-light').setScale(3.2).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.5).setDepth(3);
    s.tweens.add({ targets: glow, alpha: 0.25, duration: 1400, yoyo: true, repeat: -1 });
    s.add.particles(a.x, GROUND_Y - 160, 'fx-star', {
      x: { min: -90, max: 90 }, y: { min: -110, max: 60 }, lifespan: 1600, frequency: 90, speedY: { min: -40, max: -10 },
      scale: { start: 0.8, end: 0 }, tint: [0xfff6a0, 0xffffff, 0xbfeaff],
    }).setDepth(5);
  }

  private finale() {
    const saga = this.kingdom.saga!;
    const s = this.w.view;
    const a = this.altar!;
    GameState.setFlag(saga.flag);
    s.cameras.main.pan(a.x, WORLD_HEIGHT / 2, 700, 'Sine.easeInOut');
    this.shards.forEach((g, i) =>
      s.tweens.add({ targets: g, x: a.x, y: GROUND_Y - 150, scale: 0.2, duration: 600, delay: i * 250, ease: 'Sine.in' }),
    );
    s.time.delayedCall(1700, () => {
      sfx.yay();
      s.cameras.main.flash(600, 255, 255, 255);
      this.shine();
      for (let k = 0; k < 3; k++) s.time.delayedCall(k * 500, () => this.w.confetti(a.x + (k - 1) * 200, GROUND_Y - 300, 90));
      this.w.hint(saga.lines.finale);
    });
    s.time.delayedCall(4200, () => s.cameras.main.startFollow(this.w.player, true, 0.1, 0.1));
  }
}
