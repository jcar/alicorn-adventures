/**
 * Saves, one per player profile, all kept in this browser on this device.
 *
 * Version history (each upgrade is chained, so any old save comes forward):
 *   v1  single save: name, stardust, friends, unlocks, outfit
 *   v2  + flags, favors, visited                      (secrets & powers update)
 *   v3  profiles: up to 4 players, each with their own save, plus `seen`
 *   v4  + skills (adaptive puzzle levels) and recently asked questions
 *
 * The old single-save key is never deleted. When v3 first runs it becomes
 * profile 1 and the original stays where it was, as a backup.
 */
import { SKILLS, defaultSkills, type SkillState, type Skills } from '../puzzles/engine';

export const SAVE_KEY = 'alicorn-adventures-save'; // v1/v2 single save, kept as a backup
export const PROFILES_KEY = 'alicorn-adventures-profiles';
export const SAVE_VERSION = 4;
export const MAX_PROFILES = 4;

export interface SaveData {
  version: number;
  name: string;
  /** Total stardust ever collected. Never goes down. */
  stardust: number;
  friendsHelped: string[];
  unlocked: string[];
  equipped: { mane: string; trail: string; accessory: string };
  /** Unlocks earned but not yet celebrated on screen. */
  pendingCelebrations: string[];
  /**
   * Everything found or solved, as short tags:
   *   secret:<id> gold:<id> spark:<area> puzzle:<id> melted:<id>
   *   has:<item> gave:<item> favor:<id> mystery:solved
   */
  flags: string[];
  /** Which step each favor is on. */
  favors: Record<string, number>;
  /** Areas visited at least once (for the map). */
  visited: string[];
  /** New things she has already looked at, so their "NEW!" sparkle goes away. */
  seen: string[];
  /** Adaptive puzzle level in each skill. */
  skills: Skills;
  /** Last few questions asked, so they don't repeat right away. */
  recentQuestions: string[];
}

export interface Profile { id: string; createdAt: string; save: SaveData }
export interface ProfileStore { version: number; active: string | null; profiles: Profile[] }

export function freshSave(): SaveData {
  return {
    version: SAVE_VERSION,
    name: '',
    stardust: 0,
    friendsHelped: [],
    unlocked: [],
    equipped: { mane: 'pink', trail: 'sparkle', accessory: 'none' },
    pendingCelebrations: [],
    flags: [],
    favors: {},
    visited: [],
    seen: [],
    skills: defaultSkills(),
    recentQuestions: [],
  };
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function defaultStorage(): StorageLike | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === 'string');

const isNumberRecord = (v: unknown): v is Record<string, number> =>
  !!v && typeof v === 'object' && !Array.isArray(v) && Object.values(v).every((x) => typeof x === 'number' && x >= 0);

const KNOWN = new Set(Object.keys(freshSave()));

function readSkills(raw: unknown, experienced: boolean): Skills {
  const out = defaultSkills(experienced);
  if (!raw || typeof raw !== 'object') return out;
  for (const sk of SKILLS) {
    const v = (raw as Record<string, unknown>)[sk.id] as Partial<SkillState> | undefined;
    if (v && typeof v.level === 'number' && v.level >= 1) {
      out[sk.id] = { level: Math.min(sk.max, Math.floor(v.level)), streak: typeof v.streak === 'number' && v.streak >= 0 ? Math.floor(v.streak) : 0 };
    }
  }
  return out;
}

/**
 * Upgrade any older save to the current version and repair anything
 * missing, keeping all progress we can. Fields this version doesn't know
 * about (from a newer version) are carried along untouched.
 */
export function migrate(raw: unknown): SaveData {
  const base = freshSave();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Record<string, unknown>;
  const eq = (r.equipped && typeof r.equipped === 'object' ? r.equipped : {}) as Record<string, unknown>;
  const unknown = Object.fromEntries(Object.entries(r).filter(([k]) => !KNOWN.has(k)));
  return {
    ...unknown,
    version: SAVE_VERSION,
    name: typeof r.name === 'string' ? r.name.slice(0, 12) : base.name,
    stardust: typeof r.stardust === 'number' && r.stardust >= 0 ? Math.floor(r.stardust) : 0,
    friendsHelped: isStringArray(r.friendsHelped) ? [...new Set(r.friendsHelped)] : [],
    unlocked: isStringArray(r.unlocked) ? [...new Set(r.unlocked)] : [],
    equipped: {
      mane: typeof eq.mane === 'string' ? eq.mane : base.equipped.mane,
      trail: typeof eq.trail === 'string' ? eq.trail : base.equipped.trail,
      accessory: typeof eq.accessory === 'string' ? eq.accessory : base.equipped.accessory,
    },
    pendingCelebrations: isStringArray(r.pendingCelebrations) ? r.pendingCelebrations : [],
    // v2: version 1 saves simply start with none.
    flags: isStringArray(r.flags) ? [...new Set(r.flags)] : [],
    favors: isNumberRecord(r.favors) ? { ...r.favors } : {},
    visited: isStringArray(r.visited) ? [...new Set(r.visited)] : [],
    // v3
    seen: isStringArray(r.seen) ? [...new Set(r.seen)] : [],
    // v4: someone who has helped most friends starts the puzzles further along.
    skills: readSkills(r.skills, isStringArray(r.friendsHelped) && r.friendsHelped.length >= 4),
    recentQuestions: isStringArray(r.recentQuestions) ? r.recentQuestions.slice(-20) : [],
  };
}

