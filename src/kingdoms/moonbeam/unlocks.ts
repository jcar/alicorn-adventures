import type { Unlock } from '../../core/content/types';

export const UNLOCKS: Unlock[] = [
  { id: 'area-starlit', kind: 'area', target: 'starlit', name: 'Starlit Meadow', friends: ['fluff'] },
  { id: 'area-mirror', kind: 'area', target: 'mirror', name: 'Mirror Lake', friends: ['nyx'] },
  { id: 'area-library', kind: 'area', target: 'library', name: 'Lantern Library', friends: ['selene'] },
  { id: 'area-palace', kind: 'area', target: 'palace', name: 'Moon Palace', friends: ['hoot'] },
  { id: 'power-moon', kind: 'power', target: 'moon', name: 'Moon Phase power', friends: ['nyx'] },
  { id: 'sticker-book', kind: 'sticker', target: 'item-book', name: "Professor Hoot's story", flags: ['favor:hoot-story'], hint: 'Answer Professor Hoot\'s question in your Glade' },
  { id: 'sticker-moon-lantern', kind: 'sticker', target: 'item-moon-lantern', name: 'A moon lantern for Nyx', flags: ['favor:moon-lantern'], hint: "Get Professor Hoot's moon lantern for Nyx" },
  { id: 'mane-moonlight', kind: 'mane', target: 'moonlight', name: 'Moonlight mane', flags: ['star:moonbeam'], hint: "Bring Pip's mama and papa home" },
  { id: 'acc-mooncrown', kind: 'accessory', target: 'mooncrown', name: 'Moon Crown', flags: ['family:home'], hint: "Bring Pip's whole family home" },
  { id: 'trail-starfall', kind: 'trail', target: 'starfall', name: 'Starfall trail', flags: ['family:home'], hint: "Bring Pip's whole family home" },
];
