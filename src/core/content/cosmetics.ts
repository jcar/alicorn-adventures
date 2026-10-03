export interface ManeColor {
  id: string;
  name: string;
  /** Main mane color (used by placeholder art and UI swatches). */
  color: number;
  /** Second color for streaky manes. */
  accent: number;
}

export interface Trail {
  id: string;
  name: string;
  texture: string;
  tints: number[];
}

export interface Accessory {
  id: string;
  name: string;
  texture: string;
  /** Offset from the alicorn's center, facing right, in pixels. */
  offsetX: number;
  offsetY: number;
}

export const MANES: ManeColor[] = [
  { id: 'pink', name: 'Bubblegum Pink', color: 0xff7eb9, accent: 0xffc2de },
  { id: 'purple', name: 'Lilac Dream', color: 0xa77bff, accent: 0xd9c6ff },
  { id: 'blue', name: 'Sky Blue', color: 0x5ec8ff, accent: 0xbfeaff },
  { id: 'gold', name: 'Sunny Gold', color: 0xffc93c, accent: 0xfff0b3 },
  { id: 'mint', name: 'Minty Green', color: 0x5fe0a8, accent: 0xc4f7df },
  { id: 'rainbow', name: 'Rainbow', color: 0xff5e7e, accent: 0x7ed6ff },
  { id: 'starlight', name: 'Starlight', color: 0xdfe8ff, accent: 0xffffff },
  { id: 'ocean', name: 'Ocean', color: 0x2fc8c8, accent: 0xbff4f0 },
];

export const TRAILS: Trail[] = [
  { id: 'none', name: 'No Trail', texture: 'fx-dot', tints: [0xffffff] },
  { id: 'sparkle', name: 'Sparkles', texture: 'fx-star', tints: [0xfff6a0, 0xffffff] },
  { id: 'hearts', name: 'Hearts', texture: 'fx-heart', tints: [0xff7eb9, 0xff4f8b] },
  { id: 'bubbles', name: 'Bubbles', texture: 'fx-bubble', tints: [0xbfeaff, 0xffffff] },
  { id: 'rainbow', name: 'Rainbow', texture: 'fx-dot', tints: [0xff5e5e, 0xffa24c, 0xffe14c, 0x6fe36f, 0x5ec8ff, 0xa77bff] },
  { id: 'golden', name: 'Golden Stars', texture: 'fx-star', tints: [0xffd23c, 0xffb31a, 0xfff2a8] },
  { id: 'superstar', name: 'Superstar', texture: 'fx-star', tints: [0xff5e5e, 0xffa24c, 0xffe14c, 0x6fe36f, 0x5ec8ff, 0xa77bff, 0xffffff] },
  { id: 'tides', name: 'Tide Bubbles', texture: 'fx-bubble', tints: [0x5ec8ff, 0x7fe0d6, 0xffffff] },
];

export const ACCESSORIES: Accessory[] = [
  { id: 'none', name: 'Nothing', texture: '', offsetX: 0, offsetY: 0 },
  { id: 'bow', name: 'Big Bow', texture: 'acc-bow', offsetX: 30, offsetY: -42 },
  { id: 'crown', name: 'Flower Crown', texture: 'acc-crown', offsetX: 42, offsetY: -44 },
  { id: 'saddle', name: 'Sparkly Saddle', texture: 'acc-saddle', offsetX: -4, offsetY: -6 },
  { id: 'tiara', name: 'Star Tiara', texture: 'acc-tiara', offsetX: 40, offsetY: -46 },
  { id: 'shellcrown', name: 'Sea Shell Crown', texture: 'acc-shellcrown', offsetX: 40, offsetY: -46 },
];

export const findMane = (id: string) => MANES.find((m) => m.id === id) ?? MANES[0];
export const findTrail = (id: string) => TRAILS.find((t) => t.id === id) ?? TRAILS[0];
export const findAccessory = (id: string) => ACCESSORIES.find((a) => a.id === id) ?? ACCESSORIES[0];
