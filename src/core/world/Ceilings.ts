import Phaser from 'phaser';
import { GameState } from '../systems/GameState';
import { sfx } from '../audio/sfx';
import type { World } from './types';
import { blockedLine } from './blocked';

const GLASS_H = 36;
const SIDE_W = 36;
/** How far below the glass she can be and still Fizz Pop through it. */
const POP_REACH = 420;
const POP_SPEED = -1050;
const REPEAT_HINT_MS = 15000;

interface Ceiling { def: NonNullable<World['level']['ceilings']>[number]; glass?: Phaser.GameObjects.GameObject & { body: Phaser.Physics.Arcade.StaticBody } }

/**
 * Fizz Pop (Fluff's power) and the candy-glass ceilings it bursts through.
 * Each ceiling seals a little sky room: candy walls on both sides from the
 * top of the world down to the glass, so the only way in is up through it.
 */
export class Ceilings {
  private ceilings: Ceiling[] = [];

  constructor(private w: World) {}

  build() {
    const s = this.w.view;
    const L = this.w.level;
    for (const def of L.ceilings ?? []) {
      for (const x of [def.x - SIDE_W, def.x + def.w]) {
        const side = s.add.tileSprite(x, 0, SIDE_W, def.y + GLASS_H, `ground-${L.id}`).setOrigin(0).setDepth(5).setTint(0xf3c6e6);
        s.physics.add.existing(side, true);
        this.w.solids.add(side);
      }
      const c: Ceiling = { def };
      if (!GameState.hasFlag(`opened:${def.id}`)) {
        const tex = L.art?.ceiling;
        const glass = (tex && s.textures.exists(tex)
          ? s.add.image(def.x, def.y, tex).setDisplaySize(def.w, GLASS_H)
          : s.add.rectangle(def.x, def.y, def.w, GLASS_H, 0xff9fd6, 0.55).setStrokeStyle(4, 0xffffff, 0.9)
        ).setOrigin(0).setDepth(6);
        s.physics.add.existing(glass, true);
        this.w.solids.add(glass);
        c.glass = glass as Ceiling['glass'];
        s.tweens.add({ targets: glass, alpha: 0.75, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      }
      this.ceilings.push(c);
    }
  }

  /** The closed ceiling she's under, close enough to pop through. */
  private above() {
    const p = this.w.player;
    return this.ceilings.find((c) => c.glass && p.x >= c.def.x && p.x <= c.def.x + c.def.w && p.y > c.def.y && p.y - c.def.y < POP_REACH);
  }

  /** Horn magic under candy glass: a big soda bounce right through it. Returns true if it popped. */
  onMagic(): boolean {
    const c = this.above();
    if (!c || !GameState.hasPower('fizz')) return false;
    const s = this.w.view;
    const glass = c.glass!;
    c.glass = undefined;
    glass.body.enable = false;
    GameState.setFlag(`opened:${c.def.id}`);
    sfx.bounce();
    sfx.magic();
    s.add.particles(c.def.x + c.def.w / 2, c.def.y, 'fx-bubble', {
      x: { min: -c.def.w / 2, max: c.def.w / 2 }, speedY: { min: -260, max: -60 }, speedX: { min: -80, max: 80 }, lifespan: 1100,
      scale: { start: 1, end: 0.3 }, alpha: { start: 1, end: 0 }, tint: [0xff9fd6, 0xffffff, 0xbfeaff], emitting: false,
    }).setDepth(9).explode(60);
    s.tweens.killTweensOf(glass);
    s.tweens.add({ targets: glass, alpha: 0, duration: 400, onComplete: () => glass.destroy() });
    this.w.player.bounce(POP_SPEED);
    return true;
  }

  update() {
    const c = this.above();
    if (!c) return;
    const line = GameState.hasPower('fizz') ? 'ceiling-fizz' : blockedLine(this.w, 'fizz', 'ceiling-blocked');
    this.w.hintOnce(`ceiling-${c.def.id}`, line, REPEAT_HINT_MS);
  }
}
