import { AREA_ORDER, FRIENDS, HOME, LEVELS, POWERS } from './registry';
import type { Hideable, LevelDef, PowerId } from './types';

/**
 * Which powers you need to reach a spot in a level. Winds and ice walls are
 * full height, so anything past one needs that power; dark places need Glow
 * to see; hidden things need Sniff.
 */
export function powersNeeded(level: LevelDef, p: Hideable): Set<PowerId> {
  const need = new Set<PowerId>();
  if (p.hidden) need.add('sniff');
  for (const w of level.winds ?? []) if (p.x >= w.x) need.add('dash');
  for (const i of level.ice ?? []) if (p.x >= i.x) need.add('warmth');
  for (const d of level.darks ?? [])
    if (p.x >= d.x && p.x <= d.x + d.w && p.y >= d.y && p.y <= d.y + d.h) need.add('glow');
  return need;
}

/** Powers you already have the first time you can visit an area. */
export function powersOnArrival(areaId: string): Set<PowerId> {
  const before = AREA_ORDER.slice(0, AREA_ORDER.indexOf(areaId)).map((a) => LEVELS[a].friend?.id);
  return new Set(POWERS.filter((p) => before.includes(p.friend)).map((p) => p.id));
}

/** Everything that counts toward an area's "✨ secrets" number. */
export function secretIds(level: LevelDef): string[] {
  return [...(level.chests ?? []).map((c) => c.id), ...(level.notes ?? []).filter((n) => n.secret).map((n) => n.id)];
}

export const goldIds = (level: LevelDef) => (level.golds ?? []).map((g) => g.id);

/** Clue notes in story order, with the area each one hides in. */
export function allClues(): { id: string; line: string; area: string }[] {
  return AREA_ORDER.flatMap((a) =>
    (LEVELS[a].notes ?? []).filter((n) => n.secret).map((n) => ({ id: n.id, line: n.line, area: a })),
  ).sort((x, y) => Number(x.id.split('-')[1]) - Number(y.id.split('-')[1]));
}

/** Areas whose color sparks the Heart Crystal is waiting for. Frosty Peaks' spark comes from Pip. */
export const SPARK_AREAS = HOME.heartCrystalSparks;

export const friendIds = () => FRIENDS.map((f) => f.id);
