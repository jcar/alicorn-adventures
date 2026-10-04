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
  // Nearby sparkle hints can take turns with it (and replace it within a
  // moment), so record every hint as it's set rather than polling.
  await A(() => {
    window.__heard = [];
    window.__onHint = (_p, v) => window.__heard.push(v?.text ?? '');
    window.game.registry.events.on('changedata-hint', window.__onHint);
  });
  await A((x) => window.alicorn.teleport(x - 60, 450), windX);
  await h.wait(3600);
  const heard = await A(() => { window.game.registry.events.off('changedata-hint', window.__onHint); return window.__heard; });
  const seen = heard.some((t) => /Finish helping the friend here first/.test(t));
  if (!seen) console.log('  heard:', heard);
  check(`${area}: the barrier sends her back to the friend, not "come back later"`, seen);
}
console.log('ERRORS', h.errors.join('\n') || 'none');
await h.browser.close();
process.exit(ok && !h.errors.length ? 0 : 1);
