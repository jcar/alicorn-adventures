import type { FriendDef } from '../../core/content/types';

export const FRIENDS: FriendDef[] = [
  {
    id: 'bunny',
    name: 'Bunny',
    texture: 'friend-bunny',
    request: { kind: 'fetch', item: 'carrot', count: 3 },
    lines: { ask: 'bunny-ask', progress: 'bunny-progress', thanks: 'bunny-thanks' },
    gladeX: 640,
  },
  {
    id: 'fox',
    name: 'Fox',
    texture: 'friend-fox',
    request: { kind: 'fetch', item: 'berry', count: 4 },
    lines: { ask: 'fox-ask', progress: 'fox-progress', thanks: 'fox-thanks' },
    gladeX: 960,
  },
  {
    id: 'owl',
    name: 'Owl',
    texture: 'friend-owl',
    request: { kind: 'wake' },
    lines: { ask: 'owl-ask', hint: 'owl-hint', thanks: 'owl-thanks' },
    gladeX: 1280,
  },
  {
    id: 'dragon',
    name: 'Baby Dragon',
    texture: 'friend-dragon',
    request: { kind: 'bloom' },
    lines: { ask: 'dragon-ask', progress: 'dragon-progress', thanks: 'dragon-thanks' },
    gladeX: 1600,
  },
  {
    id: 'pip',
    name: 'Pip',
    texture: 'friend-pip',
    request: { kind: 'found' },
    lines: { ask: 'pip-found', thanks: 'pip-thanks' },
    gladeX: 2730,
  },
];

