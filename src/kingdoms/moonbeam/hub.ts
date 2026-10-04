import { GROUND_Y, SKY_MAP, arc, type LevelDef } from '../../core/content/types';

const G = GROUND_Y;

/** Moonlight Observatory: a hilltop under the stars, the doors to the kingdom, and the moon altar. */
export const HUB: LevelDef = {
  id: 'moonbeam-hub',
  name: 'Moonlight Observatory',
  width: 2400,
  theme: { skyTop: 0x2a2f6a, skyBottom: 0x9a8ad8, far: 0x4a4f8a, near: 0x6a8ab8, ground: 0x3f4a6a, groundTop: 0xc8d0ff, deco: 'moonbeam' },
  music: { bpm: 76, root: 64 },
  start: { x: 300, y: G - 80 },
  ground: [{ x: 0, w: 2400 }],
  platforms: [{ x: 1640, y: 400, w: 160 }],
  stardust: [...arc(1720, 360, 5, 120)],
  items: [],
  blooms: [],
  bouncers: [],
  portals: [
    { x: 150, target: SKY_MAP },
    { x: 480, target: 'starlit' },
    { x: 800, target: 'mirror' },
    { x: 1120, target: 'library' },
    { x: 1440, target: 'palace' },
  ],
  stations: [{ x: 2130, kind: 'altar' }],
  decos: [{ texture: 'deco-telescope', x: 1760 }, { texture: 'deco-moonflower', x: 2340 }],
};
