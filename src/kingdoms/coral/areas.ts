import { GROUND_Y, arc, row, tunnel, type LevelDef } from '../../core/content/types';

const G = GROUND_Y;

/** Under the sea everything floats: these areas are all swim mode. */
const UNDERWATER = {
  mode: 'swim' as const,
  bouncers: [],
  stations: [],
  art: { catcher: 'big-bubble', bumper: 'jelly', crystal: 'shell-chime' },
};
/** Sea-glass walls open with Shell Song (taught by Grandma Tide). */
const glass = (id: string, x: number) => ({ id, x, power: 'song' as const, texture: 'sea-glass', blocked: 'glass-blocked', can: 'glass-sing' });
const current = (x: number, w: number) => ({ x, w, power: 'jet' as const, style: 'current' as const });

const shallowsTunnel = tunnel(3900, 420, 'shallows-gold-1');
const kelpTunnel = tunnel(1900, 420, 'kelp-gold-1');
const shipTunnel = tunnel(2300, 420, 'ship-gold-1');
const trenchTunnel = tunnel(1100, 420, 'trench-gold-1');

export const AREAS: Record<string, LevelDef> = {
  shallows: {
    id: 'shallows',
    name: 'Sunny Shallows',
    width: 5200,
    theme: { skyTop: 0x5ec8ff, skyBottom: 0xc9f1ff, far: 0x8fd3f4, near: 0x3aa7a3, ground: 0xd9bf8c, groundTop: 0xf6e3b4, deco: 'reef' },
    music: { bpm: 84, root: 64 },
    start: { x: 320, y: G - 80 },
    ground: [{ x: 0, w: 2000 }, { x: 2200, w: 3000 }],
    platforms: [{ x: 900, y: 420, w: 180 }, { x: 1700, y: 360, w: 200 }, { x: 2700, y: 300, w: 200 }, { x: 3600, y: 420, w: 220 }],
    stardust: [...row(450, 560, 5), ...arc(1100, 380, 6, 160), ...row(1720, 320, 3, 50), ...arc(2500, 480, 6, 180), ...row(3640, 380, 3, 50), ...row(4500, 560, 4)],
    items: [{ x: 990, y: 380 }, { x: 1800, y: 320 }, { x: 2800, y: 260 }, { x: 3300, y: 560, hidden: true }],
    blooms: [],
    friend: { id: 'marina', x: 700, y: G },
    portals: [{ x: 150, target: 'coral-hub' }],
    ...UNDERWATER,
    blocks: shallowsTunnel.blocks,
    bumpers: shallowsTunnel.bumpers,
    golds: [shallowsTunnel.gold, { id: 'shallows-gold-2', x: 4800, y: 300 }],
    gates: [{ id: 'shallows-gate', x: 3050, skill: 'math' }],
    patterns: [{ id: 'shallows-pattern', x: 2300, crystals: [{ x: 2400, y: 480 }, { x: 2510, y: 420 }, { x: 2620, y: 480 }], offset: 0 }],
    chests: [
      { id: 'shallows-chest-pattern', x: 2780, y: G, reward: { stardust: 10 }, byPattern: 'shallows-pattern' },
      { id: 'shallows-chest-glass', x: 5140, y: G, reward: { stardust: 20 } },
    ],
    notes: [{ id: 'coral-note-1', x: 1300, y: G, line: 'coral-note-1', secret: true }],
    winds: [current(4450, 260)],
    walls: [glass('shallows-glass', 4950)],
    spark: { x: 5060, y: 450 },
    decos: [{ texture: 'deco-coral', x: 560 }, { texture: 'deco-seaweed', x: 1480 }, { texture: 'deco-coral', x: 3450 }, { texture: 'deco-seaweed', x: 4300 }],
  },

  kelp: {
    id: 'kelp',
    name: 'Kelp Forest',
    width: 5200,
    theme: { skyTop: 0x2f8f8a, skyBottom: 0x8fe0c8, far: 0x3aa7a3, near: 0x2f6b55, ground: 0x8a7a5a, groundTop: 0x7fd09c, deco: 'kelp' },
    music: { bpm: 76, root: 62 },
    start: { x: 320, y: G - 80 },
    ground: [{ x: 0, w: 1600 }, { x: 1800, w: 1600 }, { x: 3600, w: 1600 }],
    platforms: [{ x: 1000, y: 430, w: 180 }, { x: 3100, y: 400, w: 200 }, { x: 4200, y: 330, w: 220 }],
    stardust: [...row(400, 560, 4), ...arc(1100, 400, 5, 140), ...arc(1700, 520, 5, 140), ...row(3120, 360, 3, 50), ...arc(3500, 520, 5, 140), ...row(4220, 290, 4, 50)],
    items: [],
    blooms: [{ x: 500, y: G }, { x: 1200, y: G }, { x: 2600, y: G }, { x: 2950, y: G, hidden: true }, { x: 3900, y: G }],
    friend: { id: 'otto', x: 800, y: G },
    portals: [{ x: 150, target: 'coral-hub' }],
    ...UNDERWATER,
    art: { ...UNDERWATER.art, bud: 'anemone-bud', flower: 'anemone', cave: 'sea-cave' },
    blocks: kelpTunnel.blocks,
    bumpers: kelpTunnel.bumpers,
    golds: [kelpTunnel.gold, { id: 'kelp-gold-2', x: 4960, y: 250 }],
    gates: [{ id: 'kelp-gate', x: 3300, skill: 'logic' }],
    patterns: [{ id: 'kelp-pattern', x: 4200, crystals: [{ x: 4300, y: 480 }, { x: 4410, y: 420 }, { x: 4520, y: 480 }, { x: 4630, y: 420 }], offset: 0 }],
    chests: [
      { id: 'kelp-chest-pattern', x: 4660, y: G, reward: { stardust: 10 }, byPattern: 'kelp-pattern' },
      { id: 'kelp-chest-glass', x: 5130, y: G, reward: { stardust: 20 } },
    ],
    notes: [{ id: 'coral-note-2', x: 1400, y: G, line: 'coral-note-2', secret: true, hidden: true }],
    darks: [{ x: 2400, y: 250, w: 400, h: 470 }],
    winds: [current(4700, 220)],
    walls: [glass('kelp-glass', 5040)],
    spark: { x: 2700, y: 400 },
    decos: [{ texture: 'deco-seaweed', x: 300 }, { texture: 'deco-seaweed', x: 1450 }, { texture: 'deco-seaweed', x: 2200 }, { texture: 'deco-seaweed', x: 3750 }],
  },

  ship: {
    id: 'ship',
    name: 'Sunken Ship',
    width: 5400,
    theme: { skyTop: 0x1f4f7a, skyBottom: 0x5ea8c8, far: 0x2f5f8a, near: 0x3a4f6a, ground: 0x7a6248, groundTop: 0xc9a46a, deco: 'ship' },
    music: { bpm: 80, root: 57 },
    start: { x: 320, y: G - 80 },
    ground: [{ x: 0, w: 5400 }],
    platforms: [{ x: 700, y: 420, w: 160 }, { x: 2600, y: 360, w: 220 }, { x: 4000, y: 380, w: 220 }],
    stardust: [...row(420, 560, 4), ...arc(1300, 480, 5, 140), ...row(2620, 320, 4, 50), ...row(3100, 560, 4), ...arc(4100, 480, 5, 140)],
    items: [{ x: 3700, y: 560 }],
    blooms: [],
    friend: { id: 'crab', x: 560, y: G },
    portals: [{ x: 150, target: 'coral-hub' }],
    ...UNDERWATER,
    blocks: shipTunnel.blocks,
    bumpers: shipTunnel.bumpers,
    golds: [shipTunnel.gold, { id: 'ship-gold-2', x: 4650, y: 250 }],
    gates: [{ id: 'ship-gate', x: 3000, skill: 'math', offset: 1 }],
    patterns: [{ id: 'ship-pattern', x: 1500, crystals: [{ x: 1600, y: 480 }, { x: 1710, y: 420 }, { x: 1820, y: 480 }, { x: 1930, y: 420 }], offset: 1 }],
    chests: [
      { id: 'ship-chest-pattern', x: 2060, y: G, reward: { stardust: 10 }, byPattern: 'ship-pattern' },
      { id: 'ship-chest-cabin', x: 1080, y: G, reward: { stardust: 15 } },
      { id: 'ship-chest-glass', x: 5250, y: G, reward: { stardust: 20 } },
    ],
    notes: [{ id: 'coral-note-3', x: 2420, y: G, line: 'coral-note-3', secret: true }],
    darks: [{ x: 900, y: 250, w: 350, h: 470 }, { x: 3400, y: 200, w: 600, h: 520 }],
    art: { ...UNDERWATER.art, cave: 'ship-cabin' },
    winds: [current(4300, 260)],
    walls: [glass('ship-glass', 5050)],
    spark: { x: 4850, y: 450 },
    decos: [{ texture: 'deco-anchor', x: 2300 }, { texture: 'deco-barrel', x: 3150 }, { texture: 'deco-barrel', x: 4150 }],
  },

  trench: {
    id: 'trench',
    name: 'Moonlit Trench',
    width: 5600,
    theme: { skyTop: 0x1a1f4a, skyBottom: 0x3a4f8a, far: 0x2a2f6a, near: 0x4a3f7a, ground: 0x4a4a6a, groundTop: 0x8a8ac8, deco: 'trench' },
    music: { bpm: 70, root: 60 },
    start: { x: 320, y: G - 80 },
    ground: [{ x: 0, w: 1500 }, { x: 1700, w: 1500 }, { x: 3400, w: 2200 }],
    platforms: [{ x: 1520, y: 470, w: 160 }, { x: 3220, y: 470, w: 160 }, { x: 4600, y: 360, w: 220 }],
    stardust: [...row(420, 560, 4), ...arc(1600, 520, 5, 130), ...row(2150, 560, 3), ...arc(3300, 520, 5, 130), ...row(3900, 560, 4), ...row(4620, 320, 4, 50)],
    items: [],
    blooms: [],
    friend: { id: 'tide', x: 4400, y: G },
    portals: [{ x: 150, target: 'coral-hub' }],
    ...UNDERWATER,
    blocks: trenchTunnel.blocks,
    bumpers: trenchTunnel.bumpers,
    golds: [trenchTunnel.gold, { id: 'trench-gold-2', x: 2700, y: 150 }],
    gates: [{ id: 'trench-gate', x: 3200, skill: 'reading', offset: 1 }],
    patterns: [{ id: 'trench-pattern', x: 700, crystals: [{ x: 800, y: 480 }, { x: 910, y: 420 }, { x: 1020, y: 480 }, { x: 1130, y: 420 }, { x: 1240, y: 480 }], offset: 1 }],
    chests: [
      { id: 'trench-chest-pattern', x: 1380, y: G, reward: { stardust: 15 }, byPattern: 'trench-pattern' },
      { id: 'trench-chest-dark', x: 2700, y: G, reward: { stardust: 15 } },
    ],
    notes: [{ id: 'coral-note-4', x: 5250, y: G, line: 'coral-note-4', secret: true }],
    darks: [{ x: 2400, y: 0, w: 600, h: 720 }],
    winds: [current(1900, 300), current(3600, 260)],
    walls: [glass('trench-glass', 5000)],
    spark: { x: 5450, y: 450 },
    decos: [{ texture: 'deco-coral', x: 600 }, { texture: 'deco-seaweed', x: 3500 }, { texture: 'deco-coral', x: 4200 }],
  },
};

export const AREA_ORDER = ['shallows', 'kelp', 'ship', 'trench'];

export const AREA_COLORS: Record<string, number> = {
  shallows: 0x7ed6ff,
  kelp: 0x6fe36f,
  ship: 0xffc93c,
  trench: 0xc9a7ff,
};
