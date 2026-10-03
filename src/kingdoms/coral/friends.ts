import type { FriendDef } from '../../core/content/types';

export const FRIENDS: FriendDef[] = [
  {
    id: 'marina', name: 'Marina', texture: 'friend-marina',
    request: { kind: 'fetch', item: 'pearl', count: 4 },
    lines: { ask: 'marina-ask', progress: 'marina-progress', thanks: 'marina-thanks' },
    gladeX: 3250,
  },
  {
    id: 'otto', name: 'Otto', texture: 'friend-otto',
    request: { kind: 'bloom' },
    lines: { ask: 'otto-ask', progress: 'otto-progress', thanks: 'otto-thanks' },
    gladeX: 3520,
  },
  {
    id: 'crab', name: 'Captain Crab', texture: 'friend-crab',
    request: { kind: 'fetch', item: 'key', count: 1 },
    lines: { ask: 'crab-ask', progress: 'crab-progress', thanks: 'crab-thanks' },
    gladeX: 3790,
  },
  {
    id: 'tide', name: 'Grandma Tide', texture: 'friend-tide',
    request: { kind: 'wake' },
    lines: { ask: 'tide-ask', hint: 'tide-hint', thanks: 'tide-thanks' },
    gladeX: 4080,
  },
];
