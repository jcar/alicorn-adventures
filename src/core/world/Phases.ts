import Phaser from 'phaser';
import { GROUND_Y, WORLD_HEIGHT } from '../content';
import { GameState } from '../systems/GameState';
import { sfx } from '../audio/sfx';
import type { World } from './types';
import { blockedLine } from './blocked';

type Phase = 'day' | 'night';
interface Wall { phase: Phase; x: number; art: Phaser.GameObjects.GameObject & { setAlpha(a: number): unknown }; body: Phaser.Physics.Arcade.StaticBody }

const REPEAT_HINT_MS = 15000;

/**
 * Day and night (Nyx's Moon Phase). Moon dials switch the whole area between
 * day and night. Sun walls are only there by day, shadow walls only at night,
 * and some things (like constellation stars) only shine at night. Every stretch
 * between walls has a dial (tests check), so she can never get stuck.
 */
export class Phases {
  phase: Phase = 'day';
  private walls: Wall[] = [];
  private night?: Phaser.GameObjects.Rectangle;
  private stars?: Phaser.GameObjects.Particles.ParticleEmitter;
  private listeners: ((p: Phase) => void)[] = [];

  constructor(private w: World) {}

  get active() { return !!this.w.level.phases; }

  /** Call `fn` now and whenever day turns to night or back. */
  onChange(fn: (p: Phase) => void) {
    this.listeners.push(fn);
    fn(this.phase);
  }

  build() {
    const L = this.w.level;
    if (!L.phases) return;
    const s = this.w.view;
    this.phase = L.phases.start;
    const { width, height } = s.scale;
    this.night = s.add.rectangle(0, 0, width, height, 0x1a1f5a, 0.42).setOrigin(0).setScrollFactor(0).setDepth(19);
    this.stars = s.add.particles(0, 0, 'fx-star', {
      x: { min: 0, max: width }, y: { min: 20, max: height * 0.5 }, lifespan: 2400, frequency: 220,
      scale: { start: 0.5, end: 0 }, alpha: { start: 0.9, end: 0 }, tint: [0xffffff, 0xfff6a0, 0xbfeaff],
    }).setScrollFactor(0).setDepth(19);

    for (const def of L.phaseWalls ?? []) {
      const tex = def.phase === 'day' ? L.art?.dayWall : L.art?.nightWall;
      const art = tex && s.textures.exists(tex)
        ? s.add.image(def.x + 32, WORLD_HEIGHT, tex).setOrigin(0.5, 1).setDisplaySize(110, WORLD_HEIGHT)
        : s.add.rectangle(def.x, 0, 64, WORLD_HEIGHT, def.phase === 'day' ? 0xffd86a : 0x3a2f7a, 0.75).setOrigin(0);
      art.setDepth(6);
      const zone = s.add.zone(def.x, 0, 64, WORLD_HEIGHT).setOrigin(0);
      s.physics.add.existing(zone, true);
      this.w.solids.add(zone);
      this.walls.push({ phase: def.phase, x: def.x, art, body: zone.body as Phaser.Physics.Arcade.StaticBody });
    }

    for (const d of L.moonDials ?? []) {
      const tex = L.art?.dial && s.textures.exists(L.art.dial) ? L.art.dial : 'pedestal';
      const img = s.add.image(d.x, GROUND_Y + 4, tex).setOrigin(0.5, 1).setDepth(5);
      if (!L.art?.dial) img.setTint(0xc9b8ff);
      this.w.addSpot({
        x: d.x, y: GROUND_Y, promptY: GROUND_Y - img.displayHeight - 70,
        get verb() { return GameState.hasPower('moon') ? 'to change day and night' : 'to look'; },
        use: () => this.useDial(),
      });
    }
    this.apply(false);
  }

  private useDial() {
    if (!GameState.hasPower('moon')) {
      sfx.soft();
      return this.w.hint(blockedLine(this.w, 'moon', 'dial-blocked'));
    }
    this.set(this.phase === 'day' ? 'night' : 'day');
  }

  set(p: Phase) {
    if (!this.active || p === this.phase) return;
    this.phase = p;
    sfx.magic();
    this.w.view.cameras.main.flash(400, p === 'night' ? 40 : 255, p === 'night' ? 40 : 245, p === 'night' ? 120 : 200);
    this.apply(true);
    this.w.hintOnce(`phase-${p}`, p === 'night' ? 'phase-night' : 'phase-day', 20000);
  }

  private apply(animate: boolean) {
    const night = this.phase === 'night';
    const s = this.w.view;
    if (this.night) animate ? s.tweens.add({ targets: this.night, alpha: night ? 1 : 0, duration: 600 }) : this.night.setAlpha(night ? 1 : 0);
    if (this.stars) this.stars.emitting = night;
    for (const wall of this.walls) {
      const there = wall.phase === this.phase;
      wall.body.enable = there;
      const a = there ? 1 : 0.12;
      animate ? s.tweens.add({ targets: wall.art, alpha: a, duration: 500 }) : wall.art.setAlpha(a);
    }
    // Don't trap her inside a wall that just appeared: nudge her back out the way she came.
    const p = this.w.player;
    for (const wall of this.walls)
      if (wall.body.enable && p.x > wall.x - 45 && p.x < wall.x + 64 + 45) p.body.reset(p.x < wall.x + 32 ? wall.x - 50 : wall.x + 64 + 50, p.y);
    for (const fn of this.listeners) fn(this.phase);
  }

  /** Reminders at a wall that's in the way right now. */
  update() {
    const p = this.w.player;
    for (const wall of this.walls) {
      if (!wall.body.enable || Math.abs(p.x - wall.x) > 160) continue;
      const line = GameState.hasPower('moon') ? (wall.phase === 'day' ? 'day-wall-hint' : 'night-wall-hint') : blockedLine(this.w, 'moon', 'phase-blocked');
      this.w.hintOnce(`phasewall-${wall.x}-${this.phase}`, line, REPEAT_HINT_MS);
    }
  }
}
