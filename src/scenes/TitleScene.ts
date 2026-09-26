import Phaser from 'phaser';
import { Controls } from '../systems/Controls';
import { GameState } from '../systems/GameState';
import { addBackdrop } from '../ui/backdrop';
import { textStyle, titleStyle } from '../ui/style';
import { audio, isMuted, setMuted, sfx } from '../audio/sfx';
import { playGeneratedMusic } from '../audio/music';
import { isVoiceOn, setVoiceOn, speak } from '../audio/voice';

export class TitleScene extends Phaser.Scene {
  private controls!: Controls;
  private resetHold = 0;
  private resetText!: Phaser.GameObjects.Text;

  constructor() { super('Title'); }

  create() {
    const { width, height } = this.scale;
    this.controls = new Controls(this);
    addBackdrop(this, 'glade', width);

    const title = this.add.text(width / 2, 150, 'Alicorn\nAdventures', titleStyle(96, { align: 'center', lineSpacing: -20 })).setOrigin(0.5);
    this.tweens.add({ targets: title, y: 160, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    const hero = this.add.image(width / 2, 400, `alicorn-${GameState.data.equipped.mane}`).setScale(1.6);
    this.tweens.add({ targets: hero, y: 370, angle: -4, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.add.particles(0, 0, 'fx-star', {
      follow: hero, followOffset: { x: -60, y: 20 }, frequency: 90, lifespan: 1200, speedX: { min: -120, max: -40 },
      speedY: { min: -20, max: 20 }, scale: { start: 1, end: 0 }, tint: [0xfff6a0, 0xff7eb9, 0x7ed6ff],
    });

    const name = GameState.data.name;
    const prompt = this.add.text(width / 2, 580, name ? `Welcome back, ${name}!\nPress SPACE to play!` : 'Press SPACE to play!',
      titleStyle(44, { align: 'center' })).setOrigin(0.5);
    this.tweens.add({ targets: prompt, scale: 1.06, duration: 700, yoyo: true, repeat: -1 });

    this.add.text(16, height - 34, 'Grown-ups: M = sound on/off · V = voice on/off · hold R to start over',
      textStyle(18, { color: '#ffffff', stroke: '#2b1f4a', strokeThickness: 4 }));
    this.resetText = this.add.text(width / 2, 680, '', titleStyle(28)).setOrigin(0.5);

    const kb = this.input.keyboard!;
    kb.on('keydown-M', () => setMuted(!isMuted()));
    kb.on('keydown-V', () => setVoiceOn(!isVoiceOn()));
  }

  update(_t: number, dt: number) {
    const r = this.input.keyboard!.addKey('R');
    if (r.isDown) {
      this.resetHold += dt;
      const left = Math.ceil((3000 - this.resetHold) / 1000);
      this.resetText.setText(left > 0 ? `Starting over in ${left}...` : 'All fresh!');
      if (this.resetHold >= 3000 && this.resetHold - dt < 3000) {
        GameState.resetAll();
        this.time.delayedCall(600, () => this.scene.restart());
      }
    } else if (this.resetHold) {
      this.resetHold = 0;
      this.resetText.setText('');
    }

    if (this.controls.confirm()) {
      audio(); // browsers only allow sound after a key press
      sfx.yay();
      playGeneratedMusic(84, 60);
      this.cameras.main.fadeOut(400, 255, 255, 255);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        if (GameState.data.name) {
          this.scene.start('World', { levelId: 'glade' });
        } else {
          speak(this, 'pick-name');
          this.scene.start('NamePicker');
        }
      });
    }
  }
}
