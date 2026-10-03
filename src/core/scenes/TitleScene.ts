import Phaser from 'phaser';
import { Controls } from '../systems/Controls';
import { GameState } from '../systems/GameState';
import { addBackdrop } from '../ui/backdrop';
import { COLORS, textStyle, titleStyle } from '../ui/style';
import { audio, isMuted, setMuted, sfx } from '../audio/sfx';
import { playGeneratedMusic } from '../audio/music';
import { isVoiceOn, setVoiceOn, speak } from '../audio/voice';
import { downloadBackup, pickBackupFile } from '../systems/Backup';
import type { Profile } from '../systems/SaveManager';

interface Card { profile?: Profile; box: Phaser.GameObjects.Rectangle }

/**
 * Title screen and player picker. Each player has their own alicorn and
 * save. ← → choose a player, SPACE plays.
 */
export class TitleScene extends Phaser.Scene {
  private controls!: Controls;
  private resetHold = 0;
  private resetText!: Phaser.GameObjects.Text;
  private cards: Card[] = [];
  private sel = 0;
  private leaving = false;

  constructor() { super('Title'); }

  create() {
    const { width, height } = this.scale;
    this.controls = new Controls(this);
    this.cards = [];
    this.leaving = false;
    addBackdrop(this, 'glade', width);

    const title = this.add.text(width / 2, 120, 'Alicorn\nAdventures', titleStyle(88, { align: 'center', lineSpacing: -20 })).setOrigin(0.5);
    this.tweens.add({ targets: title, y: 130, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    const profiles = GameState.profiles();
    if (profiles.length) this.buildCards(profiles);
    else this.buildFirstTime();

    this.add.text(16, height - 34, 'Grown-ups: M sound · V voice · B save a backup · L load a backup · hold R to start over',
      textStyle(18, { color: '#ffffff', stroke: '#2b1f4a', strokeThickness: 4 }));
    this.resetText = this.add.text(width / 2, 640, '', titleStyle(28)).setOrigin(0.5);

    const kb = this.input.keyboard!;
    kb.on('keydown-M', () => setMuted(!isMuted()));
    kb.on('keydown-V', () => setVoiceOn(!isVoiceOn()));
    kb.on('keydown-B', () => {
      const p = this.selectedProfile();
      if (!p) return this.flash('Pick a player first.');
      downloadBackup(p.save);
      this.flash(`Backup of ${p.save.name || 'this player'} saved to your downloads!`);
    });
    kb.on('keydown-L', () => {
      const p = this.selectedProfile();
      if (p) GameState.selectProfile(p.id);
      pickBackupFile()
        .then((save) => {
          if (!save) return;
          GameState.restore(save);
          this.flash(`Loaded ${save.name || 'the'} backup!`);
          this.time.delayedCall(1200, () => this.scene.restart());
        })
        .catch(() => this.flash("That file isn't an Alicorn Adventures backup."));
    });
  }

  /** First time on this device: one big friendly alicorn and "press space". */
  private buildFirstTime() {
    const { width } = this.scale;
    const hero = this.add.image(width / 2, 400, 'alicorn-pink').setScale(1.6);
    this.tweens.add({ targets: hero, y: 370, angle: -4, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.trail(hero);
    const prompt = this.add.text(width / 2, 560, 'Press SPACE to play!', titleStyle(44)).setOrigin(0.5);
    this.tweens.add({ targets: prompt, scale: 1.06, duration: 700, yoyo: true, repeat: -1 });
    this.cards = [{ box: this.add.rectangle(0, 0, 1, 1).setVisible(false) }];
  }

  private buildCards(profiles: Profile[]) {
    const { width } = this.scale;
    const slots: (Profile | undefined)[] = [...profiles];
    if (GameState.canAddProfile()) slots.push(undefined);
    const gap = 260;
    slots.forEach((p, i) => {
      const x = width / 2 + (i - (slots.length - 1) / 2) * gap;
      const y = 400;
      const box = this.add.rectangle(x, y, 230, 270, COLORS.paper, 0.92).setStrokeStyle(6, COLORS.paperEdge);
      if (p) {
        const hero = this.add.image(x, y - 30, `alicorn-${p.save.equipped.mane}`).setScale(1.05);
        this.tweens.add({ targets: hero, y: y - 40, duration: 1100 + i * 120, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        this.add.text(x, y + 70, p.save.name || 'New friend', titleStyle(32)).setOrigin(0.5);
        const friends = p.save.friendsHelped.length;
        const gold = p.save.flags.filter((f) => f.startsWith('gold:')).length;
        this.add.text(x, y + 108, `💛 ${friends}  ⭐ ${gold}  ✨ ${p.save.stardust}`, textStyle(20)).setOrigin(0.5);
      } else {
        this.add.text(x, y - 20, '+', titleStyle(96)).setOrigin(0.5);
        this.add.text(x, y + 80, 'New player', titleStyle(30)).setOrigin(0.5);
      }
      box.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        if (this.sel === i) this.play();
        else { this.sel = i; this.highlight(); }
      });
      this.cards.push({ profile: p, box });
    });
    const active = GameState.activeProfile();
    this.sel = Math.max(0, slots.findIndex((p) => p && p.id === active?.id));
    this.highlight();
    const prompt = this.add.text(width / 2, 580, '← → pick a player · SPACE to play!', titleStyle(34)).setOrigin(0.5);
    this.tweens.add({ targets: prompt, scale: 1.04, duration: 700, yoyo: true, repeat: -1 });
  }

  private trail(target: Phaser.GameObjects.Image) {
    this.add.particles(0, 0, 'fx-star', {
      follow: target, followOffset: { x: -60, y: 20 }, frequency: 90, lifespan: 1200, speedX: { min: -120, max: -40 },
      speedY: { min: -20, max: 20 }, scale: { start: 1, end: 0 }, tint: [0xfff6a0, 0xff7eb9, 0x7ed6ff],
    });
  }

  private highlight() {
    this.cards.forEach((c, i) => {
      const on = i === this.sel;
      c.box.setStrokeStyle(on ? 10 : 6, on ? 0xff7eb9 : COLORS.paperEdge).setScale(on ? 1.06 : 1);
    });
  }

  private selectedProfile() {
    return this.cards[this.sel]?.profile;
  }

  private flash(msg: string) {
    this.resetText.setText(msg);
    this.time.delayedCall(3000, () => { if (this.resetText.text === msg) this.resetText.setText(''); });
  }

  private play() {
    if (this.leaving) return;
    this.leaving = true;
    audio(); // browsers only allow sound after a key press
    sfx.yay();
    playGeneratedMusic(84, 60);
    const p = this.selectedProfile();
    if (p) GameState.selectProfile(p.id);
    this.cameras.main.fadeOut(400, 255, 255, 255);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (p && p.save.name) this.scene.start('World', { levelId: 'glade' });
      else {
        speak(this, 'pick-name');
        this.scene.start('NamePicker', { newProfile: !p });
      }
    });
  }

  update(_t: number, dt: number) {
    if (this.leaving) return;
    const r = this.input.keyboard!.addKey('R');
    const p = this.selectedProfile();
    if (r.isDown && p) {
      this.resetHold += dt;
      const left = Math.ceil((3000 - this.resetHold) / 1000);
      this.resetText.setText(left > 0 ? `Starting ${p.save.name || 'this player'} over in ${left}...` : 'All fresh!');
      if (this.resetHold >= 3000 && this.resetHold - dt < 3000) {
        GameState.selectProfile(p.id);
        GameState.resetAll();
        this.time.delayedCall(600, () => this.scene.restart());
      }
    } else if (this.resetHold) {
      this.resetHold = 0;
      this.resetText.setText('');
    }

    const c = this.controls;
    const dx = (c.menuRight() ? 1 : 0) - (c.menuLeft() ? 1 : 0);
    if (dx && this.cards.length > 1) {
      this.sel = Phaser.Math.Wrap(this.sel + dx, 0, this.cards.length);
      sfx.select();
      this.highlight();
    }
    if (c.confirm()) this.play();
  }
}
