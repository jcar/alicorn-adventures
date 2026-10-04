import { describe, expect, it } from 'vitest';
import { SKILLS, adapt, bankOf, defaultSkills, levelFor, maxLevel, pickQuestion, tuneLength } from '../src/core/puzzles/engine';
import { DIALOGUE, NUMBER_MAX } from '../src/core/content';
import { migrate } from '../src/core/systems/SaveManager';

describe('question banks', () => {
  for (const skill of ['math', 'reading', 'logic'] as const) {
    const max = SKILLS.find((s) => s.id === skill)!.max;
    it(`${skill}: every level 1..${max} has at least 8 questions`, () => {
      for (let l = 1; l <= max; l++) expect(bankOf(skill)[String(l)]?.length ?? 0, `level ${l}`).toBeGreaterThanOrEqual(8);
    });
    it(`${skill}: every answer can actually be picked`, () => {
      for (const qs of Object.values(bankOf(skill)))
        for (const q of qs) {
          if (q.kind === 'number') {
            expect(Number.isInteger(q.answer), q.id).toBe(true);
            expect(q.answer, q.id).toBeGreaterThanOrEqual(0);
            // The number lock goes to NUMBER_MAX, or to the question's own max (tens and ones go to 99).
            expect(q.answer, q.id).toBeLessThanOrEqual(q.max ?? NUMBER_MAX);
            if (q.max !== undefined) expect(q.max, q.id).toBeLessThanOrEqual(99);
          } else {
            expect(q.choices?.[q.answer], q.id).toBeDefined();
            expect(new Set(q.choices).size, `${q.id} has duplicate choices`).toBe(q.choices!.length);
          }
        }
    });
    it(`${skill}: every question has a voice line`, () => {
      for (const qs of Object.values(bankOf(skill))) for (const q of qs) expect(DIALOGUE[q.id]?.text, q.id).toBe(q.text);
    });
  }

  it('sums with a counting hint add up', () => {
    for (const qs of Object.values(bankOf('math')))
      for (const q of qs) if (q.visual) expect(q.visual.op === '+' ? q.visual.a + q.visual.b : q.visual.a - q.visual.b, q.id).toBe(q.answer);
  });

  it('avoids recently asked questions', () => {
    const recent = bankOf('math')['1'].slice(0, 9).map((q) => q.id);
    for (let i = 0; i < 20; i++) expect(recent).not.toContain(pickQuestion('math', 1, recent).id);
  });
});

describe('adapting to the player', () => {
  it('two first-try wins move a skill up a level', () => {
    let s = { level: 2, streak: 0 };
    s = adapt(s, { firstTry: true, misses: 0 }, 8);
    expect(s).toEqual({ level: 2, streak: 1 });
    s = adapt(s, { firstTry: true, misses: 0 }, 8);
    expect(s).toEqual({ level: 3, streak: 0 });
  });

  it('a struggle moves it down, a single miss just resets the streak', () => {
    expect(adapt({ level: 3, streak: 1 }, { firstTry: false, misses: 1 }, 8)).toEqual({ level: 3, streak: 0 });
    expect(adapt({ level: 3, streak: 1 }, { firstTry: false, misses: 3 }, 8)).toEqual({ level: 2, streak: 0 });
  });

  it('never goes below 1 or above the top level', () => {
    expect(adapt({ level: 1, streak: 0 }, { firstTry: false, misses: 5 }, 8).level).toBe(1);
    expect(adapt({ level: 8, streak: 1 }, { firstTry: true, misses: 0 }, 8).level).toBe(8);
    expect(levelFor(defaultSkills(), 'math', -5)).toBe(1);
    expect(levelFor(defaultSkills(true), 'logic', 10)).toBe(maxLevel('logic'));
  });

  it('crystal tunes grow from 3 notes to 8', () => {
    expect(tuneLength(1)).toBe(3);
    expect(tuneLength(6)).toBe(8);
  });
});

describe('save v4', () => {
  it('a player who has helped most friends starts further along', () => {
    const veteran = migrate({ version: 3, name: 'Sparkle', friendsHelped: ['bunny', 'fox', 'owl', 'dragon', 'pip'] });
    const beginner = migrate({ version: 3, name: 'Luna', friendsHelped: ['bunny'] });
    expect(veteran.skills.math.level).toBeGreaterThan(beginner.skills.math.level);
  });

  it('keeps existing skill levels and repairs bad ones', () => {
    const m = migrate({ skills: { math: { level: 6, streak: 1 }, reading: { level: 99 }, logic: 'oops' } });
    expect(m.skills.math).toEqual({ level: 6, streak: 1 });
    expect(m.skills.reading.level).toBe(maxLevel('reading'));
    expect(m.skills.logic.level).toBeGreaterThanOrEqual(1);
    expect(m.skills.memory.level).toBeGreaterThanOrEqual(1);
  });
});
