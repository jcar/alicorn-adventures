// The Coral Kingdom: Pip's saga news, landing from the Sky Map, swimming,
// currents that need Bubble Jet, sea-glass that needs Shell Song, Luma's altar.
import { start } from './harness.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const out = process.argv[2] ?? fs.mkdtempSync(path.join(os.tmpdir(), 'alicorn-coral-'));
const h = await start();
let ok = true;
const check = (label, cond) => { console.log(`${cond ? '✓' : '✗'} ${label}`); ok &&= !!cond; };
const A = (fn, a) => h.page.evaluate(fn, a);
const go = async (l, w) => { await A(([l, w]) => window.alicorn.go(l, w), [l, w]); await h.wait(2800); };
const hero = async () => (await A(() => window.alicorn.state())).hero;
const flags = async () => (await h.save()).flags;

await h.wait(3000);
await A(() => window.alicorn.preset('ready-for-finale')); await h.wait(2500);
await A(() => window.alicorn.teleport('crystal')); await h.wait(500); await h.tap('ArrowDown'); await h.wait(4000);
// Pip has news once the Heart Crystal shines.
await A(() => window.alicorn.teleport(2730)); await h.wait(1500);
check("Pip tells her about the Guardian Stars", (await flags()).includes('saga:intro'));
await h.shot(out, 'coral-1-pip-news');

// The Sky Map now shows the Coral island (no longer a mystery).
await A(() => window.alicorn.sky('glade')); await h.wait(2500);
const islands = await A(() => window.game.scene.getScene('SkyMap').islands.map((i) => ({ id: i.id, target: i.target, locked: i.locked })));
const coral = islands.find((i) => i.id === 'coral');
check('the Coral island is on the Sky Map and open', coral && coral.target === 'coral-hub' && !coral.locked);
check('it is no longer a mystery island', !islands.some((i) => i.id === 'coral' && !i.target));
await h.shot(out, 'coral-2-skymap');
for (let i = 0; i < islands.length && (await A(() => { const s = window.game.scene.getScene('SkyMap'); return s.islands[s.sel].id; })) !== 'coral'; i++) await h.tap('ArrowRight');
await h.tap('ArrowDown'); await h.wait(3000);
check('landing goes to Coral Cove', (await A(() => window.alicorn.state().level)) === 'coral-hub');
await h.shot(out, 'coral-3-cove');

// Currents push back without Bubble Jet.
await go('shallows', 'start');
check('Sunny Shallows is underwater', await A(() => window.game.scene.getScene('World').player.swimming));
await A(() => window.alicorn.teleport(4400, 450)); await h.wait(200);
await h.page.keyboard.down('ArrowRight'); await h.wait(1500); await h.page.keyboard.up('ArrowRight');
check('a strong current pushes her back without Bubble Jet', (await hero()).x < 4560);
await A(() => window.alicorn.help('marina')); await h.wait(300);
await A(() => window.alicorn.teleport(4300, 450)); await A(() => { window.game.scene.getScene('World').player.facing = 1; }); await h.wait(300);
await h.tap('ArrowDown'); await h.wait(1600);
check('with Bubble Jet she zooms through', (await hero()).x > 4710);

// Sea-glass needs Shell Song.
await A(() => window.alicorn.teleport('shallows-glass')); await h.wait(500); await h.tap('ArrowDown'); await h.wait(900);
check('sea-glass stays shut without Shell Song', !(await flags()).includes('opened:shallows-glass'));
await A(() => window.alicorn.help('tide')); await h.wait(300);
await h.tap('ArrowDown'); await h.wait(1200);
check('Shell Song sings it open', (await flags()).includes('opened:shallows-glass'));
await h.shot(out, 'coral-4-glass');

// Luma's altar.
await A(() => window.alicorn.flag('spark:shallows', 'spark:kelp', 'spark:ship', 'spark:trench'));
await go('coral-hub', 'altar'); await h.tap('ArrowDown'); await h.wait(4500);
check("all four shards restore Luma", (await flags()).includes('star:coral'));
await h.shot(out, 'coral-5-luma');
const unlocked = (await h.save()).unlocked;
check('Luma unlocks the Sea Shell Crown and Ocean mane', unlocked.includes('acc-shellcrown') && unlocked.includes('mane-ocean'));
console.log('screens in', out);
console.log('ERRORS', h.errors.join('\n') || 'none');
await h.browser.close();
process.exit(ok && !h.errors.length ? 0 : 1);
