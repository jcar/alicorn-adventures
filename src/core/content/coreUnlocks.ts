import type { Unlock } from './types';

/**
 * Unlocks that belong to the whole game, not one kingdom: the starting
 * kit, stardust goals and golden-star goals. Kingdom packs add their own.
 */
export const CORE_UNLOCKS: Unlock[] = [
  { id: 'mane-pink', kind: 'mane', target: 'pink', name: 'Bubblegum Pink mane' },
  { id: 'trail-none', kind: 'trail', target: 'none', name: 'No trail' },
  { id: 'trail-sparkle', kind: 'trail', target: 'sparkle', name: 'Sparkle trail' },
  { id: 'acc-none', kind: 'accessory', target: 'none', name: 'No hat' },
  { id: 'mane-purple', kind: 'mane', target: 'purple', name: 'Lilac Dream mane', stardust: 15 },
  { id: 'acc-bow', kind: 'accessory', target: 'bow', name: 'Big Bow', stardust: 30 },
  { id: 'trail-hearts', kind: 'trail', target: 'hearts', name: 'Heart trail', stardust: 50 },
  { id: 'mane-blue', kind: 'mane', target: 'blue', name: 'Sky Blue mane', stardust: 75 },
  { id: 'deco-lanterns', kind: 'decoration', target: 'lanterns', name: 'Glowing lanterns', stardust: 100 },
  { id: 'acc-crown', kind: 'accessory', target: 'crown', name: 'Flower Crown', stardust: 130 },
  { id: 'trail-bubbles', kind: 'trail', target: 'bubbles', name: 'Bubble trail', stardust: 160 },
  { id: 'mane-gold', kind: 'mane', target: 'gold', name: 'Sunny Gold mane', stardust: 200 },
  { id: 'mane-mint', kind: 'mane', target: 'mint', name: 'Minty Green mane', stardust: 250 },
  { id: 'acc-saddle', kind: 'accessory', target: 'saddle', name: 'Sparkly Saddle', stardust: 300 },
  { id: 'trail-golden', kind: 'trail', target: 'golden', name: 'Golden Star trail', gold: 3 },
  { id: 'mane-starlight', kind: 'mane', target: 'starlight', name: 'Starlight mane', gold: 6 },
  { id: 'trail-superstar', kind: 'trail', target: 'superstar', name: 'Superstar trail', gold: 10 },
];
