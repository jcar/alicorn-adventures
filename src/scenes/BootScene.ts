import Phaser from 'phaser';
import { FONT } from '../ui/style';

/** Waits (briefly) for the rounded font so text never pops from one font to another. */
export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    const timeout = new Promise((r) => setTimeout(r, 1500));
    const font = document.fonts?.load(`800 32px ${FONT}`).catch(() => undefined);
    Promise.race([font, timeout]).then(() => this.scene.start('Preload'));
  }
}
