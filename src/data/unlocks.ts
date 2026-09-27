/**
 * Stardust is never spent. It fills a jar forever, and unlocks pop out
 * when the jar reaches a goal, so nothing a child earns can be lost.
 */
export type UnlockKind = 'mane' | 'trail' | 'accessory' | 'area' | 'decoration' | 'power' | 'sticker';

export interface Unlock {
  id: string;
  kind: UnlockKind;
  /** Cosmetic, area, power or decoration id (or a sticker's texture). */
  target: string;
  name: string;
  /** Total stardust collected (ever) needed. */
  stardust?: number;
  /** Friends that must have been helped. */
  friends?: string[];
  /** Golden stars that must have been found. */
  gold?: number;
  /** Story flags that must be set, e.g. a finished favor. */
  flags?: string[];
  /** How to earn it, in words, for anything unlocked by `flags`. */
  hint?: string;
}

const EVERYONE = ['bunny', 'fox', 'owl', 'dragon'];

export const UNLOCKS: Unlock[] = [
  // Starting kit: free from the first moment.
  { id: 'mane-pink', kind: 'mane', target: 'pink', name: 'Bubblegum Pink mane' },
  { id: 'trail-none', kind: 'trail', target: 'none', name: 'No trail' },
  { id: 'trail-sparkle', kind: 'trail', target: 'sparkle', name: 'Sparkle trail' },
  { id: 'acc-none', kind: 'accessory', target: 'none', name: 'No hat' },
  { id: 'area-woods', kind: 'area', target: 'woods', name: 'Whispering Woods' },

  // Stardust goals.
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

  // Each friend teaches a power.
  { id: 'power-sniff', kind: 'power', target: 'sniff', name: 'Sniff power', friends: ['bunny'] },
  { id: 'power-dash', kind: 'power', target: 'dash', name: 'Dash power', friends: ['fox'] },
  { id: 'power-glow', kind: 'power', target: 'glow', name: 'Glow power', friends: ['owl'] },
  { id: 'power-warmth', kind: 'power', target: 'warmth', name: 'Warm Breath power', friends: ['dragon'] },

  // Helping friends opens the forest.
  { id: 'area-meadow', kind: 'area', target: 'meadow', name: 'Mushroom Meadow', friends: ['bunny'] },
  { id: 'area-waterfall', kind: 'area', target: 'waterfall', name: 'Crystal Waterfall', friends: ['fox'] },
  { id: 'area-clouds', kind: 'area', target: 'clouds', name: 'Rainbow Cloud Kingdom', friends: ['owl'] },
  { id: 'area-frost', kind: 'area', target: 'frost', name: 'Frosty Peaks', friends: ['dragon'] },
  { id: 'deco-flowers', kind: 'decoration', target: 'flowers', name: 'Flower garden', friends: ['bunny', 'fox'] },

  // Golden stars hide in the trickiest places.
  { id: 'trail-golden', kind: 'trail', target: 'golden', name: 'Golden Star trail', gold: 3 },
  { id: 'mane-starlight', kind: 'mane', target: 'starlight', name: 'Starlight mane', gold: 6 },
  { id: 'trail-superstar', kind: 'trail', target: 'superstar', name: 'Superstar trail', gold: 10 },

  // Favors between friends.
  { id: 'sticker-berries', kind: 'sticker', target: 'item-berry', name: "Fox's berry sum", flags: ['favor:berries'], hint: 'Help Fox count berries in your Glade' },
  { id: 'sticker-lantern', kind: 'sticker', target: 'item-lantern', name: "Fox's cozy lantern", flags: ['favor:lantern'], hint: "Get Owl's lantern for Fox" },
  { id: 'sticker-shell', kind: 'sticker', target: 'item-shell', name: "Dragon's Moon Shell", flags: ['favor:shell'], hint: 'Find a Moon Shell for Baby Dragon' },

  // Everyone is friends.
  { id: 'mane-rainbow', kind: 'mane', target: 'rainbow', name: 'Rainbow mane', friends: EVERYONE },
  { id: 'trail-rainbow', kind: 'trail', target: 'rainbow', name: 'Rainbow trail', friends: EVERYONE },

  // The big mystery.
  { id: 'acc-tiara', kind: 'accessory', target: 'tiara', name: 'Star Tiara', flags: ['mystery:solved'], hint: 'Solve the mystery of the Heart Crystal' },
];
