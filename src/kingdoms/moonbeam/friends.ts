import type { FriendDef } from '../../core/content/types';

export const FRIENDS: FriendDef[] = [
  {
    id: 'nyx', name: 'Nyx', texture: 'friend-nyx',
    request: { kind: 'solve', puzzles: ['starlit-stars-1', 'starlit-stars-2', 'starlit-stars-3'] },
    lines: { ask: 'nyx-ask', progress: 'nyx-progress', hint: 'nyx-hint', thanks: 'nyx-thanks' },
    gladeX: 5450,
  },
  {
    id: 'selene', name: 'Selene', texture: 'friend-selene',
    request: { kind: 'fetch', item: 'feather', count: 4 },
    lines: { ask: 'selene-ask', progress: 'selene-progress', hint: 'selene-hint', thanks: 'selene-thanks' },
    gladeX: 5720,
  },
  {
    id: 'hoot', name: 'Professor Hoot', texture: 'friend-hoot',
    request: { kind: 'fetch', item: 'book', count: 3 },
    lines: { ask: 'hoot-ask', progress: 'hoot-progress', hint: 'hoot-hint', thanks: 'hoot-thanks' },
    gladeX: 5990,
  },
  {
    id: 'mochi', name: 'Mochi', texture: 'friend-mochi',
    request: { kind: 'fetch', item: 'moonstone', count: 4 },
    lines: { ask: 'mochi-ask', progress: 'mochi-progress', hint: 'mochi-hint', thanks: 'mochi-thanks' },
    gladeX: 6260,
  },
];
