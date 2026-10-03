import Phaser from 'phaser';
import { AREA_COLORS, GROUND_Y } from '../content';
import { GameState } from '../systems/GameState';
import { sfx } from '../audio/sfx';
import type { World } from './types';

const PICKUP_REACH = 65;

interface Pickup { img: Phaser.GameObjects.Image; available: boolean; collect: () => void }

/**
 * Treasure chests, clue notes, golden stars, color sparks and story items.
 * Anything marked hidden stays invisible until Sniff finds it.
 */
export class Secrets {
  private pickups: Pickup[] = [];
  /** Chests that appear when a pattern puzzle is solved. */
  private byPattern = new Map<string, () => void>();

  constructor(private w: World) {}

  build() {
    this.buildDecos();
    this.buildChests();
    this.buildNotes();
    this.buildGolds();
    this.buildSpark();
    this.buildStoryItems();
  }

  patternSolved(patternId: string) {
    this.byPattern.get(patternId)?.();
  }

  update() {
    const p = this.w.player;
    for (const k of this.pickups)
      if (k.available && !this.w.isHiddenByDark(k.img.x, k.img.y) && Phaser.Math.Distance.Between(p.x, p.y, k.img.x, k.img.y) < PICKUP_REACH) {
        k.available = false;
        k.collect();
      }
  }

  // ------------------------------------------------------------

  /** Start invisible; Sniff (or a solved pattern) pops it into view. */
  private hide(img: Phaser.GameObjects.Image, x: number, y: number, onReveal: () => void) {
    img.setAlpha(0);
    this.w.addHidden({
      x, y, revealed: false,
      reveal: () => {
        this.popIn(img);
        onReveal();
      },
    });
  }

  private popIn(img: Phaser.GameObjects.Image) {
    const s = this.w.view;
    img.setAlpha(1).setScale(0);
    s.tweens.add({ targets: img, scale: 1, duration: 500, ease: 'Back.out' });
    s.add.particles(img.x, img.y - 30, 'fx-star', {
      speed: { min: 60, max: 180 }, lifespan: 700, scale: { start: 0.9, end: 0 }, tint: [0xfff6a0, 0xffffff], emitting: false,
    }).setDepth(9).explode(18);
  }

  private buildDecos() {
    for (const d of this.w.level.decos ?? [])
      this.w.view.add.image(d.x, (d.y ?? GROUND_Y) + 4, d.texture).setOrigin(0.5, 1).setDepth(4);
  }

  private buildChests() {
    const s = this.w.view;
    for (const c of this.w.level.chests ?? []) {
      let opened = GameState.hasFlag(`secret:${c.id}`);
      const img = s.add.image(c.x, c.y + 4, opened ? 'chest-open' : 'chest').setOrigin(0.5, 1).setDepth(6);
      let available = !c.hidden && !c.byPattern;
      if (c.byPattern && !GameState.hasFlag(`puzzle:${c.byPattern}`) && !opened) {
        img.setAlpha(0);
        this.byPattern.set(c.byPattern, () => { this.popIn(img); available = true; });
      } else if (c.byPattern) available = true;
      if (c.hidden && !opened) this.hide(img, c.x, c.y, () => { available = true; });
      else if (c.hidden) available = true;

      this.w.addSpot({
        x: c.x, y: c.y, verb: 'to open', promptY: c.y - 110,
        enabled: () => available && !opened,
        use: () => {
          opened = true;
          GameState.setFlag(`secret:${c.id}`);
          img.setTexture('chest-open');
          s.tweens.add({ targets: img, scaleY: 1.15, duration: 120, yoyo: true });
          sfx.yay();
          this.w.confetti(c.x, c.y - 60, 40);
          this.w.giveStardust(c.reward.stardust ?? 0, c.x, c.y - 120);
          this.w.hint('chest-open');
        },
      });
    }
  }

