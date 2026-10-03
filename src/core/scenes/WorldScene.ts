import Phaser from 'phaser';
import { LEVELS, GROUND_Y, SKY_MAP, WORLD_HEIGHT, kingdomOfArea, kingdomOfLevel, type Hideable, type LevelDef } from '../content';
import { imagesIn, lateImageKeys, loadAudio, queueBundle } from '../assets';
import { makePlaceholders } from '../art/placeholders';
import { FRIENDS, findFriend, type FriendDef } from '../content';
import { powerFromFriend } from '../content';
import { goldIds, secretIds } from '../content';
import { Alicorn } from '../objects/Alicorn';
import { Friend } from '../objects/Friend';
import { Controls } from '../systems/Controls';
import { GameState } from '../systems/GameState';
import { SpeechBubble } from '../ui/SpeechBubble';
import { addBackdrop } from '../ui/backdrop';
import { textStyle, titleStyle } from '../ui/style';
import { sfx } from '../audio/sfx';
import { playGeneratedMusic, stopGeneratedMusic } from '../audio/music';
import { lineText, speak } from '../audio/voice';
import { Barriers } from '../world/Barriers';
import { Darkness } from '../world/Darkness';
import { Secrets } from '../world/Secrets';
import { Patterns } from '../world/Patterns';
import { Favors } from '../world/Favors';
import { HeartCrystal } from '../world/HeartCrystal';
import type { HiddenThing, Spot, World } from '../world/types';

interface WorldData { levelId: string; from?: string; firstTime?: boolean }

interface Bloom { img: Phaser.GameObjects.Image; open: boolean; available: boolean }

export interface Quest { texture: string; have: number; need: number }

const PASTELS = [0xffb3d1, 0xfff0b3, 0xc4f7df, 0xbfeaff, 0xd9c6ff, 0xffd1a8];
const TALK_GAP_MS = 7000;
const SNIFF_REACH = 320;

/**
 * Every place in the game (the Home Glade and each area) is this one
 * scene, built from the data in src/data/levels.ts. Barriers, darkness,
 * secrets, puzzles and favors live in src/world/.
 */
export class WorldScene extends Phaser.Scene implements World {
  level!: LevelDef;
  player!: Alicorn;
  solids!: Phaser.Physics.Arcade.StaticGroup;
  get view(): Phaser.Scene { return this; }

  private from?: string;
  private firstTime = false;
  private controls!: Controls;
  private bubble!: SpeechBubble;
  private prompt!: Phaser.GameObjects.Container;
  private promptText!: Phaser.GameObjects.Text;
  private blooms: Bloom[] = [];
  private bouncers: Phaser.GameObjects.Image[] = [];
  private spots: Spot[] = [];
  private hidden: HiddenThing[] = [];
  private shownHints = new Map<string, number>();
  private lastShimmer = 0;
  private solvers: { x: number; solve: () => void }[] = [];
  private overlayGfx?: Phaser.GameObjects.Graphics;
  private friend?: Friend;
  private gladeFriends: Friend[] = [];
  private questHave = 0;
  private talkedOnce = false;
  private lastTalk = -Infinity;
  private cloudBusy = false;
  private caughtOnce = false;
  private leaving = false;
  private music?: Phaser.Sound.BaseSound;
  private barriers!: Barriers;
  private darkness!: Darkness;
  private secrets!: Secrets;
  private favors?: Favors;

  constructor() { super('World'); }

  init(data: WorldData) {
    this.level = LEVELS[data.levelId] ?? LEVELS.glade;
    this.from = data.from;
    this.firstTime = !!data.firstTime;
    this.blooms = [];
    this.bouncers = [];
    this.spots = [];
    this.hidden = [];
    this.solvers = [];
    this.music = undefined;
    this.overlayGfx = undefined;
    this.shownHints = new Map();
    this.friend = undefined;
    this.gladeFriends = [];
    this.favors = undefined;
    this.questHave = 0;
    this.talkedOnce = false;
    this.lastTalk = -Infinity;
    this.cloudBusy = false;
    this.leaving = false;
  }

  /** Fly-in loading: this kingdom's pictures, if they aren't loaded yet. */
  preload() {
    const kingdom = kingdomOfLevel(this.level.id);
    if (kingdom) queueBundle(this, kingdom.id);
  }

