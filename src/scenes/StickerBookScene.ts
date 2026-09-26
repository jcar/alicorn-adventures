import Phaser from 'phaser';
import { Controls } from '../systems/Controls';
import { GameState } from '../systems/GameState';
import { FRIENDS } from '../data/friends';
import { UNLOCKS } from '../data/unlocks';
import { iconFor } from '../ui/icons';
import { requirementText } from '../ui/requirement';
import { COLORS, textStyle, titleStyle } from '../ui/style';
import { sfx } from '../audio/sfx';

interface Sticker { texture: string; tint?: number; name: string; got: boolean; how: string }

const COLS = 7;

/** Every friend and every unlock, as stickers. Grey ones show how to earn them. */
export class StickerBookScene extends Phaser.Scene {
  private controls!: Controls;
  private stickers: Sticker[] = [];
  private frames: Phaser.GameObjects.Rectangle[] = [];
  private sel = 0;
  private caption!: Phaser.GameObjects.Text;

  constructor() { super('StickerBook'); }

  create() {
    const { width, height } = this.scale;
    this.controls = new Controls(this);
    this.sel = 0;
    this.frames = [];
    const d = GameState.data;
    this.stickers = [
      ...FRIENDS.map((f) => ({
        texture: f.texture, name: f.name, got: d.friendsHelped.includes(f.id), how: `Find ${f.name} in the forest and help them`,
      })),
      ...UNLOCKS.filter((u) => u.stardust !== undefined || u.friends).map((u) => {
        const ic = iconFor(u);
        return { texture: ic.texture, tint: ic.tint, name: u.name, got: d.unlocked.includes(u.id), how: requirementText(u) };
      }),
    ];

    this.add.rectangle(0, 0, width, height, 0x2b1f4a, 0.7).setOrigin(0);
    const g = this.add.graphics();
    g.fillStyle(0xfff3e0).lineStyle(8, 0xd9a441).fillRoundedRect(50, 30, width - 100, height - 60, 40).strokeRoundedRect(50, 30, width - 100, height - 60, 40);
    const owner = d.name ? `${d.name}'s Sticker Book` : 'Sticker Book';
    this.add.text(width / 2, 80, owner, titleStyle(52)).setOrigin(0.5);
    const got = this.stickers.filter((s) => s.got).length;
    this.add.text(width / 2, 130, `${got} of ${this.stickers.length} stickers  ·  ${d.stardust} stardust`, textStyle(26, { color: '#8a5a3c' })).setOrigin(0.5);

    this.stickers.forEach((s, i) => {
      const x = width / 2 + ((i % COLS) - (COLS - 1) / 2) * 150;
      const y = 225 + Math.floor(i / COLS) * 135;
      this.frames.push(this.add.rectangle(x, y, 124, 118, s.got ? 0xffffff : 0xefe7da).setStrokeStyle(4, s.got ? COLORS.paperEdge : 0xd9cbb5));
      const img = this.add.image(x, y, s.texture);
      img.setScale(Math.min(2.5, 92 / Math.max(img.width, img.height)));
      if (s.got) {
        if (s.tint !== undefined) img.setTint(s.tint);
        img.setAngle(Phaser.Math.Between(-6, 6));
      } else {
        img.setTintFill(0xcfc3b0);
        this.add.text(x, y, '?', titleStyle(44)).setOrigin(0.5);
      }
    });

    this.caption = this.add.text(width / 2, height - 90, '', textStyle(30, { align: 'center', wordWrap: { width: 1000 } })).setOrigin(0.5);
    this.add.text(width / 2, height - 48, 'Arrows to look  ·  SPACE to close', textStyle(20, { color: '#8a5a3c' })).setOrigin(0.5);
    this.highlight();
  }

  private highlight() {
    this.frames.forEach((f, i) => f.setScale(i === this.sel ? 1.12 : 1).setStrokeStyle(i === this.sel ? 8 : 4, i === this.sel ? 0xff7eb9 : this.stickers[i].got ? COLORS.paperEdge : 0xd9cbb5));
    const s = this.stickers[this.sel];
    this.caption.setText(s.got ? `${s.name}!` : `Secret sticker. ${s.how}!`);
  }

  update() {
    const c = this.controls;
    const n = this.stickers.length;
    let next = this.sel;
    if (c.menuLeft()) next--;
    if (c.menuRight()) next++;
    if (c.menuUp()) next -= COLS;
    if (c.menuDown()) next += COLS;
    next = Phaser.Math.Clamp(next, 0, n - 1);
    if (next !== this.sel) { this.sel = next; sfx.select(); this.highlight(); }
    if (c.confirm() || c.back()) {
      sfx.whoosh();
      this.scene.stop();
      this.scene.resume('World');
    }
  }
}
