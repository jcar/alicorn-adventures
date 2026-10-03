import { migrate, type SaveData } from './SaveManager';

/**
 * Save backups: a plain JSON file a grown-up can keep, move to another
 * device, or restore. Saves never leave the device any other way.
 */
export const BACKUP_FORMAT = 'alicorn-adventures-backup';

export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  formatVersion: 1;
  savedAt: string;
  save: SaveData;
}

export function makeBackup(save: SaveData, now = new Date()): BackupFile {
  return { format: BACKUP_FORMAT, formatVersion: 1, savedAt: now.toISOString(), save: structuredClone(save) };
}

/** Reads a backup file (or a bare save) and upgrades it. Throws if it isn't one. */
export function readBackup(text: string): SaveData {
  const raw = JSON.parse(text) as unknown;
  if (!raw || typeof raw !== 'object') throw new Error('Not a backup file');
  const r = raw as Record<string, unknown>;
  const save = r.format === BACKUP_FORMAT ? r.save : raw;
  if (!save || typeof save !== 'object' || !('version' in (save as object))) throw new Error('Not an Alicorn Adventures save');
  return migrate(save);
}

export function backupFileName(save: SaveData, now = new Date()) {
  const who = (save.name || 'alicorn').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  return `alicorn-adventures-${who}-${now.toISOString().slice(0, 10)}.json`;
}

/** Download the backup as a file (browser only). */
export function downloadBackup(save: SaveData) {
  const blob = new Blob([JSON.stringify(makeBackup(save), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = backupFileName(save);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Let a grown-up pick a backup file. Resolves with the save, or undefined if cancelled. */
export function pickBackupFile(): Promise<SaveData | undefined> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve(undefined);
      try {
        resolve(readBackup(await file.text()));
      } catch (e) {
        reject(e);
      }
    };
    input.click();
  });
}