  create() {
    // Fill in anything that still has no art (or failed to load), but leave other
    // kingdoms' pictures alone: their real art loads when she flies there.
    const here = kingdomOfLevel(this.level.id)?.id;
    makePlaceholders(this, new Set([...lateImageKeys()].filter((k) => !imagesIn(here ?? '').some((a) => a.key === k))));
    const L = this.level;
    this.controls = new Controls(this);
    this.physics.world.setBounds(0, 0, L.width, WORLD_HEIGHT);
    this.physics.world.setBoundsCollision(true, true, true, false); // open at the bottom, where the cloud lives
    this.cameras.main.setBounds(0, 0, L.width, WORLD_HEIGHT);
    if (L.id !== 'glade') GameState.visit(L.id);

    addBackdrop(this, L.id, L.width);
    this.addAmbient();

    this.solids = this.buildTerrain();
    this.buildPortalsAndStations();
    this.buildDecorations();

    const startX = this.from ? (L.portals.find((p) => p.target === this.from)?.x ?? L.start.x) : L.start.x;
    this.player = new Alicorn(this, startX, this.from ? GROUND_Y - 80 : L.start.y);
    this.physics.add.collider(this.player, this.solids);

    this.barriers = new Barriers(this);
    this.barriers.build();
    this.secrets = new Secrets(this);
    this.secrets.build();
    new Patterns(this, (id) => this.secrets.patternSolved(id)).build();
    this.buildPickups();
    this.buildFriends();
    this.darkness = new Darkness(this);
    this.darkness.build();
    this.bubble = new SpeechBubble(this);
    this.buildPrompt();

    const cam = this.cameras.main;
    cam.startFollow(this.player, true, 0.1, 0.1);
    cam.setDeadzone(160, 200);
    cam.fadeIn(400, 255, 255, 255);

    if (!this.scene.isActive('UI')) this.scene.launch('UI');
    this.registry.set('levelName', { name: L.name, at: this.time.now });
    this.startMusic();

    if (this.firstTime) this.time.delayedCall(900, () => this.hint('glade-hello'));
    else if (L.id === 'glade' && !GameState.data.seen.includes('star-gate')) {
      GameState.markSeen('star-gate');
      this.time.delayedCall(1200, () => this.hint('star-gate-hint'));
    }

    this.events.on(Phaser.Scenes.Events.RESUME, () => {
      this.input.keyboard?.resetKeys();
      this.controls.reset();
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.music?.stop();
      this.music?.destroy();
    });
  }

  // ------------------------------------------------------------ World API (used by src/world/*)

  addSpot(spot: Spot) {
    this.spots.push(spot);
    return spot;
  }

  addHidden(thing: HiddenThing) {
    this.hidden.push(thing);
  }

  isHiddenByDark(x: number, y: number) {
    return !GameState.hasPower('glow') && !!this.darkness?.covers(x, y);
  }

  /** Narrator lines appear at the bottom of the screen and are read aloud. */
  hint(lineId: string) {
    this.registry.set('hint', { text: lineText(lineId, GameState.data.name), at: this.time.now });
    speak(this, lineId, GameState.data.name);
  }

  hintOnce(key: string, lineId: string, repeatMs?: number) {
    const last = this.shownHints.get(key);
    if (last !== undefined && (repeatMs === undefined || this.time.now - last < repeatMs)) return;
    this.shownHints.set(key, this.time.now);
    this.hint(lineId);
  }

  say(lineId: string, x: number, y: number, ms = 4200) {
    this.lastTalk = this.time.now;
    this.bubble.say(lineText(lineId, GameState.data.name), x, y, ms);
    speak(this, lineId, GameState.data.name);
  }

