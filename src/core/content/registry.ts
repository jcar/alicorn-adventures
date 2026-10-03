import type { FavorDef, FriendDef, KingdomDef, LevelDef, Line, PowerDef, Puzzle, Teaser, Unlock } from './types';
import { CORE_UNLOCKS } from './coreUnlocks';
import coreDialogue from './dialogue.json';
import puzzleDialogue from '../puzzles/dialogue.json';
import home from '../../home';

/**
 * Every kingdom pack in src/kingdoms/<id>/index.ts is found automatically and
 * merged here. Adding a kingdom = adding a folder.
 */
const packs = import.meta.glob<{ default: KingdomDef }>('../../kingdoms/*/index.ts', { eager: true });

export const KINGDOMS: KingdomDef[] = Object.values(packs).map((m) => m.default).sort((a, b) => a.order - b.order);
export const HOME = home;

const merge = <T>(pick: (k: KingdomDef) => Record<string, T>) => Object.assign({}, ...KINGDOMS.map(pick)) as Record<string, T>;

export const LEVELS: Record<string, LevelDef> = {
  glade: home.level,
  ...Object.fromEntries(KINGDOMS.map((k) => [k.hub.id, k.hub])),
  ...merge((k) => k.areas),
};
/** Every area in story order, across all kingdoms. */
export const AREA_ORDER: string[] = KINGDOMS.flatMap((k) => k.areaOrder);
export const AREA_COLORS: Record<string, number> = merge((k) => k.areaColors);
export const FRIENDS: FriendDef[] = KINGDOMS.flatMap((k) => k.friends);
export const POWERS: PowerDef[] = KINGDOMS.flatMap((k) => k.powers);
export const PUZZLES: Record<string, Puzzle> = merge((k) => k.puzzles);
export const FAVORS: FavorDef[] = KINGDOMS.flatMap((k) => k.favors);
export const UNLOCKS: Unlock[] = [...CORE_UNLOCKS, ...KINGDOMS.flatMap((k) => k.unlocks)];
export const DIALOGUE: Record<string, Line> = { ...coreDialogue, ...puzzleDialogue, ...home.dialogue, ...merge((k) => k.dialogue) };

export const findFriend = (id: string) => FRIENDS.find((f) => f.id === id);
export const powerFromFriend = (friendId: string) => POWERS.find((p) => p.friend === friendId);
export const kingdomOfArea = (areaId: string) => KINGDOMS.find((k) => areaId in k.areas);
export const kingdomOfLevel = (levelId: string) => KINGDOMS.find((k) => k.hub.id === levelId || levelId in k.areas);

/** Kingdoms still being imagined: mystery islands on the Sky Map. */
export const UPCOMING: Teaser[] = [
  { id: 'coral', name: 'Coral Kingdom', map: { x: 0.6, y: 0.68 } },
  { id: 'sweets', name: 'Sweet Treat Valley', map: { x: 0.7, y: 0.3 } },
  { id: 'moonbeam', name: 'Moonbeam Kingdom', map: { x: 0.87, y: 0.6 } },
];
