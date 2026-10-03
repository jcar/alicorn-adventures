import Phaser from 'phaser';
import { GROUND_Y, WORLD_HEIGHT } from '../content';
import { GameState } from '../systems/GameState';
import { sfx } from '../audio/sfx';
import type { World } from './types';

const WIND_PUSH = -320;
const DASH_REACH = 220;
const MELT_REACH = 280;
const BUMP_SPEED = 520;
/** While she stays stuck at a barrier, remind her every so often. */
const REPEAT_HINT_MS = 15000;

interface IceWall { id: string; x: number; art: Phaser.GameObjects.Image; body: Phaser.Physics.Arcade.StaticBody; melted: boolean }
type WallDef = NonNullable<World['level']['walls']>[number];
interface PowerWall { def: WallDef; art: Phaser.GameObjects.Image; body: Phaser.Physics.Arcade.StaticBody; open: boolean }
type WindDef = NonNullable<World['level']['winds']>[number];
interface Bumper { img: Phaser.GameObjects.Image; lastHit: number }

/**
 * Things in the way: wind and water currents (need Dash / Bubble Jet), ice
 * walls (Warm Breath), power walls like sea-glass (Shell Song), number-lock
 * gates, and the bouncy clouds guarding golden stars.
 */
export class Barriers {
  private ice: IceWall[] = [];
  private walls: PowerWall[] = [];
  private bumpers: Bumper[] = [];

  constructor(private w: World) {}

  build() {
    this.buildWinds();
    this.buildIce();
    this.buildWalls();
    this.buildGates();
    this.buildBumpers();
  }

  private buildWinds() {
    const s = this.w.view;
    for (const wind of this.w.level.winds ?? []) {
      const water = wind.style === 'current';
      s.add.rectangle(wind.x, 0, wind.w, WORLD_HEIGHT, water ? 0x5ec8ff : 0xffffff, water ? 0.14 : 0.12).setOrigin(0).setDepth(8);
      s.add.particles(0, 0, water ? 'fx-bubble' : 'fx-dot', {
        x: { min: wind.x + wind.w, max: wind.x + wind.w + 20 }, y: { min: 20, max: GROUND_Y - 10 },
        speedX: { min: -900, max: -600 }, speedY: water ? { min: -40, max: 10 } : 0, lifespan: (wind.w / 700) * 1000, frequency: 25,
        scaleX: water ? 0.8 : { start: 2.6, end: 1.4 }, scaleY: water ? 0.8 : 0.35, alpha: { start: 0.8, end: 0.1 }, tint: 0xffffff,
      }).setDepth(8);
    }
  }

  private buildIce() {
    const s = this.w.view;
    for (const def of this.w.level.ice ?? []) {
      if (GameState.hasFlag(`melted:${def.id}`)) continue;
      const art = s.add.image(def.x + 32, WORLD_HEIGHT, 'ice-wall').setOrigin(0.5, 1).setDepth(6);
      art.setDisplaySize(art.width * (WORLD_HEIGHT / art.height), WORLD_HEIGHT);
      const zone = s.add.zone(def.x, 0, 64, WORLD_HEIGHT).setOrigin(0);
      s.physics.add.existing(zone, true);
      this.w.solids.add(zone);
      this.ice.push({ id: def.id, x: def.x, art, body: zone.body as Phaser.Physics.Arcade.StaticBody, melted: false });
    }
  }

  /** Walls that open with a power: draw them, block the way, remember once opened. */
  private buildWalls() {
    const s = this.w.view;
    for (const def of this.w.level.walls ?? []) {
      if (GameState.hasFlag(`opened:${def.id}`)) continue;
      const art = s.add.image(def.x + 32, WORLD_HEIGHT, def.texture).setOrigin(0.5, 1).setDepth(6);
      art.setDisplaySize(art.width * (WORLD_HEIGHT / art.height), WORLD_HEIGHT);
      const zone = s.add.zone(def.x, 0, 64, WORLD_HEIGHT).setOrigin(0);
      s.physics.add.existing(zone, true);
      this.w.solids.add(zone);
      this.walls.push({ def, art, body: zone.body as Phaser.Physics.Arcade.StaticBody, open: false });
    }
  }

  private buildGates() {
    const s = this.w.view;
    for (const g of this.w.level.gates ?? []) {
      if (GameState.hasFlag(`puzzle:${g.id}`)) continue;
      const art = s.add.image(g.x + 36, WORLD_HEIGHT, 'gate').setOrigin(0.5, 1).setDepth(6);
      art.setDisplaySize(art.width * (WORLD_HEIGHT / art.height), WORLD_HEIGHT);
      const zone = s.add.zone(g.x, 0, 72, WORLD_HEIGHT).setOrigin(0);
      s.physics.add.existing(zone, true);
      this.w.solids.add(zone);
      const signX = g.x - 90;
      s.add.image(signX, GROUND_Y + 4, 'gate-sign').setOrigin(0.5, 1).setDepth(5);
      let open = false;
      this.w.addSpot({
        x: signX, y: GROUND_Y, verb: 'to try the lock', promptY: GROUND_Y - 170,
        enabled: () => !open,
        use: () => this.w.openPuzzle(g, () => {
          open = true;
          GameState.setFlag(`puzzle:${g.id}`);
          (zone.body as Phaser.Physics.Arcade.StaticBody).enable = false;
          sfx.yay();
          this.w.hint('gate-right');
          s.tweens.add({ targets: art, y: art.y - WORLD_HEIGHT, duration: 1600, ease: 'Sine.in', onComplete: () => art.destroy() });
          s.cameras.main.shake(400, 0.004);
        }),
      });
    }
  }

