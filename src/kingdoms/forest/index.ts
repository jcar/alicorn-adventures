import type { KingdomDef } from '../../core/content/types';
import { AREAS, AREA_COLORS, AREA_ORDER } from './areas';
import { HUB } from './hub';
import { FRIENDS } from './friends';
import { POWERS } from './powers';
import { PUZZLES } from './puzzles';
import { FAVORS } from './favors';
import { UNLOCKS } from './unlocks';
import dialogue from './dialogue.json';

/** The Enchanted Forest: the first kingdom, and the Heart Crystal mystery. */
const forest: KingdomDef = {
  id: 'forest',
  name: 'The Enchanted Forest',
  order: 1,
  hub: HUB,
  map: { x: 0.38, y: 0.42 },
  island: 'island-forest',
  areaOrder: AREA_ORDER,
  areas: AREAS,
  areaColors: AREA_COLORS,
  friends: FRIENDS,
  powers: POWERS,
  puzzles: PUZZLES,
  favors: FAVORS,
  unlocks: UNLOCKS,
  dialogue,
};

export default forest;
