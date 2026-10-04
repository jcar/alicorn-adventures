import { POWERS, type PowerId } from '../content';
import { GameState } from '../systems/GameState';
import type { World } from './types';

/**
 * What to say at something she can't use yet. If the friend who teaches that
 * power lives in this very area and is still waiting for help, point her back
 * to them ("come back any time" would send her the wrong way).
 */
export function blockedLine(w: World, power: PowerId, otherwise: string) {
  const teacher = POWERS.find((p) => p.id === power)?.friend;
  const friendHere = w.level.friend?.id;
  return teacher && teacher === friendHere && !GameState.hasHelped(teacher) ? 'help-friend-first' : otherwise;
}
