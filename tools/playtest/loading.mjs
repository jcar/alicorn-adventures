// Start-up weight: what downloads before the title screen, and that
// kingdom pictures, voices and music arrive later, when needed.
import { start, baseSave } from './harness.mjs';

const h = await start(baseSave(), { url: process.env.GAME_URL });
let ok = true;
const check = (label, cond) => { console.log(`${cond ? '✓' : '✗'} ${label}`); ok &&= !!cond; };
const files = () => h.page.evaluate(() => performance.getEntriesByType('resource').map((r) => ({ url: r.name.split('/assets/')[1] ?? '', kb: Math.round((r.transferSize || r.encodedBodySize) / 1024) })).filter((r) => r.url));
await h.wait(3500);
const boot = await files();
const kb = boot.reduce((n, f) => n + f.kb, 0);
console.log(`  before the title screen: ${boot.length} files, ${kb} KB`);
check('no voice or music downloaded at start', !boot.some((f) => /audio\//.test(f.url)));
check('no forest-only pictures at start', !boot.some((f) => /bg-woods-far|deco-snowman/.test(f.url)));
await h.page.mouse.click(640, 690); await h.tap('Space'); await h.wait(2500);
await h.page.evaluate(() => window.alicorn.go('woods', 'friend')); await h.wait(5000);
const later = await files();
check('forest pictures load on arrival', later.some((f) => /bg-woods-far/.test(f.url)));
check('woods music streams in', later.some((f) => /music-woods/.test(f.url)));
check("Bunny's voice loads when she speaks", later.some((f) => /vo-bunny-ask/.test(f.url)));
check('the woods background is real art, not a placeholder', await h.page.evaluate(() => !window.game.textures.get('bg-woods-far').source[0].isCanvas));
console.log('ERRORS', h.errors.join('\n') || 'none');
await h.browser.close();
process.exit(ok && !h.errors.length ? 0 : 1);
