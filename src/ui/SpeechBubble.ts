import Phaser from 'phaser';
import { COLORS, textStyle } from './style';

/** A friendly rounded speech bubble that pops in above a speaker. */
export class SpeechBubble extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private hideTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    this.bg = scene.add.graphics();
    this.label = scene.add.text(0, 0, '', textStyle(26, { align: 'center', wordWrap: { width: 340 } })).setOrigin(0.5, 1);
    this.add([this.bg, this.label]);
    this.setDepth(50).setVisible(false);
    scene.add.existing(this);
  }

  say(text: string, x: number, y: number, ms = 4500) {
    this.label.setText(text);
    const w = this.label.width + 40;
    const h = this.label.height + 26;
    // Keep the bubble on screen; the tail still points at the speaker.
    const cam = this.scene.cameras.main;
    const bx = Phaser.Math.Clamp(x, cam.scrollX + w / 2 + 12, cam.scrollX + cam.width - w / 2 - 12);
    const by = Math.max(y, h + 30);
    const tail = Phaser.Math.Clamp(x - bx, -w / 2 + 30, w / 2 - 30);
    this.bg.clear();
    this.bg.fillStyle(COLORS.paper, 1).lineStyle(4, COLORS.paperEdge, 1);
    this.bg.fillRoundedRect(-w / 2, -h - 18, w, h, 22).strokeRoundedRect(-w / 2, -h - 18, w, h, 22);
    this.bg.fillTriangle(tail - 14, -20, tail + 14, -20, tail, 0);
    this.bg.lineStyle(4, COLORS.paperEdge, 1).lineBetween(tail - 14, -18, tail, 0).lineBetween(tail + 14, -18, tail, 0);
    x = bx;
    y = by;
    this.label.setPosition(0, -31);
    this.setPosition(x, y).setVisible(true).setScale(0.3).setAlpha(1);
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({ targets: this, scale: 1, duration: 260, ease: 'Back.out' });
    this.hideTimer?.remove();
    this.hideTimer = this.scene.time.delayedCall(ms, () => this.hide());
  }

  hide() {
    if (!this.visible) return;
    this.scene.tweens.add({ targets: this, alpha: 0, scale: 0.8, duration: 200, onComplete: () => this.setVisible(false) });
  }
}
