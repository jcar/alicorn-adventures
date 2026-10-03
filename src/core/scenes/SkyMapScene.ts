import Phaser from 'phaser';
import { KINGDOMS, UPCOMING, goldIds, secretIds, type KingdomDef } from '../content';
import { Controls } from '../systems/Controls';
import { GameState } from '../systems/GameState';
import { textStyle, titleStyle } from '../ui/style';
import { sfx } from '../audio/sfx';
import { playGeneratedMusic, stopGeneratedMusic } from '../audio/music';
import { speak } from '../audio/voice';
import { loadAudio } from '../assets';

interface Island {
  id: string;
  name: string;
  x: number;
  y: number;
  /** Where landing takes you (a level id), or nothing for a mystery island. */
  target?: string;
  kingdom?: KingdomDef;
  locked: boolean;
  img: Phaser.GameObjects.Image;
}

/**
 * The Sky Map: kingdoms float in the sky as islands. Fly between them
 * with the arrows (or tap), and press ↓ / Space / Enter to land.
 * Mystery islands are kingdoms still to come.
 */
export class SkyMapScene extends Phaser.Scene {
  private controls!: Controls;
  private islands: Island[] = [];
  private sel = 0;
  private hero!: Phaser.GameObjects.Image;
  private caption!: Phaser.GameObjects.Text;
  private from = 'glade';
  private leaving = false;
  private music?: Phaser.Sound.BaseSound;
  private flight?: Phaser.Tweens.Tween;

  constructor() { super('SkyMap'); }

  init(data: { from?: string }) {
    this.from = data?.from ?? 'glade';
    this.islands = [];
    this.leaving = false;
    this.music = undefined;
  }

