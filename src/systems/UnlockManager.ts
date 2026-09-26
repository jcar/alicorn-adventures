import { UNLOCKS, type Unlock, type UnlockKind } from '../data/unlocks';
import type { SaveData } from './SaveManager';

export function meetsRequirements(u: Unlock, save: SaveData): boolean {
  if (u.stardust !== undefined && save.stardust < u.stardust) return false;
  if (u.friends && !u.friends.every((f) => save.friendsHelped.includes(f))) return false;
  return true;
}

/**
 * Grants every unlock whose goal has been reached. Returns only the new ones.
 * Starter unlocks (no requirements) are granted silently.
 */
export function grantUnlocks(save: SaveData, all: Unlock[] = UNLOCKS): Unlock[] {
  const fresh: Unlock[] = [];
  for (const u of all) {
    if (save.unlocked.includes(u.id) || !meetsRequirements(u, save)) continue;
    save.unlocked.push(u.id);
    const isStarter = u.stardust === undefined && !u.friends;
    if (!isStarter) {
      fresh.push(u);
      save.pendingCelebrations.push(u.id);
    }
  }
  return fresh;
}

export function isUnlocked(save: SaveData, kind: UnlockKind, target: string, all: Unlock[] = UNLOCKS): boolean {
  return all.some((u) => u.kind === kind && u.target === target && save.unlocked.includes(u.id));
}

export function unlockFor(kind: UnlockKind, target: string, all: Unlock[] = UNLOCKS): Unlock | undefined {
  return all.find((u) => u.kind === kind && u.target === target);
}

/** The next stardust goal, so the HUD can show how full the jar is. */
export function nextStardustGoal(save: SaveData, all: Unlock[] = UNLOCKS): Unlock | undefined {
  return all
    .filter((u) => u.stardust !== undefined && !save.unlocked.includes(u.id))
    .sort((a, b) => a.stardust! - b.stardust!)[0];
}
