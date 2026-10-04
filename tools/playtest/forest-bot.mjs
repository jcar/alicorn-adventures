// The playthrough bot: a brand-new player finishes every kingdom, each in ONE
// forward pass (friends, sparks, clues, favors and the finale, never going back
// to an earlier area), then an optional bonus sweep for chests and golden stars
// behind later powers. It moves around with the debug kit but
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

// Help an area's friend, with only the powers earned so far.
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
const powers = () => A(() => JSON.parse(localStorage.getItem('alicorn-adventures-profiles')).profiles[0].save.unlocked.filter((u) => u.startsWith('power-')));
const flags = () => A(() => JSON.parse(localStorage.getItem('alicorn-adventures-profiles')).profiles[0].save.flags);
const reach = (k) => A((k) => window.alicorn.canReach(k).ok, k);

// Collect what's in an area. On the first pass she only goes where the powers
// she has right now can take her (teleporting would skip walls, so ask first).
async function sweep(area, firstPass) {
  await go(area, 'start');
  const m = await markers(area);
  const keys = Object.keys(m);
  const of = async (re) => {
    const ks = keys.filter((k) => re.test(k));
    if (!firstPass) return ks;
    const ok = [];
    for (const k of ks) if (await reach(k)) ok.push(k);
    return ok;
  };
  for (const k of await of(/-gate$/)) { await tp(k); await press(1); await h.wait(800); await solveIfOpen(); }
  for (const k of await of(/-pattern$/)) { await tp(k); await A(() => window.alicorn.solve()); await h.wait(1600); }
  for (const k of await of(/-ice|-glass$/)) { await tp(k); await press(2); await h.wait(600); }
  for (const k of await of(/-chest-|note-|-sign$/)) { await tp(k); await press(2); await h.wait(400); }
  for (const k of await of(/-gold-/)) { await tp(m[k].x, m[k].y); await h.wait(500); }
  for (const k of await of(/^spark$/)) { await tp(m[k].x, m[k].y); await h.wait(700); }
  for (const k of await of(/^moon-shell$/)) { await tp(m[k].x - 40); await press(1); await tp(m[k].x, m[k].y - 20); await h.wait(600); }
}

async function doFavors() {
  await go('glade', 'start');
  for (let i = 0; i < 20; i++) {
    const todo = await A(() => window.alicorn.favorsTodo());
    if (!todo.length) break;
    await tp(todo[0].x); await h.wait(300); await press(1);
    await h.wait(3200); await solveIfOpen(); await h.wait(1500);
  }
}

// ---- each world in ONE forward pass: help the friend, then take everything
// reachable with the powers known so far. Sparks, shards and clues must all be
// found this way: finishing a world never means going back to an earlier area.
const kingdoms = await A(() => window.alicorn.kingdoms());
for (const k of kingdoms) {
  for (const area of k.areas) {
    // (Pip only comes out once the clues are read, so a friend may need the sweep first.)
    let helpedHere = await helpFriend(area);
    await sweep(area, true);
    if (!helpedHere) helpedHere = await helpFriend(area);
    check(`${k.id}: helped the friend in ${area}`, helpedHere);
  }
  const f = await flags();
  const sparksLeft = k.areas.filter((a) => a !== 'frost' && !f.includes(`spark:${a}`));
  const cluesLeft = (await Promise.all(k.areas.map(async (a) => Object.keys(await markers(a)).filter((id) => /note-\d+$/.test(id)))))
    .flat().filter((id) => !f.includes(`secret:${id}`));
  check(`${k.id}: every spark found in one forward pass ${sparksLeft.join(' ')}`, !sparksLeft.length);
  check(`${k.id}: every clue found in one forward pass ${cluesLeft.join(' ')}`, !cluesLeft.length);
  log(k.id, (await powers()).join(' '), JSON.stringify(await progress()));

  // the world's finale, straight away
  await doFavors();
  if (k.id === 'forest') {
    await tp('crystal'); await press(1); await h.wait(4500);
    await h.shot(out, 'bot-1-forest-finale');
    check('forest: the mystery is solved without going back', (await progress()).mystery === true);
  }
  if (k.saga) {
    await go(k.hub, 'altar'); await press(1); await h.wait(4500);
    await h.shot(out, `bot-2-${k.id}-altar`);
    check(`${k.id}: Guardian Star restored without going back`, (await flags()).includes(`star:${k.id}`));
  }
}

// ---- the optional bonus sweep: chests and golden stars behind later powers
for (const area of areas) { await sweep(area, false); log(area, JSON.stringify(await progress())); }
await doFavors();
await h.shot(out, 'bot-3-all-done');

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
