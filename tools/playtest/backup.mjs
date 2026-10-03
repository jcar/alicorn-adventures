// Backup round trip: B downloads a backup; L restores it over a changed save.
import { start, baseSave, SAVE_KEY } from './harness.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const out = fs.mkdtempSync(path.join(os.tmpdir(), 'alicorn-backup-'));
const h = await start(baseSave({ stardust: 412, friendsHelped: ['bunny', 'fox', 'owl', 'dragon', 'pip'], flags: ['mystery:solved', 'spark:frost'], favors: { lantern: 3 } }));
await h.wait(3000); await h.page.mouse.click(640, 360);
const [dl] = await Promise.all([h.page.waitForEvent('download'), h.tap('b')]);
const file = path.join(out, dl.suggestedFilename());
await dl.saveAs(file);
const backup = JSON.parse(fs.readFileSync(file, 'utf8'));
console.log('downloaded', dl.suggestedFilename(), '| format', backup.format, '| name', backup.save.name, '| stardust', backup.save.stardust);

await h.page.evaluate((k) => { const s = JSON.parse(localStorage.getItem(k)); s.stardust = 1; s.name = 'Oops'; localStorage.setItem(k, JSON.stringify(s)); }, SAVE_KEY);
await h.page.reload(); await h.wait(3000); await h.page.mouse.click(640, 360);
const [chooser] = await Promise.all([h.page.waitForEvent('filechooser'), h.tap('l')]);
await chooser.setFiles(file);
await h.wait(2500);
const after = await h.page.evaluate((k) => ({ save: JSON.parse(localStorage.getItem(k)), kept: !!localStorage.getItem(`${k}-before-restore`) }), SAVE_KEY);
const ok = after.save.name === 'Sparkle' && after.save.stardust === 412 && after.save.flags.includes('mystery:solved') && after.kept;
console.log('restored', after.save.name, after.save.stardust, '| previous kept aside:', after.kept, ok ? '✓' : '✗');
console.log('ERRORS', h.errors.join('\n') || 'none');
await h.browser.close();
process.exit(ok && !h.errors.length ? 0 : 1);
