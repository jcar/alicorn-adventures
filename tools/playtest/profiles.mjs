// The save upgrade, in a real browser: her old single save becomes player 1 with
// everything intact, the old save stays as a backup, and a second player can join.
import { start, baseSave, SAVE_KEY, PROFILES_KEY } from './harness.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const out = process.argv[2] ?? fs.mkdtempSync(path.join(os.tmpdir(), 'alicorn-profiles-'));
const finished = baseSave({
  name: 'Sparkle', stardust: 431, friendsHelped: ['bunny', 'fox', 'owl', 'dragon', 'pip'],
  equipped: { mane: 'starlight', trail: 'superstar', accessory: 'tiara' },
  flags: ['mystery:solved', 'spark:frost', 'gold:woods-gold-1'], favors: { lantern: 3 }, visited: ['woods', 'frost'],
});
let ok = true;
const check = (label, cond) => { console.log(`${cond ? '✓' : '✗'} ${label}`); ok &&= !!cond; };

const h = await start(finished);
await h.wait(3000);
const store = await h.page.evaluate((k) => JSON.parse(localStorage.getItem(k)), PROFILES_KEY);
const legacy = await h.page.evaluate((k) => JSON.parse(localStorage.getItem(k)), SAVE_KEY);
const p1 = store.profiles[0].save;
check('old save became player 1', store.profiles.length === 1 && store.active === 'p1');
check('name, stardust, friends, outfit kept', p1.name === 'Sparkle' && p1.stardust === 431 && p1.friendsHelped.length === 5 && p1.equipped.accessory === 'tiara');
check('flags, favors, visited kept', p1.flags.includes('mystery:solved') && p1.favors.lantern === 3 && p1.visited.includes('frost'));
check('old save left untouched as a backup', JSON.stringify(legacy) === JSON.stringify(finished));
await h.shot(out, 'profiles-1-title');

// Add a second player: → to "New player", SPACE, pick the first name card.
await h.page.mouse.click(640, 680); // empty space, just to focus the page
await h.tap('ArrowRight'); await h.tap('Space'); await h.wait(1500);
check('new player goes to the name picker', (await h.page.evaluate(() => window.game.scene.isActive('NamePicker'))));
await h.tap('ArrowRight'); await h.tap('Space'); await h.wait(2500);
const two = await h.page.evaluate((k) => JSON.parse(localStorage.getItem(k)), PROFILES_KEY);
const newbie = two.profiles.find((p) => p.id === two.active);
check('second player created and active', two.profiles.length === 2 && newbie.save.name === 'Luna' && newbie.save.stardust === 0);
check('player 1 untouched', two.profiles[0].save.stardust === 431);

// Back to the title: both cards show.
await h.page.reload(); await h.wait(3000);
await h.shot(out, 'profiles-2-two-players');
await h.page.mouse.click(640, 680); // empty space, just to focus the page
await h.tap('ArrowLeft'); await h.tap('Space'); await h.wait(2500);
const s = await h.st();
check('picking Sparkle loads her game', s.level === 'glade' && s.helped.length === 5);

console.log('screens in', out);
console.log('ERRORS', h.errors.join('\n') || 'none');
await h.browser.close();
process.exit(ok && !h.errors.length ? 0 : 1);
