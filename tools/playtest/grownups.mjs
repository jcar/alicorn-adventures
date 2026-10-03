// The Grown-up Corner: hold ⚙ to open, change settings, remove a player only by holding.
import { start, baseSave, PROFILES_KEY } from './harness.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const out = process.argv[2] ?? fs.mkdtempSync(path.join(os.tmpdir(), 'alicorn-grownups-'));
const h = await start(baseSave({ name: 'Sparkle', stardust: 50 }));
let ok = true;
const check = (label, cond) => { console.log(`${cond ? '✓' : '✗'} ${label}`); ok &&= !!cond; };
const active = (k) => h.page.evaluate((k) => window.game.scene.isActive(k), k);
const store = () => h.page.evaluate((k) => JSON.parse(localStorage.getItem(k)), PROFILES_KEY);

await h.wait(3000);
// Make a second player first (through the real flow).
await h.page.mouse.click(640, 690);
await h.tap('ArrowRight'); await h.tap('Space'); await h.wait(1500); await h.tap('Space'); await h.wait(2500);
check('two players exist', (await store()).profiles.length === 2);
await h.page.reload(); await h.wait(3000);

// A quick tap on ⚙ does nothing; holding it opens the corner.
await h.page.mouse.click(1224, 56); await h.wait(400);
check('a quick tap on ⚙ does not open it', !(await active('GrownUps')));
await h.page.mouse.move(1224, 56); await h.page.mouse.down(); await h.wait(2400); await h.page.mouse.up(); await h.wait(1200);
check('holding ⚙ opens the Grown-up Corner', await active('GrownUps'));
await h.shot(out, 'grownups-1');

// Sound off (row 7), then pick player 2 (row 1 → right), then hold "Remove" (row 5).
await h.tap('ArrowDown', 6); await h.tap('Space'); await h.wait(300);
check('sound turns off and is remembered', (await h.page.evaluate(() => JSON.parse(localStorage.getItem('alicorn-adventures-settings')))).muted === true);
await h.tap('ArrowUp', 6); await h.tap('ArrowRight'); await h.wait(300);
await h.tap('ArrowDown', 4);
await h.tap('Space'); await h.wait(500);
check('a tap on "Remove" removes nothing', (await store()).profiles.length === 2);
await h.hold('Space', 2600); await h.wait(500);
const after = await store();
check('holding "Remove" removes only that player', after.profiles.length === 1 && after.profiles[0].save.name === 'Sparkle');
await h.shot(out, 'grownups-2-removed');
await h.tap('Escape'); await h.wait(1500);
check('Esc goes back to the title', (await active('Title')) && !(await active('GrownUps')));
console.log('screens in', out);
console.log('ERRORS', h.errors.join('\n') || 'none');
await h.browser.close();
process.exit(ok && !h.errors.length ? 0 : 1);
