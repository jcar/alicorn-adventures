export const WORLD_HEIGHT = 720;
export const GROUND_Y = 620;

export type Deco = 'glade' | 'trees' | 'mushrooms' | 'crystals' | 'clouds';

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
  items: Point[];
  blooms: Point[];
  bouncers: Point[];
  friend?: { id: string; x: number; y: number };
  portals: { x: number; target: string }[];
  stations: { x: number; kind: 'mirror' | 'tree' }[];
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

const G = GROUND_Y;

export const LEVELS: Record<string, LevelDef> = {
  glade: {
    id: 'glade',
    name: 'Home Glade',
    width: 2400,
    theme: { skyTop: 0x9ad8ff, skyBottom: 0xffe3f3, far: 0xb7e4c7, near: 0x7cc995, ground: 0x8a5a3c, groundTop: 0x6fd08c, deco: 'glade' },
    music: { bpm: 84, root: 60 },
    start: { x: 260, y: G - 80 },
    ground: [{ x: 0, w: 2400 }],
    platforms: [{ x: 1650, y: 400, w: 160 }],
    stardust: [...arc(1730, 360, 7, 150)],
    items: [],
    blooms: [{ x: 420, y: G }, { x: 1500, y: G }],
    bouncers: [],
    portals: [
      { x: 520, target: 'woods' },
      { x: 860, target: 'meadow' },
      { x: 1200, target: 'waterfall' },
      { x: 1540, target: 'clouds' },
    ],
    stations: [
      { x: 1900, kind: 'mirror' },
      { x: 2200, kind: 'tree' },
    ],
  },

  woods: {
    id: 'woods',
    name: 'Whispering Woods',
    width: 4400,
    theme: { skyTop: 0x5b4b9a, skyBottom: 0xc7a8e8, far: 0x46407a, near: 0x2f6b55, ground: 0x5a3d2b, groundTop: 0x4fae6d, deco: 'trees' },
    music: { bpm: 76, root: 57 },
    start: { x: 320, y: G - 80 },
    ground: [{ x: 0, w: 1500 }, { x: 1680, w: 1100 }, { x: 2960, w: 1440 }],
    platforms: [
      { x: 1100, y: 470, w: 200 },
      { x: 1560, y: 420, w: 180 },
      { x: 2200, y: 360, w: 220 },
      { x: 2600, y: 250, w: 180 },
      { x: 3500, y: 440, w: 240 },
    ],
    stardust: [
      ...row(480, 560, 5),
      ...arc(1200, 440, 6, 150),
      ...row(1540, 380, 4, 50),
      ...arc(2300, 330, 7, 180),
      ...row(2560, 210, 4, 50),
      ...row(3100, 560, 6),
      ...arc(3620, 400, 7, 170),
      ...row(3950, 300, 5),
    ],
    items: [
      { x: 1180, y: 420 },
      { x: 2690, y: 200 },
      { x: 3620, y: 390 },
    ],
    blooms: [{ x: 900, y: G }, { x: 2000, y: G }, { x: 3300, y: G }, { x: 4100, y: G }],
    bouncers: [],
    friend: { id: 'bunny', x: 760, y: G },
    portals: [{ x: 150, target: 'glade' }],
    stations: [],
  },

  meadow: {
    id: 'meadow',
    name: 'Mushroom Meadow',
    width: 4600,
    theme: { skyTop: 0xffb07c, skyBottom: 0xfff1b8, far: 0xe9a3c9, near: 0x9bd46b, ground: 0x7a4f35, groundTop: 0x9bd46b, deco: 'mushrooms' },
    music: { bpm: 96, root: 62 },
    start: { x: 320, y: G - 80 },
    ground: [{ x: 0, w: 1800 }, { x: 2000, w: 1300 }, { x: 3480, w: 1120 }],
    platforms: [
      { x: 1500, y: 300, w: 200 },
      { x: 2500, y: 260, w: 200 },
      { x: 3800, y: 330, w: 220 },
    ],
    stardust: [
      ...row(500, 560, 5),
      ...arc(1100, 520, 7, 200),
      ...row(1480, 250, 4, 50),
      ...arc(2300, 500, 7, 220),
      ...row(2480, 210, 4, 50),
      ...arc(3000, 480, 7, 220),
      ...row(3700, 560, 6),
      ...row(3780, 280, 4, 50),
    ],
    items: [
      { x: 1600, y: 250 },
      { x: 2600, y: 210 },
      { x: 3100, y: 200 },
      { x: 4300, y: 560 },
    ],
    blooms: [{ x: 700, y: G }, { x: 2200, y: G }, { x: 4000, y: G }],
    bouncers: [
      { x: 1100, y: G },
      { x: 2300, y: G },
      { x: 3000, y: G },
      { x: 4200, y: G },
    ],
    friend: { id: 'fox', x: 720, y: G },
    portals: [{ x: 150, target: 'glade' }],
    stations: [],
  },

  waterfall: {
    id: 'waterfall',
    name: 'Crystal Waterfall',
    width: 4400,
    theme: { skyTop: 0x4fb3e8, skyBottom: 0xc9f1ff, far: 0x8fd3f4, near: 0x3aa7a3, ground: 0x6b6f8a, groundTop: 0x7fe0d6, deco: 'crystals' },
    music: { bpm: 80, root: 64 },
    start: { x: 320, y: G - 80 },
    ground: [{ x: 0, w: 1000 }, { x: 1250, w: 260 }, { x: 1760, w: 260 }, { x: 2270, w: 900 }, { x: 3400, w: 1000 }],
    platforms: [
      { x: 1640, y: 480, w: 160 },
      { x: 2150, y: 470, w: 160 },
      { x: 2750, y: 330, w: 260 },
      { x: 3280, y: 460, w: 160 },
    ],
    stardust: [
      ...row(450, 560, 6),
      ...arc(1380, 560, 6, 160),
      ...arc(1890, 560, 6, 160),
      ...row(2350, 560, 5),
      ...row(2680, 280, 5, 50),
      ...arc(3280, 420, 6, 150),
      ...row(3600, 560, 6),
    ],
    items: [],
    blooms: [{ x: 700, y: G }, { x: 1380, y: G }, { x: 2500, y: G }, { x: 3900, y: G }],
    bouncers: [],
    friend: { id: 'owl', x: 2880, y: 330 },
    portals: [{ x: 150, target: 'glade' }],
    stations: [],
  },

  clouds: {
    id: 'clouds',
    name: 'Rainbow Cloud Kingdom',
    width: 4600,
    theme: { skyTop: 0xff9ecf, skyBottom: 0xbfe6ff, far: 0xffffff, near: 0xf3e9ff, ground: 0xe9e4ff, groundTop: 0xffffff, deco: 'clouds' },
    music: { bpm: 88, root: 65 },
    start: { x: 320, y: G - 80 },
    ground: [{ x: 0, w: 1100 }, { x: 1500, w: 700 }, { x: 2600, w: 700 }, { x: 3700, w: 900 }],
    platforms: [
      { x: 1250, y: 450, w: 200 },
      { x: 1900, y: 300, w: 200 },
      { x: 2400, y: 420, w: 180 },
      { x: 3000, y: 260, w: 220 },
      { x: 3450, y: 430, w: 200 },
    ],
    stardust: [
      ...row(450, 560, 5),
      ...arc(1300, 400, 7, 200),
      ...row(1860, 250, 4, 50),
      ...arc(2450, 380, 7, 200),
      ...row(2960, 210, 5, 50),
      ...arc(3500, 390, 7, 200),
      ...row(4000, 300, 6),
    ],
    items: [],
    blooms: [
      { x: 900, y: G },
      { x: 1950, y: 300 },
      { x: 2900, y: G },
      { x: 3080, y: 260 },
      { x: 4200, y: G },
    ],
    bouncers: [],
    friend: { id: 'dragon', x: 700, y: G },
    portals: [{ x: 150, target: 'glade' }],
    stations: [],
  },
};

export const AREA_ORDER = ['woods', 'meadow', 'waterfall', 'clouds'];
