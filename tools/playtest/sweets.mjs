// Sweet Treat Valley: Pip's news about Sol, landing from the Sky Map, Bea's
// recipe (read the card, count, leave extras), Shrink through a tiny tunnel,
// the spoon and the cocoa door, Fizz Pop into Sol's last sky room, and Sol's altar.
import { start } from './harness.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const out = process.argv[2] ?? fs.mkdtempSync(path.join(os.tmpdir(), 'alicorn-sweets-'));
const h = await start();
let ok = true;
const check = (label, cond) => { console.log(`${cond ? '✓' : '✗'} ${label}`); ok &&= !!cond; };
const A = (fn, a) => h.page.evaluate(fn, a);
const go = async (l, w) => { await A(([l, w]) => window.alicorn.go(l, w), [l, w]); await h.wait(2800); };
const tp = async (w, y) => { await A(([w, y]) => window.alicorn.teleport(w, y), [w, y]); await h.wait(500); };
const hero = () => A(() => window.alicorn.hero());
const flags = async () => (await h.save()).flags;
const helped = async () => (await h.save()).friendsHelped;
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
const quest = () => A(() => window.alicorn.quest());

await h.wait(3000);
await A(() => window.alicorn.preset('coral-done')); await h.wait(2500);
await hint();

// Pip has news about Sol once Grandma Tide is helped.
await A(() => window.alicorn.teleport(2730)); await h.wait(1500);
check('Pip tells her about Sol', (await flags()).includes('saga:news:sweets'));
await h.shot(out, 'sweets-1-pip-news');

// The Sky Map shows Sweet Treat Valley, open.
await A(() => window.alicorn.sky('glade')); await h.wait(2500);
const islands = await A(() => window.game.scene.getScene('SkyMap').islands.map((i) => ({ id: i.id, target: i.target, locked: i.locked })));
const sweets = islands.find((i) => i.id === 'sweets');
check('Sweet Treat Valley is on the Sky Map and open', sweets && sweets.target === 'sweets-hub' && !sweets.locked);
await h.shot(out, 'sweets-2-skymap');
for (let i = 0; i < islands.length && (await A(() => { const s = window.game.scene.getScene('SkyMap'); return s.islands[s.sel].id; })) !== 'sweets'; i++) await h.tap('ArrowRight');
await h.tap('ArrowDown'); await h.wait(3000);
check('landing goes to Candy Square', (await A(() => window.alicorn.state().level)) === 'sweets-hub');
await h.shot(out, 'sweets-3-square');

// Bea's recipe: 3 strawberries, 2 lemons, 1 egg.
await go('lollipop', 'start');
const card = await quest();
check('the recipe card has three rows', Array.isArray(card) && card.map((r) => r.need).join() === '3,2,1');
await hint(); await tp('item-3'); await h.wait(600);
check("the berry isn't on the card", /not on the recipe card/.test(await hint()));
for (const k of ['item-1', 'item-2', 'item-4', 'item-5', 'item-6', 'item-7']) { await tp(k); await h.wait(400); }
await hint(); await tp('item-8'); await h.wait(600);
const q8 = await quest(), h8 = await hint(); check(`a third lemon stays put (${q8[1].have}; ${h8})`, q8[1].have === 2 && /enough/.test(h8));
check('the card is complete', (await quest()).every((r) => r.have >= r.need));
await h.shot(out, 'sweets-4-recipe');
await tp('friend'); await h.wait(6000);
check('Bea is helped and teaches Shrink', (await helped()).includes('bea') && (await h.save()).unlocked.includes('power-shrink'));

// Shrink at the mushroom, through the tiny tunnel to Sol's first sparkle.
await tp(4950); await h.wait(400); await h.tap('ArrowDown'); await h.wait(900);
check('the mushroom makes her tiny', (await hero()).tiny);
await A(() => { window.game.scene.getScene('World').player.facing = 1; });
await h.hold('ArrowRight', 2400);
check("tiny, she reaches Sol's sparkle in the tunnel", (await flags()).includes('spark:lollipop'));
await h.shot(out, 'sweets-5-tunnel');

// Chocolate River: the cocoa door needs Duck's spoon.
await A(() => window.alicorn.help('millie'));
await go('chocolate', 'start');
check('Chocolate River is a swim', await A(() => window.game.scene.getScene('World').player.swimming));
await hint(); await tp('chocolate-door'); await h.tap('ArrowDown'); await h.wait(900);
check('the cocoa door stays shut without the spoon', !(await flags()).includes('opened:chocolate-door') && /spoon/.test(await hint()));
await tp('spoon'); await h.wait(900);
await tp('chocolate-door'); await h.tap('ArrowDown'); await h.wait(1500);
check('the spoon opens the cocoa door', (await flags()).includes('opened:chocolate-door'));
await h.shot(out, 'sweets-6-door');

// Cotton Candy Clouds: Fluff teaches Fizz Pop; Sol's last sparkle is in the sky room.
await A(() => window.alicorn.help('duck'));
await go('cottoncandy', 'start');
await tp(5780, 500); await h.wait(500); await h.tap('ArrowDown'); await h.wait(900);
check('candy glass stays shut before Fluff', !(await flags()).includes('opened:cottoncandy-candy-glass'));
await A(() => window.alicorn.help('fluff')); await h.wait(300);
await tp(5780, 500); await h.wait(500); await h.tap('ArrowDown'); await h.wait(500);
check('Fizz Pop bursts the candy glass', (await flags()).includes('opened:cottoncandy-candy-glass'));
await h.shot(out, 'sweets-7-fizz');
for (let i = 0; i < 6 && !(await flags()).includes('spark:cottoncandy'); i++) { await h.tap('Space'); await h.wait(250); }
await tp('spark'); await h.wait(800);
check("Sol's last sparkle is hers", (await flags()).includes('spark:cottoncandy'));

// Sol's altar.
await A(() => window.alicorn.flag('spark:gumdrop', 'spark:chocolate'));
await go('sweets-hub', 'altar'); await h.tap('ArrowDown'); await h.wait(4500);
check('all four sparkles restore Sol', (await flags()).includes('star:sweets'));
await h.shot(out, 'sweets-8-sol');
const unlocked = (await h.save()).unlocked;
check('Sol unlocks the Sugar Crown and Candy Swirl mane', unlocked.includes('acc-sugarcrown') && unlocked.includes('mane-candy'));

console.log('screens in', out);
console.log('ERRORS', h.errors.join('\n') || 'none');
await h.browser.close();
process.exit(ok && !h.errors.length ? 0 : 1);
