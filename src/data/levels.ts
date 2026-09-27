export const WORLD_HEIGHT = 720;
export const GROUND_Y = 620;

export type Deco = 'glade' | 'trees' | 'mushrooms' | 'crystals' | 'clouds' | 'frost';

export interface Theme {
  skyTop: number;
  skyBottom: number;
  far: number;
  near: number;
  ground: number;
  groundTop: number;
  deco: Deco;
}

export interface Point { x: number; y: number }
/** Something that stays invisible until Sniff finds it. */
export interface Hideable extends Point { hidden?: boolean }

export interface Reward { stardust?: number }

export interface LevelDef {
  id: string;
  name: string;
  width: number;
  theme: Theme;
  /** Gentle generated-music settings, used when no music file exists. */
  music: { bpm: number; root: number };
  start: Point;
  ground: { x: number; w: number }[];
  platforms: { x: number; y: number; w: number }[];
  stardust: Point[];
  /** The friend's quest items (carrots, berries). */
  items: Hideable[];
  blooms: Hideable[];
  bouncers: Point[];
  friend?: { id: string; x: number; y: number };
  portals: { x: number; target: string }[];
  stations: { x: number; kind: 'mirror' | 'tree' | 'crystal' }[];

  // ---- secrets & powers (all optional)
  /** Solid on every side: tunnel walls for golden-star challenges. */
  blocks?: { x: number; y: number; w: number; h: number }[];
  /** Full-height wind that pushes back toward the start. Needs Dash. */
  winds?: { x: number; w: number }[];
  /** Full-height ice wall. Needs Warm Breath. */
  ice?: { id: string; x: number }[];
  /** Too dark to see without Glow. */
  darks?: { x: number; y: number; w: number; h: number }[];
  /** Full-height stone gate with a number lock. */
  gates?: { id: string; x: number; puzzle: string }[];
  /** Crystals that chime a tune to copy. Solving it reveals the chest with the same id. */
  patterns?: { id: string; x: number; crystals: Point[]; length: number }[];
  chests?: (Hideable & { id: string; reward: Reward; byPattern?: string })[];
  /** Clue notes (secret: true) and helpful signs. `line` is a dialogue id. */
  notes?: (Hideable & { id: string; line: string; secret?: boolean })[];
  golds?: (Point & { id: string })[];
  /** Bouncy clouds that drift up and down and gently push you away. */
  bumpers?: (Point & { range: number })[];
  /** This area's color spark for the Heart Crystal. */
  spark?: Point;
  /** Things a friend's favor needs, like the Moon Shell. */
  storyItems?: (Hideable & { id: string })[];
  /** Pictures that are just for looking at (and sometimes counting!). */
  decos?: { texture: string; x: number; y?: number }[];
}

/** A straight line of stardust. */
export function row(x: number, y: number, n: number, dx = 64): Point[] {
  return Array.from({ length: n }, (_, i) => ({ x: x + i * dx, y }));
}

/** A rainbow-shaped arc of stardust, great for flying through. */
export function arc(cx: number, y: number, n: number, r = 200): Point[] {
  return Array.from({ length: n }, (_, i) => {
    const t = Math.PI * (i / (n - 1));
    return { x: cx - Math.cos(t) * r, y: y - Math.sin(t) * r * 0.7 };
  });
}

/**
 * A golden-star challenge: a tunnel open on its left, with bouncy clouds
 * drifting inside and the star at the far end.
 */
function tunnel(x: number, w: number, starId: string) {
  return {
    blocks: [
      { x, y: 60, w, h: 36 },
      { x, y: 236, w, h: 36 },
      { x: x + w - 36, y: 96, w: 36, h: 140 },
    ],
    bumpers: [
      { x: x + w * 0.33, y: 112, range: 100 },
      { x: x + w * 0.62, y: 212, range: -100 },
    ],
    gold: { id: starId, x: x + w - 80, y: 166 },
  };
}

const G = GROUND_Y;

const woodsTunnel = tunnel(1720, 440, 'woods-gold-1');
const meadowTunnel = tunnel(1050, 420, 'meadow-gold-2');
const waterfallTunnel = tunnel(2550, 420, 'waterfall-gold-2');
const cloudsTunnel = tunnel(1150, 420, 'clouds-gold-1');
const frostTunnel = tunnel(3780, 420, 'frost-gold-1');

