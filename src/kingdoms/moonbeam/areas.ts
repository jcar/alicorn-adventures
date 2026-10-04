import { GROUND_Y, arc, row, tunnel, type LevelDef } from '../../core/content/types';

const G = GROUND_Y;

/** Moonbeam versions of the shared pictures. */
const MOON = {
  crystal: 'moon-chime', bumper: 'star-bumper', catcher: 'moon-cloud', cave: 'library-cave',
  dayWall: 'sun-wall', nightWall: 'shadow-wall', dial: 'moon-dial', lanternDoor: 'lantern-door', lantern: 'moon-lantern',
  shrinker: 'moon-mushroom', tunnel: 'moon-rock', ceiling: 'star-glass',
};

const starlitTunnel = tunnel(5600, 420, 'starlit-gold-1');
const mirrorTunnel = tunnel(700, 420, 'mirror-gold-1');
const libraryTunnel = tunnel(800, 420, 'library-gold-1');
const palaceTunnel = tunnel(6750, 420, 'palace-gold-1');

/**
 * Moonbeam Kingdom, the last world: plan ahead. Draw constellations from
 * memory; choose day or night to get past sun walls and shadow walls; read a
 * clue and work out which lanterns to light; then the Moon Palace asks for
 * all of it at once. Puzzle locks are two levels above her own.
 */
