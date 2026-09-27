import Phaser from 'phaser';
import { Controls } from '../systems/Controls';
import { GameState } from '../systems/GameState';
import { FRIENDS } from '../data/friends';
import { UNLOCKS } from '../data/unlocks';
import { AREA_COLORS, AREA_ORDER, LEVELS } from '../data/levels';
import { allClues, goldIds, secretIds, SPARK_AREAS } from '../data/logic';
import { iconFor } from '../ui/icons';
import { requirementText } from '../ui/requirement';
import { COLORS, textStyle, titleStyle } from '../ui/style';
import { lineText } from '../audio/voice';
import { sfx } from '../audio/sfx';

interface Sticker { texture: string; tint?: number; name: string; got: boolean; how: string }

const TABS = ['Stickers', 'Map', 'Clues'] as const;
const COLS = 9;
const PAPER = 0xfff3e0;
const BROWN = '#8a5a3c';

/**
 * The Adventure Book: stickers for everything earned, a map of what's
 * still hiding in each area, and every clue from P.
 * ← → switch pages; on Stickers, ↓ goes into the grid.
 */
export class StickerBookScene extends Phaser.Scene {
  private controls!: Controls;
  private tab = 0;
  private inGrid = false;
  private sel = 0;
  private stickers: Sticker[] = [];
  private frames: Phaser.GameObjects.Rectangle[] = [];
  private tabBoxes: Phaser.GameObjects.Rectangle[] = [];
  private page!: Phaser.GameObjects.Container;
  private caption!: Phaser.GameObjects.Text;

  constructor() { super('StickerBook'); }

  create() {
    const { width, height } = this.scale;
    this.controls = new Controls(this);
    this.inGrid = false;
    this.sel = 0;
    this.tabBoxes = [];

    this.add.rectangle(0, 0, width, height, 0x2b1f4a, 0.7).setOrigin(0);
    const g = this.add.graphics();
    g.fillStyle(PAPER).lineStyle(8, 0xd9a441).fillRoundedRect(40, 24, width - 80, height - 48, 40).strokeRoundedRect(40, 24, width - 80, height - 48, 40);
    const d = GameState.data;
    this.add.text(width / 2, 70, d.name ? `${d.name}'s Adventure Book` : 'Adventure Book', titleStyle(46)).setOrigin(0.5);

    TABS.forEach((t, i) => {
      const x = width / 2 + (i - 1) * 220;
      this.tabBoxes.push(this.add.rectangle(x, 136, 200, 54, 0xffffff).setStrokeStyle(5, 0xd9cbb5));
      this.add.text(x, 136, t, textStyle(28)).setOrigin(0.5);
    });
    this.caption = this.add.text(width / 2, height - 58, '', textStyle(24, { align: 'center', wordWrap: { width: 1100 } })).setOrigin(0.5);
    this.page = this.add.container(0, 0);
    this.showTab();
  }

  private showTab() {
    this.page.removeAll(true);
    this.frames = [];
    this.tabBoxes.forEach((b, i) =>
      b.setFillStyle(i === this.tab ? 0xffe6f4 : 0xffffff).setStrokeStyle(i === this.tab && !this.inGrid ? 8 : 5, i === this.tab ? 0xff7eb9 : 0xd9cbb5));
    if (TABS[this.tab] === 'Stickers') this.buildStickers();
    if (TABS[this.tab] === 'Map') this.buildMap();
    if (TABS[this.tab] === 'Clues') this.buildClues();
    this.updateCaption();
  }

  // ------------------------------------------------------------ stickers

