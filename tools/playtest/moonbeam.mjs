// Moonbeam Kingdom: Pip's news about Mama and Papa, landing from the Sky Map,
// Nyx's constellations (draw the star pictures), day and night walls, a
// lantern door clue, the moon altar, and Pip's whole family coming home.
import { start } from './harness.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const out = process.argv[2] ?? fs.mkdtempSync(path.join(os.tmpdir(), 'alicorn-moonbeam-'));
const h = await start();
let ok = true;
const check = (label, cond) => { console.log(`${cond ? '✓' : '✗'} ${label}`); ok &&= !!cond; };
const A = (fn, a) => h.page.evaluate(fn, a);
const go = async (l, w) => { await A(([l, w]) => window.alicorn.go(l, w), [l, w]); await h.wait(2800); };
const tp = async (w, y) => { await A(([w, y]) => window.alicorn.teleport(w, y), [w, y]); await h.wait(450); };
const hero = () => A(() => window.alicorn.hero());
const phase = () => A(() => window.alicorn.phase());
const flags = async () => (await h.save()).flags;
const helped = async () => (await h.save()).friendsHelped;
const quest = () => A(() => window.alicorn.quest());
// Every hint since the last check (another hint can replace one within a moment).
const hint = () => A(() => {
  if (!window.__heard) {
    window.__heard = [];
    window.game.registry.events.on('changedata-hint', (_p, v) => window.__heard.push(v?.text ?? ''));
  }
  const all = window.__heard.join(' | ');
  window.__heard = [];
  return all;
});
const walk = async (ms) => { await A(() => { window.game.scene.getScene('World').player.facing = 1; }); await h.hold('ArrowRight', ms); };

await h.wait(3000);
await A(() => window.alicorn.preset('sweets-done')); await h.wait(2500);
await A(() => window.alicorn.unflag('saga:news:moonbeam')); await hint();

// Pip has news about Mama and Papa once Fluff is helped.
await tp(2730); await h.wait(1500);
check('Pip tells her about Mama and Papa', (await flags()).includes('saga:news:moonbeam'));
check('Luma and Sol twinkle in the Glade sky', await A(() => window.game.scene.getScene('World').family?.members?.length === 2));
await h.shot(out, 'moonbeam-1-pip-news');

// The Sky Map shows the Moonbeam Kingdom, open.
await A(() => window.alicorn.sky('glade')); await h.wait(2500);
const islands = await A(() => window.game.scene.getScene('SkyMap').islands.map((i) => ({ id: i.id, target: i.target, locked: i.locked })));
const moon = islands.find((i) => i.id === 'moonbeam');
check('the Moonbeam Kingdom is on the Sky Map and open', moon && moon.target === 'moonbeam-hub' && !moon.locked);
check('no mystery islands are left', !islands.some((i) => !i.target));
await h.shot(out, 'moonbeam-2-skymap');
for (let i = 0; i < islands.length && (await A(() => { const s = window.game.scene.getScene('SkyMap'); return s.islands[s.sel].id; })) !== 'moonbeam'; i++) await h.tap('ArrowRight');
await h.tap('ArrowDown'); await h.wait(3000);
check('landing goes to the Moonlight Observatory', (await A(() => window.alicorn.state().level)) === 'moonbeam-hub');
await h.shot(out, 'moonbeam-3-observatory');

// Starlit Meadow: it's night, and Nyx wants her three star pictures drawn.
await go('starlit', 'start');
check('Starlit Meadow starts at night', (await phase()) === 'night');
const q0 = await quest();
check("Nyx's quest card counts star pictures", q0 && q0.need === 3 && q0.have === 0);
// Draw the first one by touching its stars in order.
for (const [x, y] of [[1300, 400], [1420, 260], [1540, 400]]) { await tp(x, y + 30); await h.wait(500); }
await h.wait(1500);
check('touching the three stars in order draws the first picture', (await flags()).includes('puzzle:starlit-stars-1') && (await quest()).have === 1);
await h.shot(out, 'moonbeam-4-constellation');
for (const k of ['starlit-stars-2', 'starlit-stars-3']) { await tp(k); await A(() => window.alicorn.solve()); await h.wait(1800); }
await tp('friend'); await h.wait(7000);
check('Nyx is helped and teaches Moon Phase', (await helped()).includes('nyx') && (await h.save()).unlocked.includes('power-moon'));

// A shadow wall at night; the moon dial makes it day.
await tp(4200); await hint(); await walk(1200);
check("at night the shadow wall is in the way", (await hero()).x < 4330);
await tp('dial-1'); await h.tap('ArrowDown'); await h.wait(1200);
check('the moon dial makes it day', (await phase()) === 'day');
await walk(1600);
check('by day the shadow wall is gone', (await hero()).x > 4400);
await h.shot(out, 'moonbeam-5-day');

// Mirror Lake: sun wall, then shadow wall. Read the wall, choose day or night.
await go('mirror', 'start');
await tp(1150); await walk(1200);
check('Mirror Lake: the sun wall blocks by day', (await hero()).x < 1300);
await tp('dial-1'); await h.tap('ArrowDown'); await h.wait(1200);
await walk(2200);
check('...night lets her past, until the shadow wall', (await hero()).x > 1400 && (await hero()).x < 2100);
await tp('dial-2'); await h.tap('ArrowDown'); await h.wait(1200);
await walk(2800);
check('...and day again gets her past the shadow wall', (await hero()).x > 2200);

// Lantern Library: "the red lantern and the one next to it, but not the blue one".
await A(() => window.alicorn.help('selene'));
await go('library', 'start');
const lantern = async (x) => { await tp(x, 520); await h.wait(300); await h.tap('ArrowDown'); await h.wait(500); };
await tp('library-lanterns-2'); await hint(); await h.tap('ArrowDown'); await h.wait(800);
check('the sign reads the clue', /next to it, but not the blue/.test(await hint()));
await lantern(2660); await lantern(2550);
check('red and blue: not quite', /not quite/i.test(await hint()) && !(await flags()).includes('opened:library-lanterns-2'));
await lantern(2550); await lantern(2770);
check('red and yellow: the door opens', (await flags()).includes('opened:library-lanterns-2'));
await h.shot(out, 'moonbeam-6-lanterns');

// The moon altar: Mama and Papa shine again.
await A(() => window.alicorn.flag('spark:starlit', 'spark:mirror', 'spark:library', 'spark:palace'));
await go('moonbeam-hub', 'altar'); await h.tap('ArrowDown'); await h.wait(4500);
check('all four moon shards restore Mama and Papa', (await flags()).includes('star:moonbeam'));
check('the Moonlight mane unlocks', (await h.save()).unlocked.includes('mane-moonlight'));
await h.shot(out, 'moonbeam-7-altar');

// Home: Pip's whole family.
await go('glade', 'start');
await tp(2610); await h.wait(12000);
check("Pip's whole family comes home", (await flags()).includes('family:home'));
const unlocked = (await h.save()).unlocked;
check('the Moon Crown and Starfall trail unlock', unlocked.includes('acc-mooncrown') && unlocked.includes('trail-starfall'));
await h.shot(out, 'moonbeam-8-family');

console.log('screens in', out);
console.log('ERRORS', h.errors.join('\n') || 'none');
await h.browser.close();
process.exit(ok && !h.errors.length ? 0 : 1);
