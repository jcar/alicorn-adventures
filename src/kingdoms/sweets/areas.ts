import { GROUND_Y, arc, row, tunnel, type LevelDef } from '../../core/content/types';

const G = GROUND_Y;

/** Candy versions of the shared pictures. */
const CANDY = { crystal: 'candy-chime', bumper: 'gumdrop', catcher: 'cotton-cloud', shrinker: 'shrink-mushroom', ceiling: 'candy-glass', tunnel: 'candy-rock' };
/** A candy-glass sky room: Fizz Pop (Fluff, the last friend here) opens it, so it holds bonuses until then. */
const skyRoom = (id: string, x: number, w = 320, y = 290) => ({ id, x, w, y });
/** A little floor inside a sky room, for its treasure chest to sit on. */
const roomFloor = (x: number, w = 320, y = 290) => ({ x: x + 10, y: y - 50, w: w - 20 });

const lollipopTunnel = tunnel(1250, 420, 'lollipop-gold-1');
const gumdropTunnel = tunnel(6250, 420, 'gumdrop-gold-1');
const chocolateTunnel = tunnel(950, 420, 'chocolate-gold-1');
const cottonTunnel = tunnel(1250, 420, 'cottoncandy-gold-1');

/**
 * Sweet Treat Valley: thinking in two steps. Read a recipe and count; plan a
 * route through tiny tunnels (tiny wings only hop, so grow to fly); find the
 * spoon before the cocoa door; harder puzzle locks (one level up).
 * Every tunnel has a shrink mushroom on both sides, so she is never stuck.
 */