  private buildStickers() {
    const { width } = this.scale;
    const d = GameState.data;
    this.stickers = [
      ...FRIENDS.map((f) => ({
        texture: f.texture, name: f.name, got: d.friendsHelped.includes(f.id),
        how: f.id === 'pip' ? 'Someone is hiding. Follow the clues from P' : `Find ${f.name} in the forest and help them`,
      })),
      ...UNLOCKS.filter((u) => u.stardust !== undefined || u.friends || u.gold !== undefined || u.flags).map((u) => {
        const ic = iconFor(u);
        return { texture: ic.texture, tint: ic.tint, name: u.name, got: d.unlocked.includes(u.id), how: requirementText(u) };
      }),
    ];
    this.stickers.forEach((s, i) => {
      const x = width / 2 + ((i % COLS) - (COLS - 1) / 2) * 122;
      const y = 238 + Math.floor(i / COLS) * 112;
      const frame = this.add.rectangle(x, y, 104, 98, s.got ? 0xffffff : 0xefe7da).setStrokeStyle(4, s.got ? COLORS.paperEdge : 0xd9cbb5);
      this.frames.push(frame);
      const img = this.add.image(x, y, s.texture);
      img.setScale(Math.min(2.4, 80 / Math.max(img.width, img.height)));
      this.page.add([frame, img]);
      if (s.got) {
        if (s.tint !== undefined) img.setTint(s.tint);
        img.setAngle(Phaser.Math.Between(-6, 6));
      } else {
        img.setTintFill(0xcfc3b0);
        this.page.add(this.add.text(x, y, '?', titleStyle(38)).setOrigin(0.5));
      }
    });
    this.highlightSticker();
  }

  private highlightSticker() {
    this.frames.forEach((f, i) => {
      const on = this.inGrid && i === this.sel;
      f.setScale(on ? 1.12 : 1).setStrokeStyle(on ? 7 : 4, on ? 0xff7eb9 : this.stickers[i].got ? COLORS.paperEdge : 0xd9cbb5);
    });
  }

  // ------------------------------------------------------------ map

  private buildMap() {
    const { width } = this.scale;
    const spots = [
      { id: 'glade', x: width / 2 - 440, y: 300 },
      { id: 'woods', x: width / 2 - 220, y: 470 },
      { id: 'meadow', x: width / 2, y: 300 },
      { id: 'waterfall', x: width / 2 + 220, y: 470 },
      { id: 'clouds', x: width / 2 + 440, y: 300 },
      { id: 'frost', x: width / 2, y: 560 },
    ];
    const path = this.add.graphics().lineStyle(10, 0xe8d6b8);
    const order = ['glade', ...AREA_ORDER];
    for (let i = 1; i < order.length; i++) {
      const a = spots.find((s) => s.id === order[i - 1])!;
      const b = spots.find((s) => s.id === order[i])!;
      path.lineBetween(a.x, a.y, b.x, b.y);
    }
    this.page.add(path);

    for (const s of spots) {
      const L = LEVELS[s.id];
      const open = s.id === 'glade' || GameState.has('area', s.id);
      const card = this.add.rectangle(s.x, s.y, 200, 128, open ? 0xffffff : 0xefe7da).setStrokeStyle(5, open ? COLORS.paperEdge : 0xd9cbb5);
      this.page.add(card);
      this.page.add(this.add.text(s.x, s.y - 40, L.name, textStyle(20, { align: 'center', wordWrap: { width: 190 } })).setOrigin(0.5));
      if (!open) {
        this.page.add(this.add.image(s.x, s.y + 16, 'icon-lock').setScale(0.7));
        continue;
      }
      if (s.id === 'glade') {
        const colors = SPARK_AREAS.filter((a) => GameState.hasFlag(`spark:${a}`)).length;
        this.page.add(this.add.text(s.x, s.y, `Heart Crystal\n${colors} of ${SPARK_AREAS.length} colors`, textStyle(18, { align: 'center', color: BROWN })).setOrigin(0.5));
        SPARK_AREAS.forEach((a, i) => {
          const gem = this.add.image(s.x - 60 + i * 30, s.y + 44, 'spark').setScale(0.25);
          if (GameState.hasFlag(`spark:${a}`)) gem.setTint(AREA_COLORS[a]);
          else gem.setTintFill(0xd9cbb5);
          this.page.add(gem);
        });
        continue;
      }
      const secrets = secretIds(L);
      const golds = goldIds(L);
      const found = secrets.filter((id) => GameState.hasFlag(`secret:${id}`)).length;
      const gold = golds.filter((id) => GameState.hasFlag(`gold:${id}`)).length;
      const spark = GameState.hasFlag(`spark:${s.id}`);
      this.page.add(this.add.text(s.x, s.y, `✨ ${found}/${secrets.length}   ⭐ ${gold}/${golds.length}`, textStyle(22)).setOrigin(0.5));
      const gem = this.add.image(s.x, s.y + 38, 'spark').setScale(0.3);
      if (spark) gem.setTint(AREA_COLORS[s.id]);
      else gem.setTintFill(0xd9cbb5);
      this.page.add(gem);
      if (found < secrets.length || gold < golds.length || !spark) {
        const twinkle = this.add.text(s.x + 82, s.y - 58, '✨', textStyle(28)).setOrigin(0.5);
        this.tweens.add({ targets: twinkle, scale: 1.4, duration: 600, yoyo: true, repeat: -1 });
        this.page.add(twinkle);
      }
    }
  }

