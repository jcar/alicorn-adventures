import { FAVORS, KINGDOMS, type KingdomDef } from '../content';
import { freshSave, type SaveData } from '../systems/SaveManager';
import { grantUnlocks } from '../systems/UnlockManager';
import { defaultSkills } from '../puzzles/engine';

/**
 * Ready-made saves for testing any part of the story without playing up
 * to it. Pure data, so tests and the playtest bot can use them too.
 */
const kingdom = (id: string) => KINGDOMS.find((k) => k.id === id)!;
const friendsOf = (k: KingdomDef) => k.areaOrder.map((a) => k.areas[a].friend?.id).filter((f): f is string => !!f);

/** Every secret, golden star, spark, puzzle, opened wall and favor in these kingdoms. */
function everythingIn(...kingdoms: KingdomDef[]): string[] {
  const flags: string[] = [];
  for (const k of kingdoms) {
    for (const L of Object.values(k.areas)) {
      for (const c of L.chests ?? []) flags.push(`secret:${c.id}`);
      for (const n of L.notes ?? []) if (n.secret) flags.push(`secret:${n.id}`);
      for (const g of L.golds ?? []) flags.push(`gold:${g.id}`);
      for (const g of L.gates ?? []) flags.push(`puzzle:${g.id}`);
      for (const p of L.patterns ?? []) flags.push(`puzzle:${p.id}`);
      for (const i of L.ice ?? []) flags.push(`melted:${i.id}`);
      for (const w of L.walls ?? []) flags.push(`opened:${w.id}`);
      for (const c of L.ceilings ?? []) flags.push(`opened:${c.id}`);
      for (const d of L.doors ?? []) flags.push(`opened:${d.id}`, `has:${d.item}`);
      for (const c of L.constellations ?? []) flags.push(`puzzle:${c.id}`);
      for (const d of L.lanternDoors ?? []) flags.push(`opened:${d.id}`);
    }
    for (const a of k.areaOrder) flags.push(`spark:${a}`);
    const friends = friendsOf(k);
    for (const f of FAVORS) if (f.needs.every((n) => friends.includes(n))) flags.push(`favor:${f.id}`);
    if (k.saga) flags.push(k.saga.flag, `saga:news:${k.id}`);
  }
  return flags;
}

function save(friends: string[], extra: Partial<SaveData> = {}): SaveData {
  const s: SaveData = { ...freshSave(), name: 'Tester', friendsHelped: friends, visited: [], skills: defaultSkills(friends.length >= 4), ...extra };
  grantUnlocks(s);
  s.pendingCelebrations = [];
  return s;
}

const forest = () => kingdom('forest');
const forestFriends = () => friendsOf(forest());
const favorsDone = (flags: string[]) => Object.fromEntries(FAVORS.filter((f) => flags.includes(`favor:${f.id}`)).map((f) => [f.id, f.steps.length]));

export const PRESETS: Record<string, () => SaveData> = {
  fresh: () => ({ ...freshSave(), name: 'Tester' }),
  'woods-done': () => save(forestFriends().slice(0, 1)),
  'meadow-done': () => save(forestFriends().slice(0, 2)),
  'waterfall-done': () => save(forestFriends().slice(0, 3)),
  /** All four forest powers, Frosty Peaks open, Pip not found yet. */
  'all-powers': () => save(forestFriends().slice(0, 4), { stardust: 120 }),
  /** Everything in the forest except the Heart Crystal finale: press ↓ at the crystal to see it. */
  'ready-for-finale': () => save(forestFriends(), { stardust: 400, flags: everythingIn(forest()).filter((f) => f !== 'mystery:solved') }),
  /** The whole forest finished, like a child who has played it all. The Coral Kingdom is open. */
  'forest-done': () => {
    const flags = [...everythingIn(forest()), 'mystery:solved', 'saga:intro'];
    return save(forestFriends(), { stardust: 420, flags, favors: favorsDone(flags) });
  },
  /** Forest done, plus every Coral friend helped; Luma's shards still to find. */
  'coral-friends': () => {
    const flags = [...everythingIn(forest()), 'mystery:solved', 'saga:intro'];
    return save([...forestFriends(), ...friendsOf(kingdom('coral'))], { stardust: 520, flags, favors: favorsDone(flags) });
  },
  /** Forest and Coral finished (Luma restored): Sweet Treat Valley is open, nothing there done yet. */
  'coral-done': () => {
    const flags = [...everythingIn(forest(), kingdom('coral')), 'mystery:solved', 'saga:intro'];
    return save([...forestFriends(), ...friendsOf(kingdom('coral'))], { stardust: 560, flags, favors: favorsDone(flags) });
  },
  /** Coral done, plus every Sweet Treat Valley friend helped (all powers); Sol's sparkles still to find. */
  'sweets-friends': () => {
    const flags = [...everythingIn(forest(), kingdom('coral')), 'mystery:solved', 'saga:intro'];
    return save([...forestFriends(), ...friendsOf(kingdom('coral')), ...friendsOf(kingdom('sweets'))], { stardust: 640, flags, favors: favorsDone(flags) });
  },
  /** Forest, Coral and Sweets finished (Sol restored): the Moonbeam Kingdom is open. */
  'sweets-done': () => {
    const flags = [...everythingIn(forest(), kingdom('coral'), kingdom('sweets')), 'mystery:solved', 'saga:intro'];
    return save(['forest', 'coral', 'sweets'].flatMap((k) => friendsOf(kingdom(k))), { stardust: 700, flags, favors: favorsDone(flags) });
  },
  /** Sweets done, plus every Moonbeam friend helped; Mama and Papa's shards still to find. */
  'moonbeam-friends': () => {
    const flags = [...everythingIn(forest(), kingdom('coral'), kingdom('sweets')), 'mystery:solved', 'saga:intro'];
    return save(KINGDOMS.flatMap(friendsOf), { stardust: 800, flags, favors: favorsDone(flags) });
  },
  /** Every Guardian Star restored; walk up to Pip in the Glade for the family reunion. */
  'ready-for-family': () => {
    const flags = [...everythingIn(...KINGDOMS), 'mystery:solved', 'saga:intro'];
    return save(KINGDOMS.flatMap(friendsOf), { stardust: 900, flags, favors: favorsDone(flags) });
  },
  /** Everything everywhere, reunion included. */
  'all-done': () => {
    const flags = [...everythingIn(...KINGDOMS), 'mystery:solved', 'saga:intro', 'family:home'];
    return save(KINGDOMS.flatMap(friendsOf), { stardust: 700, flags, favors: favorsDone(flags) });
  },
};