  create() {
    const { width, height } = this.scale;
    this.controls = new Controls(this);
    this.add.image(0, 0, 'bg-skymap').setOrigin(0).setDisplaySize(width, height);
    this.add.particles(0, 0, 'fx-star', {
      x: { min: 0, max: width }, y: { min: 0, max: height * 0.6 }, lifespan: 2500, frequency: 120,
      scale: { start: 0.5, end: 0 }, alpha: { start: 0.9, end: 0 }, tint: [0xffffff, 0xfff6a0],
    });
    this.add.text(width / 2, 52, 'Sky Map', titleStyle(56)).setOrigin(0.5);

    const add = (o: Omit<Island, 'img'>, texture: string) => {
      const px = o.x * width;
      const py = o.y * height;
      const img = this.add.image(px, py, texture);
      img.setScale(Math.min(1, 230 / img.width));
      this.tweens.add({ targets: img, y: py - 10, duration: 1800 + Math.random() * 600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      if (o.locked || !o.target) img.setTint(0xb8b0d0);
      this.add.text(px, py + img.displayHeight / 2 + 8, o.name, titleStyle(24, { align: 'center', wordWrap: { width: 230 } })).setOrigin(0.5, 0);
      const island: Island = { ...o, x: px, y: py, img };
      img.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        const i = this.islands.indexOf(island);
        if (i === this.sel) this.land();
        else this.choose(i);
      });
      this.islands.push(island);
      return island;
    };

    add({ id: 'glade', name: 'Home', x: 0.14, y: 0.62, target: 'glade', locked: false }, 'island-home');
    for (const k of KINGDOMS) {
      const locked = !!k.needs?.some((f) => !GameState.hasHelped(f));
      const isl = add({ id: k.id, name: k.name, x: k.map.x, y: k.map.y, target: k.hub.id, kingdom: k, locked }, k.island);
      this.addBadges(isl, k);
    }
    for (const t of UPCOMING) {
      const isl = add({ id: t.id, name: '???', x: t.map.x, y: t.map.y, locked: true }, 'island-mystery');
      this.add.text(isl.x, isl.y - 10, '?', titleStyle(64)).setOrigin(0.5).setAlpha(0.85);
    }
    this.islands.sort((a, b) => a.x - b.x);

    this.caption = this.add.text(width / 2, height - 60, '', textStyle(28, { align: 'center', color: '#ffffff', stroke: '#2b1f4a', strokeThickness: 6 })).setOrigin(0.5);

    const start = Math.max(0, this.islands.findIndex((i) => i.target === this.from || i.kingdom?.hub.id === this.from || (i.kingdom && this.from in i.kingdom.areas)));
    this.sel = start;
    const here = this.islands[start];
    this.hero = this.add.image(here.x, here.y - here.img.displayHeight / 2 - 30, `alicorn-${GameState.data.equipped.mane}`).setScale(0.7).setDepth(10);
    this.tweens.add({ targets: this.hero, angle: { from: -4, to: 4 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.add.particles(0, 0, 'fx-star', {
      follow: this.hero, followOffset: { x: -40, y: 10 }, frequency: 80, lifespan: 900, speedX: { min: -80, max: -20 },
      scale: { start: 0.8, end: 0 }, tint: [0xfff6a0, 0xff7eb9, 0x7ed6ff],
    }).setDepth(9);
    this.updateCaption();

    this.registry.set('levelName', { name: 'Sky Map', at: this.time.now });
    if (!GameState.data.seen.includes('skymap')) {
      GameState.markSeen('skymap');
      this.time.delayedCall(800, () => {
        this.registry.set('hint', { text: 'This is the Sky Map! Fly to an island and press down to land.', at: this.time.now });
        speak(this, 'skymap-hello');
      });
    }
    this.startMusic();
    this.cameras.main.fadeIn(400, 255, 255, 255);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { this.music?.stop(); this.music?.destroy(); });
  }

  /** "✨ 12/18 ⭐ 6/10" and a NEW! tag for kingdoms she hasn't visited yet. */
  private addBadges(isl: Island, k: KingdomDef) {
    const areas = Object.values(k.areas);
    const secrets = areas.flatMap(secretIds);
    const golds = areas.flatMap(goldIds);
    const s = secrets.filter((id) => GameState.hasFlag(`secret:${id}`)).length;
    const g = golds.filter((id) => GameState.hasFlag(`gold:${id}`)).length;
    // Under the name, so the flying alicorn never covers it.
    const y = isl.y + isl.img.displayHeight / 2 + 70;
    if (!isl.locked) this.add.text(isl.x, y, `✨${s}/${secrets.length}  ⭐${g}/${golds.length}`, textStyle(22, { color: '#ffffff', stroke: '#2b1f4a', strokeThickness: 5 })).setOrigin(0.5, 0);
    const visited = Object.keys(k.areas).some((a) => GameState.data.visited.includes(a));
    if (!visited && !isl.locked) {
      const tag = this.add.text(isl.x + 90, isl.y - 60, 'NEW!', titleStyle(26, { stroke: '#ff7eb9' })).setOrigin(0.5);
      this.tweens.add({ targets: tag, scale: 1.2, duration: 500, yoyo: true, repeat: -1 });
    }
  }

  private startMusic() {
    const play = () => {
      stopGeneratedMusic();
      this.music = this.sound.add('music-skymap', { loop: true, volume: 0.35 });
      this.music.play();
    };
    if (this.cache.audio.exists('music-skymap')) return play();
    playGeneratedMusic(70, 65);
    loadAudio(this, 'music-skymap').then((ok) => { if (ok && this.scene.isActive() && !this.music) play(); });
  }

  private choose(i: number) {
    if (this.leaving || i === this.sel) return;
    const to = this.islands[i];
    this.hero.setFlipX(to.x < this.islands[this.sel].x);
    this.sel = i;
    sfx.whoosh();
    this.flight?.stop();
    this.flight = this.tweens.add({ targets: this.hero, x: to.x, y: to.y - to.img.displayHeight / 2 - 30, duration: 550, ease: 'Sine.inOut' });
    this.updateCaption();
  }

  private updateCaption() {
    const isl = this.islands[this.sel];
    if (!isl.target) this.caption.setText('A mystery island... coming soon!');
    else if (isl.locked) this.caption.setText(`${isl.name} is still asleep. Keep helping friends!`);
    else this.caption.setText(`${isl.name}  ·  Press ⬇ to land`);
  }

  private land() {
    const isl = this.islands[this.sel];
    if (!isl.target || isl.locked) {
      sfx.soft();
      this.tweens.add({ targets: isl.img, x: isl.x + 8, duration: 60, yoyo: true, repeat: 3 });
      return;
    }
    this.leaving = true;
    sfx.whoosh();
    this.tweens.add({ targets: this.hero, y: isl.y, scale: 0.2, alpha: 0, duration: 500, ease: 'Sine.in' });
    this.cameras.main.fadeOut(500, 255, 255, 255);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('World', { levelId: isl.target, from: 'skymap' }));
  }

  update() {
    if (this.leaving) return;
    const c = this.controls;
    const dx = (c.menuRight() ? 1 : 0) - (c.menuLeft() ? 1 : 0);
    const dy = (c.menuUp() ? -1 : 0);
    if (dx || dy) this.choose(Phaser.Math.Wrap(this.sel + (dx || dy), 0, this.islands.length));
    if (c.action() || c.confirm()) this.land();
    if (c.back()) {
      // Back where you came from.
      this.leaving = true;
      this.cameras.main.fadeOut(300, 255, 255, 255);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('World', { levelId: this.from, from: 'skymap' }));
    }
  }
}
