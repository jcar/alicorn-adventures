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
 * The Coral Kingdom: swimming under the sea. Pip's big sister Luma, a
 * Guardian Star, fell into the sea and broke into four shining shards.
 */
const coral: KingdomDef = {
  id: 'coral',
  name: 'The Coral Kingdom',
  order: 2,
  hub: HUB,
  map: { x: 0.6, y: 0.68 },
  island: 'island-coral',
  needs: ['pip'],
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
    flag: 'star:coral',
    starName: 'Luma, the Sea Star',
    altarTexture: 'altar-coral',
    shards: AREA_ORDER,
    lines: {
      status: ['coral-altar-0', 'coral-altar-1', 'coral-altar-2', 'coral-altar-3'],
      finale: 'coral-altar-finale',
      done: 'coral-altar-done',
    },
    clueTitle: 'Clues from Luma',
  },
};

export default coral;
