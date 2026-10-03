import { describe, expect, it } from 'vitest';
import { MAX_PROFILES, PROFILES_KEY, SAVE_KEY, SAVE_VERSION, SaveManager, freshSave, migrate } from '../src/core/systems/SaveManager';

function memoryStorage(initial: Record<string, string> = {}) {
  const m = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    raw: m,
  };
}

// ---- Fixtures: what real saves looked like in each older version.
const V1_MID = { version: 1, name: 'Luna', stardust: 64, friendsHelped: ['bunny', 'fox'], unlocked: ['mane-pink', 'mane-purple', 'acc-bow', 'area-woods', 'area-meadow'], equipped: { mane: 'purple', trail: 'sparkle', accessory: 'bow' }, pendingCelebrations: [] };
const V2_FRESH = { version: 2, name: '', stardust: 0, friendsHelped: [], unlocked: [], equipped: { mane: 'pink', trail: 'sparkle', accessory: 'none' }, pendingCelebrations: [], flags: [], favors: {}, visited: [] };
const V2_FINISHED = {
  version: 2, name: 'Sparkle', stardust: 431,
  friendsHelped: ['bunny', 'fox', 'owl', 'dragon', 'pip'],
  unlocked: ['mane-pink', 'trail-none', 'trail-sparkle', 'acc-none', 'area-woods', 'mane-purple', 'acc-bow', 'power-sniff', 'area-meadow', 'mane-starlight', 'acc-tiara'],
  equipped: { mane: 'starlight', trail: 'superstar', accessory: 'tiara' },
  pendingCelebrations: ['trail-superstar'],
  flags: ['secret:note-1', 'gold:woods-gold-1', 'spark:woods', 'spark:frost', 'puzzle:woods-gate', 'melted:woods-ice', 'gave:lantern', 'favor:lantern', 'mystery:solved'],
  favors: { berries: 1, lantern: 3, shell: 3 },
  visited: ['woods', 'meadow', 'waterfall', 'clouds', 'frost'],
};

describe('migrating old saves (nothing earned is ever lost)', () => {
  for (const [label, old] of [['v1 mid-game', V1_MID], ['v2 fresh', V2_FRESH], ['v2 finished', V2_FINISHED]] as const) {
    it(`${label}: every field carries over`, () => {
      const m = migrate(old);
      expect(m.version).toBe(SAVE_VERSION);
      for (const [k, v] of Object.entries(old)) if (k !== 'version') expect(m[k as keyof typeof m], k).toEqual(v);
      expect(m.seen).toEqual([]);
    });
  }

  it('v1 saves gain empty v2 fields', () => {
    const m = migrate(V1_MID);
    expect(m.flags).toEqual([]);
    expect(m.favors).toEqual({});
    expect(m.visited).toEqual([]);
  });

  it('keeps fields from a newer version it does not know about', () => {
    const fromTheFuture = { ...V2_FINISHED, version: 9, garden: { roses: 4 }, pets: ['comet'] };
    const m = migrate(fromTheFuture) as unknown as Record<string, unknown>;
    expect(m.garden).toEqual({ roses: 4 });
    expect(m.pets).toEqual(['comet']);
    expect(m.name).toBe('Sparkle');
  });

  it('repairs malformed values without throwing', () => {
    expect(migrate({ stardust: -5 }).stardust).toBe(0);
    expect(migrate({ stardust: 12.7 }).stardust).toBe(12);
    expect(migrate({ friendsHelped: ['fox', 'fox', 7] }).friendsHelped).toEqual([]);
    expect(migrate({ favors: { lantern: 2, bad: -1 } }).favors).toEqual({});
    expect(migrate({ flags: ['gold:a', 'gold:a'] }).flags).toEqual(['gold:a']);
    expect(migrate('nonsense')).toEqual(freshSave());
  });
});

describe('profiles', () => {
  it('a brand-new device has no players yet', () => {
    const s = new SaveManager(memoryStorage());
    expect(s.profiles()).toEqual([]);
    expect(s.data).toEqual(freshSave());
  });

  it("first run: her old single save becomes profile 1, and the old save is left in place", () => {
    const legacy = JSON.stringify(V2_FINISHED);
    const storage = memoryStorage({ [SAVE_KEY]: legacy });
    const s = new SaveManager(storage);
    expect(s.profiles()).toHaveLength(1);
    expect(s.active()?.id).toBe('p1');
    expect(s.data.name).toBe('Sparkle');
    expect(s.data.flags).toContain('mystery:solved');
    expect(s.data.favors).toEqual({ berries: 1, lantern: 3, shell: 3 });
    expect(storage.raw.get(SAVE_KEY)).toBe(legacy); // backup untouched
    expect(storage.raw.has(PROFILES_KEY)).toBe(true);
  });

  it('only migrates once: later progress is not overwritten by the old save', () => {
    const storage = memoryStorage({ [SAVE_KEY]: JSON.stringify(V2_FINISHED) });
    const a = new SaveManager(storage);
    a.data.stardust = 999;
    a.save();
    const b = new SaveManager(storage);
    expect(b.data.stardust).toBe(999);
  });

  it('players are kept separate', () => {
    const storage = memoryStorage();
    const s = new SaveManager(storage);
    const luna = s.create('Luna')!;
    s.data.stardust = 10;
    const star = s.create('Starla')!;
    expect(s.data.stardust).toBe(0);
    s.data.friendsHelped.push('bunny');
    s.save();
    const again = new SaveManager(storage);
    expect(again.active()?.id).toBe(star.id);
    again.select(luna.id);
    expect(again.data.name).toBe('Luna');
    expect(again.data.stardust).toBe(10);
    expect(again.data.friendsHelped).toEqual([]);
  });

  it(`allows at most ${MAX_PROFILES} players`, () => {
    const s = new SaveManager(memoryStorage());
    for (let i = 0; i < MAX_PROFILES; i++) expect(s.create(`P${i}`)).toBeDefined();
    expect(s.create('One too many')).toBeUndefined();
  });

  it('removing a player picks another one', () => {
    const s = new SaveManager(memoryStorage());
    const a = s.create('A')!;
    const b = s.create('B')!;
    s.remove(b.id);
    expect(s.active()?.id).toBe(a.id);
  });

  it('starting over resets only the active player', () => {
    const s = new SaveManager(memoryStorage());
    const a = s.create('A')!;
    s.data.stardust = 50;
    s.create('B');
    s.data.stardust = 70;
    s.reset();
    expect(s.data).toEqual(freshSave());
    s.select(a.id);
    expect(s.data.stardust).toBe(50);
  });

  it('an unreadable profiles store is parked, never thrown away', () => {
    const storage = memoryStorage({ [PROFILES_KEY]: '{oops', [SAVE_KEY]: JSON.stringify(V1_MID) });
    const s = new SaveManager(storage);
    expect(s.data.name).toBe('Luna'); // fell back to the old save
    const parked = [...storage.raw.keys()].find((k) => k.startsWith(`${PROFILES_KEY}-unreadable-`));
    expect(parked && storage.raw.get(parked)).toBe('{oops');
  });

  it('works without any storage at all', () => {
    const s = new SaveManager(undefined);
    s.create('Nobody');
    expect(() => s.save()).not.toThrow();
    expect(s.data.name).toBe('Nobody');
  });

  it('replaceActive (backups, presets) creates a player if there is none', () => {
    const s = new SaveManager(memoryStorage());
    s.replaceActive(migrate(V2_FINISHED));
    expect(s.profiles()).toHaveLength(1);
    expect(s.data.name).toBe('Sparkle');
  });
});
