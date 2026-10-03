/**
 * Headless-browser playtest helpers. Used by the scripts in tools/playtest/
 * to drive the game the way a child would (keys), plus the dev-only
 * `window.game` hook for jumping around and reading state.
 *
 *   GAME_URL     defaults to the local dev server (http://localhost:5173/)
 *   CHROMIUM     path to a Chromium binary (auto-detected from the Playwright cache)
 */
import { chromium } from 'playwright-core';
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export const SAVE_KEY = 'alicorn-adventures-save'; // the old single save (seeding it tests the upgrade too)
export const PROFILES_KEY = 'alicorn-adventures-profiles';

/** In the page: the active player's save (falls back to the old single save). */
const READ_ACTIVE = `(() => {
  const store = JSON.parse(localStorage.getItem('${'alicorn-adventures-profiles'}') || 'null');
  const p = store && store.profiles.find((x) => x.id === store.active);
  return p ? p.save : JSON.parse(localStorage.getItem('${'alicorn-adventures-save'}') || '{}');
})()`;

function findChromium() {
  if (process.env.CHROMIUM) return process.env.CHROMIUM;
  const cache = path.join(os.homedir(), '.cache/ms-playwright');
  const dir = existsSync(cache) && readdirSync(cache).filter((d) => /^chromium-\d+$/.test(d)).sort().pop();
  const exe = dir && path.join(cache, dir, 'chrome-linux64/chrome');
  if (exe && existsSync(exe)) return exe;
  throw new Error('No Chromium found. Run `npx playwright-core install chromium` or set CHROMIUM=/path/to/chrome');
}

/** A save in the current format, with sensible defaults. */
/** An old-style (v2) single save; the game upgrades it into profile 1 on load. */
export const baseSave = (extra = {}) => ({
  version: 2, name: 'Sparkle', stardust: 0, friendsHelped: [], unlocked: [],
  equipped: { mane: 'pink', trail: 'sparkle', accessory: 'none' },
  pendingCelebrations: [], flags: [], favors: {}, visited: [], ...extra,
});

export async function start(save, { url = process.env.GAME_URL ?? 'http://localhost:5173/', touch = false } = {}) {
  const browser = await chromium.launch({
    executablePath: findChromium(),
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, acceptDownloads: true, hasTouch: touch });
  const errors = [];
  page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}\n${(e.stack ?? '').split('\n').slice(0, 4).join('\n')}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push(`[console] ${m.text()}`); });
  if (save)
    await page.addInitScript(([key, s]) => {
      if (!sessionStorage.getItem('seeded')) {
        localStorage.setItem(key, JSON.stringify(s));
        sessionStorage.setItem('seeded', '1');
      }
    }, [SAVE_KEY, save]);
  await page.goto(url ?? process.env.GAME_URL ?? 'http://localhost:5173/');

  const wait = (ms) => page.waitForTimeout(ms);
  const tap = async (key, n = 1) => {
    for (let i = 0; i < n; i++) { await page.keyboard.down(key); await wait(90); await page.keyboard.up(key); await wait(220); }
  };
  const hold = async (key, ms) => { await page.keyboard.down(key); await wait(ms); await page.keyboard.up(key); };
  const tp = (x, y) => page.evaluate(([x, y]) => window.game.scene.getScene('World').player.body.reset(x, y), [x, y]);
  const face = (dir) => page.evaluate((d) => { window.game.scene.getScene('World').player.facing = d; }, dir);
  const save_ = () => page.evaluate(READ_ACTIVE);
  const st = () => page.evaluate((readActive) => {
    const g = window.game; const w = g.scene.getScene('World'); const p = w?.player;
    const s = eval(readActive);
    return {
      active: g.scene.getScenes(true).map((x) => x.scene.key), level: w?.level?.id, p: p && [Math.round(p.x), Math.round(p.y)],
      flags: s.flags, favors: s.favors, helped: s.friendsHelped, stardust: s.stardust, hint: g.registry.get('hint')?.text,
    };
  }, READ_ACTIVE);
  const shot = (dir, name) => page.screenshot({ path: path.join(dir, `${name}.png`) });
  /** Click to focus, then press Space through the title screen. */
  const boot = async () => { await wait(3000); await page.mouse.click(640, 360); await tap('Space'); await wait(1500); };
  return { browser, page, errors, wait, tap, hold, tp, face, st, save: save_, shot, boot };
}