export const LEVELS: Record<string, LevelDef> = {
  glade: {
    id: 'glade',
    name: 'Home Glade',
    width: 3100,
    theme: { skyTop: 0x9ad8ff, skyBottom: 0xffe3f3, far: 0xb7e4c7, near: 0x7cc995, ground: 0x8a5a3c, groundTop: 0x6fd08c, deco: 'glade' },
    music: { bpm: 84, root: 60 },
    start: { x: 260, y: G - 80 },
    ground: [{ x: 0, w: 3100 }],
    platforms: [{ x: 1920, y: 380, w: 160 }],
    stardust: [...arc(2000, 340, 7, 150)],
    items: [],
    blooms: [{ x: 360, y: G }, { x: 1600, y: G }],
    bouncers: [],
    portals: [
      { x: 480, target: 'woods' },
      { x: 800, target: 'meadow' },
      { x: 1120, target: 'waterfall' },
      { x: 1440, target: 'clouds' },
      { x: 1760, target: 'frost' },
    ],
    stations: [
      { x: 2250, kind: 'mirror' },
      { x: 2550, kind: 'tree' },
      { x: 2920, kind: 'crystal' },
    ],
  },

  woods: {
    id: 'woods',
    name: 'Whispering Woods',
    width: 5400,
    theme: { skyTop: 0x5b4b9a, skyBottom: 0xc7a8e8, far: 0x46407a, near: 0x2f6b55, ground: 0x5a3d2b, groundTop: 0x4fae6d, deco: 'trees' },
    music: { bpm: 76, root: 57 },
    start: { x: 320, y: G - 80 },
    ground: [{ x: 0, w: 1500 }, { x: 1680, w: 1100 }, { x: 2960, w: 2440 }],
    platforms: [
      { x: 1100, y: 470, w: 200 },
      { x: 1520, y: 420, w: 160 },
      { x: 2440, y: 360, w: 200 },
      { x: 2600, y: 250, w: 180 },
      { x: 3500, y: 440, w: 240 },
    ],
    stardust: [
      ...row(480, 560, 5),
      ...arc(1200, 440, 6, 150),
      ...row(1520, 380, 3, 50),
      ...row(2460, 320, 3, 50),
      ...row(2560, 210, 4, 50),
      ...row(3000, 560, 4),
      ...arc(3620, 400, 7, 170),
      ...row(4380, 560, 4),
      ...row(5000, 560, 2),
    ],
    items: [{ x: 1180, y: 420 }, { x: 2690, y: 200 }, { x: 3620, y: 390 }],
    blooms: [{ x: 900, y: G }, { x: 2000, y: G }, { x: 3150, y: G }, { x: 4450, y: G }],
    bouncers: [],
    friend: { id: 'bunny', x: 760, y: G },
    portals: [{ x: 150, target: 'glade' }],
    stations: [],
    blocks: woodsTunnel.blocks,
    bumpers: woodsTunnel.bumpers,
    golds: [woodsTunnel.gold, { id: 'woods-gold-2', x: 5020, y: 300 }],
    gates: [{ id: 'woods-gate', x: 3300, puzzle: 'woods-lock' }],
    patterns: [{ id: 'woods-pattern', x: 1850, crystals: [{ x: 1960, y: 500 }, { x: 2070, y: 440 }, { x: 2180, y: 500 }], length: 3 }],
    chests: [
      { id: 'woods-chest-pattern', x: 2330, y: G, reward: { stardust: 10 }, byPattern: 'woods-pattern' },
      { id: 'woods-chest-cave', x: 4110, y: G, reward: { stardust: 15 } },
    ],
    notes: [
      { id: 'note-1', x: 2620, y: G, line: 'note-1', secret: true },
      { id: 'note-2', x: 560, y: G, line: 'note-2', secret: true, hidden: true },
    ],
    darks: [{ x: 3900, y: 250, w: 440, h: 470 }],
    winds: [{ x: 4700, w: 260 }],
    ice: [{ id: 'woods-ice', x: 5150 }],
    spark: { x: 5300, y: 450 },
  },

  meadow: {
    id: 'meadow',
    name: 'Mushroom Meadow',
    width: 6000,
    theme: { skyTop: 0xffb07c, skyBottom: 0xfff1b8, far: 0xe9a3c9, near: 0x9bd46b, ground: 0x7a4f35, groundTop: 0x9bd46b, deco: 'mushrooms' },
    music: { bpm: 96, root: 62 },
    start: { x: 320, y: G - 80 },
    ground: [{ x: 0, w: 1800 }, { x: 2000, w: 1300 }, { x: 3480, w: 2520 }],
    platforms: [
      { x: 1500, y: 320, w: 200 },
      { x: 2500, y: 260, w: 200 },
      { x: 4300, y: 330, w: 220 },
    ],
    stardust: [
      ...row(500, 560, 4),
      ...arc(1100, 520, 7, 200),
      ...row(1520, 280, 3, 50),
      ...row(2480, 210, 4, 50),
      ...arc(3050, 480, 7, 200),
      ...row(3620, 560, 5),
      ...row(4320, 280, 4, 50),
      ...row(4700, 560, 4),
    ],
    items: [{ x: 1600, y: 270 }, { x: 2600, y: 210 }, { x: 3150, y: 200 }, { x: 4650, y: 560, hidden: true }],
    blooms: [{ x: 450, y: G }, { x: 3230, y: G }, { x: 4750, y: G }],
    bouncers: [{ x: 1100, y: G }, { x: 2750, y: G }, { x: 3100, y: G }, { x: 4850, y: G }],
    friend: { id: 'fox', x: 720, y: G },
    portals: [{ x: 150, target: 'glade' }],
    stations: [],
    blocks: meadowTunnel.blocks,
    bumpers: meadowTunnel.bumpers,
    golds: [{ id: 'meadow-gold-1', x: 5350, y: 150 }, meadowTunnel.gold],
    gates: [{ id: 'meadow-gate', x: 2950, puzzle: 'meadow-lock' }],
    patterns: [{
      id: 'meadow-pattern', x: 3600,
      crystals: [{ x: 3700, y: 480 }, { x: 3810, y: 420 }, { x: 3920, y: 480 }, { x: 4030, y: 420 }],
      length: 4,
    }],
    chests: [
      { id: 'meadow-chest-pattern', x: 4150, y: G, reward: { stardust: 10 }, byPattern: 'meadow-pattern' },
      { id: 'meadow-chest-ice', x: 5700, y: G, reward: { stardust: 20 } },
    ],
    notes: [
      { id: 'meadow-sign', x: 4500, y: G, line: 'meadow-sign' },
      { id: 'note-3', x: 2380, y: G, line: 'note-3', secret: true },
      { id: 'note-4', x: 5850, y: G, line: 'note-4', secret: true },
    ],
    darks: [{ x: 2050, y: 240, w: 380, h: 480 }],
    winds: [{ x: 5000, w: 260 }],
    ice: [{ id: 'meadow-ice', x: 5550 }],
    spark: { x: 2230, y: 470 },
  },

  waterfall: {
    id: 'waterfall',
    name: 'Crystal Waterfall',
    width: 6000,
    theme: { skyTop: 0x4fb3e8, skyBottom: 0xc9f1ff, far: 0x8fd3f4, near: 0x3aa7a3, ground: 0x6b6f8a, groundTop: 0x7fe0d6, deco: 'crystals' },
    music: { bpm: 80, root: 64 },
    start: { x: 320, y: G - 80 },
    ground: [{ x: 0, w: 1100 }, { x: 1300, w: 500 }, { x: 2000, w: 1400 }, { x: 3600, w: 2400 }],
    platforms: [
      { x: 1150, y: 480, w: 120 },
      { x: 1850, y: 470, w: 120 },
      { x: 3450, y: 470, w: 120 },
      { x: 3800, y: 330, w: 260 },
    ],
    stardust: [
      ...row(420, 560, 4),
      ...arc(1200, 520, 5, 140),
      ...row(1360, 560, 5),
      ...arc(1900, 520, 5, 140),
      ...row(2480, 560, 4),
      ...row(3620, 560, 3),
      ...row(3830, 280, 4, 50),
      ...row(4200, 560, 5),
    ],
    items: [],
    blooms: [{ x: 600, y: G }, { x: 1400, y: G }, { x: 2450, y: G }, { x: 4100, y: G }],
    bouncers: [],
    friend: { id: 'owl', x: 3930, y: 330 },
    portals: [{ x: 150, target: 'glade' }],
    stations: [],
    blocks: waterfallTunnel.blocks,
    bumpers: waterfallTunnel.bumpers,
    golds: [{ id: 'waterfall-gold-1', x: 5100, y: 200 }, waterfallTunnel.gold],
    gates: [{ id: 'waterfall-gate', x: 3330, puzzle: 'waterfall-lock' }],
    patterns: [{
      id: 'waterfall-pattern', x: 2500,
      crystals: [{ x: 2600, y: 480 }, { x: 2710, y: 420 }, { x: 2820, y: 480 }, { x: 2930, y: 420 }, { x: 3040, y: 480 }],
      length: 5,
    }],
    chests: [
      { id: 'waterfall-chest-cave', x: 880, y: G, reward: { stardust: 15 } },
      { id: 'waterfall-chest-pattern', x: 3200, y: G, reward: { stardust: 10 }, byPattern: 'waterfall-pattern' },
    ],
    notes: [
      { id: 'note-5', x: 1500, y: G, line: 'note-5', secret: true },
      { id: 'waterfall-sign', x: 1700, y: G, line: 'waterfall-sign' },
      { id: 'note-6', x: 4550, y: G, line: 'note-6', secret: true, hidden: true },
    ],
    darks: [{ x: 700, y: 240, w: 360, h: 480 }],
    winds: [{ x: 2100, w: 300 }, { x: 4800, w: 260 }],
    ice: [{ id: 'waterfall-ice', x: 5250 }],
    spark: { x: 5500, y: 450 },
    storyItems: [{ id: 'moon-shell', x: 4300, y: 580, hidden: true }],
    decos: [{ texture: 'deco-tall-crystal', x: 4300 }],
  },

  clouds: {
    id: 'clouds',
    name: 'Rainbow Cloud Kingdom',
    width: 6600,
    theme: { skyTop: 0xff9ecf, skyBottom: 0xbfe6ff, far: 0xffffff, near: 0xf3e9ff, ground: 0xe9e4ff, groundTop: 0xffffff, deco: 'clouds' },
    music: { bpm: 88, root: 65 },
    start: { x: 320, y: G - 80 },
    ground: [{ x: 0, w: 1100 }, { x: 1500, w: 700 }, { x: 2600, w: 700 }, { x: 3700, w: 2900 }],
    platforms: [
      { x: 1250, y: 450, w: 200 },
      { x: 1900, y: 300, w: 200 },
      { x: 2400, y: 420, w: 180 },
      { x: 3000, y: 260, w: 220 },
      { x: 3450, y: 430, w: 200 },
    ],
    stardust: [
      ...row(450, 560, 5),
      ...arc(1300, 400, 5, 150),
      ...row(1860, 250, 4, 50),
      ...arc(2450, 380, 5, 150),
      ...row(2960, 210, 5, 50),
      ...arc(3500, 390, 5, 150),
      ...row(4600, 560, 4),
      ...row(5400, 300, 6),
    ],
    items: [],
    blooms: [
      { x: 900, y: G },
      { x: 1950, y: 300 },
      { x: 2900, y: G },
      { x: 3950, y: G },
      { x: 4700, y: G },
      { x: 5000, y: G, hidden: true },
    ],
    bouncers: [],
    friend: { id: 'dragon', x: 700, y: G },
    portals: [{ x: 150, target: 'glade' }],
    stations: [],
    blocks: cloudsTunnel.blocks,
    bumpers: cloudsTunnel.bumpers,
    golds: [cloudsTunnel.gold, { id: 'clouds-gold-2', x: 3950, y: 300 }],
    gates: [{ id: 'clouds-gate', x: 2650, puzzle: 'clouds-lock' }],
    patterns: [{
      id: 'clouds-pattern', x: 5200,
      crystals: [{ x: 5300, y: 480 }, { x: 5410, y: 420 }, { x: 5520, y: 480 }, { x: 5630, y: 420 }, { x: 5740, y: 480 }],
      length: 5,
    }],
    chests: [
      { id: 'clouds-chest-pattern', x: 5860, y: G, reward: { stardust: 10 }, byPattern: 'clouds-pattern' },
      { id: 'clouds-chest-ice', x: 6200, y: G, reward: { stardust: 20 } },
    ],
    notes: [{ id: 'note-7', x: 6400, y: G, line: 'note-7', secret: true }],
    darks: [{ x: 3750, y: 200, w: 400, h: 520 }],
    winds: [{ x: 4300, w: 260 }],
    ice: [{ id: 'clouds-ice', x: 6000 }],
    spark: { x: 6500, y: 300 },
  },

  frost: {
    id: 'frost',
    name: 'Frosty Peaks',
    width: 7000,
    theme: { skyTop: 0x7aa7e0, skyBottom: 0xe6f4ff, far: 0xdbe9ff, near: 0xffffff, ground: 0x8fa9d6, groundTop: 0xf4fbff, deco: 'frost' },
    music: { bpm: 72, root: 67 },
    start: { x: 320, y: G - 80 },
    ground: [{ x: 0, w: 1400 }, { x: 1600, w: 1400 }, { x: 3200, w: 1800 }, { x: 5200, w: 1800 }],
    platforms: [
      { x: 1440, y: 480, w: 120 },
      { x: 3040, y: 470, w: 120 },
      { x: 5040, y: 470, w: 120 },
    ],
    stardust: [
      ...row(450, 560, 5),
      ...arc(1500, 520, 5, 140),
      ...row(2100, 560, 5),
      ...arc(3100, 520, 5, 140),
      ...row(4500, 560, 4),
      ...arc(5100, 520, 5, 140),
      ...row(5500, 560, 4),
    ],
    items: [],
    blooms: [{ x: 800, y: G }, { x: 2300, y: G }, { x: 4700, y: G }],
    bouncers: [],
    friend: { id: 'pip', x: 6600, y: G },
    portals: [{ x: 150, target: 'glade' }],
    stations: [],
    blocks: frostTunnel.blocks,
    bumpers: frostTunnel.bumpers,
    golds: [frostTunnel.gold, { id: 'frost-gold-2', x: 6000, y: 280 }],
    gates: [{ id: 'frost-gate', x: 2800, puzzle: 'frost-lock' }],
    patterns: [{
      id: 'frost-pattern', x: 3700,
      crystals: [{ x: 3800, y: 480 }, { x: 3910, y: 420 }, { x: 4020, y: 480 }, { x: 4130, y: 420 }, { x: 4240, y: 480 }, { x: 4350, y: 420 }],
      length: 6,
    }],
    chests: [
      { id: 'frost-chest-pattern', x: 4500, y: G, reward: { stardust: 15 }, byPattern: 'frost-pattern' },
      { id: 'frost-chest-hidden', x: 4800, y: G, reward: { stardust: 20 }, hidden: true },
    ],
    notes: [{ id: 'note-8', x: 3500, y: G, line: 'note-8', secret: true }],
    darks: [{ x: 5400, y: 200, w: 1400, h: 520 }],
    winds: [{ x: 1700, w: 300 }, { x: 6100, w: 250 }],
    ice: [{ id: 'frost-ice-1', x: 3350 }, { id: 'frost-ice-2', x: 5900 }],
    // The snowmen before the gate are the answer to its counting puzzle.
    decos: [
      { texture: 'deco-snowman', x: 620 },
      { texture: 'deco-snowman', x: 1150 },
      { texture: 'deco-snowman', x: 1900 },
      { texture: 'deco-snowman', x: 2500 },
    ],
  },
};

export const AREA_ORDER = ['woods', 'meadow', 'waterfall', 'clouds', 'frost'];

/** Area colors, used for sparks, the Heart Crystal and the map. */
export const AREA_COLORS: Record<string, number> = {
  woods: 0xa77bff,
  meadow: 0xffa24c,
  waterfall: 0x5ec8ff,
  clouds: 0xff7eb9,
  frost: 0xe8fbff,
};
