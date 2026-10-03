export const SAVE_KEY = 'alicorn-adventures-save';
export const SAVE_VERSION = 2;

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
   *   has:<item> favor:<id> mystery:solved
   */
  flags: string[];
  /** Which step each favor is on. */
  favors: Record<string, number>;
  /** Areas visited at least once (for the map). */
  visited: string[];
}

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

/** Upgrade older saves and repair anything missing, keeping all progress we can. */
export function migrate(raw: unknown): SaveData {
  const base = freshSave();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Record<string, unknown>;
  const eq = (r.equipped && typeof r.equipped === 'object' ? r.equipped : {}) as Record<string, unknown>;
  return {
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
    // Added in version 2; version 1 saves simply start with none.
    flags: isStringArray(r.flags) ? [...new Set(r.flags)] : [],
    favors: isNumberRecord(r.favors) ? { ...r.favors } : {},
    visited: isStringArray(r.visited) ? [...new Set(r.visited)] : [],
  };
}

export class SaveManager {
  data: SaveData;

  constructor(private storage: StorageLike | undefined = defaultStorage()) {
    this.data = this.load();
  }

  load(): SaveData {
    try {
      const text = this.storage?.getItem(SAVE_KEY);
      return text ? migrate(JSON.parse(text)) : freshSave();
    } catch {
      return freshSave();
    }
  }

  save(): void {
    try {
      this.storage?.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch {
      // Private windows can block storage; the game keeps working without saving.
    }
  }

  reset(): void {
    this.data = freshSave();
    try {
      this.storage?.removeItem(SAVE_KEY);
    } catch {
      /* ignore */
    }
  }
}