  private buildBumpers() {
    const s = this.w.view;
    for (const b of this.w.level.bumpers ?? []) {
      const tex = this.w.level.art?.bumper;
      const img = s.add.image(b.x, b.y, tex ?? 'cloud').setDepth(7);
      if (tex) img.setScale(Math.min(1, 110 / img.width));
      else img.setScale(0.55).setTint(0xffc2de);
      s.tweens.add({ targets: img, y: b.y + b.range, duration: 1300 + Math.random() * 400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.bumpers.push({ img, lastHit: 0 });
    }
  }

  /** The wind or current the hero is at (or inside), where ↓ should dash. */
  nearWind(): WindDef | undefined {
    const x = this.w.player.x;
    return (this.w.level.winds ?? []).find((wd) => x >= wd.x - DASH_REACH && x <= wd.x + wd.w);
  }

  /** Is the hero inside a wind right now? (A dash keeps going until it's clear.) */
  inWind(): boolean {
    const x = this.w.player.x;
    return (this.w.level.winds ?? []).some((wd) => x >= wd.x - 40 && x <= wd.x + wd.w + 40);
  }

  /** Warm Breath melts nearby ice; other powers open their walls. Returns true if anything opened. */
  onMagic(): boolean {
    let opened = false;
    for (const wall of this.walls) {
      if (wall.open || !GameState.hasPower(wall.def.power) || Math.abs(this.w.player.x - wall.def.x) > MELT_REACH) continue;
      opened = true;
      wall.open = true;
      wall.body.enable = false;
      GameState.setFlag(`opened:${wall.def.id}`);
      const s = this.w.view;
      sfx.magic();
      s.add.particles(wall.def.x + 32, GROUND_Y - 200, 'fx-star', {
        x: { min: -30, max: 30 }, y: { min: -300, max: 200 }, speed: { min: 60, max: 200 }, lifespan: 1100,
        scale: { start: 1, end: 0 }, tint: [0xbfeaff, 0xc4f7df, 0xffffff], emitting: false,
      }).setDepth(9).explode(60);
      s.tweens.add({ targets: wall.art, alpha: 0, y: wall.art.y + 80, duration: 1000, onComplete: () => wall.art.destroy() });
    }
    if (!GameState.hasPower('warmth')) return opened;
    let melted = false;
    for (const wall of this.ice) {
      if (wall.melted || Math.abs(this.w.player.x - wall.x) > MELT_REACH) continue;
      melted = true;
      wall.melted = true;
      wall.body.enable = false;
      GameState.setFlag(`melted:${wall.id}`);
      const s = this.w.view;
      sfx.bloom();
      s.add.particles(wall.x + 32, GROUND_Y - 200, 'fx-dot', {
        x: { min: -30, max: 30 }, y: { min: -300, max: 200 }, speedY: { min: -120, max: -40 }, lifespan: 1200,
        scale: { start: 1.4, end: 0 }, alpha: { start: 0.8, end: 0 }, tint: [0xffffff, 0xdff4ff], emitting: false,
      }).setDepth(9).explode(60);
      s.tweens.add({ targets: wall.art, alpha: 0, scaleX: 0, duration: 900, onComplete: () => wall.art.destroy() });
    }
    return melted || opened;
  }

  update(time: number) {
    const p = this.w.player;
    for (const wd of this.w.level.winds ?? []) {
      const inside = p.x >= wd.x && p.x <= wd.x + wd.w;
      if (inside && !p.dashing && !p.frozen) p.body.setVelocityX(Math.min(p.body.velocity.x, WIND_PUSH));
      if (p.x >= wd.x - 120 && p.x <= wd.x + wd.w) {
        const can = GameState.hasPower(wd.power ?? 'dash');
        const kind = wd.style === 'current' ? 'current' : 'wind';
        this.w.hintOnce(`wind-${wd.x}`, `${kind}-${can ? 'dash' : 'blocked'}`, REPEAT_HINT_MS);
      }
    }
    for (const wall of this.ice)
      if (!wall.melted && Math.abs(p.x - wall.x) < 150)
        this.w.hintOnce(`ice-${wall.id}`, GameState.hasPower('warmth') ? 'ice-melt' : 'ice-blocked', REPEAT_HINT_MS);
    for (const wall of this.walls)
      if (!wall.open && Math.abs(p.x - wall.def.x) < 150)
        this.w.hintOnce(`wall-${wall.def.id}`, GameState.hasPower(wall.def.power) ? wall.def.can : wall.def.blocked, REPEAT_HINT_MS);
    for (const g of this.w.level.gates ?? [])
      if (!GameState.hasFlag(`puzzle:${g.id}`) && Math.abs(p.x - g.x) < 240) this.w.hintOnce(`gate-${g.id}`, 'gate-hint');

    for (const b of this.bumpers) {
      const dx = p.x - b.img.x;
      const dy = p.y - b.img.y;
      const d = Math.hypot(dx, dy);
      if (d > 75 || time - b.lastHit < 250) continue;
      b.lastHit = time;
      const nx = d ? dx / d : -1;
      const ny = d ? dy / d : 0;
      p.body.setVelocity(nx * BUMP_SPEED - 120, ny * BUMP_SPEED);
      sfx.bounce();
      this.w.view.tweens.add({ targets: b.img, scaleX: 0.7, scaleY: 0.45, duration: 90, yoyo: true });
    }
  }
}
