import { describe, expect, it } from 'vitest';
import { AREA_ORDER, LEVELS, GROUND_Y, KINGDOMS } from '../src/core/content';
import { FRIENDS } from '../src/core/content';
import { FAVORS } from '../src/core/content';
import { NUMBER_MAX, PUZZLES } from '../src/core/content';
import { POWERS } from '../src/core/content';
import { allClues, goldIds, powersNeeded, powersOnArrival, secretIds } from '../src/core/content';
import { DIALOGUE as dialogue } from '../src/core/content';

const lines = dialogue as Record<string, unknown>;
const subset = (a: Set<string>, b: Set<string>) => [...a].filter((x) => !b.has(x));

describe('every area can be finished with the powers you have when you arrive', () => {
  for (const id of AREA_ORDER) {
    it(id, () => {
      const L = LEVELS[id];
      const have = powersOnArrival(id);
      const friend = FRIENDS.find((f) => f.id === L.friend?.id)!;
      const mainPath = [{ x: L.friend!.x, y: L.friend!.y }];
      if (friend.request.kind === 'fetch') mainPath.push(...L.items);
      if (friend.request.kind === 'bloom') mainPath.push(...L.blooms);
      for (const p of mainPath) expect(subset(powersNeeded(L, p), have), `${id} @ ${p.x},${p.y}`).toEqual([]);
    });
  }

  it("each kingdom's last area comes with all the powers taught before it", () => {
    for (const k of KINGDOMS) {
      const last = k.areaOrder[k.areaOrder.length - 1];
      const earlier = AREA_ORDER.slice(0, AREA_ORDER.indexOf(last)).map((a) => LEVELS[a].friend?.id);
      const expected = POWERS.filter((p) => earlier.includes(p.friend)).length;
      expect(powersOnArrival(last).size, k.id).toBe(expected);
    }
    expect(powersOnArrival('frost').size).toBe(4); // the forest's four
  });

  it('each area has a secret you can find on your first visit, and one to come back for', () => {
    for (const id of AREA_ORDER) {
      const L = LEVELS[id];
      const have = powersOnArrival(id);
      const spots = [...(L.chests ?? []), ...(L.notes ?? []).filter((n) => n.secret)];
      const needs = spots.map((s) => subset(powersNeeded(L, s), have).length);
      expect(needs.some((n) => n === 0), `${id}: something findable now`).toBe(true);
      if (id !== 'frost') expect(needs.some((n) => n > 0), `${id}: something to come back for`).toBe(true);
    }
  });
});

describe('secrets, puzzles and favors fit together', () => {
  it('every level thing sits inside its level', () => {
    for (const L of Object.values(LEVELS)) {
      const pts = [...(L.chests ?? []), ...(L.notes ?? []), ...(L.golds ?? []), ...(L.storyItems ?? []), ...(L.spark ? [L.spark] : [])];
      for (const p of pts) {
        expect(p.x, L.id).toBeGreaterThan(0);
        expect(p.x, L.id).toBeLessThan(L.width);
        expect(p.y, L.id).toBeLessThanOrEqual(GROUND_Y);
      }
      for (const i of L.ice ?? []) expect(i.x).toBeLessThan(L.width - 100);
    }
  });

  it('ids are unique across the whole game', () => {
    const ids = Object.values(LEVELS).flatMap((L) => [...secretIds(L), ...goldIds(L), ...(L.ice ?? []).map((i) => i.id), ...(L.gates ?? []).map((g) => g.id), ...(L.patterns ?? []).map((p) => p.id)]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('pattern chests point at a real pattern, and tunes are long enough', () => {
    for (const L of Object.values(LEVELS)) {
      const patterns = new Set((L.patterns ?? []).map((p) => p.id));
      for (const c of L.chests ?? []) if (c.byPattern) expect(patterns.has(c.byPattern), c.id).toBe(true);
      for (const p of L.patterns ?? []) expect(p.crystals.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('within a kingdom, tunes get harder (or stay the same) area by area', () => {
    for (const k of KINGDOMS) {
      const offsets = k.areaOrder.map((a) => k.areas[a].patterns?.[0]?.offset ?? 0);
      for (let i = 1; i < offsets.length; i++) expect(offsets[i], k.id).toBeGreaterThanOrEqual(offsets[i - 1]);
    }
  });

  it('every puzzle exists, is spoken, and has a pickable answer', () => {
    // Each gate asks either a hand-written puzzle or an adaptive skill question, not both.
    for (const L of Object.values(LEVELS))
      for (const g of L.gates ?? []) {
        expect(!!g.puzzle !== !!g.skill, g.id).toBe(true);
        if (g.puzzle) expect(PUZZLES[g.puzzle], g.id).toBeDefined();
      }
    for (const [id, p] of Object.entries(PUZZLES)) {
      expect(lines, id).toHaveProperty(p.line);
      if (p.kind === 'number') expect(p.answer).toBeLessThanOrEqual(NUMBER_MAX);
      else expect(p.choices[p.answer], id).toBeDefined();
    }
  });

  it('the Frosty Peaks lock asks how many snowmen are before the gate', () => {
    const L = LEVELS.frost;
    const gate = L.gates!.find((g) => g.puzzle === 'frost-lock')!;
    const snowmen = (L.decos ?? []).filter((d) => d.texture === 'deco-snowman' && d.x < gate.x).length;
    expect(PUZZLES['frost-lock'].answer).toBe(snowmen);
  });

  it('every favor step makes sense', () => {
    const friendIds = new Set(FRIENDS.map((f) => f.id));
    const obtainable = new Set([
      ...FAVORS.flatMap((f) => f.steps.flatMap((s) => (s.kind === 'puzzle' && s.gives ? [s.gives] : []))),
      ...Object.values(LEVELS).flatMap((L) => (L.storyItems ?? []).map((i) => i.id)),
    ]);
    for (const f of FAVORS) {
      for (const n of f.needs) expect(friendIds.has(n)).toBe(true);
      for (const s of f.steps) {
        expect(f.needs, `${f.id}: ${s.npc} lives in the Glade`).toContain(s.npc);
        const ids = s.kind === 'talk' ? [s.line] : s.kind === 'puzzle' ? [s.line, s.done] : [s.wait, s.done];
        for (const l of ids) expect(lines, `${f.id}`).toHaveProperty(l);
        if (s.kind === 'puzzle') expect(s.skill ? true : !!PUZZLES[s.puzzle!], `${f.id} puzzle`).toBe(true);
        if (s.kind === 'bring') expect(obtainable.has(s.item), `${f.id} needs ${s.item}`).toBe(true);
      }
    }
  });

  it('there are 8 clues from P, numbered 1 to 8, all written', () => {
    const clues = allClues();
    expect(clues.map((c) => c.id)).toEqual(['note-1', 'note-2', 'note-3', 'note-4', 'note-5', 'note-6', 'note-7', 'note-8']);
    for (const c of clues) expect(lines).toHaveProperty(c.line);
    for (const L of Object.values(LEVELS)) for (const n of L.notes ?? []) expect(lines, n.id).toHaveProperty(n.line);
  });

  it('every power has a lesson line, and every friend line exists', () => {
    for (const p of POWERS) expect(lines).toHaveProperty(p.teach);
    for (const f of FRIENDS) for (const l of Object.values(f.lines)) expect(lines, f.id).toHaveProperty(l!);
  });

  it('every area except Frosty Peaks hides a color spark (Pip has the last one)', () => {
    for (const id of AREA_ORDER) expect(!!LEVELS[id].spark, id).toBe(id !== 'frost');
  });
});