  private buildNotes() {
    const s = this.w.view;
    for (const n of this.w.level.notes ?? []) {
      const img = s.add.image(n.x, n.y + 4, n.secret ? 'note' : 'sign').setOrigin(0.5, 1).setDepth(5);
      let available = !n.hidden || GameState.hasFlag(`secret:${n.id}`);
      if (!available) this.hide(img, n.x, n.y, () => { available = true; });
      if (n.secret) s.tweens.add({ targets: img, angle: { from: -3, to: 3 }, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.w.addSpot({
        x: n.x, y: n.y, verb: 'to read', promptY: n.y - 130,
        enabled: () => available,
        use: () => {
          sfx.soft();
          this.w.say(n.line, n.x, n.y - img.displayHeight - 10, 7000);
          if (n.secret && GameState.setFlag(`secret:${n.id}`)) {
            this.w.giveStardust(5, n.x, n.y - 150);
            s.time.delayedCall(7200, () => this.w.hint('new-clue'));
          }
        },
      });
    }
  }

  private buildGolds() {
    const s = this.w.view;
    for (const g of this.w.level.golds ?? []) {
      if (GameState.hasFlag(`gold:${g.id}`)) continue;
      const img = s.add.image(g.x, g.y, 'gold-star').setDepth(7);
      s.tweens.add({ targets: img, scale: 1.2, angle: 15, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      s.add.particles(g.x, g.y, 'fx-star', { lifespan: 900, frequency: 160, speed: 40, scale: { start: 0.7, end: 0 }, tint: 0xffd23c }).setDepth(6);
      this.pickups.push({
        img, available: true,
        collect: () => {
          GameState.setFlag(`gold:${g.id}`);
          sfx.yay();
          this.w.confetti(g.x, g.y, 50);
          this.w.hint('gold-star');
          s.tweens.killTweensOf(img);
          s.tweens.add({ targets: img, scale: 3, alpha: 0, angle: 360, duration: 700, onComplete: () => img.destroy() });
        },
      });
    }
  }

  private buildSpark() {
    const sp = this.w.level.spark;
    const id = this.w.level.id;
    if (!sp || GameState.hasFlag(`spark:${id}`)) return;
    const s = this.w.view;
    const color = AREA_COLORS[id] ?? 0xffffff;
    const glow = s.add.image(sp.x, sp.y, 'fx-light').setTint(color).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.6).setDepth(6);
    const img = s.add.image(sp.x, sp.y, 'spark').setTint(color).setDepth(7);
    s.tweens.add({ targets: [img, glow], y: sp.y - 16, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.pickups.push({
      img, available: true,
      collect: () => {
        GameState.setFlag(`spark:${id}`);
        sfx.yay();
        this.w.confetti(sp.x, sp.y, 70);
        this.w.hint('spark-found');
        s.tweens.killTweensOf([img, glow]);
        s.tweens.add({ targets: [img, glow], scale: 3, alpha: 0, duration: 900, onComplete: () => { img.destroy(); glow.destroy(); } });
      },
    });
  }

  private buildStoryItems() {
    const s = this.w.view;
    for (const it of this.w.level.storyItems ?? []) {
      if (GameState.hasFlag(`has:${it.id}`) || GameState.hasFlag(`gave:${it.id}`)) continue;
      const img = s.add.image(it.x, it.y, `item-${it.id === 'moon-shell' ? 'shell' : it.id}`).setDepth(7);
      const pickup: Pickup = {
        img, available: !it.hidden,
        collect: () => {
          GameState.setFlag(`has:${it.id}`);
          sfx.item();
          this.w.hint('item-found');
          s.tweens.add({ targets: img, y: img.y - 90, scale: 2, alpha: 0, duration: 700, onComplete: () => img.destroy() });
        },
      };
      if (it.hidden) this.hide(img, it.x, it.y, () => { pickup.available = true; });
      this.pickups.push(pickup);
    }
  }
}
