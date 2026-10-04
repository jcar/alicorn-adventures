import Phaser from 'phaser';
import { GROUND_Y } from '../content';
import { GameState } from '../systems/GameState';
import { sfx } from '../audio/sfx';
import type { World } from './types';
import { blockedLine } from './blocked';

/** How low a tiny tunnel is, by default: room for a tiny alicorn (about 40px) but never a big one (90px). */
export const TUNNEL_GAP = 80;
/** While she stays at a tunnel she can't fit, remind her every so often. */
const REPEAT_HINT_MS = 15000;

/**
 * Shrink (Bea's power) and the tiny tunnels it opens: rock from the sky down
 * to a low gap. ↓ at a shrink mushroom makes her tiny; ↓ anywhere with room
 * above grows her back, so she can never get stuck small.
 */
export class Tunnels {
  constructor(private w: World) {}

  build() {
    const s = this.w.view;
    const L = this.w.level;
    for (const t of L.tunnels ?? []) {
      const h = GROUND_Y - (t.gap ?? TUNNEL_GAP);
      const tex = L.art?.tunnel && s.textures.exists(L.art.tunnel) ? L.art.tunnel : `ground-${L.id}`;
      const rock = s.add.tileSprite(t.x, 0, t.w, h, tex).setOrigin(0).setDepth(5);
      if (!L.art?.tunnel) rock.setTint(0xd8c4e8);
      s.physics.add.existing(rock, true);
      this.w.solids.add(rock);
      // A little arch at the mouth on each side, so the way in is easy to spot.
      for (const x of [t.x, t.x + t.w]) s.add.ellipse(x, GROUND_Y - 34, 70, 70, 0x2b1f4a, 0.55).setDepth(4);
    }
    for (const m of L.shrinkers ?? []) {
      const tex = L.art?.shrinker && s.textures.exists(L.art.shrinker) ? L.art.shrinker : 'bouncer';
      const img = s.add.image(m.x, GROUND_Y + 4, tex).setOrigin(0.5, 1).setDepth(6);
      if (!L.art?.shrinker) img.setTint(0xc79bff).setScale(0.8);
      s.tweens.add({ targets: img, scaleY: img.scaleY * 0.92, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      s.add.particles(m.x, GROUND_Y - 60, 'fx-star', {
        x: { min: -30, max: 30 }, lifespan: 900, frequency: 300, speedY: { min: -40, max: -10 }, scale: { start: 0.5, end: 0 }, tint: 0xd9c6ff,
      }).setDepth(6);
      this.w.addSpot({
        x: m.x, y: GROUND_Y, promptY: GROUND_Y - 150,
        get verb() { return GameState.hasPower('shrink') ? 'to shrink' : 'to look'; },
        enabled: () => !this.w.player.tiny,
        use: () => this.shrink(),
      });
    }
  }

  private shrink() {
    if (!GameState.hasPower('shrink')) {
      sfx.soft();
      return this.w.hint(blockedLine(this.w, 'shrink', 'shrink-blocked'));
    }
    this.w.player.setTiny(true);
    this.w.hintOnce('shrunk', 'shrink-tiny');
  }

  /** Horn magic while tiny grows her back, if there's room. Returns true if it did something. */
  onMagic(): boolean {
    const p = this.w.player;
    if (!p.tiny) return false;
    if (!this.roomToGrow()) {
      this.w.hintOnce('no-room', 'grow-no-room', 6000);
      return true;
    }
    p.setTiny(false);
    return true;
  }

  /** Would a full-size alicorn fit where she's standing? (One-way platforms don't count.) */
  roomToGrow() {
    const p = this.w.player;
    const b = p.body;
    const big = { w: 90, h: 90 };
    const bodies = this.w.view.physics.overlapRect(p.x - big.w / 2, b.bottom - big.h - 2, big.w, big.h, false, true) as Phaser.Physics.Arcade.StaticBody[];
    return !bodies.some((sb) => sb.checkCollision.down && this.w.solids.contains(sb.gameObject));
  }

  /** Gentle reminders when she's big at a tunnel's mouth. */
  update() {
    const p = this.w.player;
    if (p.tiny) return;
    for (const t of this.w.level.tunnels ?? []) {
      if (Math.abs(p.x - t.x) > 130 && Math.abs(p.x - (t.x + t.w)) > 130) continue;
      const line = GameState.hasPower('shrink') ? 'tunnel-tiny' : blockedLine(this.w, 'shrink', 'shrink-blocked');
      this.w.hintOnce(`tunnel-${t.x}`, line, REPEAT_HINT_MS);
    }
  }
}
