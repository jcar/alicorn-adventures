import type { FavorDef } from '../../core/content/types';

export const FAVORS: FavorDef[] = [
  {
    id: 'cupcake-count',
    needs: ['bea'],
    steps: [{ npc: 'bea', kind: 'puzzle', skill: 'math', offset: 1, line: 'bea-favor-ask', done: 'bea-favor-thanks' }],
    stardust: 15,
  },
  {
    // Fluff is chilly after all that floating. Duck makes cocoa, but Millie knows the secret recipe.
    id: 'hot-cocoa',
    needs: ['millie', 'duck', 'fluff'],
    steps: [
      { npc: 'fluff', kind: 'talk', line: 'fluff-favor-ask' },
      { npc: 'millie', kind: 'puzzle', puzzle: 'millie-riddle', line: 'millie-favor-ask', done: 'millie-favor-give', gives: 'hot-cocoa' },
      { npc: 'fluff', kind: 'bring', item: 'hot-cocoa', wait: 'fluff-favor-wait', done: 'fluff-favor-thanks' },
    ],
    stardust: 20,
  },
];
