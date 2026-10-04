import type { FriendDef } from '../../core/content/types';

export const FRIENDS: FriendDef[] = [
  {
    id: 'bea', name: 'Bea', texture: 'friend-bea',
    request: { kind: 'recipe', items: [{ item: 'strawberry', count: 3 }, { item: 'lemon', count: 2 }, { item: 'egg', count: 1 }] },
    lines: { ask: 'bea-ask', progress: 'bea-progress', hint: 'bea-hint', thanks: 'bea-thanks' },
    gladeX: 4370,
  },
  {
    id: 'millie', name: 'Millie', texture: 'friend-millie',
    request: { kind: 'fetch', item: 'button', count: 3 },
    lines: { ask: 'millie-ask', progress: 'millie-progress', hint: 'millie-hint', thanks: 'millie-thanks' },
    gladeX: 4640,
  },
  {
    id: 'duck', name: 'Duck', texture: 'friend-duck',
    request: { kind: 'fetch', item: 'cocoa', count: 3 },
    lines: { ask: 'duck-ask', progress: 'duck-progress', hint: 'duck-hint', thanks: 'duck-thanks' },
    gladeX: 4910,
  },
  {
    id: 'fluff', name: 'Fluff', texture: 'friend-fluff',
    request: { kind: 'fetch', item: 'wool', count: 5 },
    lines: { ask: 'fluff-ask', progress: 'fluff-progress', thanks: 'fluff-thanks' },
    gladeX: 5180,
  },
];
