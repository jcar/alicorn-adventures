import type { FavorDef } from '../../core/content/types';

export const FAVORS: FavorDef[] = [
  {
    id: 'pearl-count',
    needs: ['marina'],
    steps: [{ npc: 'marina', kind: 'puzzle', skill: 'math', offset: 1, line: 'marina-favor-ask', done: 'marina-favor-thanks' }],
    stardust: 15,
  },
  {
    id: 'treasure-map',
    needs: ['otto', 'crab'],
    steps: [
      { npc: 'crab', kind: 'talk', line: 'crab-favor-ask' },
      { npc: 'otto', kind: 'puzzle', puzzle: 'otto-riddle', line: 'otto-favor-ask', done: 'otto-favor-give', gives: 'treasure-map' },
      { npc: 'crab', kind: 'bring', item: 'treasure-map', wait: 'crab-favor-wait', done: 'crab-favor-thanks' },
    ],
    stardust: 20,
  },
];
