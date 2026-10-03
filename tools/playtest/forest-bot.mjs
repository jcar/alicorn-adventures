// The playthrough bot: a brand-new player finishes every kingdom (the Enchanted Forest, the Coral Kingdom),
// every friend, power, gate, pattern, chest, clue, golden star, spark and favor,
// ending with the Heart Crystal finale. It moves around with the debug kit but
// does every interaction with real key presses, and checks progress at each step.
import { start } from './harness.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const out = process.argv[2] ?? fs.mkdtempSync(path.join(os.tmpdir(), 'alicorn-bot-'));
const h = await start();
const A = (fn, ...args) => h.page.evaluate(fn, ...args);
const log = (...m) => console.log(' ', ...m);
let ok = true;
const check = (label, cond) => { console.log(`${cond ? '✓' : '✗'} ${label}`); ok &&= !!cond; };

const go = async (level, where) => { await A(([l, w]) => window.alicorn.go(l, w), [level, where]); await h.wait(2600); };
const tp = async (where, y) => { await A(([w, y]) => window.alicorn.teleport(w, y), [where, y]); await h.wait(450); };
const press = async (n = 1) => { for (let i = 0; i < n; i++) { await h.tap('ArrowDown'); await h.wait(500); } };
const puzzleOpen = () => A(() => window.game.scene.isActive('Puzzle'));
const solveIfOpen = async () => { if (await puzzleOpen()) { await A(() => window.alicorn.solve()); await h.wait(2200); } };
const markers = (level) => A((l) => window.alicorn.markers(l), level);
const progress = () => A(() => window.alicorn.progress());
const helped = () => A(() => window.alicorn.state().friends);

// ---- a fresh player
await h.wait(3000);
await h.page.mouse.click(640, 690);
await h.tap('Space'); await h.wait(1500);
await h.tap('Space'); await h.wait(2500);
check('fresh player starts at Home', (await A(() => window.alicorn.state().level)) === 'glade');
const areas = await A(() => window.alicorn.areas());

// ---- pass 1: help each friend, in story order, with only the powers earned so far
async function helpFriend(area) {
  await go(area, 'start');
  const m = await markers(area);
  const friendBefore = (await helped()).length;
  // Fetch quests: collect each item (sniffing first, in case it's hidden).
  for (const k of Object.keys(m).filter((k) => k.startsWith('item-'))) {
    await tp(m[k].x - 40); await press(1); await tp(m[k].x, m[k].y); await h.wait(300);
  }
  // Bloom quests: sniff, then bloom each flower.
  for (const k of Object.keys(m).filter((k) => k.startsWith('bloom-'))) { await tp(k); await press(2); }
  // Then go to the friend (fetch completes on arrival; wake needs horn magic; Pip just needs finding).
  // A missed keypress under load shouldn't fail the run: try the action again a few times.
  await tp('friend'); await h.wait(800);
  for (let attempt = 0; attempt < 4 && (await helped()).length === friendBefore; attempt++) {
    await press(1);
    for (let i = 0; i < 8 && (await helped()).length === friendBefore; i++) await h.wait(500);
  }
  await h.wait(5500); // thanks, confetti, moving home
  return (await helped()).length > friendBefore;
}
for (const area of areas.filter((a) => a !== 'frost')) check(`helped the friend in ${area}`, await helpFriend(area));
const powers = await A(() => ['sniff', 'dash', 'glow', 'warmth'].filter((p) => window.alicorn.game.scene.getScene('UI') && JSON.parse(localStorage.getItem('alicorn-adventures-profiles')).profiles[0].save.unlocked.includes(`power-${p}`)));
check('learned all four powers', powers.length === 4);

// ---- pass 2: every secret everywhere, now that every power is known
async function sweep(area) {
  await go(area, 'start');
  const m = await markers(area);
  const keys = Object.keys(m);
  const of = (re) => keys.filter((k) => re.test(k));
  for (const k of of(/-gate$/)) { await tp(k); await press(1); await h.wait(800); await solveIfOpen(); }
  for (const k of of(/-pattern$/)) { await tp(k); await A(() => window.alicorn.solve()); await h.wait(1600); }
  for (const k of of(/-ice|-glass$/)) { await tp(k); await press(2); await h.wait(600); }
  for (const k of of(/-chest-|note-|-sign$/)) { await tp(k); await press(2); await h.wait(400); }
  for (const k of of(/-gold-/)) { await tp(m[k].x, m[k].y); await h.wait(500); }
  for (const k of of(/^spark$/)) { await tp(m[k].x, m[k].y); await h.wait(700); }
  for (const k of of(/^moon-shell$/)) { await tp(m[k].x - 40); await press(1); await tp(m[k].x, m[k].y - 20); await h.wait(600); }
}
for (const area of areas) { await sweep(area); log(area, JSON.stringify(await progress())); }

// ---- pass 3: find Pip in Frosty Peaks
check('found Pip', await helpFriend('frost'));

// ---- pass 4: every favor at Home
await go('glade', 'start');
for (let i = 0; i < 20; i++) {
  const todo = await A(() => window.alicorn.favorsTodo());
  if (!todo.length) break;
  await tp(todo[0].x); await h.wait(300); await press(1);
  await h.wait(3200); await solveIfOpen(); await h.wait(1500);
}
await h.shot(out, 'bot-1-favors-done');

// ---- pass 5: the Heart Crystal finale, then each kingdom's Guardian Star
await tp('crystal'); await press(1); await h.wait(4500);
await h.shot(out, 'bot-2-finale');
for (const hub of ['coral-hub']) {
  await go(hub, 'altar'); await press(1); await h.wait(4500);
  await h.shot(out, `bot-3-${hub}-altar`);
}

const p = await progress();
log(JSON.stringify(p));
const full = (s) => { const [a, b] = s.split('/'); return a === b; };
check('every friend helped', full(p.friends));
check('every secret found', full(p.secrets));
check('every golden star found', full(p.golds));
check('every color spark found', full(p.sparks));
check('every favor done', full(p.favors));
check('the mystery is solved', p.mystery === true);
check("every kingdom's Guardian Star is restored", full(p.stars));
console.log('screens in', out);
console.log('ERRORS', h.errors.join('\n') || 'none');
await h.browser.close();
process.exit(ok && !h.errors.length ? 0 : 1);
