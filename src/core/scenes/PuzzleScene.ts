import Phaser from 'phaser';
import { Controls } from '../systems/Controls';
import { NUMBER_MAX } from '../content';
import type { Question } from '../puzzles/engine';
import { COLORS, textStyle, titleStyle } from '../ui/style';
import { speak } from '../audio/voice';
import { sfx } from '../audio/sfx';
import { GameState } from '../systems/GameState';

export interface PuzzleResult { firstTry: boolean; misses: number }
interface PuzzleData { question: Question; title?: string; onSolved: (r: PuzzleResult) => void }

/**
 * Number locks (← → pick a number, ↑ ↓ jump by 5) and choice questions
 * (← → choose). A wrong answer just says "try again"; after two, a counting
 * hint appears for sums. Esc steps away to go look around.
 */
export class PuzzleScene extends Phaser.Scene {
  private controls!: Controls;
  private q!: Question;
  private title?: string;
  private onSolved!: (r: PuzzleResult) => void;
  private value = 0;
  private choice = 0;
  private misses = 0;
  private valueText?: Phaser.GameObjects.Text;
  private cards: Phaser.GameObjects.Rectangle[] = [];
  private feedback!: Phaser.GameObjects.Text;
  private panel!: Phaser.GameObjects.Container;
  private hint?: Phaser.GameObjects.Container;
  private busy = false;

  constructor() { super('Puzzle'); }

  init(data: PuzzleData) {
    this.q = data.question;
    this.title = data.title;
    this.onSolved = data.onSolved;
    this.value = 0;
    this.choice = 0;
    this.misses = 0;
    this.cards = [];
    this.valueText = undefined;
    this.hint = undefined;
    this.busy = false;
  }

  create() {
    const { width, height } = this.scale;
    this.controls = new Controls(this);
    this.add.rectangle(0, 0, width, height, 0x2b1f4a, 0.7).setOrigin(0);
    this.panel = this.add.container(0, 0);
    const g = this.add.graphics();
    g.fillStyle(COLORS.paper).lineStyle(8, 0xffc93c).fillRoundedRect(140, 60, width - 280, height - 120, 40).strokeRoundedRect(140, 60, width - 280, height - 120, 40);
    this.panel.add(g);

    const isNumber = this.q.kind === 'number';
    this.panel.add(this.add.text(width / 2, 118, this.title ?? (isNumber ? 'Number Lock' : 'Think About It!'), titleStyle(50)).setOrigin(0.5));
    this.panel.add(this.add.text(width / 2, 220, this.q.text, textStyle(34, { align: 'center', wordWrap: { width: 900 } })).setOrigin(0.5));
    speak(this, this.q.line, GameState.data.name);

    if (this.q.kind === 'number') {
      this.panel.add(this.add.text(width / 2 - 170, 390, '◀', textStyle(70, { color: '#ff7eb9' })).setOrigin(0.5));
      this.panel.add(this.add.text(width / 2 + 170, 390, '▶', textStyle(70, { color: '#ff7eb9' })).setOrigin(0.5));
      this.panel.add(this.add.rectangle(width / 2, 390, 200, 150, 0xffffff).setStrokeStyle(8, COLORS.paperEdge));
      this.valueText = this.add.text(width / 2, 390, '0', titleStyle(110)).setOrigin(0.5);
      this.panel.add(this.valueText);
    } else {
      const n = this.q.choices.length;
      this.q.choices.forEach((c, i) => {
        const x = width / 2 + (i - (n - 1) / 2) * 310;
        const card = this.add.rectangle(x, 400, 280, 120, 0xffffff).setStrokeStyle(6, COLORS.paperEdge);
        this.cards.push(card);
        this.panel.add([card, this.add.text(x, 400, c, textStyle(30, { align: 'center', wordWrap: { width: 250 } })).setOrigin(0.5)]);
      });
    }
    this.feedback = this.add.text(width / 2, 528, '', textStyle(32, { color: '#7a4fd6' })).setOrigin(0.5);
    this.panel.add(this.feedback);
    const how = isNumber ? `← → change by 1 · ↑ ↓ change by ${this.bigStep()} · SPACE try it · ESC look around` : '← → choose · SPACE answer · ESC look around';
    this.panel.add(this.add.text(width / 2, height - 92, how, textStyle(22, { color: '#8f86a8' })).setOrigin(0.5));
    this.refresh();
  }

