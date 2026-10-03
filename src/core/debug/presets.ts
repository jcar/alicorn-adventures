import { AREA_ORDER, LEVELS } from '../content';
import { FAVORS } from '../content';
import { freshSave, type SaveData } from '../systems/SaveManager';
import { grantUnlocks } from '../systems/UnlockManager';

/**
 * Ready-made saves for testing any part of the story without playing up
 * to it. Pure data, so tests and the playtest bot can use them too.
 */
const FRIEND_ORDER = ['bunny', 'fox', 'owl', 'dragon', 'pip'];

function withFriends(n: number, extra: Partial<SaveData> = {}): SaveData {
  const s: SaveData = { ...freshSave(), name: 'Tester', friendsHelped: FRIEND_ORDER.slice(0, n), visited: AREA_ORDER.slice(0, n), ...extra };
  grantUnlocks(s);
  s.pendingCelebrations = [];
  return s;
}

/** Every secret, golden star, spark, puzzle, melted wall and favor in the game. */
function everythingFound(): string[] {
  const flags: string[] = [];
  for (const L of Object.values(LEVELS)) {
    for (const c of L.chests ?? []) flags.push(`secret:${c.id}`);
    for (const n of L.notes ?? []) if (n.secret) flags.push(`secret:${n.id}`);
    for (const g of L.golds ?? []) flags.push(`gold:${g.id}`);
    for (const g of L.gates ?? []) flags.push(`puzzle:${g.id}`);
    for (const p of L.patterns ?? []) flags.push(`puzzle:${p.id}`);
    for (const i of L.ice ?? []) flags.push(`melted:${i.id}`);
  }
  for (const a of AREA_ORDER) flags.push(`spark:${a}`);
  for (const f of FAVORS) flags.push(`favor:${f.id}`);
  return flags;
}

export const PRESETS: Record<string, () => SaveData> = {
  fresh: () => ({ ...freshSave(), name: 'Tester' }),
  'woods-done': () => withFriends(1),
  'meadow-done': () => withFriends(2),
  'waterfall-done': () => withFriends(3),
  /** All four powers, Frosty Peaks open, Pip not found yet. */
  'all-powers': () => withFriends(4, { stardust: 120 }),
  /** Everything except the Heart Crystal finale: press ↓ at the crystal to see it. */
  'ready-for-finale': () => withFriends(5, { stardust: 400, flags: everythingFound().filter((f) => f !== 'mystery:solved') }),
  /** The whole forest finished, like a child who has played it all. */
  'forest-done': () => {
    const s = withFriends(5, { stardust: 420, flags: [...everythingFound(), 'mystery:solved'], favors: Object.fromEntries(FAVORS.map((f) => [f.id, f.steps.length])) });
    grantUnlocks(s);
    s.pendingCelebrations = [];
    return s;
  },
};
