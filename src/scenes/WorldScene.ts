import Phaser from 'phaser';
import { LEVELS, GROUND_Y, WORLD_HEIGHT, type LevelDef } from '../data/levels';
import { FRIENDS, findFriend, type FriendDef } from '../data/friends';
import { Alicorn } from '../objects/Alicorn';
import { Friend } from '../objects/Friend';
import { Controls } from '../systems/Controls';
import { GameState } from '../systems/GameState';
import { SpeechBubble } from '../ui/SpeechBubble';
import { addBackdrop } from '../ui/backdrop';
import { titleStyle } from '../ui/style';
import { sfx } from '../audio/sfx';
import { playGeneratedMusic, stopGeneratedMusic } from '../audio/music';
import { lineText, speak } from '../audio/voice';

interface WorldData { levelId: string; from?: string; firstTime?: boolean }

interface Bloom { img: Phaser.GameObjects.Image; open: boolean }
interface Spot {
  x: number;
  kind: 'portal' | 'mirror' | 'tree';
  target?: string;
  locked: boolean;
  art: Phaser.GameObjects.Image;
  arrow: Phaser.GameObjects.Text;
}

export interface Quest { texture: string; have: number; need: number }

const PASTELS = [0xffb3d1, 0xfff0b3, 0xc4f7df, 0xbfeaff, 0xd9c6ff, 0xffd1a8];
const TALK_GAP_MS = 7000;

/**
 * Every place in the game (the Home Glade and each forest area) is this one
 * scene, built from the data in src/data/levels.ts.
 */
export class WorldScene extends Phaser.Scene {
  private level!: LevelDef;
  private from?: string;
  private firstTime = false;
  private controls!: Controls;
  private player!: Alicorn;
  private bubble!: SpeechBubble;
  private blooms: Bloom[] = [];
  private bouncers: Phaser.GameObjects.Image[] = [];
  private spots: Spot[] = [];
  private friend?: Friend;
  private gladeFriends: Friend[] = [];
  private questHave = 0;
  private talkedOnce = false;
  private lastTalk = -Infinity;
  private cloudBusy = false;
  private caughtOnce = false;
  private leaving = false;
  private music?: Phaser.Sound.BaseSound;

  constructor() { super('World'); }

  init(data: WorldData) {
    this.level = LEVELS[data.levelId] ?? LEVELS.glade;
    this.from = data.from;
    this.firstTime = !!data.firstTime;
    this.blooms = [];
    this.bouncers = [];
    this.spots = [];
    this.friend = undefined;
    this.gladeFriends = [];
    this.questHave = 0;
    this.talkedOnce = false;
    this.lastTalk = -Infinity;
    this.cloudBusy = false;
    this.leaving = false;
  }

