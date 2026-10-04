import type { FavorDef } from '../../core/content/types';

export const FAVORS: FavorDef[] = [
  {
    id: 'hoot-story',
    needs: ['hoot'],
    steps: [{ npc: 'hoot', kind: 'puzzle', skill: 'reading', offset: 2, line: 'hoot-favor-ask', done: 'hoot-favor-thanks' }],
    stardust: 20,
  },
  {
    // Nyx wants to read Hoot's books at night; Hoot has a moon lantern.
    id: 'moon-lantern',
    needs: ['nyx', 'hoot'],
    steps: [
      { npc: 'nyx', kind: 'talk', line: 'nyx-favor-ask' },
      { npc: 'hoot', kind: 'puzzle', skill: 'logic', offset: 2, line: 'hoot-lantern-ask', done: 'hoot-lantern-give', gives: 'moon-lantern' },
      { npc: 'nyx', kind: 'bring', item: 'moon-lantern', wait: 'nyx-favor-wait', done: 'nyx-favor-thanks' },
    ],
    stardust: 25,
  },
];
