import Phaser from 'phaser';
import { Controls } from '../systems/Controls';
import { GameState } from '../systems/GameState';
import { SKILLS } from '../puzzles/engine';
import { COLORS, textStyle, titleStyle } from '../ui/style';
import { sfx } from '../audio/sfx';

/**
 * Grown-up Corner → Puzzle levels. Shows where the selected player is in each
 * skill and lets a grown-up move it. The game keeps adapting from there:
 * two first-try wins go up a level, a struggle goes down one.
 */
export class SkillsScene extends Phaser.Scene {
  private controls!: Controls;
  private sel = 0;
  private boxes: Phaser.GameObjects.Rectangle[] = [];
  private texts: Phaser.GameObjects.Text[] = [];

  constructor() { super('Skills'); }

  create() {
    const { width, height } = this.scale;
    this.controls = new Controls(this);
    this.sel = 0;
    this.boxes = [];
    this.texts = [];
    this.add.rectangle(0, 0, width, height, 0x2b1f4a, 0.6).setOrigin(0);
    const g = this.add.graphics();
    g.fillStyle(COLORS.paper).lineStyle(8, 0x8f86a8).fillRoundedRect(160, 50, width - 320, height - 100, 36).strokeRoundedRect(160, 50, width - 320, height - 100, 36);
    const who = GameState.data.name || 'this player';
    this.add.text(width / 2, 100, `Puzzle levels for ${who}`, titleStyle(40)).setOrigin(0.5);
    [...SKILLS, undefined].forEach((sk, i) => {
      const y = 190 + i * 88;
      this.boxes.push(this.add.rectangle(width / 2, y, 780, 70, 0xffffff).setStrokeStyle(4, COLORS.paperEdge));
      this.texts.push(this.add.text(width / 2, y - (sk ? 10 : 0), '', textStyle(28)).setOrigin(0.5));
      if (sk) this.add.text(width / 2, y + 20, sk.about, textStyle(17, { color: '#8f86a8' })).setOrigin(0.5);
    });
    this.add.text(width / 2, height - 100, '↑ ↓ choose · ← → change the level · ESC done', textStyle(20, { color: '#8f86a8' })).setOrigin(0.5);
    this.add.text(width / 2, height - 72, 'The game keeps adjusting by itself: two first-try wins go up, a struggle goes down.', textStyle(18, { color: '#8f86a8' })).setOrigin(0.5);
    this.refresh();
  }

  private refresh() {
    SKILLS.forEach((sk, i) => this.texts[i].setText(`◀  ${sk.name}: level ${GameState.data.skills[sk.id].level} of ${sk.max}  ▶`));
    this.texts[SKILLS.length].setText('Done');
    this.boxes.forEach((b, i) => b.setStrokeStyle(i === this.sel ? 8 : 4, i === this.sel ? 0xff7eb9 : COLORS.paperEdge));
  }

  private close() {
    sfx.whoosh();
    this.scene.stop();
    this.scene.resume('GrownUps');
  }

  update() {
    const c = this.controls;
    if (c.menuUp()) { this.sel = Phaser.Math.Wrap(this.sel - 1, 0, SKILLS.length + 1); sfx.select(); this.refresh(); }
    if (c.menuDown()) { this.sel = Phaser.Math.Wrap(this.sel + 1, 0, SKILLS.length + 1); sfx.select(); this.refresh(); }
    const sk = SKILLS[this.sel];
    const dx = (c.menuRight() ? 1 : 0) - (c.menuLeft() ? 1 : 0);
    if (sk && dx) {
      GameState.setSkillLevel(sk.id, GameState.data.skills[sk.id].level + dx);
      sfx.select();
      this.refresh();
    }
    if (c.back() || (c.confirm() && !sk)) this.close();
  }
}