  create() {
    const L = this.level;
    this.controls = new Controls(this);
    this.physics.world.setBounds(0, 0, L.width, WORLD_HEIGHT);
    this.physics.world.setBoundsCollision(true, true, true, false); // open at the bottom, where the cloud lives
    this.cameras.main.setBounds(0, 0, L.width, WORLD_HEIGHT);

    addBackdrop(this, L.id, L.width);
    this.addAmbient();

    const solids = this.buildTerrain();
    this.buildSpots();
    this.buildDecorations();

    const startX = this.from ? (L.portals.find((p) => p.target === this.from)?.x ?? L.start.x) : L.start.x;
    this.player = new Alicorn(this, startX, this.from ? GROUND_Y - 80 : L.start.y);
    this.physics.add.collider(this.player, solids);

    this.buildPickups();
    this.buildFriends();
    this.bubble = new SpeechBubble(this);

    const cam = this.cameras.main;
    cam.startFollow(this.player, true, 0.1, 0.1);
    cam.setDeadzone(160, 200);
    cam.fadeIn(400, 255, 255, 255);

    if (!this.scene.isActive('UI')) this.scene.launch('UI');
    this.registry.set('levelName', { name: L.name, at: this.time.now });
    this.startMusic();

    if (this.firstTime) this.time.delayedCall(900, () => this.hint('glade-hello'));

    this.events.on(Phaser.Scenes.Events.RESUME, () => this.input.keyboard?.resetKeys());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.music?.stop();
      this.music?.destroy();
    });
  }

  // ------------------------------------------------------------ building

  private buildTerrain() {
    const L = this.level;
    const solids = this.physics.add.staticGroup();
    for (const g of L.ground) {
      const ts = this.add.tileSprite(g.x, GROUND_Y, g.w, WORLD_HEIGHT - GROUND_Y + 40, `ground-${L.id}`).setOrigin(0).setDepth(5);
      this.physics.add.existing(ts, true);
      solids.add(ts);
    }
    for (const p of L.platforms) {
      const ts = this.add.tileSprite(p.x, p.y, p.w, 44, `ground-${L.id}`).setOrigin(0).setDepth(5);
      this.physics.add.existing(ts, true);
      const body = ts.body as Phaser.Physics.Arcade.StaticBody;
      // One-way: fly up through from below, land on top.
      body.checkCollision.down = false;
      body.checkCollision.left = false;
      body.checkCollision.right = false;
      solids.add(ts);
    }
    return solids;
  }

  private buildSpots() {
    const L = this.level;
    for (const p of L.portals) {
      const locked = p.target !== 'glade' && !GameState.has('area', p.target);
      const art = this.add.image(p.x, GROUND_Y + 4, 'portal').setOrigin(0.5, 1).setDepth(4);
      const label = p.target === 'glade' ? 'Home' : LEVELS[p.target]?.name ?? p.target;
      this.add.text(p.x, GROUND_Y - 236, label, titleStyle(26, { align: 'center', wordWrap: { width: 220 } })).setOrigin(0.5, 1).setDepth(4);
      if (locked) {
        art.setTint(0x9990b0);
        this.add.image(p.x, GROUND_Y - 90, 'icon-lock').setDepth(4);
      } else {
        this.add.particles(p.x, GROUND_Y - 110, 'fx-star', {
          x: { min: -45, max: 45 }, y: { min: -60, max: 90 }, lifespan: 1200, frequency: 180,
          scale: { start: 0.7, end: 0 }, speedY: { min: -30, max: -10 }, tint: [0xffffff, 0xfff6a0, 0xffc2de],
        }).setDepth(4);
      }
      this.spots.push({ x: p.x, kind: 'portal', target: p.target, locked, art, arrow: this.makeArrow(p.x, GROUND_Y - 340) });
    }
    for (const s of L.stations) {
      const art = this.add.image(s.x, GROUND_Y + 4, `station-${s.kind}`).setOrigin(0.5, 1).setDepth(4);
      const label = s.kind === 'mirror' ? 'Dress Up' : 'Stickers';
      const top = GROUND_Y - art.height;
      this.add.text(s.x, top - 6, label, titleStyle(28)).setOrigin(0.5, 1).setDepth(4);
      this.spots.push({ x: s.x, kind: s.kind, locked: false, art, arrow: this.makeArrow(s.x, top - 60) });
    }
  }

  private makeArrow(x: number, y: number) {
    const a = this.add.text(x, y, '▼', titleStyle(44)).setOrigin(0.5).setDepth(20).setVisible(false);
    this.tweens.add({ targets: a, y: y + 14, duration: 400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    return a;
  }

  private buildDecorations() {
    if (this.level.id !== 'glade') return;
    if (GameState.has('decoration', 'lanterns'))
      for (const x of [340, 1040, 1720, 2100]) {
        const l = this.add.image(x, 220, 'deco-lanterns').setDepth(3);
        this.tweens.add({ targets: l, angle: 3, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      }
    if (GameState.has('decoration', 'flowers'))
      for (const x of [140, 700, 1370, 2020, 2330]) this.add.image(x, GROUND_Y + 6, 'deco-flowers').setOrigin(0.5, 1).setDepth(6);
  }

  private buildPickups() {
    const L = this.level;
    const stardust = this.physics.add.staticGroup();
    for (const p of L.stardust) {
      const s = stardust.create(p.x, p.y, 'stardust') as Phaser.Physics.Arcade.Image;
      s.setDepth(7).setCircle(18, 4, 4);
      this.tweens.add({ targets: s, scale: 1.15, angle: 12, duration: 600 + Math.random() * 300, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
    this.physics.add.overlap(this.player, stardust, (_p, s) => this.collectStardust(s as Phaser.Physics.Arcade.Image));

    const def = L.friend && findFriend(L.friend.id);
    if (def && def.request.kind === 'fetch' && !GameState.hasHelped(def.id)) {
      const items = this.physics.add.staticGroup();
      for (const p of L.items) {
        const it = items.create(p.x, p.y, `item-${def.request.item}`) as Phaser.Physics.Arcade.Image;
        it.setDepth(7);
        this.tweens.add({ targets: it, angle: { from: -10, to: 10 }, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        this.add.particles(p.x, p.y, 'fx-star', { lifespan: 900, frequency: 250, speed: 30, scale: { start: 0.6, end: 0 }, tint: 0xfff6a0 }).setDepth(6);
      }
      this.physics.add.overlap(this.player, items, (_p, it) => this.collectItem(it as Phaser.Physics.Arcade.Image, def));
    }

    for (const b of L.blooms) {
      const img = this.add.image(b.x, b.y + 4, 'bloom-bud').setOrigin(0.5, 1).setDepth(6);
      this.tweens.add({ targets: img, angle: { from: -4, to: 4 }, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.blooms.push({ img, open: false });
    }
    for (const b of L.bouncers) this.bouncers.push(this.add.image(b.x, b.y + 4, 'bouncer').setOrigin(0.5, 1).setDepth(6));
  }

  private buildFriends() {
    const L = this.level;
    if (L.id === 'glade') {
      for (const def of FRIENDS.filter((f) => GameState.hasHelped(f.id)))
        this.gladeFriends.push(new Friend(this, def.gladeX, GROUND_Y + 4, def));
      return;
    }
    const def = L.friend && findFriend(L.friend.id);
    if (!def || GameState.hasHelped(def.id)) return;
    this.friend = new Friend(this, L.friend!.x, L.friend!.y + 4, def);
    if (def.request.kind === 'wake') this.friend.sleep();
    this.setQuest(def);
  }

  private addAmbient() {
    const cfg: Record<string, { tex: string; tint: number[]; scale: number }> = {
      glade: { tex: 'fx-heart', tint: [0xffc2de, 0xd9c6ff, 0xfff0b3], scale: 0.7 },
      trees: { tex: 'fx-dot', tint: [0xfff6a0, 0xd8ff9a], scale: 0.45 },
      mushrooms: { tex: 'fx-dot', tint: [0xffc2de, 0xffffff], scale: 0.5 },
      crystals: { tex: 'fx-star', tint: [0xffffff, 0xbfeaff], scale: 0.5 },
      clouds: { tex: 'fx-star', tint: [0xfff6a0, 0xffffff], scale: 0.6 },
    };
    const a = cfg[this.level.theme.deco];
    this.add.particles(0, 0, a.tex, {
      x: { min: 0, max: 1280 }, y: { min: 60, max: 600 }, lifespan: 5000, frequency: 260,
      speedX: { min: -15, max: 15 }, speedY: { min: -25, max: -5 }, scale: { start: a.scale, end: a.scale * 0.3 },
      alpha: { start: 0.9, end: 0 }, tint: a.tint,
    }).setScrollFactor(0).setDepth(-5);
  }

  private startMusic() {
    const key = `music-${this.level.id}`;
    if (this.cache.audio.exists(key)) {
      stopGeneratedMusic();
      this.music = this.sound.add(key, { loop: true, volume: 0.35 });
      this.music.play();
    } else {
      playGeneratedMusic(this.level.music.bpm, this.level.music.root);
    }
  }

  // ------------------------------------------------------------ play

  update(_time: number, dt: number) {
    if (this.leaving) return;
    const c = this.controls;
    const downPressed = c.magic();
    const near = this.nearestSpot();
    this.spots.forEach((s) => s.arrow.setVisible(s === near));

    if (near && downPressed) this.interact(near);
    const cast = this.player.control(c, dt, downPressed && !near);
    if (cast) this.onMagic();

    this.checkBouncers();
    if (this.player.y > WORLD_HEIGHT + 60 && !this.cloudBusy) this.cloudCatch();
    this.checkFriendTalk();

    if (c.back()) this.openOverlay('StickerBook');
  }

  private nearestSpot(): Spot | undefined {
    if (this.player.y < GROUND_Y - 260) return undefined;
    return this.spots.find((s) => Math.abs(s.x - this.player.x) < 80);
  }

  private interact(s: Spot) {
    if (s.kind === 'mirror') return this.openOverlay('Wardrobe');
    if (s.kind === 'tree') return this.openOverlay('StickerBook');
    if (s.locked) {
      sfx.soft();
      this.tweens.add({ targets: s.art, x: s.x + 8, duration: 60, yoyo: true, repeat: 3 });
      this.hint('door-locked');
      return;
    }
    this.travel(s.target!);
  }

  private travel(target: string) {
    this.leaving = true;
    this.player.frozen = true;
    this.player.body.setVelocity(0, 0).setAllowGravity(false);
    sfx.whoosh();
    this.tweens.add({ targets: this.player, scale: 0.2, alpha: 0, angle: 360, duration: 500 });
    this.cameras.main.fadeOut(500, 255, 255, 255);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.restart({ levelId: target, from: this.level.id }));
  }

  private openOverlay(key: 'Wardrobe' | 'StickerBook') {
    sfx.whoosh();
    this.scene.pause();
    this.scene.launch(key);
  }

  private collectStardust(s: Phaser.Physics.Arcade.Image) {
    (s.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    sfx.chime();
    GameState.addStardust(1);
    this.tweens.killTweensOf(s);
    this.tweens.add({ targets: s, y: s.y - 50, scale: 1.8, alpha: 0, duration: 300, onComplete: () => s.destroy() });
  }

  private collectItem(it: Phaser.Physics.Arcade.Image, def: FriendDef) {
    (it.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    sfx.item();
    this.questHave++;
    this.setQuest(def);
    this.tweens.killTweensOf(it);
    this.tweens.add({ targets: it, y: it.y - 80, scale: 2, alpha: 0, duration: 500, onComplete: () => it.destroy() });
    if (this.friend && def.request.kind === 'fetch' && this.questHave >= def.request.count)
      this.time.delayedCall(700, () => this.hint('fetch-done'));
  }

  private setQuest(def: FriendDef) {
    const r = def.request;
    const q: Quest | null =
      r.kind === 'fetch' ? { texture: `item-${r.item}`, have: this.questHave, need: r.count }
        : r.kind === 'bloom' ? { texture: 'bloom-flower', have: this.questHave, need: this.blooms.length }
          : null;
    this.registry.set('quest', q);
  }

  private onMagic() {
    const p = this.player;
    for (const b of this.blooms)
      if (!b.open && Phaser.Math.Distance.Between(p.x, p.y, b.img.x, b.img.y - 30) < 220) this.openBloom(b);

    const f = this.friend;
    if (f?.asleep && Phaser.Math.Distance.Between(p.x, p.y, f.x, f.y - 50) < 240) {
      f.wake();
      this.helped(f);
    }
    for (const gf of this.gladeFriends)
      if (Math.abs(gf.x - p.x) < 200) gf.celebrate();
  }

  private openBloom(b: Bloom) {
    b.open = true;
    this.tweens.killTweensOf(b.img);
    b.img.setTexture('bloom-flower').setTint(Phaser.Utils.Array.GetRandom(PASTELS)).setScale(0).setAngle(0);
    this.tweens.add({ targets: b.img, scale: 1, duration: 500, ease: 'Back.out' });
    sfx.bloom();
    this.add.particles(b.img.x, b.img.y - 40, 'fx-heart', {
      speed: { min: 80, max: 200 }, lifespan: 800, scale: { start: 0.9, end: 0 }, tint: PASTELS, emitting: false,
    }).setDepth(8).explode(12);
    GameState.addStardust(3);
    const plus = this.add.text(b.img.x, b.img.y - 110, '+3 ✨', titleStyle(34)).setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: plus, y: plus.y - 60, alpha: 0, duration: 1200, onComplete: () => plus.destroy() });

    const f = this.friend;
    if (f && !f.helped && f.def.request.kind === 'bloom') {
      this.questHave = this.blooms.filter((x) => x.open).length;
      this.setQuest(f.def);
      if (this.questHave >= this.blooms.length) this.makeRainbow(f);
      else if (this.time.now - this.lastTalk > 3000) this.friendSay(f, f.def.lines.progress!);
    }
  }

  private makeRainbow(f: Friend) {
    const r = this.add.image(f.x, GROUND_Y - 40, 'rainbow').setOrigin(0.5, 1).setDepth(-4).setAlpha(0).setScale(1.3);
    this.tweens.add({ targets: r, alpha: 1, duration: 1500 });
    this.cameras.main.pan(f.x, WORLD_HEIGHT / 2, 800, 'Sine.inOut');
    this.time.delayedCall(900, () => {
      this.helped(f);
      this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    });
  }

  private helped(f: Friend) {
    if (f.helped) return;
    f.helped = true;
    this.registry.set('quest', null);
    sfx.yay();
    this.confetti(f.x, f.y - 120);
    f.celebrate();
    this.friendSay(f, f.def.lines.thanks, 5000);
    GameState.helpFriend(f.def.id);
    this.time.delayedCall(5200, () => {
      this.hint('friend-moved');
      this.add.particles(f.x, f.y - 50, 'fx-star', {
        speed: { min: 60, max: 180 }, lifespan: 900, scale: { start: 1, end: 0 }, tint: [0xfff6a0, 0xffc2de, 0xbfeaff], emitting: false,
      }).setDepth(9).explode(30);
      this.tweens.add({ targets: f, alpha: 0, y: f.y - 120, duration: 1200, onComplete: () => f.setVisible(false) });
      this.friend = undefined;
    });
  }

  private checkFriendTalk() {
    const p = this.player;
    const now = this.time.now;
    const f = this.friend;
    if (f && !f.helped && Math.abs(p.x - f.x) < 170 && Math.abs(p.y - f.y) < 260) {
      const r = f.def.request;
      if (r.kind === 'fetch' && this.questHave >= r.count) {
        this.helped(f);
      } else if (!this.talkedOnce) {
        this.talkedOnce = true;
        this.friendSay(f, f.def.lines.ask);
        if (f.def.lines.hint) this.time.delayedCall(2200, () => this.hint(f.def.lines.hint!));
      } else if (now - this.lastTalk > TALK_GAP_MS) {
        this.friendSay(f, r.kind === 'fetch' && this.questHave > 0 ? f.def.lines.progress! : f.def.lines.ask);
      }
    }
    for (const gf of this.gladeFriends)
      if (Math.abs(p.x - gf.x) < 120 && now - this.lastTalk > TALK_GAP_MS + 3000)
        this.friendSay(gf, Math.random() < 0.5 ? gf.def.lines.thanks : 'glade-friend');
  }

  private friendSay(f: Friend, lineId: string, ms = 4200) {
    this.lastTalk = this.time.now;
    this.bubble.say(lineText(lineId, GameState.data.name), f.x, f.y - f.displayHeight - 12, ms);
    speak(this, lineId, GameState.data.name);
  }

  /** Narrator lines appear at the bottom of the screen and are read aloud. */
  private hint(lineId: string) {
    this.registry.set('hint', { text: lineText(lineId, GameState.data.name), at: this.time.now });
    speak(this, lineId, GameState.data.name);
  }

  private checkBouncers() {
    const p = this.player;
    if (p.body.velocity.y <= 0) return;
    for (const m of this.bouncers) {
      const top = m.y - m.height + 10;
      if (Math.abs(p.x - m.x) < 70 && p.body.bottom > top && p.body.bottom < top + 40) {
        p.bounce();
        this.tweens.add({ targets: m, scaleY: 0.75, scaleX: 1.15, duration: 100, yoyo: true, ease: 'Quad.out' });
      }
    }
  }

  /** Falling never hurts: a smiling cloud floats the alicorn back to safe ground. */
  private cloudCatch() {
    this.cloudBusy = true;
    const p = this.player;
    p.frozen = true;
    p.body.setVelocity(0, 0).setAllowGravity(false);
    p.body.moves = false;
    const safe = p.safeSpot;
    p.setPosition(p.x, WORLD_HEIGHT + 20);
    const cloud = this.add.image(p.x, WORLD_HEIGHT + 90, 'cloud').setDepth(9);
    this.bubble.say('Whoops! A cloud caught you!', safe.x, safe.y - 90, 2200);
    if (!this.caughtOnce) speak(this, 'cloud-catch');
    this.caughtOnce = true;
    sfx.whoosh();
    this.tweens.add({ targets: p, x: safe.x, y: safe.y - 30, duration: 1500, ease: 'Sine.inOut' });
    this.tweens.add({
      targets: cloud, x: safe.x, y: safe.y + 40, duration: 1500, ease: 'Sine.inOut',
      onComplete: () => {
        p.body.moves = true;
        p.body.setAllowGravity(true);
        p.frozen = false;
        this.cloudBusy = false;
        this.tweens.add({ targets: cloud, y: cloud.y + 300, alpha: 0, duration: 1200, onComplete: () => cloud.destroy() });
      },
    });
  }

  private confetti(x: number, y: number) {
    this.add.particles(x, y, 'fx-dot', {
      speed: { min: 250, max: 600 }, angle: { min: -160, max: -20 }, gravityY: 500, lifespan: 2200,
      scale: { start: 0.9, end: 0.4 }, rotate: { min: 0, max: 360 },
      tint: [0xff5e5e, 0xffa24c, 0xffe14c, 0x6fe36f, 0x5ec8ff, 0xa77bff, 0xff7eb9], emitting: false,
    }).setDepth(40).explode(90);
  }
}