  // ------------------------------------------------------------ clues

  private buildClues() {
    const { width } = this.scale;
    this.page.add(this.add.text(width / 2, 200, 'Clues from P', titleStyle(32)).setOrigin(0.5));
    allClues().forEach((c, i) => {
      const y = 250 + i * 50;
      const got = GameState.hasFlag(`secret:${c.id}`);
      const text = got ? lineText(c.line) : `???   (hidden somewhere in ${LEVELS[c.area].name})`;
      this.page.add(this.add.text(120, y, `${i + 1}.`, textStyle(22, { color: BROWN })));
      this.page.add(this.add.text(160, y, text, textStyle(22, { color: got ? COLORS.ink : '#b3a58c', wordWrap: { width: width - 300 } })));
    });
  }

  // ------------------------------------------------------------ input

  private updateCaption() {
    const t = TABS[this.tab];
    if (t === 'Stickers' && this.inGrid) {
      const s = this.stickers[this.sel];
      this.caption.setText(s.got ? `${s.name}!` : `Secret sticker. ${s.how}!`);
    } else if (t === 'Stickers') {
      const got = this.stickers.filter((s) => s.got).length;
      this.caption.setText(`${got} of ${this.stickers.length} stickers.  Press ⬇ to look closer.  ← → turn the page.  SPACE closes.`);
    } else if (t === 'Map') {
      this.caption.setText('A twinkle ✨ means something is still hiding there!  ← → turn the page.  SPACE closes.');
    } else {
      this.caption.setText('Read the clues to find where P is hiding.  ← → turn the page.  SPACE closes.');
    }
  }

  update() {
    const c = this.controls;
    if (c.confirm() || c.back()) {
      sfx.whoosh();
      this.scene.stop();
      this.scene.resume('World');
      return;
    }
    if (this.inGrid) {
      const n = this.stickers.length;
      let next = this.sel;
      if (c.menuLeft()) next--;
      if (c.menuRight()) next++;
      if (c.menuDown()) next += COLS;
      if (c.menuUp()) {
        if (this.sel < COLS) {
          this.inGrid = false;
          sfx.select();
          this.showTab();
          return;
        }
        next -= COLS;
      }
      next = Phaser.Math.Clamp(next, 0, n - 1);
      if (next !== this.sel) {
        this.sel = next;
        sfx.select();
        this.highlightSticker();
        this.updateCaption();
      }
      return;
    }
    const dx = (c.menuRight() ? 1 : 0) - (c.menuLeft() ? 1 : 0);
    if (dx) {
      this.tab = Phaser.Math.Wrap(this.tab + dx, 0, TABS.length);
      sfx.select();
      this.showTab();
    }
    if (c.menuDown() && TABS[this.tab] === 'Stickers') {
      this.inGrid = true;
      this.sel = 0;
      sfx.select();
      this.showTab();
    }
    c.menuUp();
  }
}
