import { describe, expect, it } from 'vitest';
import { backupFileName, makeBackup, readBackup } from '../src/systems/Backup';
import { freshSave } from '../src/systems/SaveManager';

const finished = () => ({
  ...freshSave(),
  name: 'Sparkle', stardust: 412, friendsHelped: ['bunny', 'fox', 'owl', 'dragon', 'pip'],
  unlocked: ['mane-pink', 'area-frost', 'acc-tiara'], flags: ['mystery:solved', 'gold:woods-gold-1', 'spark:frost'],
  favors: { lantern: 3, shell: 3, berries: 1 }, visited: ['woods', 'frost'],
  equipped: { mane: 'starlight', trail: 'superstar', accessory: 'tiara' },
});

describe('save backups', () => {
  it('round-trips a finished game exactly', () => {
    const save = finished();
    const text = JSON.stringify(makeBackup(save));
    expect(readBackup(text)).toEqual(save);
  });

  it('accepts a bare save copied straight out of the browser', () => {
    const save = finished();
    expect(readBackup(JSON.stringify(save))).toEqual(save);
  });

  it('upgrades an old version 1 save inside a backup', () => {
    const v1 = { version: 1, name: 'Luna', stardust: 9, friendsHelped: ['bunny'], unlocked: [], equipped: {}, pendingCelebrations: [] };
    const out = readBackup(JSON.stringify({ format: 'alicorn-adventures-backup', formatVersion: 1, savedAt: '', save: v1 }));
    expect(out.name).toBe('Luna');
    expect(out.friendsHelped).toEqual(['bunny']);
    expect(out.flags).toEqual([]);
  });

  it('refuses files that are not saves', () => {
    expect(() => readBackup('not json')).toThrow();
    expect(() => readBackup(JSON.stringify({ hello: 'world' }))).toThrow();
  });

  it('names the file after the alicorn and the date', () => {
    expect(backupFileName(finished(), new Date('2026-10-03T12:00:00Z'))).toBe('alicorn-adventures-sparkle-2026-10-03.json');
  });
});
