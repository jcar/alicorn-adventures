export type FriendRequest =
  | { kind: 'fetch'; item: 'carrot' | 'berry'; count: number }
  | { kind: 'wake' }
  | { kind: 'bloom' };

export interface FriendDef {
  id: string;
  name: string;
  texture: string;
  request: FriendRequest;
  lines: { ask: string; progress?: string; hint?: string; thanks: string };
  /** Where this friend lives in the Home Glade after being helped. */
  gladeX: number;
}

export const FRIENDS: FriendDef[] = [
  {
    id: 'bunny',
    name: 'Bunny',
    texture: 'friend-bunny',
    request: { kind: 'fetch', item: 'carrot', count: 3 },
    lines: { ask: 'bunny-ask', progress: 'bunny-progress', thanks: 'bunny-thanks' },
    gladeX: 620,
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
    gladeX: 1300,
  },
  {
    id: 'dragon',
    name: 'Baby Dragon',
    texture: 'friend-dragon',
    request: { kind: 'bloom' },
    lines: { ask: 'dragon-ask', progress: 'dragon-progress', thanks: 'dragon-thanks' },
    gladeX: 1640,
  },
];

export const findFriend = (id: string) => FRIENDS.find((f) => f.id === id);
