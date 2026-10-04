/**
 * Shared shapes for all content: kingdoms, areas, friends, powers,
 * puzzles, favors and unlocks. Kingdom packs import only from here.
 */

export const WORLD_HEIGHT = 720;
export const GROUND_Y = 620;

export type Deco = 'glade' | 'trees' | 'mushrooms' | 'crystals' | 'clouds' | 'frost' | 'beach' | 'reef' | 'kelp' | 'ship' | 'trench';

export interface Theme {
  skyTop: number;
  skyBottom: number;
  far: number;
  near: number;
  ground: number;
  groundTop: number;
  deco: Deco;
}

export interface Point { x: number; y: number }

/**
 * What a gate or favor asks:
 *   { skill: 'math', offset: -1 }  a question from the bank, one level easier than the player's
 *   { puzzle: 'frost-lock' }      a fixed, hand-written puzzle (for story moments)
 */
export interface PuzzleSpec { puzzle?: string; skill?: 'math' | 'reading' | 'logic'; offset?: number }
/** Something that stays invisible until Sniff finds it. */
export interface Hideable extends Point { hidden?: boolean }

export interface Reward { stardust?: number }

export interface LevelDef {
  id: string;
  name: string;
  width: number;
  theme: Theme;
  /** Gentle generated-music settings, used when no music file exists. */
  music: { bpm: number; root: number };
  start: Point;
  ground: { x: number; w: number }[];
  platforms: { x: number; y: number; w: number }[];
  stardust: Point[];
  /** The friend's quest items (carrots, berries). For a recipe, `item` says which ingredient each one is. */
  items: (Hideable & { item?: string })[];
  blooms: Hideable[];
  bouncers: Point[];
  friend?: { id: string; x: number; y: number };
  portals: { x: number; target: string }[];
  stations: { x: number; kind: 'mirror' | 'tree' | 'crystal' | 'altar' }[];

  // ---- secrets & powers (all optional)
  /** Solid on every side: tunnel walls for golden-star challenges. */
  blocks?: { x: number; y: number; w: number; h: number }[];
  /** Full-height wind that pushes back toward the start. Needs Dash. */
  winds?: { x: number; w: number; power?: PowerId; style?: 'wind' | 'current' }[];
  /** Full-height walls that open with a power (e.g. sea-glass opens with Shell Song). */
  walls?: { id: string; x: number; power: PowerId; texture: string; blocked: string; can: string }[];
  /** 'swim': underwater (floaty, same keys). Default is 'explore'. */
  mode?: 'explore' | 'swim';
  /** Swap the shared pictures for this area's own (flower bud, flower, pattern crystal, the catch-you cloud). */
  art?: { bud?: string; flower?: string; crystal?: string; catcher?: string; bumper?: string; cave?: string; shrinker?: string; tunnel?: string; ceiling?: string };
  /** Rock from the sky down to a low gap: only a tiny (Shrink) alicorn fits through. */
  tunnels?: { x: number; w: number; gap?: number }[];
  /** Shrink mushrooms: ↓ here to become tiny (needs Shrink). ↓ anywhere with room grows her back. */
  shrinkers?: { x: number }[];
  /** Candy-glass ceilings sealing a little sky room above them (walls on both sides). Fizz Pop breaks through. */
  ceilings?: { id: string; x: number; w: number; y: number }[];
  /** Full-height ice wall. Needs Warm Breath. */
  ice?: { id: string; x: number }[];
  /** Too dark to see without Glow. */
  darks?: { x: number; y: number; w: number; h: number }[];
  /** Full-height doors that open with a story item found in the same area (`has:<item>`), like a spoon for the cocoa door. `need` is what she's told without it. */
  doors?: { id: string; x: number; item: string; need: string; texture?: string }[];
  /** Full-height stone gate with a number lock. */
  gates?: ({ id: string; x: number } & PuzzleSpec)[];
  /** Crystals that chime a tune to copy. Solving it reveals the chest with the same id. */
  /** Tune length follows the player's memory level; offset makes this one easier (-) or harder (+). */
  patterns?: { id: string; x: number; crystals: Point[]; offset?: number }[];
  chests?: (Hideable & { id: string; reward: Reward; byPattern?: string })[];
  /** Clue notes (secret: true) and helpful signs. `line` is a dialogue id. */
  notes?: (Hideable & { id: string; line: string; secret?: boolean })[];
  golds?: (Point & { id: string })[];
  /** Bouncy clouds that drift up and down and gently push you away. */
  bumpers?: (Point & { range: number })[];
  /** This area's color spark for the Heart Crystal. */
  spark?: Point;
  /** Things a friend's favor needs, like the Moon Shell. */
  storyItems?: (Hideable & { id: string })[];
  /** Pictures that are just for looking at (and sometimes counting!). */
  decos?: { texture: string; x: number; y?: number }[];
}

/** A straight line of stardust. */
export function row(x: number, y: number, n: number, dx = 64): Point[] {
  return Array.from({ length: n }, (_, i) => ({ x: x + i * dx, y }));
}

