import Phaser from 'phaser';
import { GROUND_Y } from '../content';
import { GameState } from '../systems/GameState';
import type { World } from './types';

const DARK = 0x0b0820;
const SMALL_LIGHT = 0.7; // without Glow you can just see yourself
const GLOW_LIGHT = 2.6;
const FLASH_LIGHT = 4.2;

interface Zone { x: number; y: number; w: number; h: number; rt: Phaser.GameObjects.RenderTexture }

/** Caves and storm clouds you can only see inside with Owl's Glow. */
export class Darkness {
  private zones: Zone[] = [];
  private brush!: Phaser.GameObjects.Image;
  private aura?: Phaser.GameObjects.Image;
  private light = GLOW_LIGHT;

  constructor(private w: World) {}

  build() {
    const s = this.w.view;
    this.brush = s.make.image({ key: 'fx-light', add: false });
    for (const d of this.w.level.darks ?? []) {
      // Rocky cave arch behind, when the dark place sits on the ground.
      const cave = this.w.level.art?.cave ?? 'cave';
      if (d.y + d.h >= GROUND_Y && d.y > 0)
        s.add.image(d.x + d.w / 2, GROUND_Y + 10, cave).setOrigin(0.5, 1).setDisplaySize(d.w + 80, d.h + 40).setDepth(1);
      const rt = s.add.renderTexture(d.x, d.y, d.w, d.h).setOrigin(0).setDepth(9.6);
      rt.fill(DARK, 0.95);
      this.zones.push({ ...d, rt });
    }
    if (this.zones.length && GameState.hasPower('glow'))
      this.aura = s.add.image(0, 0, 'fx-light').setDepth(9.7).setBlendMode(Phaser.BlendModes.ADD).setTint(0xfff3c4).setAlpha(0).setScale(1.6);
  }

  covers(x: number, y: number) {
    return (this.w.level.darks ?? []).some((d) => x >= d.x && x <= d.x + d.w && y >= d.y - 10 && y <= d.y + d.h);
  }

  /** Glow flares brighter for a moment when you use horn magic. */
  onMagic() {
    if (!GameState.hasPower('glow') || !this.zones.length) return;
    this.light = FLASH_LIGHT;
    this.w.view.tweens.add({ targets: this, light: GLOW_LIGHT, duration: 900, ease: 'Sine.out' });
  }

  update() {
    const p = this.w.player;
    const glow = GameState.hasPower('glow');
    let inAny = false;
    for (const z of this.zones) {
      const near = p.x > z.x - 400 && p.x < z.x + z.w + 400;
      if (!near) continue;
      const inside = p.x >= z.x && p.x <= z.x + z.w && p.y >= z.y && p.y <= z.y + z.h;
      if (inside) {
        inAny = true;
        this.w.hintOnce(`dark-${z.x}`, glow ? 'dark-glow' : 'dark-blocked', glow ? undefined : 15000);
      }
      z.rt.clear().fill(DARK, 0.95);
      this.brush.setScale(glow ? this.light : SMALL_LIGHT);
      z.rt.erase(this.brush, p.x - z.x, p.y - z.y);
    }
    if (this.aura) {
      this.aura.setPosition(p.x, p.y - 20);
      this.aura.setAlpha(Phaser.Math.Linear(this.aura.alpha, inAny ? 0.35 : 0, 0.1));
    }
  }
}
