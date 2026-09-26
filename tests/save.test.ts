import { describe, expect, it } from 'vitest';
import { SAVE_KEY, SaveManager, freshSave, migrate } from '../src/systems/SaveManager';

function memoryStorage(initial: Record<string, string> = {}) {
  const m = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    raw: m,
  };
}

describe('SaveManager', () => {
  it('starts fresh with no save', () => {
    expect(new SaveManager(memoryStorage()).data).toEqual(freshSave());
  });

  it('round-trips progress', () => {
    const store = memoryStorage();
    const a = new SaveManager(store);
    a.data.name = 'Luna';
    a.data.stardust = 42;
    a.data.friendsHelped.push('bunny');
    a.save();
    const b = new SaveManager(store);
    expect(b.data.name).toBe('Luna');
    expect(b.data.stardust).toBe(42);
    expect(b.data.friendsHelped).toEqual(['bunny']);
  });

  it('falls back to a fresh save when the save is corrupt', () => {
    const store = memoryStorage({ [SAVE_KEY]: '{not json' });
    expect(new SaveManager(store).data).toEqual(freshSave());
  });

  it('works without any storage at all', () => {
    const s = new SaveManager(undefined);
    s.data.stardust = 3;
    expect(() => s.save()).not.toThrow();
  });

  it('migrates an old or partial save, keeping what it can', () => {
    const m = migrate({ version: 0, name: 'Sparkle', stardust: 12.7, friendsHelped: ['fox', 'fox', 7], equipped: { mane: 'blue' } });
    expect(m.version).toBe(1);
    expect(m.name).toBe('Sparkle');
    expect(m.stardust).toBe(12);
    expect(m.friendsHelped).toEqual([]); // contained a non-string, so it's rebuilt
    expect(m.equipped).toEqual({ mane: 'blue', trail: 'sparkle', accessory: 'none' });
  });

  it('never lets stardust go negative', () => {
    expect(migrate({ stardust: -5 }).stardust).toBe(0);
  });
});
