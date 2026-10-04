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
 * Moonbeam Kingdom, the last world: plan ahead. Pip's mama and papa, the
 * last Guardian Stars, fell asleep here and their light became four moon
 * shards. Restoring them brings Pip's whole family home.
 */
const moonbeam: KingdomDef = {
  id: 'moonbeam',
  name: 'Moonbeam Kingdom',
  order: 4,
  hub: HUB,
  map: { x: 0.87, y: 0.6 },
  island: 'island-moonbeam',
  needs: ['fluff'],
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
    flag: 'star:moonbeam',
    starName: 'Mama Nova and Papa Orion',
    altarTexture: 'altar-moonbeam',
    shards: AREA_ORDER,
    lines: {
      status: ['moonbeam-altar-0', 'moonbeam-altar-1', 'moonbeam-altar-2', 'moonbeam-altar-3'],
      finale: 'moonbeam-altar-finale',
      done: 'moonbeam-altar-done',
    },
    clueTitle: 'Clues from Mama and Papa',
    news: { line: 'pip-parents', after: 'fluff' },
    family: [{ name: 'Mama Nova', tint: 0xe0c8ff }, { name: 'Papa Orion', tint: 0xa8d4ff }],
    finale: true,
  },
};

export default moonbeam;