const newId = () => `p${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;

/** Read the profiles store, repairing it; undefined if it isn't usable. */
function readStore(raw: unknown): ProfileStore | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  if (!Array.isArray(r.profiles)) return undefined;
  const profiles = r.profiles
    .filter((p): p is Record<string, unknown> => !!p && typeof p === 'object' && typeof (p as Profile).id === 'string')
    .slice(0, MAX_PROFILES)
    .map((p) => ({ id: p.id as string, createdAt: typeof p.createdAt === 'string' ? p.createdAt : '', save: migrate(p.save) }));
  const active = typeof r.active === 'string' && profiles.some((p) => p.id === r.active) ? r.active : profiles[0]?.id ?? null;
  return { version: SAVE_VERSION, active, profiles };
}

export class SaveManager {
  store: ProfileStore;
  /** Used before any profile exists (title screen on a brand-new device). */
  private scratch = freshSave();

  constructor(private storage: StorageLike | undefined = defaultStorage()) {
    this.store = this.load();
  }

  /** The active player's save. */
  get data(): SaveData {
    return this.active()?.save ?? this.scratch;
  }

  active(): Profile | undefined {
    return this.store.profiles.find((p) => p.id === this.store.active);
  }

  load(): ProfileStore {
    const get = (k: string) => {
      try { return this.storage?.getItem(k) ?? null; } catch { return null; }
    };
    const text = get(PROFILES_KEY);
    if (text) {
      try {
        const store = readStore(JSON.parse(text));
        if (store) return store;
      } catch { /* fall through */ }
      // Never throw away something we can't read: park it to one side.
      try { this.storage?.setItem(`${PROFILES_KEY}-unreadable-${Date.now()}`, text); } catch { /* ignore */ }
    }
    // First run of v3: the old single save becomes profile 1. The old key stays as a backup.
    const legacy = get(SAVE_KEY);
    if (legacy) {
      try {
        const store: ProfileStore = {
          version: SAVE_VERSION, active: 'p1',
          profiles: [{ id: 'p1', createdAt: new Date().toISOString(), save: migrate(JSON.parse(legacy)) }],
        };
        this.store = store;
        this.save();
        return store;
      } catch { /* unreadable legacy save: start fresh, but leave it in place */ }
    }
    return { version: SAVE_VERSION, active: null, profiles: [] };
  }

  save(): void {
    try {
      this.storage?.setItem(PROFILES_KEY, JSON.stringify(this.store));
    } catch {
      // Private windows can block storage; the game keeps working without saving.
    }
  }

  profiles(): Profile[] {
    return this.store.profiles;
  }

  select(id: string) {
    if (!this.store.profiles.some((p) => p.id === id)) return;
    this.store.active = id;
    this.save();
  }

  /** A new player. Returns undefined if all slots are taken. */
  create(name: string): Profile | undefined {
    if (this.store.profiles.length >= MAX_PROFILES) return undefined;
    const save = { ...freshSave(), name: name.slice(0, 12) };
    const p: Profile = { id: newId(), createdAt: new Date().toISOString(), save };
    this.store.profiles.push(p);
    this.store.active = p.id;
    this.save();
    return p;
  }

  remove(id: string) {
    this.store.profiles = this.store.profiles.filter((p) => p.id !== id);
    if (this.store.active === id) this.store.active = this.store.profiles[0]?.id ?? null;
    this.save();
  }

  /** Swap in a whole save for the active player (backups, debug presets). Creates a profile if none. */
  replaceActive(save: SaveData) {
    const p = this.active();
    if (p) p.save = migrate(save);
    else {
      this.create(save.name || 'Player');
      this.active()!.save = migrate(save);
    }
    this.save();
  }

  /** Start the active player over (they'll pick a name again). */
  reset(): void {
    const p = this.active();
    if (p) p.save = freshSave();
    else this.scratch = freshSave();
    this.save();
  }
}
