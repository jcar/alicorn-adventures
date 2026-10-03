import type { Unlock } from '../../core/content/types';

export const UNLOCKS: Unlock[] = [
  { id: 'area-shallows', kind: 'area', target: 'shallows', name: 'Sunny Shallows', friends: ['pip'] },
  { id: 'area-kelp', kind: 'area', target: 'kelp', name: 'Kelp Forest', friends: ['marina'] },
  { id: 'area-ship', kind: 'area', target: 'ship', name: 'Sunken Ship', friends: ['otto'] },
  { id: 'area-trench', kind: 'area', target: 'trench', name: 'Moonlit Trench', friends: ['crab'] },
  { id: 'power-jet', kind: 'power', target: 'jet', name: 'Bubble Jet power', friends: ['marina'] },
  { id: 'power-song', kind: 'power', target: 'song', name: 'Shell Song power', friends: ['tide'] },
  { id: 'sticker-pearls', kind: 'sticker', target: 'item-pearl', name: "Marina's pearl sum", flags: ['favor:pearl-count'], hint: 'Help Marina count pearls in your Glade' },
  { id: 'sticker-treasure-map', kind: 'sticker', target: 'item-treasure-map', name: "Captain Crab's treasure map", flags: ['favor:treasure-map'], hint: "Get Otto's old map for Captain Crab" },
  { id: 'acc-shellcrown', kind: 'accessory', target: 'shellcrown', name: 'Sea Shell Crown', flags: ['star:coral'], hint: 'Bring Luma home to the sea altar' },
  { id: 'mane-ocean', kind: 'mane', target: 'ocean', name: 'Ocean mane', flags: ['star:coral'], hint: 'Bring Luma home to the sea altar' },
  { id: 'trail-tides', kind: 'trail', target: 'tides', name: 'Tide Bubbles trail', gold: 15 },
];
