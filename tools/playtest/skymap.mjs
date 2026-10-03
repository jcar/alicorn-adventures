// The new world structure, walked like a child would: Home → Star Gate → Sky Map
// → Enchanted Forest hub → Whispering Woods → back to the hub → Sky Map → Home.
import { start, baseSave } from './harness.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const out = process.argv[2] ?? fs.mkdtempSync(path.join(os.tmpdir(), 'alicorn-sky-'));
const h = await start(baseSave({ friendsHelped: ['bunny', 'fox'], visited: ['woods'] }));
let ok = true;
const check = (label, cond) => { console.log(`${cond ? '✓' : '✗'} ${label}`); ok &&= !!cond; };
const scenes = () => h.page.evaluate(() => window.game.scene.getScenes(true).map((s) => s.scene.key));
const level = () => h.page.evaluate(() => window.game.scene.isActive('World') ? window.game.scene.getScene('World').level.id : null);

await h.boot();
check('starts at Home', (await level()) === 'glade');
await h.tp(460, 540); await h.wait(700); await h.shot(out, 'sky-1-star-gate');
await h.tap('ArrowDown'); await h.wait(2000);
check('Star Gate opens the Sky Map', (await scenes()).includes('SkyMap'));
await h.shot(out, 'sky-2-map');
await h.tap('ArrowRight'); await h.wait(900); await h.shot(out, 'sky-3-forest-selected');
await h.tap('ArrowDown'); await h.wait(2500);
check('landing on the forest island goes to its hub', (await level()) === 'forest-hub');
await h.shot(out, 'sky-4-hub');
await h.tp(520, 540); await h.wait(500); await h.tap('ArrowDown'); await h.wait(2500);
check('hub door goes into Whispering Woods', (await level()) === 'woods');
await h.tp(150, 540); await h.wait(500); await h.tap('ArrowDown'); await h.wait(2500);
const back = await h.st();
check('woods "Home" door returns to the hub, by the woods door', back.level === 'forest-hub' && Math.abs(back.p[0] - 520) < 30);
await h.tp(150, 540); await h.wait(500); await h.tap('ArrowDown'); await h.wait(2000);
check('hub Sky Map door opens the Sky Map', (await scenes()).includes('SkyMap'));
await h.tap('ArrowLeft'); await h.wait(900); await h.tap('Enter'); await h.wait(2500);
const home = await h.st();
check('fly home lands at the Star Gate', home.level === 'glade' && Math.abs(home.p[0] - 460) < 30);
// Mystery island: can't land
await h.tp(460, 540); await h.wait(400); await h.tap('ArrowDown'); await h.wait(2000);
await h.tap('ArrowRight', 2); await h.wait(800); await h.tap('ArrowDown'); await h.wait(1200);
check('mystery islands stay put (coming soon)', (await scenes()).includes('SkyMap'));
await h.shot(out, 'sky-5-mystery');
console.log('screens in', out);
console.log('ERRORS', h.errors.join('\n') || 'none');
await h.browser.close();
process.exit(ok && !h.errors.length ? 0 : 1);
