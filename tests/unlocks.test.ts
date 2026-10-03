import { describe, expect, it } from 'vitest';
import { freshSave } from '../src/core/systems/SaveManager';
import { grantUnlocks, isUnlocked, nextStardustGoal } from '../src/core/systems/UnlockManager';
import { UNLOCKS } from '../src/core/content';
import { FRIENDS } from '../src/core/content';
import { AREA_ORDER, LEVELS } from '../src/core/content';
import { ACCESSORIES, MANES, TRAILS } from '../src/core/content';
import { DIALOGUE as dialogue } from '../src/core/content';
import { FAVORS, KINGDOMS } from '../src/core/content';

describe('UnlockManager', () => {
  it('grants the starter kit silently', () => {
    const s = freshSave();
    expect(grantUnlocks(s)).toEqual([]);
    expect(isUnlocked(s, 'mane', 'pink')).toBe(true);
    expect(isUnlocked(s, 'area', 'woods')).toBe(true);
    expect(isUnlocked(s, 'area', 'meadow')).toBe(false);
  });

  it('pops stardust goals exactly when the jar reaches them', () => {
    const s = freshSave();
    grantUnlocks(s);
    s.stardust = 14;
    expect(grantUnlocks(s)).toEqual([]);
    s.stardust = 15;
    expect(grantUnlocks(s).map((u) => u.id)).toEqual(['mane-purple']);
    expect(grantUnlocks(s)).toEqual([]); // never twice
    expect(s.pendingCelebrations).toEqual(['mane-purple']);
  });

  it('opens each area by helping the friend in the one before', () => {
    const s = freshSave();
    grantUnlocks(s);
    for (let i = 1; i < AREA_ORDER.length; i++) {
      const prevFriend = LEVELS[AREA_ORDER[i - 1]].friend!.id;
      expect(isUnlocked(s, 'area', AREA_ORDER[i])).toBe(false);
      s.friendsHelped.push(prevFriend);
      grantUnlocks(s);
      expect(isUnlocked(s, 'area', AREA_ORDER[i])).toBe(true);
    }
  });

  it('has no dead ends: everything unlocks by helping everyone, finding everything and collecting stardust', () => {
    const s = freshSave();
    s.friendsHelped = FRIENDS.map((f) => f.id);
    s.stardust = Math.max(...UNLOCKS.map((u) => u.stardust ?? 0));
    s.flags = [
      ...Object.values(LEVELS).flatMap((L) => (L.golds ?? []).map((g) => `gold:${g.id}`)),
      ...FAVORS.map((f) => `favor:${f.id}`),
      'mystery:solved',
      ...KINGDOMS.flatMap((k) => (k.saga ? [k.saga.flag] : [])),
    ];
    grantUnlocks(s);
    expect(s.unlocked.sort()).toEqual(UNLOCKS.map((u) => u.id).sort());
    expect(nextStardustGoal(s)).toBeUndefined();
  });

  it('only helps friends that live in a reachable area', () => {
    const livesSomewhere = new Set(AREA_ORDER.map((a) => LEVELS[a].friend?.id));
    for (const u of UNLOCKS) for (const f of u.friends ?? []) expect(livesSomewhere.has(f)).toBe(true);
  });
});

describe('game data', () => {
  it('every cosmetic has an unlock and every unlock targets something real', () => {
    const ids = { mane: MANES, trail: TRAILS, accessory: ACCESSORIES } as const;
    for (const [kind, list] of Object.entries(ids))
      for (const c of list) expect(UNLOCKS.some((u) => u.kind === kind && u.target === c.id), `${kind}:${c.id}`).toBe(true);
    for (const u of UNLOCKS.filter((u) => u.kind === 'area')) expect(LEVELS[u.target]).toBeDefined();
  });

  it('there are enough golden stars for every golden unlock', () => {
    const total = Object.values(LEVELS).reduce((n, L) => n + (L.golds?.length ?? 0), 0);
    for (const u of UNLOCKS) if (u.gold) expect(total).toBeGreaterThanOrEqual(u.gold);
  });

  it('fetch quests have enough items, and bloom quests have flowers', () => {
    for (const id of AREA_ORDER) {
      const L = LEVELS[id];
      const f = FRIENDS.find((x) => x.id === L.friend?.id)!;
      if (f.request.kind === 'fetch') expect(L.items.length).toBeGreaterThanOrEqual(f.request.count);
      if (f.request.kind === 'bloom') expect(L.blooms.length).toBeGreaterThan(0);
      if (f.request.kind === 'found') expect(L.friend).toBeDefined();
    }
  });

  it('every line a friend says exists', () => {
    for (const f of FRIENDS) for (const id of Object.values(f.lines)) expect(dialogue).toHaveProperty(id!);
  });

  it('everything stays inside the level and above the ground', () => {
    for (const L of Object.values(LEVELS))
      for (const p of [...L.stardust, ...L.items]) {
        expect(p.x).toBeGreaterThan(0);
        expect(p.x).toBeLessThan(L.width);
        expect(p.y).toBeGreaterThan(40);
        expect(p.y).toBeLessThan(620);
      }
  });
});
