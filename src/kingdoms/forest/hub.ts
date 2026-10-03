import { GROUND_Y, SKY_MAP, arc, type LevelDef } from '../../core/content/types';

const G = GROUND_Y;

/** The forest clearing: the way into each forest area, and back to the Sky Map. */
export const HUB: LevelDef = {
  id: 'forest-hub',
  name: 'The Enchanted Forest',
  width: 2300,
  theme: { skyTop: 0x8fd0ff, skyBottom: 0xe6f7d9, far: 0x9fd8a8, near: 0x5fae73, ground: 0x7a5236, groundTop: 0x5fcf78, deco: 'glade' },
  music: { bpm: 80, root: 62 },
  start: { x: 300, y: G - 80 },
  ground: [{ x: 0, w: 2300 }],
  platforms: [{ x: 1980, y: 400, w: 180 }],
  stardust: [...arc(2070, 360, 5, 120)],
  items: [],
  blooms: [{ x: 680, y: G }, { x: 2100, y: G }],
  bouncers: [],
  portals: [
    { x: 150, target: SKY_MAP },
    { x: 520, target: 'woods' },
    { x: 840, target: 'meadow' },
    { x: 1160, target: 'waterfall' },
    { x: 1480, target: 'clouds' },
    { x: 1800, target: 'frost' },
  ],
  stations: [],
};