/** A rainbow-shaped arc of stardust, great for flying through. */
export function arc(cx: number, y: number, n: number, r = 200): Point[] {
  return Array.from({ length: n }, (_, i) => {
    const t = Math.PI * (i / (n - 1));
    return { x: cx - Math.cos(t) * r, y: y - Math.sin(t) * r * 0.7 };
  });
}

/**
 * A golden-star challenge: a tunnel open on its left, with bouncy clouds
 * drifting inside and the star at the far end.
 */
export function tunnel(x: number, w: number, starId: string) {
  return {
    blocks: [
      { x, y: 60, w, h: 36 },
      { x, y: 236, w, h: 36 },
      { x: x + w - 36, y: 96, w: 36, h: 140 },
    ],
    bumpers: [
      { x: x + w * 0.33, y: 112, range: 100 },
      { x: x + w * 0.62, y: 212, range: -100 },
    ],
    gold: { id: starId, x: x + w - 80, y: 166 },
  };
}

// ------------------------------------------------------------ friends

export type FriendRequest =
  | { kind: 'fetch'; item: string; count: number }
  /** Exactly these, read off a recipe card. Extras in the level (or one too many) are kindly left behind. */
  | { kind: 'recipe'; items: { item: string; count: number }[] }
  | { kind: 'wake' }
  | { kind: 'bloom' }
  /** Just find them. (Pip is hiding.) */
  | { kind: 'found' };

export interface FriendDef {
  id: string;
  name: string;
  texture: string;
  request: FriendRequest;
  lines: { ask: string; progress?: string; hint?: string; thanks: string };
  /** Where this friend lives in the Home Glade after being helped. */
  gladeX: number;
}

// ------------------------------------------------------------ powers

/** Every friend you help teaches a power. Each one opens up secrets everywhere. */
export interface PowerDef {
  id: 'sniff' | 'dash' | 'glow' | 'warmth' | 'jet' | 'song' | 'shrink' | 'fizz';
  name: string;
  friend: string;
  icon: string;
  /** Narrator line that explains the power right after it's learned. */
  teach: string;
}

// ------------------------------------------------------------ puzzles

/**
 * Number locks and riddles. The question is a dialogue line, so it's shown
 * and read aloud like everything else. Questions get harder area by area.
 */
export type Puzzle =
  | { kind: 'number'; line: string; answer: number }
  | { kind: 'choice'; line: string; choices: string[]; answer: number };

export const NUMBER_MAX = 30;

// ------------------------------------------------------------ favors

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
  | ({ npc: string; kind: 'puzzle'; line: string; done: string; gives?: string } & PuzzleSpec)
  | { npc: string; kind: 'bring'; item: string; wait: string; done: string };

export interface FavorDef {
  id: string;
  /** Friends who must have moved into the Glade first. */
  needs: string[];
  steps: FavorStep[];
  stardust: number;
}

// ------------------------------------------------------------ unlocks

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

export type PowerId = PowerDef['id'];

// ------------------------------------------------------------ kingdoms

export interface Line { speaker: string; text: string }

/**
 * A kingdom pack: everything one kingdom adds to the game. Drop a folder in
 * src/kingdoms/<id>/ whose index.ts default-exports one of these.
 */
export interface KingdomDef {
  id: string;
  name: string;
  /** Story and Sky Map order. */
  order: number;
  /** The kingdom's hub: a small place with at most 6 exits (its areas, and the Sky Map). */
  hub: LevelDef;
  /** Where its island floats on the Sky Map, as fractions of the screen. */
  map: { x: number; y: number };
  /** Island picture on the Sky Map. */
  island: string;
  /** Friends who must be helped before this kingdom opens (none = open). */
  needs?: string[];
  /** Areas in the order they open. The friend in each teaches its power. */
  areaOrder: string[];
  areas: Record<string, LevelDef>;
  /** Color of each area's spark (map, Heart Crystal). */
  areaColors: Record<string, number>;
  friends: FriendDef[];
  powers: PowerDef[];
  puzzles: Record<string, Puzzle>;
  favors: FavorDef[];
  unlocks: Unlock[];
  dialogue: Record<string, Line>;
  /** The kingdom's Guardian Star: restored at the hub's altar from one shard per area. */
  saga?: Saga;
}

export interface Saga {
  /** Flag set when the star is restored, e.g. "star:coral". */
  flag: string;
  starName: string;
  altarTexture: string;
  /** Areas whose sparks are the star's shards. */
  shards: string[];
  /** Status lines: lines.status[n] = n shards found; then ready / done / finale. */
  lines: { status: string[]; finale: string; done: string };
  /** Who signs this kingdom's clue notes (shown in the Adventure Book). */
  clueTitle: string;
}

/** Home: the player's own place (the Glade). */
export interface HomeDef {
  level: LevelDef;
  dialogue: Record<string, Line>;
  /** Areas whose color sparks the Heart Crystal is waiting for. */
  heartCrystalSparks: string[];
}

/** A kingdom that's coming later: shown on the Sky Map as a mystery island. */
export interface Teaser { id: string; name: string; map: { x: number; y: number } }

/** Doors with this target open the Sky Map. */
export const SKY_MAP = 'skymap';
