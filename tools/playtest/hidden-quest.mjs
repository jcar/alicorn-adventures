// Regression: Sunny Shallows' 4th pearl is hidden before the current. After the
// three visible pearls, the game must point her back to sniff, and the current
// must say "help the friend here first" rather than "come back later".
import { start } from './harness.mjs';
const h = await start();
let ok = true;
const check = (label, cond) => { console.log(`${cond ? '✓' : '✗'} ${label}`); ok &&= !!cond; };
const A = (fn, a) => h.page.evaluate(fn, a);
const hint = () => A(() => window.game.registry.get('hint')?.text ?? '');
await h.wait(3000);
for (const [preset, area, items, windX] of [['forest-done', 'shallows', 3, 4450], ['woods-done', 'meadow', 3, 5000]]) {
  await A((p) => window.alicorn.preset(p), preset); await h.wait(2500);
  await A((a) => window.alicorn.go(a, 'start'), area); await h.wait(3000);
  for (let i = 1; i <= items; i++) { await A((k) => window.alicorn.teleport(k), `item-${i}`); await h.wait(600); }
  await h.wait(900);
  check(`${area}: after the visible ones, she's told the last one is hiding`, /hiding/.test(await hint()));
  await A((x) => window.alicorn.teleport(x - 60, 450), windX);
  // Nearby sparkle hints can take turns with it, so watch for a few seconds.
  let seen = false;
  for (let i = 0; i < 12 && !seen; i++) { await h.wait(300); seen = /Finish helping the friend here first/.test(await hint()); }
  check(`${area}: the barrier sends her back to the friend, not "come back later"`, seen);
}
console.log('ERRORS', h.errors.join('\n') || 'none');
await h.browser.close();
process.exit(ok && !h.errors.length ? 0 : 1);
