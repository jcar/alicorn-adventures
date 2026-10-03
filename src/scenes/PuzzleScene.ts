import Phaser from 'phaser';
import { Controls } from '../systems/Controls';
import { NUMBER_MAX, PUZZLES, type Puzzle } from '../data/puzzles';
import { COLORS, textStyle, titleStyle } from '../ui/style';
import { lineText, speak } from '../audio/voice';
import { sfx } from '../audio/sfx';
import { GameState } from '../systems/GameState';

interface PuzzleData { puzzleId: string; onSolved: () => void }

/**
 * Number locks (← → to pick a number) and riddles (← → to pick an answer).
 * A wrong answer just says "try again"; Esc steps away to go look around.
 */
export class PuzzleScene extends Phaser.Scene {
  private controls!: Controls;
  private puzzle!: Puzzle;
  private onSolved!: () => void;
  private value = 0;
  private choice = 0;
  private valueText?: Phaser.GameObjects.Text;
  private cards: Phaser.GameObjects.Rectangle[] = [];
  private feedback!: Phaser.GameObjects.Text;
  private panel!: Phaser.GameObjects.Container;
  private busy = false;

  constructor() { super('Puzzle'); }

  init(data: PuzzleData) {
    this.puzzle = PUZZLES[data.puzzleId];
    this.onSolved = data.onSolved;
    this.value = 0;
    this.choice = 0;
    this.cards = [];
    this.valueText = undefined;
    this.busy = false;
  }

  create() {
    const { width, height } = this.scale;
    this.controls = new Controls(this);
    this.add.rectangle(0, 0, width, height, 0x2b1f4a, 0.7).setOrigin(0);
    this.panel = this.add.container(0, 0);
    const g = this.add.graphics();
    g.fillStyle(COLORS.paper).lineStyle(8, 0xffc93c).fillRoundedRect(140, 80, width - 280, height - 160, 40).strokeRoundedRect(140, 80, width - 280, height - 160, 40);
    this.panel.add(g);

    const isRiddle = this.puzzle.kind === 'choice';
    this.panel.add(this.add.text(width / 2, 140, isRiddle ? 'Riddle Time!' : 'Number Lock', titleStyle(52)).setOrigin(0.5));
    this.panel.add(this.add.text(width / 2, 250, lineText(this.puzzle.line), textStyle(34, { align: 'center', wordWrap: { width: 880 } })).setOrigin(0.5));
    speak(this, this.puzzle.line, GameState.data.name);

    if (this.puzzle.kind === 'number') {
      this.panel.add(this.add.text(width / 2 - 170, 410, '◀', textStyle(70, { color: '#ff7eb9' })).setOrigin(0.5));
      this.panel.add(this.add.text(width / 2 + 170, 410, '▶', textStyle(70, { color: '#ff7eb9' })).setOrigin(0.5));
      this.panel.add(this.add.rectangle(width / 2, 410, 200, 150, 0xffffff).setStrokeStyle(8, COLORS.paperEdge));
      this.valueText = this.add.text(width / 2, 410, '0', titleStyle(110)).setOrigin(0.5);
      this.panel.add(this.valueText);
    } else {
      this.puzzle.choices.forEach((c, i) => {
        const x = width / 2 + (i - 1) * 300;
        const card = this.add.rectangle(x, 420, 260, 110, 0xffffff).setStrokeStyle(6, COLORS.paperEdge);
        this.cards.push(card);
        this.panel.add([card, this.add.text(x, 420, c, textStyle(36)).setOrigin(0.5)]);
      });
    }
    this.feedback = this.add.text(width / 2, 530, '', textStyle(32, { color: '#7a4fd6' })).setOrigin(0.5);
    this.panel.add(this.feedback);
    const how = isRiddle ? '← → choose   SPACE answer   ESC look around' : '← → pick a number   SPACE try it   ESC look around';
    this.panel.add(this.add.text(width / 2, height - 120, how, textStyle(22, { color: '#8f86a8' })).setOrigin(0.5));
    this.refresh();
  }

  private refresh() {
    this.valueText?.setText(String(this.value));
    this.cards.forEach((c, i) => c.setStrokeStyle(i === this.choice ? 10 : 6, i === this.choice ? 0xff7eb9 : COLORS.paperEdge).setScale(i === this.choice ? 1.06 : 1));
  }

  private close() {
    this.scene.stop();
    this.scene.resume('World');
  }

  private check() {
    const p = this.puzzle;
    const right = p.kind === 'number' ? this.value === p.answer : this.choice === p.answer;
    if (!right) {
      sfx.soft();
      this.feedback.setText('Not quite. Try again!');
      speak(this, p.kind === 'choice' ? 'puzzle-wrong-friend' : 'gate-wrong');
      this.tweens.add({ targets: this.panel, x: 12, duration: 60, yoyo: true, repeat: 3 });
      return;
    }
    this.busy = true;
    sfx.yay();
    this.feedback.setText('Yes! You got it!').setColor('#2f9b5a');
    this.tweens.add({ targets: this.panel, scale: 1.03, duration: 150, yoyo: true });
    this.time.delayedCall(1100, () => {
      this.close();
      this.onSolved();
    });
  }

  /** Debug kit: answer correctly. */
  debugSolve() {
    if (this.puzzle.kind === 'number') this.value = this.puzzle.answer;
    else this.choice = this.puzzle.answer;
    this.refresh();
    this.check();
    return 'solved';
  }

  update() {
    if (this.busy) return;
    const c = this.controls;
    const dx = (c.menuRight() ? 1 : 0) - (c.menuLeft() ? 1 : 0);
    const dy = (c.menuUp() ? 1 : 0) - (c.menuDown() ? 1 : 0);
    if (dx || dy) {
      if (this.puzzle.kind === 'number') this.value = Phaser.Math.Wrap(this.value + dx + dy, 0, NUMBER_MAX + 1);
      else if (dx) this.choice = Phaser.Math.Wrap(this.choice + dx, 0, this.puzzle.choices.length);
      sfx.select();
      this.feedback.setText('');
      this.refresh();
    }
    if (c.confirm()) this.check();
    if (c.back()) {
      sfx.whoosh();
      this.close();
    }
  }
}
