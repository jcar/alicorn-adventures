import { describe, expect, it } from 'vitest';
import { HOME, KINGDOMS, SKY_MAP, UPCOMING } from '../src/core/content';

/** Home → Star Gate → Sky Map → kingdom hub (≤ 6 exits) → areas → back to the hub. */
describe('world structure', () => {
  it('Home has a single Star Gate, not a door per area', () => {
    expect(HOME.level.portals.map((p) => p.target)).toEqual([SKY_MAP]);
  });

  for (const k of KINGDOMS) {
    it(`${k.id}: the hub has at most 6 exits, including the Sky Map and every area`, () => {
      const targets = k.hub.portals.map((p) => p.target);
      expect(targets.length).toBeLessThanOrEqual(6);
      expect(targets).toContain(SKY_MAP);
      for (const a of k.areaOrder) expect(targets, a).toContain(a);
    });

    it(`${k.id}: every area leads back to its hub`, () => {
      for (const a of Object.values(k.areas)) expect(a.portals.map((p) => p.target), a.id).toContain(k.hub.id);
    });

    it(`${k.id}: hub doors don't overlap`, () => {
      const xs = k.hub.portals.map((p) => p.x).sort((a, b) => a - b);
      for (let i = 1; i < xs.length; i++) expect(xs[i] - xs[i - 1]).toBeGreaterThanOrEqual(240);
    });
  }

  it('islands sit on the Sky Map and don’t overlap', () => {
    const spots = [{ id: 'home', x: 0.14, y: 0.62 }, ...KINGDOMS.map((k) => ({ id: k.id, ...k.map })), ...UPCOMING.map((t) => ({ id: t.id, ...t.map }))];
    for (const s of spots) {
      expect(s.x).toBeGreaterThan(0.05);
      expect(s.x).toBeLessThan(0.95);
      expect(s.y).toBeGreaterThan(0.2);
      expect(s.y).toBeLessThan(0.85);
    }
    for (let i = 0; i < spots.length; i++)
      for (let j = i + 1; j < spots.length; j++)
        expect(Math.hypot((spots[i].x - spots[j].x) * 16, (spots[i].y - spots[j].y) * 9), `${spots[i].id} vs ${spots[j].id}`).toBeGreaterThan(2);
  });
});
