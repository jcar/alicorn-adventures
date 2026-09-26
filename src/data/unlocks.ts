/**
 * Stardust is never spent. It fills a jar forever, and unlocks pop out
 * when the jar reaches a goal, so nothing a child earns can be lost.
 */
export type UnlockKind = 'mane' | 'trail' | 'accessory' | 'area' | 'decoration';

export interface Unlock {
  id: string;
  kind: UnlockKind;
  /** Cosmetic, area, or decoration id this unlock grants. */
  target: string;
  name: string;
  /** Total stardust collected (ever) needed. */
  stardust?: number;
  /** Friends that must have been helped. */
  friends?: string[];
}

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

  // Helping friends opens the forest.
  { id: 'area-meadow', kind: 'area', target: 'meadow', name: 'Mushroom Meadow', friends: ['bunny'] },
  { id: 'area-waterfall', kind: 'area', target: 'waterfall', name: 'Crystal Waterfall', friends: ['fox'] },
  { id: 'area-clouds', kind: 'area', target: 'clouds', name: 'Rainbow Cloud Kingdom', friends: ['owl'] },
  { id: 'deco-flowers', kind: 'decoration', target: 'flowers', name: 'Flower garden', friends: ['bunny', 'fox'] },

  // The grand finale: everyone is friends.
  { id: 'mane-rainbow', kind: 'mane', target: 'rainbow', name: 'Rainbow mane', friends: ['bunny', 'fox', 'owl', 'dragon'] },
  { id: 'trail-rainbow', kind: 'trail', target: 'rainbow', name: 'Rainbow trail', friends: ['bunny', 'fox', 'owl', 'dragon'] },
];
