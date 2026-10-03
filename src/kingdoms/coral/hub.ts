import { GROUND_Y, SKY_MAP, arc, type LevelDef } from '../../core/content/types';

const G = GROUND_Y;

/** Coral Cove: a little beach village, the doorway to the sea, and Luma's altar. */
export const HUB: LevelDef = {
  id: 'coral-hub',
  name: 'Coral Cove',
  width: 2400,
  theme: { skyTop: 0x7fd0ff, skyBottom: 0xfff0d6, far: 0x8fd3f4, near: 0x7fd09c, ground: 0xd9bf8c, groundTop: 0xf6e3b4, deco: 'beach' },
  music: { bpm: 88, root: 65 },
  start: { x: 300, y: G - 80 },
  ground: [{ x: 0, w: 2400 }],
  platforms: [{ x: 1640, y: 400, w: 160 }],
  stardust: [...arc(1720, 360, 5, 120)],
  items: [],
  blooms: [],
  bouncers: [],
  portals: [
    { x: 150, target: SKY_MAP },
    { x: 480, target: 'shallows' },
    { x: 800, target: 'kelp' },
    { x: 1120, target: 'ship' },
    { x: 1440, target: 'trench' },
  ],
  stations: [{ x: 2130, kind: 'altar' }],
  decos: [{ texture: 'deco-beach-hut', x: 1760 }, { texture: 'deco-coral', x: 2340 }],
};
