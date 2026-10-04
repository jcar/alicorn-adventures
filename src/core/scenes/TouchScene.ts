import Phaser from 'phaser';
import { Virtual, type VKey } from '../systems/VirtualInput';
import { FONT } from '../ui/style';

interface Btn { key: VKey; x: number; y: number; r: number; label: string; caption?: string }

/**
 * On-screen buttons for tablets. They appear the first time someone touches
 * the screen and sit on top of every other scene:
 *   ◀ ▶ walk · ▲ up · ★ fly / OK · ⬇ do things · ✕ book / back
 */
export class TouchScene extends Phaser.Scene {
  private layer!: Phaser.GameObjects.Container;

  constructor() { super('Touch'); }

  create() {
    const { width, height } = this.scale;
    this.input.addPointer(3); // walk and fly at the same time
    this.layer = this.add.container(0, 0).setVisible(TouchScene.touchFirst()).setDepth(1000);

    const pad = 24;
    const buttons: Btn[] = [
      { key: 'left', x: pad + 70, y: height - pad - 70, r: 64, label: '◀' },
      { key: 'right', x: pad + 230, y: height - pad - 70, r: 64, label: '▶' },
      { key: 'up', x: pad + 150, y: height - pad - 200, r: 46, label: '▲' },
      { key: 'space', x: width - pad - 90, y: height - pad - 150, r: 74, label: '★', caption: 'fly / OK' },
      { key: 'down', x: width - pad - 250, y: height - pad - 70, r: 60, label: '⬇', caption: 'do it' },
      // Left side, under the stardust jar: the quest card can grow tall in the top-right corner.
      { key: 'esc', x: pad + 50, y: 226, r: 40, label: '✕', caption: 'book' },
    ];
    for (const b of buttons) this.addButton(b);

    // Show the buttons as soon as anyone touches the screen.
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.wasTouch && !this.layer.visible) this.layer.setVisible(true);
    });
    this.game.events.on(Phaser.Core.Events.BLUR, () => Virtual.releaseAll());
  }

  /** Tablets and phones start with the buttons showing. */
  static touchFirst() {
    try {
      return matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
    } catch {
      return false;
    }
  }

  private addButton(b: Btn) {
    const circle = this.add.circle(b.x, b.y, b.r, 0xffffff, 0.35).setStrokeStyle(4, 0xffffff, 0.85);
    const label = this.add.text(b.x, b.y - 2, b.label, { fontFamily: FONT, fontSize: `${Math.round(b.r * 0.9)}px`, color: '#ffffff', stroke: '#7a4fd6', strokeThickness: 6 }).setOrigin(0.5);
    this.layer.add([circle, label]);
    if (b.caption) {
      this.layer.add(this.add.text(b.x, b.y + b.r + 4, b.caption, { fontFamily: FONT, fontSize: '18px', fontStyle: '800', color: '#ffffff', stroke: '#2b1f4a', strokeThickness: 5 }).setOrigin(0.5, 0));
    }
    circle.setInteractive({ useHandCursor: true });
    const down = () => {
      Virtual.press(b.key);
      circle.setFillStyle(0xfff6a0, 0.7).setScale(0.92);
    };
    const up = () => {
      Virtual.release(b.key);
      circle.setFillStyle(0xffffff, 0.35).setScale(1);
    };
    circle.on('pointerdown', down);
    circle.on('pointerup', up);
    circle.on('pointerout', up);
  }
}
