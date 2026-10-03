// Adaptive puzzles: gates ask bank questions at her level, first-try wins move
// the level up, struggles show a counting hint, crystal tunes follow memory,
// and the grown-up dial changes levels.
import { start, baseSave } from './harness.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const out = process.argv[2] ?? fs.mkdtempSync(path.join(os.tmpdir(), 'alicorn-puzzles-'));
const h = await start(baseSave({ friendsHelped: [] }));
let ok = true;
const check = (label, cond) => { console.log(`${cond ? '✓' : '✗'} ${label}`); ok &&= !!cond; };
const A = (fn, arg) => h.page.evaluate(fn, arg);
const skills = () => A(() => window.alicorn.skills());
const puzzleQ = () => A(() => window.game.scene.getScene('Puzzle').q);
const open = () => A(() => window.game.scene.isActive('Puzzle'));

await h.boot();
const before = await skills();
check('a new player starts gently (math 2, memory 1)', before.math === 2 && before.memory === 1);

// The woods gate is math, one level easier than hers.
await A(() => window.alicorn.go('woods', 'woods-gate')); await h.wait(2600);
await h.tap('ArrowDown'); await h.wait(1500);
let q = await puzzleQ();
check(`woods gate asks a level-1 math question: "${q?.text}"`, q?.id?.startsWith('pz-math-1-'));
await h.shot(out, 'puzzle-1-question');
// Two wrong answers → the counting hint appears.
for (let i = 0; i < 6 && (await A(() => window.game.scene.getScene('Puzzle').misses)) < 2; i++) { await h.tap('Space'); await h.wait(500); }
check('after two misses, stars appear to count', await A(() => !!window.game.scene.getScene('Puzzle').hint));
await h.shot(out, 'puzzle-2-hint');
await A(() => window.alicorn.solve()); await h.wait(2000);
check('the gate opened', (await h.save()).flags.includes('puzzle:woods-gate'));
check('struggling moved math down a level', (await skills()).math === 1);

// Two first-try wins move it back up.
await A(() => window.alicorn.setSkill('math', 3)); await h.wait(200);
for (let i = 0; i < 2; i++) {
  await A(() => window.alicorn.go('clouds', 'clouds-gate')); await h.wait(2600);
  await h.tap('ArrowDown'); await h.wait(1500);
  q = await puzzleQ();
  log(`clouds gate (math +1): "${q?.text}"`);
  await A(() => window.alicorn.solve()); await h.wait(2000);
  await A(() => window.alicorn.unflag('puzzle:clouds-gate'));
}
function log(m) { console.log('  ' + m); }
check('two first-try wins moved math up a level', (await skills()).math === 4);

// Reading and logic gates.
await A(() => window.alicorn.go('meadow', 'meadow-gate')); await h.wait(2600);
await h.tap('ArrowDown'); await h.wait(1500);
q = await puzzleQ();
check(`meadow gate is a reading question: "${q?.text}"`, q?.id?.startsWith('pz-reading-'));
await h.shot(out, 'puzzle-3-reading');
await A(() => window.alicorn.solve()); await h.wait(2000);
await A(() => window.alicorn.go('waterfall', 'waterfall-gate')); await h.wait(2600);
await h.tap('ArrowDown'); await h.wait(1500);
q = await puzzleQ();
check(`waterfall gate is a logic question: "${q?.text}"`, q?.id?.startsWith('pz-logic-'));
await A(() => window.alicorn.solve()); await h.wait(2000);

// Crystal tunes follow memory.
await A(() => window.alicorn.setSkill('memory', 4));
await A(() => window.alicorn.go('meadow', 'meadow-pattern')); await h.wait(2600);
await h.tap('ArrowDown'); await h.wait(500);
const notes = (await A(() => window.alicorn.pattern())).notes;
check(`memory level 4 → a ${notes}-note tune (meadow, offset 0)`, notes === 6);
await A(() => window.alicorn.setSkill('memory', 1));
await A(() => window.alicorn.go('woods', 'woods-pattern')); await h.wait(2600);
await h.tap('ArrowDown'); await h.wait(500);
const easy = (await A(() => window.alicorn.pattern())).notes;
check(`memory level 1 in the woods (offset -1) → a ${easy}-note tune`, easy === 3);
console.log('screens in', out);
console.log('ERRORS', h.errors.join('\n') || 'none');
await h.browser.close();
process.exit(ok && !h.errors.length ? 0 : 1);
