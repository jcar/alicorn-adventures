import { AREA_ORDER, FRIENDS, HOME, KINGDOMS, LEVELS, POWERS } from './registry';
import type { Hideable, KingdomDef, LevelDef, PowerId } from './types';

/**
 * Which powers you need to reach a spot in a level. Winds and ice walls are
 * full height, so anything past one needs that power; dark places need Glow
 * to see; hidden things need Sniff.
 */
export function powersNeeded(level: LevelDef, p: Hideable): Set<PowerId> {
  const need = new Set<PowerId>();
  if (p.hidden) need.add('sniff');
  for (const w of level.winds ?? []) if (p.x >= w.x) need.add(w.power ?? 'dash');
  for (const w of level.walls ?? []) if (p.x >= w.x) need.add(w.power);
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

/**
 * Powers usable on the FIRST visit to an area: the ones she arrived with,
 * plus the one this area's own friend teaches (she stays in the area after
 * helping them, so turning back within it is fine; coming back later isn't).
 */
export function powersFirstPass(level: LevelDef): Set<PowerId> {
  const have = powersOnArrival(level.id);
  const f = level.friend;
  if (f) for (const pw of POWERS) if (pw.friend === f.id) have.add(pw.id);
  return have;
}

/** Can this be reached the first time through, without coming back from a later area? */
export const reachableFirstPass = (level: LevelDef, p: Hideable) =>
  [...powersNeeded(level, p)].every((pw) => powersFirstPass(level).has(pw));

/**
 * Optional bonuses (chests and golden stars) that need a power from a later
 * area. They're fine, but the game says so: "come back any time with …".
 */
export function laterPower(level: LevelDef, p: Hideable): PowerId | undefined {
  const have = powersFirstPass(level);
  return [...powersNeeded(level, p)].find((pw) => !have.has(pw));
}

/** The chests, clue notes and golden stars an area hides, with their ids. */
export const findables = (level: LevelDef): (Hideable & { flag: string })[] => [
  ...(level.chests ?? []).map((c) => ({ ...c, flag: `secret:${c.id}` })),
  ...(level.notes ?? []).filter((n) => n.secret).map((n) => ({ ...n, flag: `secret:${n.id}` })),
  ...(level.golds ?? []).map((g) => ({ ...g, flag: `gold:${g.id}` })),
];

/** Everything that counts toward an area's "✨ secrets" number. */
export function secretIds(level: LevelDef): string[] {
  return [...(level.chests ?? []).map((c) => c.id), ...(level.notes ?? []).filter((n) => n.secret).map((n) => n.id)];
}

export const goldIds = (level: LevelDef) => (level.golds ?? []).map((g) => g.id);

/** A kingdom's clue notes in story order (by the number at the end of their id), with the area each one hides in. */
export function allClues(kingdom: KingdomDef = KINGDOMS[0]): { id: string; line: string; area: string }[] {
  const num = (id: string) => Number(id.split('-').pop());
  return kingdom.areaOrder
    .flatMap((a) => (kingdom.areas[a].notes ?? []).filter((n) => n.secret).map((n) => ({ id: n.id, line: n.line, area: a })))
    .sort((x, y) => num(x.id) - num(y.id));
}

/** Areas whose color sparks the Heart Crystal is waiting for. Frosty Peaks' spark comes from Pip. */
export const SPARK_AREAS = HOME.heartCrystalSparks;

export const friendIds = () => FRIENDS.map((f) => f.id);