  private refresh() {
    this.valueText?.setText(String(this.value));
    this.cards.forEach((c, i) => c.setStrokeStyle(i === this.choice ? 10 : 6, i === this.choice ? 0xff7eb9 : COLORS.paperEdge).setScale(i === this.choice ? 1.06 : 1));
  }

  /** After two misses on a sum: draw it with stars to count. */
  private showHint() {
    if (this.hint || this.q.kind !== 'number' || !this.q.visual) return;
    const { width } = this.scale;
    const { a, b, op } = this.q.visual;
    const stars: Phaser.GameObjects.GameObject[] = [];
    const size = Math.min(34, 760 / (a + b + 2));
    const total = op === '+' ? a + b + 1 : a;
    let x = width / 2 - ((total - 1) * size) / 2;
    const place = (crossed = false) => {
      stars.push(this.add.image(x, 290, 'stardust').setDisplaySize(size, size).setAlpha(crossed ? 0.35 : 1));
      if (crossed) stars.push(this.add.text(x, 290, '✕', textStyle(size, { color: '#c93a73' })).setOrigin(0.5));
      x += size;
    };
    if (op === '+') {
      for (let i = 0; i < a; i++) place();
      stars.push(this.add.text(x, 290, '+', textStyle(size, { color: '#7a4fd6' })).setOrigin(0.5));
      x += size;
      for (let i = 0; i < b; i++) place();
    } else {
      for (let i = 0; i < a; i++) place(i >= a - b);
    }
    this.hint = this.add.container(0, 0, stars);
    this.panel.add(this.hint);
  }

  private close() {
    this.scene.stop();
    this.scene.resume('World');
  }

  private check() {
    const right = this.q.kind === 'number' ? this.value === this.q.answer : this.choice === this.q.answer;
    if (!right) {
      this.misses++;
      sfx.soft();
      this.feedback.setText(this.misses >= 2 && this.q.kind === 'number' && this.q.visual ? 'Try counting the stars!' : 'Not quite. Try again!');
      speak(this, this.q.kind === 'choice' ? 'puzzle-wrong-friend' : 'gate-wrong');
      if (this.misses >= 2) this.showHint();
      this.tweens.add({ targets: this.panel, x: 12, duration: 60, yoyo: true, repeat: 3 });
      return;
    }
    this.busy = true;
    sfx.yay();
    this.feedback.setText('Yes! You got it!').setColor('#2f9b5a');
    this.tweens.add({ targets: this.panel, scale: 1.03, duration: 150, yoyo: true });
    this.time.delayedCall(1100, () => {
      this.close();
      this.onSolved({ firstTry: this.misses === 0, misses: this.misses });
    });
  }

  /** Debug kit: answer correctly. */
  debugSolve() {
    if (this.q.kind === 'number') this.value = this.q.answer;
    else this.choice = this.q.answer;
    this.refresh();
    this.check();
    return 'solved';
  }

  /** ↑ ↓ jump by 5, or by 10 for tens-and-ones locks that go up to 99. */
  private bigStep() {
    return this.q.kind === 'number' && (this.q.max ?? NUMBER_MAX) > NUMBER_MAX ? 10 : 5;
  }

  update() {
    if (this.busy) return;
    const c = this.controls;
    const dx = (c.menuRight() ? 1 : 0) - (c.menuLeft() ? 1 : 0);
    const dy = (c.menuUp() ? 1 : 0) - (c.menuDown() ? 1 : 0);
    if (dx || dy) {
      if (this.q.kind === 'number') this.value = Phaser.Math.Wrap(this.value + dx + dy * this.bigStep(), 0, (this.q.max ?? NUMBER_MAX) + 1);
      else if (dx) this.choice = Phaser.Math.Wrap(this.choice + dx, 0, this.q.choices.length);
      sfx.select();
      if (!this.hint || this.misses < 2) this.feedback.setText('');
      this.refresh();
    }
    if (c.confirm()) this.check();
    if (c.back()) {
      sfx.whoosh();
      this.close();
    }
  }
}
