import type { KingdomDef } from '../../core/content/types';
import { AREAS, AREA_COLORS, AREA_ORDER } from './areas';
import { HUB } from './hub';
import { FRIENDS } from './friends';
import { POWERS } from './powers';
import { PUZZLES } from './puzzles';
import { FAVORS } from './favors';
import { UNLOCKS } from './unlocks';
import dialogue from './dialogue.json';

/**
 * Sweet Treat Valley: think in two steps. Pip's little brother Sol, a
 * Guardian Star, tumbled into the valley and his light scattered into four
 * sugar-sparkle shards.
 */
const sweets: KingdomDef = {
  id: 'sweets',
  name: 'Sweet Treat Valley',
  order: 3,
  hub: HUB,
  map: { x: 0.7, y: 0.3 },
  island: 'island-sweets',
  needs: ['tide'],
  areaOrder: AREA_ORDER,
  areas: AREAS,
  areaColors: AREA_COLORS,
  friends: FRIENDS,
  powers: POWERS,
  puzzles: PUZZLES,
  favors: FAVORS,
  unlocks: UNLOCKS,
  dialogue,
  saga: {
    flag: 'star:sweets',
    starName: 'Sol, the Sun Star',
    altarTexture: 'altar-sweets',
    shards: AREA_ORDER,
    lines: {
      status: ['sweets-altar-0', 'sweets-altar-1', 'sweets-altar-2', 'sweets-altar-3'],
      finale: 'sweets-altar-finale',
      done: 'sweets-altar-done',
    },
    clueTitle: 'Clues from Sol',
    news: { line: 'pip-sol', after: 'tide' },
  },
};

export default sweets;