export const AREAS: Record<string, LevelDef> = {
  starlit: {
    id: 'starlit',
    name: 'Starlit Meadow',
    width: 6400,
    phases: { start: 'night' },
    theme: { skyTop: 0x2a2f6a, skyBottom: 0x8a7ac8, far: 0x4a4f8a, near: 0x5a8a7a, ground: 0x3f4a6a, groundTop: 0x8fd8b0, deco: 'moonbeam' },
    music: { bpm: 72, root: 62 },
    start: { x: 320, y: G - 80 },
    ground: [{ x: 0, w: 6400 }],
    platforms: [{ x: 2900, y: 300, w: 220 }],
    stardust: [...row(420, 560, 4), ...arc(1700, 520, 5, 140), ...row(2920, 260, 3, 60), ...row(4000, 560, 4), ...arc(5050, 520, 5, 140)],
    items: [],
    blooms: [],
    bouncers: [],
    // Nyx's three star pictures: three stars, four, then five.
    friend: { id: 'nyx', x: 700, y: G },
    portals: [{ x: 150, target: 'moonbeam-hub' }],
    stations: [],
    art: MOON,
    constellations: [
      { id: 'starlit-stars-1', x: 1150, stars: [{ x: 1300, y: 400 }, { x: 1420, y: 260 }, { x: 1540, y: 400 }] },
      { id: 'starlit-stars-2', x: 2150, stars: [{ x: 2300, y: 430 }, { x: 2300, y: 270 }, { x: 2470, y: 270 }, { x: 2470, y: 430 }] },
      { id: 'starlit-stars-3', x: 3300, stars: [{ x: 3450, y: 300 }, { x: 3540, y: 430 }, { x: 3630, y: 320 }, { x: 3720, y: 440 }, { x: 3810, y: 290 }] },
    ],
    gates: [{ id: 'starlit-gate', x: 2700, skill: 'reading', offset: 2 }],
    // Past Nyx's meadow: a shadow wall (it's night here), with a moon dial on each side.
    moonDials: [{ x: 4100 }, { x: 4600 }],
    phaseWalls: [{ x: 4330, phase: 'night' }],
    blocks: starlitTunnel.blocks,
    bumpers: starlitTunnel.bumpers,
    golds: [starlitTunnel.gold, { id: 'starlit-gold-2', x: 3010, y: 150 }],
    chests: [
      { id: 'starlit-chest-stars', x: 2950, y: G, reward: { stardust: 15 }, byPattern: 'starlit-stars-2' },
      { id: 'starlit-chest-wall', x: 5300, y: G, reward: { stardust: 20 } },
    ],
    notes: [{ id: 'moonbeam-note-1', x: 1850, y: G, line: 'moonbeam-note-1', secret: true }],
    spark: { x: 4950, y: 340 },
    decos: [{ texture: 'deco-moonflower', x: 480 }, { texture: 'deco-moonflower', x: 1950 }, { texture: 'deco-telescope', x: 3950 }, { texture: 'deco-moonflower', x: 6200 }],
  },

  mirror: {
    id: 'mirror',
    name: 'Mirror Lake',
    width: 6800,
    phases: { start: 'day' },
    theme: { skyTop: 0x7fb0ff, skyBottom: 0xe8e0ff, far: 0x9fc0f0, near: 0x8fd8c8, ground: 0x5a6a8a, groundTop: 0xbfe8f0, deco: 'moonbeam' },
    music: { bpm: 78, root: 64 },
    start: { x: 320, y: G - 80 },
    ground: [{ x: 0, w: 6800 }],
    platforms: [{ x: 2400, y: 340, w: 200 }, { x: 4300, y: 380, w: 200 }],
    stardust: [...row(420, 560, 4), ...row(1500, 560, 3), ...row(2420, 300, 3, 60), ...row(3100, 560, 3), ...row(4320, 340, 3, 60), ...arc(5400, 520, 5, 140)],
    // Selene's four moon feathers, between the sun walls and shadow walls.
    items: [{ x: 1750, y: 560 }, { x: 2500, y: 300 }, { x: 3520, y: 560, hidden: true }, { x: 4400, y: 340 }],
    blooms: [],
    bouncers: [],
    friend: { id: 'selene', x: 6300, y: G },
    portals: [{ x: 150, target: 'moonbeam-hub' }],
    stations: [],
    art: MOON,
    // Sun, shadow, sun, shadow: which is in the way, and is it day or night? A dial in every stretch.
    phaseWalls: [{ x: 1300, phase: 'day' }, { x: 2100, phase: 'night' }, { x: 2900, phase: 'day' }, { x: 3700, phase: 'night' }],
    moonDials: [{ x: 1080 }, { x: 1560 }, { x: 2280 }, { x: 3120 }, { x: 3960 }],
    gates: [{ id: 'mirror-gate', x: 4800, skill: 'logic', offset: 2 }],
    constellations: [{ id: 'mirror-stars', x: 5150, stars: [{ x: 5300, y: 300 }, { x: 5420, y: 420 }, { x: 5560, y: 300 }, { x: 5420, y: 200 }] }],
    blocks: mirrorTunnel.blocks,
    bumpers: mirrorTunnel.bumpers,
    golds: [mirrorTunnel.gold, { id: 'mirror-gold-2', x: 4400, y: 150 }],
    chests: [
      { id: 'mirror-chest-stars', x: 5750, y: G, reward: { stardust: 15 }, byPattern: 'mirror-stars' },
      { id: 'mirror-chest-shore', x: 2800, y: G, reward: { stardust: 10 } },
    ],
    notes: [{ id: 'moonbeam-note-2', x: 2600, y: G, line: 'moonbeam-note-2', secret: true }],
    spark: { x: 6000, y: 300 },
    decos: [{ texture: 'deco-moonflower', x: 500 }, { texture: 'deco-moonflower', x: 3300 }, { texture: 'deco-moonflower', x: 6600 }],
  },

  library: {
    id: 'library',
    name: 'Lantern Library',
    width: 6600,
    theme: { skyTop: 0x3a2f5a, skyBottom: 0x8a6aa8, far: 0x5a4a7a, near: 0x7a5a8a, ground: 0x6a4a3a, groundTop: 0xd8b07a, deco: 'moonbeam' },
    music: { bpm: 80, root: 60 },
    start: { x: 320, y: G - 80 },
    ground: [{ x: 0, w: 6600 }],
    platforms: [{ x: 3250, y: 350, w: 220 }],
    stardust: [...row(420, 560, 4), ...row(1900, 560, 3), ...row(3270, 310, 3, 60), ...row(4700, 560, 3), ...arc(5800, 520, 5, 140)],
    // Professor Hoot's three books, one behind each lantern door.
    items: [{ x: 1950, y: 560 }, { x: 3360, y: 300 }, { x: 4900, y: 560 }],
    blooms: [],
    bouncers: [],
    friend: { id: 'hoot', x: 600, y: G },
    portals: [{ x: 150, target: 'moonbeam-hub' }],
    stations: [],
    art: MOON,
    // Clues get harder: name two; then "next to, but not"; then "every one except".
    lanternDoors: [
      {
        id: 'library-lanterns-1', x: 1700, clue: 'library-clue-1', answer: [1, 2],
        lanterns: [{ x: 1250, y: 500, color: 'red' }, { x: 1360, y: 500, color: 'yellow' }, { x: 1470, y: 500, color: 'green' }],
      },
      {
        id: 'library-lanterns-2', x: 3100, clue: 'library-clue-2', answer: [1, 2],
        lanterns: [{ x: 2550, y: 500, color: 'blue' }, { x: 2660, y: 500, color: 'red' }, { x: 2770, y: 500, color: 'yellow' }, { x: 2880, y: 500, color: 'green' }],
      },
      {
        id: 'library-lanterns-3', x: 4600, clue: 'library-clue-3', answer: [0, 3, 4],
        lanterns: [{ x: 3950, y: 500, color: 'green' }, { x: 4060, y: 500, color: 'purple' }, { x: 4170, y: 500, color: 'red' }, { x: 4280, y: 500, color: 'yellow' }, { x: 4390, y: 500, color: 'blue' }],
      },
    ],
    darks: [{ x: 4750, y: 250, w: 400, h: 470 }],
    gates: [{ id: 'library-gate', x: 5400, skill: 'math', offset: 2 }],
    blocks: libraryTunnel.blocks,
    bumpers: libraryTunnel.bumpers,
    golds: [libraryTunnel.gold, { id: 'library-gold-2', x: 6300, y: 200 }],
    chests: [
      { id: 'library-chest-dark', x: 5050, y: G, reward: { stardust: 15 } },
      { id: 'library-chest-top', x: 3450, y: 350, reward: { stardust: 10 } },
    ],
    notes: [{ id: 'moonbeam-note-3', x: 2200, y: G, line: 'moonbeam-note-3', secret: true, hidden: true }],
    spark: { x: 5900, y: 330 },
    decos: [{ texture: 'deco-bookshelf', x: 450 }, { texture: 'deco-bookshelf', x: 2350 }, { texture: 'deco-bookshelf', x: 3700 }, { texture: 'deco-bookshelf', x: 6450 }],
  },

  palace: {
    id: 'palace',
    name: 'Moon Palace',
    width: 7200,
    phases: { start: 'night' },
    theme: { skyTop: 0x1f2a5a, skyBottom: 0x6a7ac8, far: 0x3a4a8a, near: 0x8a8ac8, ground: 0x4a4a7a, groundTop: 0xd8d8ff, deco: 'moonbeam' },
    music: { bpm: 74, root: 65 },
    start: { x: 320, y: G - 80 },
    ground: [{ x: 0, w: 7200 }],
    platforms: [{ x: 5010, y: 240, w: 300 }],
    stardust: [...row(420, 560, 4), ...row(1700, 560, 3), ...row(3150, 560, 3), ...row(4450, 560, 3), ...arc(6300, 520, 5, 140)],
    // Mochi's four moonstones: past a shadow wall, behind a lantern door, in a tiny tunnel, and up in a sky room.
    items: [{ x: 1800, y: 560 }, { x: 3150, y: 560 }, { x: 3850, y: 585 }, { x: 5160, y: 190 }],
    blooms: [],
    bouncers: [],
    friend: { id: 'mochi', x: 700, y: G },
    portals: [{ x: 150, target: 'moonbeam-hub' }],
    stations: [],
    art: MOON,
    moonDials: [{ x: 1180 }, { x: 1650 }],
    phaseWalls: [{ x: 1400, phase: 'night' }],
    gates: [
      { id: 'palace-gate-1', x: 2100, skill: 'math', offset: 2 },
      { id: 'palace-gate-2', x: 6000, skill: 'reading', offset: 2 },
    ],
    lanternDoors: [{
      id: 'palace-lanterns', x: 2950, clue: 'palace-clue', answer: [1, 3],
      lanterns: [{ x: 2300, y: 500, color: 'purple' }, { x: 2410, y: 500, color: 'blue' }, { x: 2520, y: 500, color: 'red' }, { x: 2630, y: 500, color: 'yellow' }, { x: 2740, y: 500, color: 'green' }],
    }],
    shrinkers: [{ x: 3450 }, { x: 4300 }],
    tunnels: [{ x: 3600, w: 520 }],
    ceilings: [{ id: 'palace-star-glass', x: 5000, w: 320, y: 290 }],
    constellations: [{ id: 'palace-stars', x: 5550, stars: [{ x: 5700, y: 420 }, { x: 5700, y: 260 }, { x: 5820, y: 180 }, { x: 5940, y: 260 }, { x: 5940, y: 420 }] }],
    blocks: palaceTunnel.blocks,
    bumpers: palaceTunnel.bumpers,
    golds: [palaceTunnel.gold, { id: 'palace-gold-2', x: 3250, y: 140 }],
    chests: [
      { id: 'palace-chest-stars', x: 6300, y: G, reward: { stardust: 20 }, byPattern: 'palace-stars' },
      { id: 'palace-chest-hall', x: 4600, y: G, reward: { stardust: 15 } },
    ],
    notes: [{ id: 'moonbeam-note-4', x: 4500, y: G, line: 'moonbeam-note-4', secret: true }],
    spark: { x: 6550, y: 300 },
    decos: [{ texture: 'deco-palace-pillar', x: 480 }, { texture: 'deco-palace-pillar', x: 2200 }, { texture: 'deco-palace-pillar', x: 4450 }, { texture: 'deco-palace-pillar', x: 7050 }],
  },
};

export const AREA_ORDER = ['starlit', 'mirror', 'library', 'palace'];

export const AREA_COLORS: Record<string, number> = {
  starlit: 0xbfd0ff,
  mirror: 0x9fe8ff,
  library: 0xffd27a,
  palace: 0xe0c8ff,
};
