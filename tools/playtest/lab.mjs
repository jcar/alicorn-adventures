// Engine pieces in the debug-only lab level: a recipe quest (exactly what the
// card says, extras left behind), Shrink with a tiny tunnel (and never stuck
// small), and Fizz Pop through a candy-glass sky room.
import { start } from './harness.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const out = process.argv[2] ?? fs.mkdtempSync(path.join(os.tmpdir(), 'alicorn-lab-'));
const h = await start();
let ok = true;
const check = (label, cond) => { console.log(`${cond ? '✓' : '✗'} ${label}`); ok &&= !!cond; };
const A = (fn, a) => h.page.evaluate(fn, a);
const tp = async (w, y) => { await A(([w, y]) => window.alicorn.teleport(w, y), [w, y]); await h.wait(500); };
const hero = () => A(() => window.alicorn.hero());
const quest = () => A(() => window.alicorn.quest());
const flags = async () => (await h.save()).flags;
const helped = async () => (await h.save()).friendsHelped;
const hint = () => A(() => window.game.registry.get('hint')?.text ?? '');
const reach = (k) => A((k) => window.alicorn.canReach(k), k);

await h.wait(3000);
await A(() => window.alicorn.preset('all-powers')); await h.wait(2500);
await A(() => window.alicorn.go('lab', 'start')); await h.wait(2800);

// ---- recipe: 2 carrots + 1 berry
const q0 = await quest();
check('the recipe card has a row per ingredient', Array.isArray(q0) && q0.length === 2 && q0[0].need === 2 && q0[1].need === 1);
// Regression: the first quest of a session used to never reach the HUD.
check('the HUD shows the recipe card', (await A(() => window.game.scene.getScene('UI').questBox.list.length)) > 0);
await h.shot(out, 'lab-1-recipe-card');
await tp('item-1'); await tp('item-2');
await tp('item-3'); await h.wait(600);
check('a third carrot stays put (the card says 2)', (await quest())[0].have === 2);
check('...and she is told she has enough', /enough/.test(await hint()));
await tp('item-5'); await h.wait(600);
check("the pearl isn't on the card, so it stays put", /not on the recipe card/.test(await hint()));
check('nothing extra was counted', JSON.stringify((await quest()).map((r) => r.have)) === '[2,0]');
await tp('item-4'); await h.wait(1200);
check('the berry fills the card', JSON.stringify((await quest()).map((r) => r.have)) === '[2,1]');
await tp('friend'); await h.wait(2500);
check('the friend takes the finished recipe', (await helped()).includes('lab-chef'));

// ---- Shrink and the tiny tunnel
check('the tunnel star needs Shrink', (await reach('lab-gold-tunnel')).missing?.includes('shrink'));
await tp(2050); await h.tap('ArrowDown'); await h.wait(900);
check('without Shrink the mushroom does nothing', !(await hero()).tiny);
await A(() => window.alicorn.power('shrink'));
await h.tap('ArrowDown'); await h.wait(900);
const small = await hero();
check('with Shrink she becomes tiny (and so does her body)', small.tiny && small.bodyH < 50);
await h.shot(out, 'lab-2-tiny');
const groundY = small.y;
await h.tap('Space', 4); await h.wait(200);
check("tiny wings can't fly: she only hops", (await hero()).y > groundY - 160);
await A(() => { window.game.scene.getScene('World').player.facing = 1; });
await h.hold('ArrowRight', 1500);
const inside = await hero();
check('tiny, she walks into the tunnel', inside.x > 2300 && inside.x < 2850);
await h.tap('ArrowDown'); await h.wait(700);
check("inside the tunnel there's no room to grow, so she stays tiny", (await hero()).tiny);
const why = await hint(); check(`...and is told why (${why})`, /room/.test(why));
await h.shot(out, 'lab-3-in-tunnel');
await h.hold('ArrowRight', 2600);
check('she comes out the other side, picking up the tunnel star', (await hero()).x > 2850 && (await flags()).includes('gold:lab-gold-tunnel'));
await h.wait(400); await h.tap('ArrowDown'); await h.wait(900);
const grown = await hero();
check('with room again, ↓ grows her back, feet still on the ground', !grown.tiny && grown.y < 600);
await h.wait(800);
check('...and she stays standing (no falling through the floor)', (await hero()).y < 600);

// ---- Fizz Pop through candy glass
await tp(3600, 520); await h.wait(600);
await h.tap('ArrowDown'); await h.wait(900);
check('without Fizz Pop the candy glass stays', !(await flags()).includes('opened:lab-ceiling'));
await A(() => window.alicorn.power('fizz'));
await tp(3600, 520); await h.wait(400);
await h.tap('ArrowDown'); await h.wait(500);
check('Fizz Pop bursts the candy glass', (await flags()).includes('opened:lab-ceiling'));
await h.shot(out, 'lab-4-fizz');
await h.wait(800);
await tp('lab-gold-sky'); await h.wait(600);
check('the sky room star is hers', (await flags()).includes('gold:lab-gold-sky'));

// ---- a tens-and-ones number lock (math level 9): ↑ jumps by ten
await A(() => window.alicorn.setSkill('math', 9));
await tp('lab-gate'); await h.tap('ArrowDown'); await h.wait(1500);
const lock = await A(() => { const p = window.game.scene.getScene('Puzzle'); return { open: window.game.scene.isActive('Puzzle'), q: p.q }; });
check('the gate asks a level 9 question', lock.open && /pz-math-9-/.test(lock.q.id) && lock.q.max === 99);
await h.tap('ArrowUp', 3); await h.wait(300);
const v30 = await A(() => window.game.scene.getScene('Puzzle').value); check(`↑ jumps by ten on a big-number lock (${v30})`, v30 === 30);
await h.shot(out, 'lab-5-tens-lock');
await A(() => window.alicorn.solve()); await h.wait(2500);
check('solving it opens the gate', (await flags()).includes('puzzle:lab-gate'));

// ---- a door that opens with a key found in the same area
await tp('lab-door'); await h.tap('ArrowDown'); await h.wait(800);
check('without the key the door stays shut, and she is told why', !(await flags()).includes('opened:lab-door') && /needs the key/.test(await hint()));
await tp('key'); await h.wait(800);
await tp('lab-door'); await h.tap('ArrowDown'); await h.wait(1200);
check('with the key the door opens', (await flags()).includes('opened:lab-door'));

console.log('screens in', out);
console.log('ERRORS', h.errors.join('\n') || 'none');
await h.browser.close();
process.exit(ok && !h.errors.length ? 0 : 1);
