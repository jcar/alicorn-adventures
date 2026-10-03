import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { DIALOGUE, FRIENDS, KINGDOMS, LEVELS, PUZZLES, UNLOCKS, HOME } from '../src/core/content';

/** Packs are merged into one game, so two packs reusing an id would silently clobber each other. */
describe('kingdom registry', () => {
  it('finds the Enchanted Forest pack', () => {
    expect(KINGDOMS.map((k) => k.id)).toContain('forest');
  });

  it('Home keeps the level id "glade" (saves and doors depend on it)', () => {
    expect(HOME.level.id).toBe('glade');
    expect(LEVELS.glade).toBe(HOME.level);
  });

  it('no dialogue line id is defined twice', () => {
    const files = ['src/core/content/dialogue.json', 'src/home/dialogue.json', ...KINGDOMS.map((k) => `src/kingdoms/${k.id}/dialogue.json`)];
    const seen = new Map<string, string>();
    for (const f of files) {
      for (const id of Object.keys(JSON.parse(fs.readFileSync(path.resolve(f), 'utf8')))) {
        expect(seen.get(id), `"${id}" is in both ${seen.get(id)} and ${f}`).toBeUndefined();
        seen.set(id, f);
      }
    }
    expect(Object.keys(DIALOGUE).length).toBe(seen.size);
  });

  it('no level, friend, puzzle or unlock id is defined twice', () => {
    const areaIds = KINGDOMS.flatMap((k) => Object.keys(k.areas));
    expect(new Set([...areaIds, 'glade']).size).toBe(areaIds.length + 1);
    expect(new Set(FRIENDS.map((f) => f.id)).size).toBe(FRIENDS.length);
    expect(new Set(UNLOCKS.map((u) => u.id)).size).toBe(UNLOCKS.length);
    const puzzleIds = KINGDOMS.flatMap((k) => Object.keys(k.puzzles));
    expect(new Set(puzzleIds).size).toBe(puzzleIds.length);
    expect(Object.keys(PUZZLES).length).toBe(puzzleIds.length);
  });

  it('every area a kingdom lists in areaOrder exists in that kingdom', () => {
    for (const k of KINGDOMS) for (const a of k.areaOrder) expect(k.areas[a], `${k.id}/${a}`).toBeDefined();
  });
});
