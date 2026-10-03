// The debug kit itself: presets, go-to markers, overlay, instant solves.
import { start } from './harness.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const out = process.argv[2] ?? fs.mkdtempSync(path.join(os.tmpdir(), 'alicorn-debug-'));
const h = await start();
await h.wait(3000);
const A = (expr) => h.page.evaluate(expr);
let ok = true;
const check = (label, cond) => { console.log(`${cond ? '✓' : '✗'} ${label}`); ok &&= !!cond; };

check('alicorn API exists', await A(() => typeof window.alicorn === 'object'));
await A(() => window.alicorn.preset('all-powers')); await h.wait(2500);
let s = await A(() => window.alicorn.state());
check('preset all-powers → Home with 4 friends', s.level === 'glade' && s.friends.length === 4);

await A(() => window.alicorn.go('woods', 'woods-chest-cave')); await h.wait(2500);
s = await A(() => window.alicorn.state());
check('go(woods, woods-chest-cave) lands by the chest', s.level === 'woods' && Math.abs(s.hero.x - 4110) < 20);
console.log('  ', await A(() => window.alicorn.overlay(true))); await h.wait(400);
await h.shot(out, 'debug-overlay');

await A(() => window.alicorn.teleport('woods-pattern')); await h.wait(500);
console.log('  ', await A(() => window.alicorn.solve())); await h.wait(1200);
check('solve() finishes the pattern', (await h.save()).flags.includes('puzzle:woods-pattern'));

await A(() => window.alicorn.teleport('woods-gate')); await h.wait(600);
await h.tap('ArrowDown'); await h.wait(1500);
check('number lock opens', await A(() => window.game.scene.isActive('Puzzle')));
await A(() => window.alicorn.solve()); await h.wait(2000);
check('solve() opens the gate', (await h.save()).flags.includes('puzzle:woods-gate'));

await A(() => window.alicorn.preset('ready-for-finale')); await h.wait(2500);
await A(() => window.alicorn.teleport('crystal')); await h.wait(600);
await h.tap('ArrowDown'); await h.wait(3500);
check('preset ready-for-finale → finale solves the mystery', (await h.save()).flags.includes('mystery:solved'));
await h.shot(out, 'debug-finale');

console.log('screens in', out);
console.log('ERRORS', h.errors.join('\n') || 'none');
await h.browser.close();
process.exit(ok && !h.errors.length ? 0 : 1);
