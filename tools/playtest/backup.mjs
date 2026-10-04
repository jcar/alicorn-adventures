// Backup round trip: B downloads a backup; L restores it over a changed save.
import { start, baseSave, PROFILES_KEY } from './harness.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const out = fs.mkdtempSync(path.join(os.tmpdir(), 'alicorn-backup-'));
const h = await start(baseSave({ stardust: 412, friendsHelped: ['bunny', 'fox', 'owl', 'dragon', 'pip'], flags: ['mystery:solved', 'spark:frost'], favors: { lantern: 3 } }));
await h.wait(3000); await h.page.mouse.click(640, 690); // empty space, just to focus the page
const [dl] = await Promise.all([h.page.waitForEvent('download'), h.tap('b')]);
const file = path.join(out, dl.suggestedFilename());
await dl.saveAs(file);
const backup = JSON.parse(fs.readFileSync(file, 'utf8'));
console.log('downloaded', dl.suggestedFilename(), '| format', backup.format, '| name', backup.save.name, '| stardust', backup.save.stardust);

await h.page.evaluate((k) => {
  const store = JSON.parse(localStorage.getItem(k));
  const p = store.profiles.find((x) => x.id === store.active);
  p.save.stardust = 1; p.save.name = 'Oops';
  localStorage.setItem(k, JSON.stringify(store));
}, PROFILES_KEY);
await h.page.reload(); await h.page.waitForFunction(() => window.game?.scene.isActive('Title'), null, { timeout: 20000 }); await h.wait(1000); await h.page.mouse.click(640, 690); // empty space, just to focus the page
// Headless Chrome occasionally ignores the first file-picker request; try a few times.
let chooser;
for (let i = 0; i < 3 && !chooser; i++) {
  await h.page.mouse.click(640, 690);
  [chooser] = await Promise.all([h.page.waitForEvent('filechooser', { timeout: 6000 }).catch(() => undefined), h.tap('l')]);
}
if (!chooser) throw new Error('L never opened the file picker');
await chooser.setFiles(file);
await h.wait(2500);
const after = { save: await h.save(), kept: await h.page.evaluate(() => Object.keys(localStorage).some((k) => k.startsWith('alicorn-adventures-before-restore-'))) };
const ok = after.save.name === 'Sparkle' && after.save.stardust === 412 && after.save.flags.includes('mystery:solved') && after.kept;
console.log('restored', after.save.name, after.save.stardust, '| previous kept aside:', after.kept, ok ? '✓' : '✗');
console.log('ERRORS', h.errors.join('\n') || 'none');
await h.browser.close();
process.exit(ok && !h.errors.length ? 0 : 1);
