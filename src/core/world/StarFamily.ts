import Phaser from 'phaser';
import { GROUND_Y, KINGDOMS, WORLD_HEIGHT } from '../content';
import { GameState } from '../systems/GameState';
import { sfx } from '../audio/sfx';
import { textStyle } from '../ui/style';
import type { World } from './types';

/** Set once Pip's whole family is home. Unlocks the last rewards. */
export const FAMILY_FLAG = 'family:home';
const SKY = [{ x: 0.2, y: 110 }, { x: 0.42, y: 70 }, { x: 0.64, y: 100 }, { x: 0.84, y: 65 }];

/**
 * Pip's family, at Home. Each Guardian Star she restores twinkles in the
 * Glade sky. When every one is back, Pip's family comes down to the Glade for
 * a reunion (once), and then lives beside Pip.
 */
export class StarFamily {
  private members: { name: string; tint: number }[] = [];
  private sky: Phaser.GameObjects.Image[] = [];

  constructor(private w: World, private pipX: number) {}

  /** Everyone restored so far, in story order. */
  static home() {
    return KINGDOMS.filter((k) => k.saga?.family && GameState.hasFlag(k.saga.flag)).flatMap((k) => k.saga!.family!);
  }

  /** Every star home, including the finale kingdom's (so there's no reunion before that kingdom exists). */
  static allHome() {
    const sagas = KINGDOMS.filter((k) => k.saga?.family);
    return sagas.some((k) => k.saga!.finale) && sagas.every((k) => GameState.hasFlag(k.saga!.flag));
  }

  build() {
    this.members = StarFamily.home();
    const s = this.w.view;
    if (GameState.hasFlag(FAMILY_FLAG)) return this.standBesidePip(false);
    const { width } = s.scale;
    this.members.forEach((m, i) => {
      const at = SKY[i % SKY.length];
      const x = width * at.x;
      const glow = s.add.image(x, at.y, 'fx-light').setTint(m.tint).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.6).setScrollFactor(0.15, 0).setDepth(-8);
      const star = s.add.image(x, at.y, 'friend-pip').setScale(0.55).setTint(m.tint).setScrollFactor(0.15, 0).setDepth(-7);
      s.add.text(x, at.y + 44, m.name, textStyle(18, { color: '#ffffff', stroke: '#2b1f4a', strokeThickness: 4 })).setOrigin(0.5, 0).setScrollFactor(0.15, 0).setDepth(-7);
      s.tweens.add({ targets: [star, glow], y: at.y - 8, duration: 1500 + i * 200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.sky.push(star, glow);
    });
  }

  /** Near Pip with the whole family restored: the reunion. Returns true if it started. */
  maybeReunite(): boolean {
    if (GameState.hasFlag(FAMILY_FLAG) || !StarFamily.allHome()) return false;
    if (Math.abs(this.w.player.x - this.pipX) > 200) return false;
    GameState.setFlag(FAMILY_FLAG);
    const s = this.w.view;
    const cam = s.cameras.main;
    this.w.player.frozen = true;
    cam.pan(this.pipX, WORLD_HEIGHT / 2, 900, 'Sine.easeInOut');
    s.tweens.add({ targets: this.sky, alpha: 0, duration: 800 });
    s.time.delayedCall(900, () => this.standBesidePip(true));
    s.time.delayedCall(1400, () => this.w.say('pip-family-home', this.pipX, GROUND_Y - 170, 7000));
    s.time.delayedCall(9000, () => {
      this.w.hint('family-home');
      for (let k = 0; k < 4; k++) s.time.delayedCall(k * 450, () => this.w.confetti(this.pipX + (k - 1.5) * 160, GROUND_Y - 320, 80));
    });
    s.time.delayedCall(11000, () => {
      this.w.player.frozen = false;
      cam.startFollow(this.w.player, true, 0.1, 0.1);
    });
    return true;
  }

  /** The family, standing (well, floating) beside Pip. */
  private standBesidePip(arrive: boolean) {
    const s = this.w.view;
    this.members.forEach((m, i) => {
      const side = i % 2 === 0 ? -1 : 1;
      const x = this.pipX + side * (110 + Math.floor(i / 2) * 100);
      const y = GROUND_Y - 70 - (i % 3) * 14;
      const glow = s.add.image(x, y, 'fx-light').setTint(m.tint).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.55).setDepth(3);
      const star = s.add.image(x, y, 'friend-pip').setScale(0.9).setTint(m.tint).setDepth(4);
      if (arrive) {
        star.y = glow.y = -120;
        sfx.chime();
        s.tweens.add({ targets: [star, glow], y, duration: 1400, delay: i * 350, ease: 'Sine.out' });
      }
      s.tweens.add({ targets: [star, glow], y: y - 10, duration: 1400 + i * 150, yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: arrive ? 1400 + i * 350 : 0 });
    });
  }
}