export const AREAS: Record<string, LevelDef> = {
  lollipop: {
    id: 'lollipop',
    name: 'Lollipop Lane',
    width: 6000,
    theme: { skyTop: 0xff9ecf, skyBottom: 0xfff0d6, far: 0xffc2de, near: 0x9fe3c0, ground: 0xb07a5a, groundTop: 0xff9fd6, deco: 'sweets' },
    music: { bpm: 100, root: 62 },
    start: { x: 320, y: G - 80 },
    ground: [{ x: 0, w: 2300 }, { x: 2450, w: 3550 }],
    platforms: [{ x: 1550, y: 340, w: 220 }, { x: 2400, y: 300, w: 220 }, { x: 3700, y: 460, w: 200 }, roomFloor(3920)],
    stardust: [...row(450, 560, 4), ...arc(1000, 500, 5, 140), ...row(1570, 300, 3, 60), ...arc(2375, 520, 5, 120), ...row(3000, 560, 4), ...row(4400, 560, 4)],
    // Bea's recipe: 3 strawberries, 2 lemons, 1 egg. There's one strawberry and one lemon too many, and a berry that isn't on the card.
    items: [
      { x: 1150, y: 560, item: 'strawberry' },
      { x: 1660, y: 290, item: 'lemon' },
      { x: 2100, y: 560, item: 'berry' },
      { x: 2510, y: 250, item: 'strawberry' },
      { x: 2900, y: 560, item: 'egg' },
      { x: 3300, y: 560, item: 'lemon' },
      { x: 3800, y: 410, item: 'strawberry' },
      { x: 4300, y: 560, item: 'lemon' },
      { x: 4650, y: 560, item: 'strawberry', hidden: true },
    ],
    blooms: [],
    bouncers: [],
    friend: { id: 'bea', x: 720, y: G },
    portals: [{ x: 150, target: 'sweets-hub' }],
    stations: [],
    art: CANDY,
    blocks: lollipopTunnel.blocks,
    bumpers: lollipopTunnel.bumpers,
    golds: [lollipopTunnel.gold, { id: 'lollipop-gold-2', x: 3990, y: 140 }],
    gates: [{ id: 'lollipop-gate', x: 3500, skill: 'math', offset: 1 }],
    patterns: [{ id: 'lollipop-pattern', x: 1900, crystals: [{ x: 2000, y: 480 }, { x: 2110, y: 420 }, { x: 2220, y: 480 }], offset: 1 }],
    chests: [
      { id: 'lollipop-chest-pattern', x: 2560, y: G, reward: { stardust: 10 }, byPattern: 'lollipop-pattern' },
      { id: 'lollipop-chest-tunnel', x: 5800, y: G, reward: { stardust: 15 } },
      { id: 'lollipop-chest-sky', x: 4170, y: 240, reward: { stardust: 20 } },
    ],
    notes: [{ id: 'sweets-note-1', x: 2750, y: G, line: 'sweets-note-1', secret: true }],
    // Bea teaches Shrink; Sol's shard waits inside the first tiny tunnel.
    shrinkers: [{ x: 4950 }, { x: 5640 }],
    tunnels: [{ x: 5100, w: 420 }],
    spark: { x: 5320, y: 585 },
    ceilings: [skyRoom('lollipop-candy-glass', 3920)],
    decos: [{ texture: 'deco-lollipop', x: 520 }, { texture: 'deco-candy-cane', x: 1400 }, { texture: 'deco-lollipop', x: 3150 }, { texture: 'deco-candy-cane', x: 4500 }],
  },

  gumdrop: {
    id: 'gumdrop',
    name: 'Gumdrop Caves',
    width: 6800,
    theme: { skyTop: 0x5a3f7a, skyBottom: 0xc79bff, far: 0x7a5aa8, near: 0xff9fd6, ground: 0x6a4a7a, groundTop: 0x9fe3c0, deco: 'sweets' },
    music: { bpm: 86, root: 60 },
    start: { x: 320, y: G - 80 },
    ground: [{ x: 0, w: 6800 }],
    // The high ledge needs a big alicorn: tiny wings only hop.
    platforms: [{ x: 2000, y: 300, w: 320 }, { x: 4560, y: 420, w: 200 }, roomFloor(5800)],
    stardust: [...row(420, 560, 4), ...row(2030, 260, 5, 60), ...arc(4000, 520, 5, 120), ...row(4580, 380, 3, 60), ...row(5850, 560, 3)],
    // Millie's three sugar buttons: one in each of the first two tunnels, one up on the ledge.
    items: [{ x: 1500, y: 585 }, { x: 2160, y: 255 }, { x: 3350, y: 585 }],
    blooms: [],
    bouncers: [],
    friend: { id: 'millie', x: 700, y: G },
    portals: [{ x: 150, target: 'sweets-hub' }],
    stations: [],
    art: { ...CANDY, cave: 'candy-cave' },
    shrinkers: [{ x: 1080 }, { x: 1880 }, { x: 2680 }, { x: 3720 }, { x: 4960 }, { x: 5700 }],
    tunnels: [{ x: 1250, w: 500 }, { x: 2900, w: 720 }, { x: 5100, w: 460 }],
    darks: [{ x: 2900, y: 0, w: 720, h: 720 }],
    blocks: gumdropTunnel.blocks,
    bumpers: gumdropTunnel.bumpers,
    golds: [gumdropTunnel.gold, { id: 'gumdrop-gold-2', x: 5870, y: 140 }],
    gates: [{ id: 'gumdrop-gate', x: 4150, skill: 'logic', offset: 1 }],
    patterns: [{ id: 'gumdrop-pattern', x: 4400, crystals: [{ x: 4500, y: 360 }, { x: 4610, y: 300 }, { x: 4720, y: 360 }, { x: 4610, y: 480 }], offset: 1 }],
    chests: [
      { id: 'gumdrop-chest-pattern', x: 4850, y: G, reward: { stardust: 10 }, byPattern: 'gumdrop-pattern' },
      { id: 'gumdrop-chest-sky', x: 6050, y: 240, reward: { stardust: 20 } },
    ],
    notes: [{ id: 'sweets-note-2', x: 3900, y: G, line: 'sweets-note-2', secret: true, hidden: true }],
    spark: { x: 5330, y: 585 },
    ceilings: [skyRoom('gumdrop-candy-glass', 5800)],
    decos: [{ texture: 'deco-gumdrop', x: 480 }, { texture: 'deco-gumdrop', x: 2550 }, { texture: 'deco-gumdrop', x: 4050 }, { texture: 'deco-gumdrop', x: 6650 }],
  },

  chocolate: {
    id: 'chocolate',
    name: 'Chocolate River',
    width: 6400,
    mode: 'swim',
    water: 0x8a4a2a,
    theme: { skyTop: 0x8a5a3a, skyBottom: 0xd9a87a, far: 0xa8704a, near: 0x6a3f2a, ground: 0x5a3a2a, groundTop: 0xffd6a0, deco: 'sweets' },
    music: { bpm: 84, root: 57 },
    start: { x: 320, y: G - 80 },
    ground: [{ x: 0, w: 6400 }],
    platforms: [{ x: 1900, y: 380, w: 200 }, { x: 3600, y: 300, w: 220 }, roomFloor(5800)],
    stardust: [...row(420, 560, 4), ...arc(1600, 500, 5, 140), ...row(1920, 340, 3, 60), ...row(3200, 560, 4), ...row(3620, 260, 3, 60), ...arc(5200, 480, 5, 140)],
    // Duck's three cocoa beans are behind the cocoa door. The spoon that opens it is past the current.
    items: [{ x: 3400, y: 560 }, { x: 3720, y: 255 }, { x: 4300, y: 560, hidden: true }],
    blooms: [],
    bouncers: [],
    friend: { id: 'duck', x: 700, y: G },
    portals: [{ x: 150, target: 'sweets-hub' }],
    stations: [],
    art: CANDY,
    winds: [{ x: 2300, w: 280, power: 'jet', style: 'current' }],
    storyItems: [{ id: 'spoon', x: 2750, y: 560 }],
    doors: [{ id: 'chocolate-door', x: 3000, item: 'spoon', need: 'door-needs-spoon', texture: 'cocoa-door' }],
    blocks: chocolateTunnel.blocks,
    bumpers: chocolateTunnel.bumpers,
    golds: [chocolateTunnel.gold, { id: 'chocolate-gold-2', x: 5870, y: 140 }],
    gates: [{ id: 'chocolate-gate', x: 4700, skill: 'reading', offset: 1 }],
    patterns: [{ id: 'chocolate-pattern', x: 1300, crystals: [{ x: 1400, y: 480 }, { x: 1510, y: 420 }, { x: 1620, y: 480 }, { x: 1730, y: 420 }], offset: 1 }],
    chests: [
      { id: 'chocolate-chest-pattern', x: 1820, y: G, reward: { stardust: 10 }, byPattern: 'chocolate-pattern' },
      { id: 'chocolate-chest-dark', x: 5450, y: G, reward: { stardust: 15 } },
      { id: 'chocolate-chest-sky', x: 6050, y: 240, reward: { stardust: 20 } },
    ],
    notes: [{ id: 'sweets-note-3', x: 2050, y: G, line: 'sweets-note-3', secret: true }],
    darks: [{ x: 5300, y: 250, w: 360, h: 470 }],
    spark: { x: 5100, y: 300 },
    ceilings: [skyRoom('chocolate-candy-glass', 5800)],
    decos: [{ texture: 'deco-candy-cane', x: 520 }, { texture: 'deco-gumdrop', x: 2650 }, { texture: 'deco-candy-cane', x: 4500 }],
  },

  cottoncandy: {
    id: 'cottoncandy',
    name: 'Cotton Candy Clouds',
    width: 6600,
    theme: { skyTop: 0xc7b8ff, skyBottom: 0xffe0f0, far: 0xffffff, near: 0xffd6f0, ground: 0xf3d6ff, groundTop: 0xffffff, deco: 'sweets' },
    music: { bpm: 92, root: 65 },
    start: { x: 320, y: G - 80 },
    ground: [{ x: 0, w: 1000 }, { x: 1700, w: 900 }, { x: 3000, w: 700 }, { x: 4100, w: 2500 }],
    platforms: [{ x: 1050, y: 450, w: 180 }, { x: 2650, y: 360, w: 200 }, { x: 3750, y: 280, w: 220 }, roomFloor(5600, 360, 300)],
    stardust: [...row(420, 560, 4), ...arc(1350, 420, 5, 150), ...row(2670, 320, 3, 60), ...arc(3350, 480, 5, 140), ...row(3770, 240, 3, 60), ...row(4400, 560, 4)],
    // Fluff lost five wool puffs: two hide (Sniff), two are in a dark cloud cave (Glow), one is high up.
    items: [{ x: 900, y: 560, hidden: true }, { x: 2200, y: 560 }, { x: 2400, y: 560 }, { x: 3860, y: 230 }, { x: 3450, y: 560, hidden: true }],
    blooms: [],
    bouncers: [{ x: 2520, y: G }, { x: 3150, y: G }],
    // Fluff waits at the far end, and teaches Fizz Pop: Sol's last shard is in the sky room just past her.
    friend: { id: 'fluff', x: 5300, y: G },
    portals: [{ x: 150, target: 'sweets-hub' }],
    stations: [],
    art: { ...CANDY, cave: 'candy-cave' },
    blocks: cottonTunnel.blocks,
    bumpers: cottonTunnel.bumpers,
    golds: [cottonTunnel.gold, { id: 'cottoncandy-gold-2', x: 6350, y: 250 }],
    gates: [
      { id: 'cottoncandy-gate-1', x: 1800, skill: 'math', offset: 1 },
      { id: 'cottoncandy-gate-2', x: 4200, skill: 'logic', offset: 1 },
    ],
    patterns: [{ id: 'cottoncandy-pattern', x: 4350, crystals: [{ x: 4450, y: 480 }, { x: 4560, y: 420 }, { x: 4670, y: 480 }, { x: 4780, y: 420 }, { x: 4890, y: 480 }], offset: 1 }],
    chests: [
      { id: 'cottoncandy-chest-pattern', x: 5000, y: G, reward: { stardust: 15 }, byPattern: 'cottoncandy-pattern' },
      { id: 'cottoncandy-chest-cave', x: 2250, y: G, reward: { stardust: 15 } },
      { id: 'cottoncandy-chest-sky', x: 5900, y: 250, reward: { stardust: 20 } },
    ],
    notes: [{ id: 'sweets-note-4', x: 2450, y: G, line: 'sweets-note-4', secret: true }],
    darks: [{ x: 2100, y: 250, w: 420, h: 470 }],
    ceilings: [skyRoom('cottoncandy-candy-glass', 5600, 360, 300)],
    spark: { x: 5780, y: 170 },
    decos: [{ texture: 'deco-lollipop', x: 560 }, { texture: 'deco-candy-cane', x: 3300 }, { texture: 'deco-lollipop', x: 4600 }],
  },
};

export const AREA_ORDER = ['lollipop', 'gumdrop', 'chocolate', 'cottoncandy'];

export const AREA_COLORS: Record<string, number> = {
  lollipop: 0xff7eb9,
  gumdrop: 0xa77bff,
  chocolate: 0xc98a4a,
  cottoncandy: 0x9fe3ff,
};
