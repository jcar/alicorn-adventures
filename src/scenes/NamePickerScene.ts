import Phaser from 'phaser';
import { Controls } from '../systems/Controls';
import { GameState } from '../systems/GameState';
import { addBackdrop } from '../ui/backdrop';
import { COLORS, textStyle, titleStyle } from '../ui/style';
import { sfx } from '../audio/sfx';
import { speak } from '../audio/voice';

const NAMES = ['Sparkle', 'Luna', 'Starla', 'Clover', 'Moonbeam', 'Twinkle'];
const MAKE_OWN = 'Make my own!';
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const BACK = '⌫';
const DONE = 'Done';
const MAX_LEN = 10;

/** Pick a name with arrows + Space. No typing needed, but typing works too. */
export class NamePickerScene extends Phaser.Scene {
  private controls!: Controls;
  private mode: 'cards' | 'letters' = 'cards';
  private cards: { box: Phaser.GameObjects.Rectangle; label: string }[] = [];
  private keysGrid: { box: Phaser.GameObjects.Rectangle; label: string }[] = [];
  private sel = 0;
  private done = false;
  private typed = '';
  private typedText!: Phaser.GameObjects.Text;
  private letterLayer!: Phaser.GameObjects.Container;
  private cardLayer!: Phaser.GameObjects.Container;

  constructor() { super('NamePicker'); }

  create() {
    const { width } = this.scale;
    this.controls = new Controls(this);
    this.mode = 'cards';
    this.sel = 0;
    this.typed = '';
    this.done = false;
    addBackdrop(this, 'glade', width);
    this.add.text(width / 2, 80, "What is your alicorn's name?", titleStyle(56)).setOrigin(0.5);

    // Name cards
    this.cardLayer = this.add.container();
    this.cards = [...NAMES, MAKE_OWN].map((label, i) => {
      const col = i % 3;
      const r = Math.floor(i / 3);
      const x = i === 6 ? width / 2 : width / 2 + (col - 1) * 340;
      const y = 230 + r * 130;
      const box = this.add.rectangle(x, y, i === 6 ? 420 : 300, 100, COLORS.paper).setStrokeStyle(6, COLORS.paperEdge);
      const t = this.add.text(x, y, label, textStyle(40)).setOrigin(0.5);
      this.cardLayer.add([box, t]);
      return { box, label };
    });

    // Letter board (hidden until "Make my own!")
    this.letterLayer = this.add.container().setVisible(false);
    this.typedText = this.add.text(width / 2, 180, '', titleStyle(64)).setOrigin(0.5);
    this.letterLayer.add(this.typedText);
    this.keysGrid = [...LETTERS, BACK, DONE].map((label, i) => {
      const col = i % 7;
      const r = Math.floor(i / 7);
      const x = width / 2 + (col - 3) * 110;
      const y = 290 + r * 100;
      const box = this.add.rectangle(x, y, label === DONE ? 100 : 90, 82, COLORS.paper).setStrokeStyle(5, COLORS.paperEdge);
      const t = this.add.text(x, y, label, textStyle(label === DONE ? 30 : 44)).setOrigin(0.5);
      this.letterLayer.add([box, t]);
      return { box, label };
    });

    // Real keyboard letters for kids who know them.
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => {
      if (this.mode !== 'letters') return;
      if (/^[a-z]$/i.test(e.key)) this.addLetter(e.key.toUpperCase());
      if (e.key === 'Backspace') this.removeLetter();
    });

    this.highlight();
  }

  private get items() { return this.mode === 'cards' ? this.cards : this.keysGrid; }
  private get cols() { return this.mode === 'cards' ? 3 : 7; }

  private highlight() {
    this.items.forEach((it, i) => {
      const on = i === this.sel;
      it.box.setFillStyle(on ? 0xffe6f4 : COLORS.paper).setStrokeStyle(on ? 10 : 5, on ? 0xff7eb9 : COLORS.paperEdge);
      it.box.setScale(on ? 1.08 : 1);
    });
    this.typedText.setText(this.typed ? this.typed + '_' : '_');
  }

  private move(dx: number, dy: number) {
    const n = this.items.length;
    let next = this.sel + dx + dy * this.cols;
    if (this.mode === 'cards' && dy > 0 && this.sel >= 3) next = 6;
    if (this.mode === 'cards' && dy < 0 && this.sel === 6) next = 4;
    this.sel = Phaser.Math.Clamp(next, 0, n - 1);
    sfx.select();
    this.highlight();
  }

  private addLetter(l: string) {
    if (this.typed.length >= MAX_LEN) return;
    this.typed += this.typed ? l.toLowerCase() : l;
    sfx.chime();
    this.highlight();
  }

  private removeLetter() {
    this.typed = this.typed.slice(0, -1);
    sfx.soft();
    this.highlight();
  }

  private finish(name: string) {
    GameState.setName(name);
    sfx.yay();
    this.cameras.main.fadeOut(400, 255, 255, 255);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('World', { levelId: 'glade', firstTime: true }));
    this.done = true;
  }

  update() {
    const c = this.controls;
    if (this.done) return;
    if (c.menuLeft()) this.move(-1, 0);
    if (c.menuRight()) this.move(1, 0);
    if (c.menuUp()) this.move(0, -1);
    if (c.menuDown()) this.move(0, 1);
    if (c.back() && this.mode === 'letters') {
      this.mode = 'cards';
      this.sel = 6;
      this.letterLayer.setVisible(false);
      this.cardLayer.setVisible(true);
      this.highlight();
    }
    if (!c.confirm()) return;

    const label = this.items[this.sel].label;
    if (this.mode === 'cards') {
      if (label === MAKE_OWN) {
        this.mode = 'letters';
        this.sel = 0;
        this.cardLayer.setVisible(false);
        this.letterLayer.setVisible(true);
        sfx.whoosh();
        this.highlight();
      } else {
        this.finish(label);
      }
      return;
    }
    if (label === BACK) this.removeLetter();
    else if (label === DONE) {
      if (this.typed) this.finish(this.typed);
      else speak(this, 'pick-name');
    } else this.addLetter(label);
  }
}
