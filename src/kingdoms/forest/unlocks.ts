import type { Unlock } from '../../core/content/types';

const EVERYONE = ['bunny', 'fox', 'owl', 'dragon'];

export const UNLOCKS: Unlock[] = [
  { id: 'area-woods', kind: 'area', target: 'woods', name: 'Whispering Woods' },
  { id: 'power-sniff', kind: 'power', target: 'sniff', name: 'Sniff power', friends: ['bunny'] },
  { id: 'power-dash', kind: 'power', target: 'dash', name: 'Dash power', friends: ['fox'] },
  { id: 'power-glow', kind: 'power', target: 'glow', name: 'Glow power', friends: ['owl'] },
  { id: 'power-warmth', kind: 'power', target: 'warmth', name: 'Warm Breath power', friends: ['dragon'] },
  { id: 'area-meadow', kind: 'area', target: 'meadow', name: 'Mushroom Meadow', friends: ['bunny'] },
  { id: 'area-waterfall', kind: 'area', target: 'waterfall', name: 'Crystal Waterfall', friends: ['fox'] },
  { id: 'area-clouds', kind: 'area', target: 'clouds', name: 'Rainbow Cloud Kingdom', friends: ['owl'] },
  { id: 'area-frost', kind: 'area', target: 'frost', name: 'Frosty Peaks', friends: ['dragon'] },
  { id: 'deco-flowers', kind: 'decoration', target: 'flowers', name: 'Flower garden', friends: ['bunny', 'fox'] },
  { id: 'sticker-berries', kind: 'sticker', target: 'item-berry', name: "Fox's berry sum", flags: ['favor:berries'], hint: 'Help Fox count berries in your Glade' },
  { id: 'sticker-lantern', kind: 'sticker', target: 'item-lantern', name: "Fox's cozy lantern", flags: ['favor:lantern'], hint: "Get Owl's lantern for Fox" },
  { id: 'sticker-shell', kind: 'sticker', target: 'item-shell', name: "Dragon's Moon Shell", flags: ['favor:shell'], hint: 'Find a Moon Shell for Baby Dragon' },
  { id: 'mane-rainbow', kind: 'mane', target: 'rainbow', name: 'Rainbow mane', friends: EVERYONE },
  { id: 'trail-rainbow', kind: 'trail', target: 'rainbow', name: 'Rainbow trail', friends: EVERYONE },
  { id: 'acc-tiara', kind: 'accessory', target: 'tiara', name: 'Star Tiara', flags: ['mystery:solved'], hint: 'Solve the mystery of the Heart Crystal' },
];
