/**
 * Favors are little errands between friends who live in the Home Glade.
 * Steps happen in order; each step belongs to one friend.
 *   talk:   they say `line`, and the favor moves on.
 *   puzzle: they ask a riddle or number question (from puzzles.ts).
 *   bring:  they need `item`. `wait` is said until you have it.
 * Items are flags like "has:lantern", given by puzzles or found in the world.
 */
export type FavorStep =
  | { npc: string; kind: 'talk'; line: string }
  | { npc: string; kind: 'puzzle'; puzzle: string; line: string; done: string; gives?: string }
  | { npc: string; kind: 'bring'; item: string; wait: string; done: string };

export interface FavorDef {
  id: string;
  /** Friends who must have moved into the Glade first. */
  needs: string[];
  steps: FavorStep[];
  stardust: number;
}

export const FAVORS: FavorDef[] = [
  {
    id: 'berries',
    needs: ['fox'],
    steps: [{ npc: 'fox', kind: 'puzzle', puzzle: 'fox-math', line: 'fox-math-ask', done: 'fox-math-thanks' }],
    stardust: 10,
  },
  {
    id: 'lantern',
    needs: ['fox', 'owl'],
    steps: [
      { npc: 'fox', kind: 'talk', line: 'fox-favor-ask' },
      { npc: 'owl', kind: 'puzzle', puzzle: 'owl-riddle', line: 'owl-favor-ask', done: 'owl-favor-give', gives: 'lantern' },
      { npc: 'fox', kind: 'bring', item: 'lantern', wait: 'fox-favor-wait', done: 'fox-favor-thanks' },
    ],
    stardust: 15,
  },
  {
    id: 'shell',
    needs: ['bunny', 'dragon'],
    steps: [
      { npc: 'dragon', kind: 'talk', line: 'dragon-favor-ask' },
      { npc: 'bunny', kind: 'puzzle', puzzle: 'bunny-riddle', line: 'bunny-favor-ask', done: 'bunny-favor-hint' },
      { npc: 'dragon', kind: 'bring', item: 'moon-shell', wait: 'dragon-favor-wait', done: 'dragon-favor-thanks' },
    ],
    stardust: 15,
  },
];
