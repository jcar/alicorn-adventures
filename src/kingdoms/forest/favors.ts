import type { FavorDef } from '../../core/content/types';

export const FAVORS: FavorDef[] = [
  {
    id: 'berries',
    needs: ['fox'],
    steps: [{ npc: 'fox', kind: 'puzzle', puzzle: 'fox-math', line: 'fox-math-ask', done: 'fox-math-thanks' }],
    stardust: 10,
  },
  {
    id: 'lantern',
    needs: ['fox', 'owl'],
    steps: [
      { npc: 'fox', kind: 'talk', line: 'fox-favor-ask' },
      { npc: 'owl', kind: 'puzzle', puzzle: 'owl-riddle', line: 'owl-favor-ask', done: 'owl-favor-give', gives: 'lantern' },
      { npc: 'fox', kind: 'bring', item: 'lantern', wait: 'fox-favor-wait', done: 'fox-favor-thanks' },
    ],
    stardust: 15,
  },
  {
    id: 'shell',
    needs: ['bunny', 'dragon'],
    steps: [
      { npc: 'dragon', kind: 'talk', line: 'dragon-favor-ask' },
      { npc: 'bunny', kind: 'puzzle', puzzle: 'bunny-riddle', line: 'bunny-favor-ask', done: 'bunny-favor-hint' },
      { npc: 'dragon', kind: 'bring', item: 'moon-shell', wait: 'dragon-favor-wait', done: 'dragon-favor-thanks' },
    ],
    stardust: 15,
  },
];
