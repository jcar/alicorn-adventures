import { DIALOGUE, FRIENDS, GROUND_Y, LEVELS, type FriendDef, type LevelDef } from '../content';

const G = GROUND_Y;

/**
 * The lab: a debug-only test level for engine pieces before any kingdom uses
 * them. alicorn.go('lab'), then alicorn.power('shrink', 'fizz') to try them.
 * Left to right: a recipe friend (2 carrots + 1 berry, with an extra carrot
 * and a pearl that aren't wanted), a shrink mushroom and a tiny tunnel, then
 * a candy-glass sky room, a door that opens with a key found nearby, and a math gate (set a skill level to try any bank
 * level there). It's added only when the debug kit is on.
 */
export const LAB: LevelDef = {
  id: 'lab',
  name: 'The Lab',
  width: 5000,
  theme: { skyTop: 0x9ad0ff, skyBottom: 0xfbe3ff, far: 0xe7c6ff, near: 0xb5e6c8, ground: 0x8a6a8f, groundTop: 0xf7a8d8, deco: 'glade' },
  music: { bpm: 90, root: 60 },
  start: { x: 300, y: G - 80 },
  ground: [{ x: 0, w: 5000 }],
  platforms: [{ x: 3420, y: 210, w: 360 }],
  stardust: [],
  items: [
    { x: 900, y: 560, item: 'carrot' },
    { x: 1100, y: 560, item: 'carrot' },
    { x: 1300, y: 560, item: 'carrot' },
    { x: 1500, y: 560, item: 'berry' },
    { x: 1700, y: 560, item: 'pearl' },
  ],
  blooms: [],
  bouncers: [],
  friend: { id: 'lab-chef', x: 620, y: G },
  portals: [{ x: 150, target: 'glade' }],
  stations: [],
  shrinkers: [{ x: 2050 }],
  tunnels: [{ x: 2250, w: 600 }],
  ceilings: [{ id: 'lab-ceiling', x: 3400, w: 400, y: 330 }],
  gates: [{ id: 'lab-gate', x: 4000, skill: 'math' }],
  storyItems: [{ id: 'key', x: 4300, y: 560 }],
  doors: [{ id: 'lab-door', x: 4600, item: 'key', need: 'lab-door-need' }],
  golds: [{ id: 'lab-gold-tunnel', x: 2800, y: 575 }, { id: 'lab-gold-sky', x: 3600, y: 150 }],
};

const CHEF: FriendDef = {
  id: 'lab-chef',
  name: 'Lab Chef',
  texture: 'friend-bunny',
  request: { kind: 'recipe', items: [{ item: 'carrot', count: 2 }, { item: 'berry', count: 1 }] },
  lines: { ask: 'lab-ask', progress: 'lab-progress', thanks: 'lab-thanks' },
  gladeX: -1000,
};

export function installLab() {
  if (LEVELS.lab) return;
  LEVELS.lab = LAB;
  FRIENDS.push(CHEF);
  Object.assign(DIALOGUE, {
    'lab-ask': { speaker: 'narrator', text: 'Lab recipe: 2 carrots and 1 berry, please!' },
    'lab-progress': { speaker: 'narrator', text: 'Keep going! Check the recipe card.' },
    'lab-thanks': { speaker: 'narrator', text: 'The recipe is done!' },
    'lab-door-need': { speaker: 'narrator', text: 'This door needs the key. It is somewhere nearby!' },
  });
}

/** Lab bits that shouldn't count toward a player's progress. */
export const isLab = (id: string) => id.startsWith('lab');
