import { GROUND_Y, SKY_MAP, arc, type LevelDef } from '../../core/content/types';

const G = GROUND_Y;

/** Candy Square: a gingerbread village, the doors to the valley, and Sol's altar. */
export const HUB: LevelDef = {
  id: 'sweets-hub',
  name: 'Candy Square',
  width: 2400,
  theme: { skyTop: 0xffb3d9, skyBottom: 0xfff6d6, far: 0xffc2de, near: 0x9fe3c0, ground: 0xb07a5a, groundTop: 0xff9fd6, deco: 'sweets' },
  music: { bpm: 96, root: 64 },
  start: { x: 300, y: G - 80 },
  ground: [{ x: 0, w: 2400 }],
  platforms: [{ x: 1640, y: 400, w: 160 }],
  stardust: [...arc(1720, 360, 5, 120)],
  items: [],
  blooms: [],
  bouncers: [],
  portals: [
    { x: 150, target: SKY_MAP },
    { x: 480, target: 'lollipop' },
    { x: 800, target: 'gumdrop' },
    { x: 1120, target: 'chocolate' },
    { x: 1440, target: 'cottoncandy' },
  ],
  stations: [{ x: 2130, kind: 'altar' }],
  decos: [{ texture: 'deco-gingerbread-house', x: 1760 }, { texture: 'deco-lollipop', x: 2340 }],
};
