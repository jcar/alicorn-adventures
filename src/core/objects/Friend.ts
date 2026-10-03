import Phaser from 'phaser';
import type { FriendDef } from '../content';

/** A forest friend who bobs, blinks and sometimes needs a hand. */
export class Friend extends Phaser.GameObjects.Image {
  helped = false;
  asleep = false;
  private zzz?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, x: number, groundY: number, readonly def: FriendDef) {
    super(scene, x, groundY, def.texture);
    this.setOrigin(0.5, 1).setDepth(8);
    scene.add.existing(this);
    scene.tweens.add({ targets: this, scaleY: 1.05, scaleX: 0.97, duration: 700 + Math.random() * 300, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  sleep() {
    this.asleep = true;
    this.setTint(0xb8b0d8);
    this.zzz = this.scene.time.addEvent({
      delay: 1100, loop: true, callback: () => {
        const z = this.scene.add.text(this.x + 20, this.y - this.height, 'z', { fontFamily: 'sans-serif', fontSize: '30px', color: '#ffffff', fontStyle: 'bold' }).setDepth(9);
        this.scene.tweens.add({ targets: z, x: z.x + 40, y: z.y - 60, alpha: 0, scale: 1.8, duration: 1600, onComplete: () => z.destroy() });
      },
    });
  }

  wake() {
    this.asleep = false;
    this.clearTint();
    this.zzz?.remove();
    this.celebrate();
  }

  celebrate() {
    this.scene.tweens.add({ targets: this, y: this.y - 50, duration: 220, yoyo: true, repeat: 2, ease: 'Quad.out' });
  }
}