  giveStardust(n: number, x: number, y: number) {
    if (n <= 0) return;
    GameState.addStardust(n);
    const plus = this.add.text(x, y, `+${n} ✨`, titleStyle(34)).setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: plus, y: plus.y - 60, alpha: 0, duration: 1400, onComplete: () => plus.destroy() });
  }

  confetti(x: number, y: number, count = 90) {
    this.add.particles(x, y, 'fx-dot', {
      speed: { min: 250, max: 600 }, angle: { min: -160, max: -20 }, gravityY: 500, lifespan: 2200,
      scale: { start: 0.9, end: 0.4 }, rotate: { min: 0, max: 360 },
      tint: [0xff5e5e, 0xffa24c, 0xffe14c, 0x6fe36f, 0x5ec8ff, 0xa77bff, 0xff7eb9], emitting: false,
    }).setDepth(40).explode(count);
  }

  openPuzzle(puzzleId: string, onSolved: () => void) {
    sfx.whoosh();
    this.scene.pause();
    this.scene.launch('Puzzle', { puzzleId, onSolved: () => this.time.delayedCall(50, onSolved) });
  }

  // ------------------------------------------------------------ debug kit (see src/debug/debug.ts)

  registerSolver(x: number, solve: () => void) {
    this.solvers.push({ x, solve });
  }

  debugSolvePattern() {
    const near = [...this.solvers].sort((a, b) => Math.abs(a.x - this.player.x) - Math.abs(b.x - this.player.x))[0];
    if (!near) return 'nothing to solve here';
    near.solve();
    return `solved the pattern at x=${near.x}`;
  }

  /** Draw barriers, zones, spots and hidden things on top of the level. */
  debugOverlay(on?: boolean) {
    const show = on ?? !this.overlayGfx;
    this.overlayGfx?.destroy();
    this.overlayGfx = undefined;
    if (!show) return 'overlay off';
    const g = (this.overlayGfx = this.add.graphics().setDepth(100));
    const L = this.level;
    const box = (x: number, y: number, w: number, h: number, color: number) => {
      g.fillStyle(color, 0.18).fillRect(x, y, w, h).lineStyle(3, color, 0.9).strokeRect(x, y, w, h);
    };
    for (const w of L.winds ?? []) box(w.x, 0, w.w, WORLD_HEIGHT, 0x3fa9ff);
    for (const d of L.darks ?? []) box(d.x, d.y, d.w, d.h, 0x8a4bff);
    for (const i of L.ice ?? []) box(i.x, 0, 64, WORLD_HEIGHT, 0x7ff6ff);
    for (const gt of L.gates ?? []) box(gt.x, 0, 72, WORLD_HEIGHT, 0xc4854a);
    for (const b of L.blocks ?? []) box(b.x, b.y, b.w, b.h, 0x9a92b0);
    for (const s of this.spots) {
      g.lineStyle(2, 0x34d058, 0.9).strokeRect(s.x - (s.reachX ?? 80), s.y - (s.reachY ?? 200), (s.reachX ?? 80) * 2, (s.reachY ?? 200) * 2);
      g.fillStyle(0x34d058, 1).fillCircle(s.x, s.y, 6);
    }
    for (const h of this.hidden) g.fillStyle(h.revealed ? 0x999999 : 0xffd23c, 1).fillCircle(h.x, h.y, 10);
    return 'overlay on: blue wind · purple dark · cyan ice · brown gate · green spots · yellow hidden';
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
    for (const b of L.blocks ?? []) {
      const ts = this.add.tileSprite(b.x, b.y, b.w, b.h, `ground-${L.id}`).setOrigin(0).setDepth(5).setTint(0xdcd4f0);
      this.physics.add.existing(ts, true);
      solids.add(ts);
    }
    return solids;
  }

  private buildPortalsAndStations() {
    const L = this.level;
    for (const p of L.portals) {
      const sky = p.target === SKY_MAP;
      const isArea = !!kingdomOfArea(p.target);
      const locked = isArea && !GameState.has('area', p.target);
      const art = this.add.image(p.x, GROUND_Y + 4, sky ? 'star-gate' : 'portal').setOrigin(0.5, 1).setDepth(4);
      const target = LEVELS[p.target];
      const label = sky ? (L.id === 'glade' ? 'Star Gate' : 'Sky Map') : p.target === 'glade' ? 'Home' : target?.name ?? p.target;
      this.add.text(p.x, GROUND_Y - 262, label, titleStyle(26, { align: 'center', wordWrap: { width: 220 } })).setOrigin(0.5, 1).setDepth(4);
      if (target && isArea && !locked) this.addDoorCounts(p.x, target);
      if (locked) {
        art.setTint(0x9990b0);
        this.add.image(p.x, GROUND_Y - 90, 'icon-lock').setDepth(4);
      } else {
        this.add.particles(p.x, GROUND_Y - 110, 'fx-star', {
          x: { min: -45, max: 45 }, y: { min: -60, max: 90 }, lifespan: 1200, frequency: 180,
          scale: { start: 0.7, end: 0 }, speedY: { min: -30, max: -10 }, tint: [0xffffff, 0xfff6a0, 0xffc2de],
        }).setDepth(4);
      }
      this.addSpot({
        x: p.x, y: GROUND_Y, verb: 'to go in', promptY: GROUND_Y - 130,
        use: () => {
          if (!locked) return this.travel(p.target);
          sfx.soft();
          this.tweens.add({ targets: art, x: p.x + 8, duration: 60, yoyo: true, repeat: 3 });
          this.hint('door-locked');
        },
      });
    }
    for (const s of L.stations) {
      if (s.kind === 'crystal') continue; // HeartCrystal builds its own
      const art = this.add.image(s.x, GROUND_Y + 4, `station-${s.kind}`).setOrigin(0.5, 1).setDepth(4);
      const top = GROUND_Y - art.height;
      this.add.text(s.x, top - 6, s.kind === 'mirror' ? 'Dress Up' : 'Adventure Book', titleStyle(28)).setOrigin(0.5, 1).setDepth(4);
      this.addSpot({
        x: s.x, y: GROUND_Y, verb: s.kind === 'mirror' ? 'to dress up' : 'to open your book', promptY: top - 70,
        use: () => this.openOverlay(s.kind === 'mirror' ? 'Wardrobe' : 'StickerBook'),
      });
    }
  }

  /** "✨ 2/4  ⭐ 1/2" under each door, so she can see what's still hiding. */
  private addDoorCounts(x: number, target: LevelDef) {
    const secrets = secretIds(target);
    const golds = goldIds(target);
    const s = secrets.filter((id) => GameState.hasFlag(`secret:${id}`)).length;
    const g = golds.filter((id) => GameState.hasFlag(`gold:${id}`)).length;
    const spark = GameState.hasFlag(`spark:${target.id}`) ? '  💎' : '';
    const all = s === secrets.length && g === golds.length && spark;
    this.add.text(x, GROUND_Y - 226, `✨${s}/${secrets.length}  ⭐${g}/${golds.length}${spark}`,
      textStyle(20, { color: all ? '#ffe14c' : '#ffffff', stroke: '#2b1f4a', strokeThickness: 5 })).setOrigin(0.5, 1).setDepth(4);
  }

  private buildPrompt() {
    const arrow = this.add.text(0, 0, '▼', titleStyle(40)).setOrigin(0.5, 1);
    this.promptText = this.add.text(0, -46, '', textStyle(24, { color: '#ffffff', stroke: '#2b1f4a', strokeThickness: 6 })).setOrigin(0.5, 1);
    this.prompt = this.add.container(0, 0, [arrow, this.promptText]).setDepth(45).setVisible(false);
    this.tweens.add({ targets: arrow, y: 10, duration: 400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  private buildDecorations() {
    if (this.level.id !== 'glade') return;
    if (GameState.has('decoration', 'lanterns'))
      for (const x of [320, 960, 1600, 2400]) {
        const l = this.add.image(x, 220, 'deco-lanterns').setDepth(3);
        this.tweens.add({ targets: l, angle: 3, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      }
    if (GameState.has('decoration', 'flowers'))
      for (const x of [140, 640, 1280, 2080, 2700, 3020]) this.add.image(x, GROUND_Y + 6, 'deco-flowers').setOrigin(0.5, 1).setDepth(3);
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
        if (p.hidden) this.hideThing(it, p);
        else this.add.particles(p.x, p.y, 'fx-star', { lifespan: 900, frequency: 250, speed: 30, scale: { start: 0.6, end: 0 }, tint: 0xfff6a0 }).setDepth(6);
      }
      this.physics.add.overlap(this.player, items, (_p, it) => this.collectItem(it as Phaser.Physics.Arcade.Image, def));
    }

    for (const b of L.blooms) {
      const img = this.add.image(b.x, b.y + 4, 'bloom-bud').setOrigin(0.5, 1).setDepth(6);
      this.tweens.add({ targets: img, angle: { from: -4, to: 4 }, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      const bloom: Bloom = { img, open: false, available: !b.hidden };
      if (b.hidden) {
        img.setAlpha(0);
        this.addHidden({ x: b.x, y: b.y, revealed: false, reveal: () => { bloom.available = true; this.popIn(img); } });
      }
      this.blooms.push(bloom);
    }
    for (const b of L.bouncers) this.bouncers.push(this.add.image(b.x, b.y + 4, 'bouncer').setOrigin(0.5, 1).setDepth(6));
  }

  /** Hide a physics pickup until Sniff finds it. */
  private hideThing(obj: Phaser.Physics.Arcade.Image, p: Hideable) {
    obj.setAlpha(0);
    (obj.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    this.addHidden({
      x: p.x, y: p.y, revealed: false,
      reveal: () => {
        (obj.body as Phaser.Physics.Arcade.StaticBody).enable = true;
        this.popIn(obj);
      },
    });
  }

  private popIn(obj: Phaser.GameObjects.Image) {
    obj.setAlpha(1).setScale(0);
    this.tweens.add({ targets: obj, scale: 1, duration: 500, ease: 'Back.out' });
  }

  private buildFriends() {
    const L = this.level;
    if (L.id === 'glade') {
      for (const def of FRIENDS.filter((f) => GameState.hasHelped(f.id)))
        this.gladeFriends.push(new Friend(this, def.gladeX, GROUND_Y + 4, def));
      this.favors = new Favors(this, this.gladeFriends);
      this.favors.build();
      new HeartCrystal(this, this.gladeFriends).build();
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
      frost: { tex: 'fx-dot', tint: [0xffffff, 0xe6f4ff], scale: 0.55 },
    };
    const a = cfg[this.level.theme.deco];
    const snow = this.level.theme.deco === 'frost';
    this.add.particles(0, 0, a.tex, {
      x: { min: 0, max: 1280 }, y: snow ? { min: -20, max: 0 } : { min: 60, max: 600 }, lifespan: snow ? 7000 : 5000,
      frequency: snow ? 90 : 260, speedX: { min: -15, max: 15 },
      speedY: snow ? { min: 50, max: 110 } : { min: -25, max: -5 }, scale: { start: a.scale, end: a.scale * 0.3 },
      alpha: { start: 0.9, end: snow ? 0.4 : 0 }, tint: a.tint,
    }).setScrollFactor(0).setDepth(-5);
  }

  /** The music box plays right away; the real track takes over once it has loaded. */
  private startMusic() {
    const key = `music-${this.level.id}`;
    const play = () => {
      stopGeneratedMusic();
      this.music = this.sound.add(key, { loop: true, volume: 0.35 });
      this.music.play();
    };
    if (this.cache.audio.exists(key)) return play();
    playGeneratedMusic(this.level.music.bpm, this.level.music.root);
    const levelAtStart = this.level.id;
    loadAudio(this, key).then((ok) => {
      if (ok && this.scene.isActive() && this.level.id === levelAtStart && !this.music) play();
    });
  }

  // ------------------------------------------------------------ play

  update(time: number, dt: number) {
    if (this.leaving) return;
    const c = this.controls;
    const pressed = c.action();
    const near = this.nearestSpot();
    this.showPrompt(near);

    let cast = false;
    if (pressed && near) near.use();
    else if (pressed && GameState.hasPower('dash') && this.barriers.nearWind()) this.player.dash(() => this.barriers.inWind());
    else cast = pressed;
    if (this.player.control(c, dt, cast)) this.onMagic();

    this.barriers.update(time);
    this.darkness.update();
    this.secrets.update();
    this.checkBouncers();
    this.shimmerHidden(time);
    if (this.player.y > WORLD_HEIGHT + 60 && !this.cloudBusy) this.cloudCatch();
    this.checkFriendTalk();

    if (c.back()) this.openOverlay('StickerBook');
  }

  private nearestSpot(): Spot | undefined {
    const p = this.player;
    let best: Spot | undefined;
    let bestD = Infinity;
    for (const s of this.spots) {
      if (s.enabled && !s.enabled()) continue;
      if (this.isHiddenByDark(s.x, s.y)) continue;
      const dx = Math.abs(s.x - p.x);
      if (dx > (s.reachX ?? 80) || Math.abs(s.y - p.y) > (s.reachY ?? 200)) continue;
      if (dx < bestD) { best = s; bestD = dx; }
    }
    return best;
  }

  private showPrompt(s: Spot | undefined) {
    this.prompt.setVisible(!!s);
    if (!s) return;
    this.prompt.setPosition(s.x, s.promptY);
    this.promptText.setText(`Press ⬇ ${s.verb}`);
  }

  private travel(target: string) {
    this.leaving = true;
    this.prompt.setVisible(false);
    this.player.frozen = true;
    this.player.body.setVelocity(0, 0).setAllowGravity(false);
    sfx.whoosh();
    this.tweens.add({ targets: this.player, scale: 0.2, alpha: 0, angle: 360, duration: 500 });
    this.cameras.main.fadeOut(500, 255, 255, 255);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (target === SKY_MAP) this.scene.start('SkyMap', { from: this.level.id });
      else this.scene.restart({ levelId: target, from: this.level.id });
    });
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
    // Sniff first, so a hidden flower pops up and the next ↓ blooms it.
    if (GameState.hasPower('sniff')) this.sniff();
    this.barriers.onMagic();
    this.darkness.onMagic();

    for (const b of this.blooms)
      if (b.available && !b.open && !this.isHiddenByDark(b.img.x, b.img.y) && Phaser.Math.Distance.Between(p.x, p.y, b.img.x, b.img.y - 30) < 220) this.openBloom(b);

    const f = this.friend;
    if (f?.asleep && Phaser.Math.Distance.Between(p.x, p.y, f.x, f.y - 50) < 240) {
      f.wake();
      this.helped(f);
    }
    for (const gf of this.gladeFriends)
      if (Math.abs(gf.x - p.x) < 200) gf.celebrate();
  }

  private sniff() {
    const p = this.player;
    let found = false;
    for (const h of this.hidden) {
      if (h.revealed || Phaser.Math.Distance.Between(p.x, p.y, h.x, h.y) > SNIFF_REACH) continue;
      h.revealed = true;
      found = true;
      h.reveal();
    }
    const txt = this.add.text(p.x, p.y - 90, found ? 'Sniff sniff! ✨' : 'Sniff sniff...', textStyle(26, { color: '#ffffff', stroke: '#2b1f4a', strokeThickness: 5 }))
      .setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: txt, y: txt.y - 40, alpha: 0, duration: 1100, onComplete: () => txt.destroy() });
    if (found) sfx.bloom();
  }

  /** Once she has Sniff, hidden things give off a faint twinkle to find. */
  private shimmerHidden(time: number) {
    if (!GameState.hasPower('sniff') || time - this.lastShimmer < 1500) return;
    this.lastShimmer = time;
    for (const h of this.hidden) {
      if (h.revealed || Math.abs(h.x - this.player.x) > 900) continue;
      this.add.particles(h.x, h.y - 30, 'fx-star', {
        x: { min: -30, max: 30 }, y: { min: -30, max: 20 }, speedY: { min: -40, max: -10 }, lifespan: 1000,
        scale: { start: 0.5, end: 0 }, alpha: { start: 0.9, end: 0 }, tint: 0xfff6a0, emitting: false,
      }).setDepth(8).explode(4);
      if (Math.abs(h.x - this.player.x) < 400) this.hintOnce(`sniff-${h.x}`, 'sniff-hint');
    }
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
    this.giveStardust(3, b.img.x, b.img.y - 110);

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
    this.cameras.main.pan(f.x, WORLD_HEIGHT / 2, 800, 'Sine.easeInOut');
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
    if (f.def.id === 'pip') GameState.setFlag('spark:frost');
    const power = powerFromFriend(f.def.id);
    this.time.delayedCall(5200, () => {
      this.hint('friend-moved');
      this.add.particles(f.x, f.y - 50, 'fx-star', {
        speed: { min: 60, max: 180 }, lifespan: 900, scale: { start: 1, end: 0 }, tint: [0xfff6a0, 0xffc2de, 0xbfeaff], emitting: false,
      }).setDepth(9).explode(30);
      this.tweens.add({ targets: f, alpha: 0, y: f.y - 120, duration: 1200, onComplete: () => f.setVisible(false) });
      this.friend = undefined;
    });
    if (power) this.time.delayedCall(9500, () => this.hint(power.teach));
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
        if (r.kind === 'found') this.time.delayedCall(4200, () => this.helped(f));
      } else if (r.kind !== 'found' && now - this.lastTalk > TALK_GAP_MS) {
        this.friendSay(f, r.kind === 'fetch' && this.questHave > 0 ? f.def.lines.progress! : f.def.lines.ask);
      }
    }
    for (const gf of this.gladeFriends) {
      if (this.favors?.hasFavor(gf.def.id)) continue; // they'll talk when you press ⬇
      if (Math.abs(p.x - gf.x) < 120 && now - this.lastTalk > TALK_GAP_MS + 3000)
        this.friendSay(gf, gf.def.id === 'pip' ? 'pip-glade' : Math.random() < 0.5 ? gf.def.lines.thanks : 'glade-friend');
    }
  }

  private friendSay(f: Friend, lineId: string, ms = 4200) {
    this.say(lineId, f.x, f.y - f.displayHeight - 12, ms);
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
}
