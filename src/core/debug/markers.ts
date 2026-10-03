import { GROUND_Y, LEVELS, type LevelDef } from '../content';

export interface Marker { x: number; y: number }

/**
 * Named places in a level, so tools can say go('woods', 'woods-chest-cave')
 * instead of raw coordinates. Positions are where the hero should stand.
 */
export function markersFor(level: LevelDef): Record<string, Marker> {
  const stand = (x: number, y = GROUND_Y) => ({ x, y: Math.min(y, GROUND_Y) - 62 });
  const m: Record<string, Marker> = { start: stand(level.start.x) };
  for (const p of level.portals) m[`door-${p.target}`] = stand(p.x);
  for (const s of level.stations) m[s.kind] = stand(s.x);
  if (level.friend) m.friend = stand(level.friend.x, level.friend.y);
  if (level.spark) m.spark = { x: level.spark.x, y: level.spark.y };
  for (const c of level.chests ?? []) m[c.id] = stand(c.x, c.y);
  for (const n of level.notes ?? []) m[n.id] = stand(n.x, n.y);
  for (const g of level.golds ?? []) m[g.id] = { x: g.x, y: g.y };
  for (const g of level.gates ?? []) m[g.id] = stand(g.x - 90);
  for (const p of level.patterns ?? []) m[p.id] = stand(p.x);
  for (const i of level.ice ?? []) m[i.id] = stand(i.x - 100);
  for (const w of level.winds ?? []) m[`wind-${w.x}`] = stand(w.x - 120);
  for (const s of level.storyItems ?? []) m[s.id] = { x: s.x, y: s.y };
  (level.items ?? []).forEach((it, i) => { m[`item-${i + 1}`] = { x: it.x, y: it.y }; });
  (level.blooms ?? []).forEach((b, i) => { m[`bloom-${i + 1}`] = stand(b.x, b.y); });
  return m;
}

export const allMarkers = () => Object.fromEntries(Object.values(LEVELS).map((L) => [L.id, markersFor(L)]));
