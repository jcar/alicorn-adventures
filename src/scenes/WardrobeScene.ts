import Phaser from 'phaser';
import { Controls } from '../systems/Controls';
import { GameState } from '../systems/GameState';
import { unlockFor } from '../systems/UnlockManager';
import { ACCESSORIES, MANES, TRAILS, findAccessory, findTrail } from '../data/cosmetics';
import { COLORS, textStyle, titleStyle } from '../ui/style';
import { requirementText } from '../ui/requirement';
import { sfx } from '../audio/sfx';

type Slot = 'mane' | 'trail' | 'accessory';
const ROWS: { slot: Slot; label: string; options: { id: string; name: string }[] }[] = [
  { slot: 'mane', label: 'Mane', options: MANES },
  { slot: 'trail', label: 'Trail', options: TRAILS },
  { slot: 'accessory', label: 'Hat', options: ACCESSORIES },
];

/** The magic mirror: ↑↓ pick a row, ←→ try things on, Space when done. */
export class WardrobeScene extends Phaser.Scene {
  private controls!: Controls;
  private row = 0;
  private index: number[] = [];
  private rowTexts: { label: Phaser.GameObjects.Text; value: Phaser.GameObjects.Text; box: Phaser.GameObjects.Rectangle }[] = [];
  private preview!: Phaser.GameObjects.Image;
  private acc!: Phaser.GameObjects.Image;
  private trail?: Phaser.GameObjects.Particles.ParticleEmitter;
  private note!: Phaser.GameObjects.Text;

  constructor() { super('Wardrobe'); }

  create() {
    const { width, height } = this.scale;
    this.controls = new Controls(this);
    this.row = 0;
    this.rowTexts = [];
    const eq = GameState.data.equipped;
    this.index = ROWS.map((r) => Math.max(0, r.options.findIndex((o) => o.id === eq[r.slot])));

    this.add.rectangle(0, 0, width, height, 0x2b1f4a, 0.7).setOrigin(0).setDepth(-10);
    const g = this.add.graphics().setDepth(-9);
    g.fillStyle(COLORS.paper).lineStyle(8, 0xffc93c).fillRoundedRect(60, 50, width - 120, height - 100, 40).strokeRoundedRect(60, 50, width - 120, height - 100, 40);
    this.add.text(width / 2, 100, 'Magic Mirror', titleStyle(56)).setOrigin(0.5);

    this.add.ellipse(360, 400, 380, 440, 0xcdefff).setStrokeStyle(12, 0xffd46b).setDepth(-8);
    this.preview = this.add.image(360, 400, 'alicorn-pink').setScale(2);
    this.acc = this.add.image(360, 400, 'acc-bow').setScale(2);
    this.tweens.add({ targets: [this.preview, this.acc], y: '-=12', duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    ROWS.forEach((r, i) => {
      const y = 250 + i * 130;
      const box = this.add.rectangle(870, y, 560, 104, 0xffffff).setStrokeStyle(5, COLORS.paperEdge);
      const label = this.add.text(620, y, r.label, textStyle(30, { color: '#7a4fd6' })).setOrigin(0, 0.5);
      const value = this.add.text(900, y, '', textStyle(32, { align: 'center' })).setOrigin(0.5);
      this.add.text(740, y, '◀', textStyle(40, { color: '#ff7eb9' })).setOrigin(0.5);
      this.add.text(1110, y, '▶', textStyle(40, { color: '#ff7eb9' })).setOrigin(0.5);
      this.rowTexts.push({ label, value, box });
    });
    this.note = this.add.text(870, 598, '', textStyle(24, { color: '#8f86a8', align: 'center', wordWrap: { width: 540 } })).setOrigin(0.5);
    this.add.text(width / 2, height - 68, '↑ ↓ choose   ← → try on   SPACE all done', textStyle(24, { color: '#8f86a8' })).setOrigin(0.5);

    this.refresh();
  }

  private option(r: number) { return ROWS[r].options[this.index[r]]; }
  private unlocked(r: number) { return GameState.has(ROWS[r].slot, this.option(r).id); }

  private refresh() {
    ROWS.forEach((_r, i) => {
      const t = this.rowTexts[i];
      const on = i === this.row;
      const open = this.unlocked(i);
      t.box.setStrokeStyle(on ? 9 : 5, on ? 0xff7eb9 : COLORS.paperEdge).setFillStyle(on ? 0xffeef7 : 0xffffff);
      t.value.setText(open ? this.option(i).name : `🔒 ${this.option(i).name}`).setColor(open ? COLORS.ink : '#a9a2bd');
    });
    const locked = !this.unlocked(this.row);
    const u = unlockFor(ROWS[this.row].slot, this.option(this.row).id);
    this.note.setText(locked ? `To get this: ${requirementText(u)}!` : '');

    // Preview shows what you're looking at (even locked, as a peek), but only unlocked things get worn.
    const look = (slot: Slot) => {
      const r = ROWS.findIndex((x) => x.slot === slot);
      return r === this.row || this.unlocked(r) ? this.option(r).id : GameState.data.equipped[slot];
    };
    this.preview.setTexture(`alicorn-${look('mane')}`);
    this.preview.setAlpha(locked && this.row === 0 ? 0.5 : 1);
    const acc = findAccessory(look('accessory'));
    this.acc.setVisible(!!acc.texture).setAlpha(locked && this.row === 2 ? 0.5 : 1);
    if (acc.texture) this.acc.setTexture(acc.texture).setPosition(360 + acc.offsetX * 2, this.preview.y + acc.offsetY * 2);

    this.trail?.destroy();
    const tr = findTrail(look('trail'));
    if (tr.id !== 'none')
      this.trail = this.add.particles(0, 0, tr.texture, {
        x: { min: 190, max: 300 }, y: { min: 380, max: 460 }, speedX: { min: -140, max: -60 }, lifespan: 1100,
        frequency: 70, scale: { start: 1.2, end: 0 }, tint: tr.tints, alpha: { start: locked ? 0.4 : 1, end: 0 },
      }).setDepth(-7); // behind the alicorn, in front of the mirror
  }

  update() {
    const c = this.controls;
    if (c.menuUp()) { this.row = (this.row + ROWS.length - 1) % ROWS.length; sfx.select(); this.refresh(); }
    if (c.menuDown()) { this.row = (this.row + 1) % ROWS.length; sfx.select(); this.refresh(); }
    const dx = (c.menuRight() ? 1 : 0) - (c.menuLeft() ? 1 : 0);
    if (dx) {
      const n = ROWS[this.row].options.length;
      this.index[this.row] = (this.index[this.row] + dx + n) % n;
      if (this.unlocked(this.row)) {
        GameState.equip(ROWS[this.row].slot, this.option(this.row).id);
        sfx.chime();
      } else sfx.soft();
      this.refresh();
    }
    if (c.confirm() || c.back()) {
      sfx.whoosh();
      this.scene.stop();
      this.scene.resume('World');
    }
  }
}
