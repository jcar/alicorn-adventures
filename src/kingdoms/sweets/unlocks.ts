import type { Unlock } from '../../core/content/types';

export const UNLOCKS: Unlock[] = [
  { id: 'area-lollipop', kind: 'area', target: 'lollipop', name: 'Lollipop Lane', friends: ['tide'] },
  { id: 'area-gumdrop', kind: 'area', target: 'gumdrop', name: 'Gumdrop Caves', friends: ['bea'] },
  { id: 'area-chocolate', kind: 'area', target: 'chocolate', name: 'Chocolate River', friends: ['millie'] },
  { id: 'area-cottoncandy', kind: 'area', target: 'cottoncandy', name: 'Cotton Candy Clouds', friends: ['duck'] },
  { id: 'power-shrink', kind: 'power', target: 'shrink', name: 'Shrink power', friends: ['bea'] },
  { id: 'power-fizz', kind: 'power', target: 'fizz', name: 'Fizz Pop power', friends: ['fluff'] },
  { id: 'sticker-cupcake', kind: 'sticker', target: 'item-cupcake', name: "Bea's cupcake sum", flags: ['favor:cupcake-count'], hint: 'Help Bea count cupcakes in your Glade' },
  { id: 'sticker-hot-cocoa', kind: 'sticker', target: 'item-hot-cocoa', name: 'Hot cocoa for Fluff', flags: ['favor:hot-cocoa'], hint: "Ask Millie for the cocoa recipe, for Fluff" },
  { id: 'acc-sugarcrown', kind: 'accessory', target: 'sugarcrown', name: 'Sugar Crown', flags: ['star:sweets'], hint: 'Bring Sol home to the candy altar' },
  { id: 'mane-candy', kind: 'mane', target: 'candy', name: 'Candy Swirl mane', flags: ['star:sweets'], hint: 'Bring Sol home to the candy altar' },
  { id: 'trail-sprinkles', kind: 'trail', target: 'sprinkles', name: 'Sprinkles trail', gold: 24 },
];
