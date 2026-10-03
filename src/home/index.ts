import { GROUND_Y, SKY_MAP, arc, type HomeDef, type LevelDef } from '../core/content/types';
import { AREA_ORDER } from '../kingdoms/forest/areas';
import dialogue from './dialogue.json';

const G = GROUND_Y;

/** Her Glade. Its level id stays 'glade' forever: saves and doors point at it. */
const level: LevelDef = {
    id: 'glade',
    name: 'Home Glade',
    width: 4300,
    theme: { skyTop: 0x9ad8ff, skyBottom: 0xffe3f3, far: 0xb7e4c7, near: 0x7cc995, ground: 0x8a5a3c, groundTop: 0x6fd08c, deco: 'glade' },
    music: { bpm: 84, root: 60 },
    start: { x: 260, y: G - 80 },
    ground: [{ x: 0, w: 4300 }],
    platforms: [{ x: 1920, y: 380, w: 160 }],
    stardust: [...arc(2000, 340, 7, 150)],
    items: [],
    blooms: [{ x: 360, y: G }, { x: 1600, y: G }],
    bouncers: [],
    // One Star Gate instead of a door per area: it opens the Sky Map.
    portals: [{ x: 460, target: SKY_MAP }],
    stations: [
      { x: 2250, kind: 'mirror' },
      { x: 2550, kind: 'tree' },
      { x: 2920, kind: 'crystal' },
    ],
  };

const home: HomeDef = {
  level,
  dialogue,
  heartCrystalSparks: AREA_ORDER,
};

export default home;
