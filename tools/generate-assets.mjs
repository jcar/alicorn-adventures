#!/usr/bin/env node
/**
 * Alicorn Adventures asset generator (Gemini).
 *
 *   npm run assets                       generate everything that's missing
 *   npm run assets -- --only alicorn-pink,friend-*   just these (a trailing * matches a prefix)
 *   npm run assets -- --kind voice       only images | voice | music
 *   npm run assets -- --force            regenerate even if the file exists
 *   npm run assets -- --dry-run          show what would be generated
 *   npm run assets -- --list-models      list models this API key can use
 *   npm run assets -- --index            only rebuild public/assets/assets.json
 *   npm run assets -- --rekey            redo the cut-out/resize from saved originals (no API calls)
 *
 * Reads GEMINI_API_KEY from .env. Writes to public/assets/{images,audio}/ and
 * rebuilds public/assets/assets.json, which the game reads at startup. Any
 * PNG/WAV/MP3/OGG you drop into those folders by hand (kids' drawings!) is
 * picked up the same way, as long as it's named after a texture key.
 */
import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import sharp from 'sharp';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IMG_DIR = path.join(ROOT, 'public/assets/images');
const AUDIO_DIR = path.join(ROOT, 'public/assets/audio');
const INDEX = path.join(ROOT, 'public/assets/assets.json');

const MODELS = {
  image: process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image',
  tts: process.env.GEMINI_TTS_MODEL || 'gemini-3.8-flash-tts',
  music: process.env.GEMINI_MUSIC_MODEL || 'lyria-3-clip-preview',
};

// ------------------------------------------------------------------ cli

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const only = opt('only')?.split(',').map((s) => s.trim()).filter(Boolean);
const kind = opt('kind');
const force = flag('force');
const dryRun = flag('dry-run');

const wanted = (id, k) => {
  if (kind && kind !== k) return false;
  if (!only) return true;
  return only.some((p) => (p.endsWith('*') ? id.startsWith(p.slice(0, -1)) : id === p));
};

// ------------------------------------------------------------------ helpers

let ai;
function client() {
  if (ai) return ai;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your-key-here') {
    console.error('Missing GEMINI_API_KEY. Copy .env.example to .env and paste your key.');
    process.exit(1);
  }
  ai = new GoogleGenAI({ apiKey });
  return ai;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function withRetry(label, fn, tries = 4) {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (e) {
      const msg = String(e?.message ?? e);
      const retryable = /429|500|503|RESOURCE_EXHAUSTED|UNAVAILABLE|overloaded|deadline/i.test(msg);
      if (!retryable || i >= tries) throw e;
      const wait = 2000 * 2 ** i;
      console.warn(`  ${label}: busy, retrying in ${wait / 1000}s (${msg.slice(0, 80)})`);
      await sleep(wait);
    }
  }
}

function inlineParts(res) {
  return (res?.candidates ?? []).flatMap((c) => c?.content?.parts ?? []).filter((p) => p.inlineData?.data);
}

function closestAspect(w, h) {
  const options = { '1:1': 1, '4:3': 4 / 3, '3:4': 3 / 4, '3:2': 3 / 2, '2:3': 2 / 3, '16:9': 16 / 9, '9:16': 9 / 16, '5:4': 5 / 4, '4:5': 4 / 5, '21:9': 21 / 9 };
  const r = w / h;
  return Object.entries(options).sort((a, b) => Math.abs(Math.log(a[1] / r)) - Math.abs(Math.log(b[1] / r)))[0][0];
}

/**
 * Turn the magenta backdrop transparent, with soft edges and the pink fringe
 * removed, then trim and fit into exactly w×h (so physics offsets in the game
 * still line up with the art).
 */
async function keyOutMagenta(buf, w, h) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    // How "magenta" is this pixel? High red+blue, low green.
    const m = Math.min(r, b) - g;
    // Pink manes sit around 50, the backdrop around 200, so only key the far end.
    if (m > 160) {
      data[i + 3] = 0;
    } else if (m > 90) {
      const a = 1 - (m - 90) / 70;
      data[i + 3] = Math.round(data[i + 3] * a);
      // Despill: pull the leftover magenta tint out of edge pixels.
      const cap = Math.max(g, Math.round((r + b) / 2 - (m - 90)));
      data[i] = Math.min(r, cap);
      data[i + 2] = Math.min(b, cap);
    }
  }
  return sharp(data, { raw: info })
    .trim({ threshold: 1 })
    .resize(w, h, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: 'lanczos3' })
    .png()
    .toBuffer();
}

function pcmToWav(pcm, rate = 24000, channels = 1, bits = 16) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE((rate * channels * bits) / 8, 28);
  header.writeUInt16LE((channels * bits) / 8, 32);
  header.writeUInt16LE(bits, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

/** Trim silence off both ends of a 16-bit mono WAV, keeping a short natural pad. */
function trimWav(buf) {
  let off = 12, fmt, data;
  while (off + 8 <= buf.length) {
    const id = buf.toString('ascii', off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    if (id === 'fmt ') fmt = { channels: buf.readUInt16LE(off + 10), rate: buf.readUInt32LE(off + 12), bits: buf.readUInt16LE(off + 22) };
    if (id === 'data') data = buf.subarray(off + 8, off + 8 + size);
    off += 8 + size + (size % 2);
  }
  if (!fmt || !data || fmt.bits !== 16 || fmt.channels !== 1) return buf;
  const n = data.length / 2;
  const win = Math.floor(fmt.rate / 50);
  const loud = (i) => {
    let sum = 0;
    for (let k = i; k < Math.min(n, i + win); k++) sum += Math.abs(data.readInt16LE(k * 2));
    return sum / win > 300;
  };
  let start = 0, end = n;
  while (start < n && !loud(start)) start += win;
  while (end > start && !loud(Math.max(0, end - win))) end -= win;
  const pad = Math.floor(fmt.rate * 0.15);
  start = Math.max(0, start - pad);
  end = Math.min(n, end + pad);
  return pcmToWav(Buffer.from(data.subarray(start * 2, end * 2)), fmt.rate);
}

// ------------------------------------------------------------------ recolor

function rgbToHsv(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = d === 0 ? 0 : mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, mx ? d / mx : 0, mx];
}

function hsvToRgb(h, s, v) {
  const f = (n) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return [f(5), f(3), f(1)];
}

/**
 * Find the mane and tail in the base alicorn. Seeds are big patches of strong
 * pink (so the small cheek blush is left alone). From there it floods through
 * every touching pinkish pixel, pale streaks included, and stops at the dark
 * outlines, the white coat, the lavender wings and the gold horn.
 */
function maneMask(data, w, h, ch) {
  const n = w * h;
  const hsv = new Float32Array(n * 3);
  const strict = new Uint8Array(n);
  const loose = new Uint8Array(n);
  for (let p = 0; p < n; p++) {
    const i = p * ch;
    const [hu, sa, va] = rgbToHsv(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255);
    hsv.set([hu, sa, va], p * 3);
    const backdrop = Math.min(data[i], data[i + 2]) - data[i + 1] > 160;
    const pinkish = !backdrop && (hu >= 305 || hu < 12);
    strict[p] = pinkish && sa >= 0.3 && va >= 0.6 ? 1 : 0;
    loose[p] = pinkish && sa >= 0.13 && va >= 0.72 ? 1 : 0; // darker = outline, paler = coat shading
  }
  const neighbors = (p) => {
    const x = p % w, y = (p / w) | 0;
    return [x > 0 && p - 1, x < w - 1 && p + 1, y > 0 && p - w, y < h - 1 && p + w];
  };
  // Seeds: only large strong-pink patches.
  const seeds = [];
  const seen = new Uint8Array(n);
  const minArea = Math.round(n * 0.004);
  for (let start = 0; start < n; start++) {
    if (!strict[start] || seen[start]) continue;
    const comp = [start];
    seen[start] = 1;
    for (let k = 0; k < comp.length; k++)
      for (const q of neighbors(comp[k])) if (q !== false && strict[q] && !seen[q]) { seen[q] = 1; comp.push(q); }
    if (comp.length >= minArea) seeds.push(...comp);
  }
  // Flood through connected pinkish pixels.
  const mask = new Uint8Array(n);
  for (const p of seeds) mask[p] = 1;
  const queue = [...seeds];
  for (let k = 0; k < queue.length; k++)
    for (const q of neighbors(queue[k])) if (q !== false && loose[q] && !mask[q]) { mask[q] = 1; queue.push(q); }
  // One more pixel ring to catch the soft anti-aliased edge against the outline.
  const edge = [];
  for (let p = 0; p < n; p++) if (!mask[p] && hsv[p * 3 + 1] >= 0.05 && hsv[p * 3 + 2] >= 0.6 && (hsv[p * 3] >= 300 || hsv[p * 3] < 12))
    if (neighbors(p).some((q) => q !== false && mask[q])) edge.push(p);
  for (const p of edge) mask[p] = 1;
  return { mask, hsv };
}

/**
 * Make a new mane color from the base alicorn by swapping the hue of just
 * the mane and tail. Shading and streaks stay exactly the same, so every
 * mane is the very same character.
 */
async function recolorFrom(asset) {
  const src = path.join(ROOT, 'tools/assets/raw', `${asset.from}.png`);
  if (!existsSync(src)) throw new Error(`needs the original ${asset.from} in tools/assets/raw/ first`);
  const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: ch } = info;
  const { mask, hsv } = maneMask(data, w, h, ch);

  let minY = h, maxY = 0, minX = w, maxX = 0;
  for (let p = 0; p < w * h; p++) if (mask[p]) {
    const x = p % w, y = (p / w) | 0;
    minY = Math.min(minY, y); maxY = Math.max(maxY, y); minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  }
  const RAINBOW = [0, 30, 55, 130, 205, 275];
  const out = Buffer.from(data);
  for (let p = 0; p < w * h; p++) {
    if (!mask[p]) continue;
    const s0 = hsv[p * 3 + 1], v0 = hsv[p * 3 + 2];
    let hue = asset.hue;
    if (asset.hue === 'rainbow') {
      // Diagonal bands across mane and tail.
      const x = p % w, y = (p / w) | 0;
      const t = ((y - minY) / (maxY - minY + 1)) * 0.8 + ((maxX - x) / (maxX - minX + 1)) * 0.2;
      hue = RAINBOW[Math.min(RAINBOW.length - 1, Math.floor(t * RAINBOW.length * 1.999) % RAINBOW.length)];
    }
    const s = Math.min(1, s0 * (asset.sat ?? 1));
    const v = Math.min(1, v0 * (asset.val ?? 1));
    const [r, g, b] = hsvToRgb(hue, s, v);
    out[p * ch] = Math.round(r * 255);
    out[p * ch + 1] = Math.round(g * 255);
    out[p * ch + 2] = Math.round(b * 255);
  }
  const png = await sharp(out, { raw: { width: w, height: h, channels: ch } }).png().toBuffer();
  await processImage({ ...asset, kind: 'sprite' }, png);
}

const AUDIO_EXT = { 'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/ogg': 'ogg' };

// ------------------------------------------------------------------ generators

async function generateImage(asset, manifest) {
  const parts = [];
  if (asset.ref) {
    const refPath = path.join(IMG_DIR, `${asset.ref}.png`);
    if (!existsSync(refPath)) throw new Error(`needs ${asset.ref}.png first (run it with --only ${asset.ref})`);
    // Flatten the reference onto magenta so the model keeps the same backdrop.
    const ref = await sharp(refPath).flatten({ background: '#ff00ff' }).png().toBuffer();
    parts.push({ inlineData: { mimeType: 'image/png', data: ref.toString('base64') } });
  }
  const rules = asset.kind === 'sprite' ? manifest.spriteRules : 'Full-bleed painting that fills the whole frame, no text, no characters, no border.';
  parts.push({ text: `${asset.prompt}\n\nStyle: ${manifest.style}\n\n${rules}` });

  const res = await withRetry(asset.id, () =>
    client().models.generateContent({
      model: MODELS.image,
      contents: [{ role: 'user', parts }],
      config: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: closestAspect(asset.w, asset.h) } },
    }),
  );
  const img = inlineParts(res)[0];
  if (!img) throw new Error(`no image returned${res?.promptFeedback?.blockReason ? ` (blocked: ${res.promptFeedback.blockReason})` : ''}`);
  const raw = Buffer.from(img.inlineData.data, 'base64');
  // Keep the untouched original too, in case the magenta keying needs tweaking later.
  await mkdir(path.join(ROOT, 'tools/assets/raw'), { recursive: true });
  await writeFile(path.join(ROOT, 'tools/assets/raw', `${asset.id}.png`), raw);

  await processImage(asset, raw);
}

async function processImage(asset, raw) {
  const png = asset.kind === 'sprite'
    ? await keyOutMagenta(raw, asset.w, asset.h)
    : await sharp(raw).resize(asset.w, asset.h, { fit: 'cover' }).png().toBuffer();
  await writeFile(path.join(IMG_DIR, `${asset.id}.png`), png);
}

async function generateVoice(id, line, manifest) {
  const v = manifest.voices[line.speaker] ?? manifest.voices.narrator;
  const res = await withRetry(id, () =>
    client().models.generateContent({
      model: MODELS.tts,
      // Keep the style short ("Say sweetly: ..."): long descriptions make clips drag on.
      contents: [{ role: 'user', parts: [{ text: `Say ${v.style}: "${line.text}"` }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: v.voice } } },
      },
    }),
  );
  const a = inlineParts(res)[0];
  if (!a) throw new Error('no audio returned');
  const data = Buffer.from(a.inlineData.data, 'base64');
  const mime = a.inlineData.mimeType ?? '';
  const rate = Number(/rate=(\d+)/.exec(mime)?.[1] ?? 24000);
  const wav = /L16|pcm/i.test(mime) || !mime ? pcmToWav(data, rate) : data;
  await writeFile(path.join(AUDIO_DIR, `vo-${id}.wav`), trimWav(wav));
}

async function generateMusic(track) {
  const res = await withRetry(track.id, () =>
    client().models.generateContent({
      model: MODELS.music,
      contents: [{ role: 'user', parts: [{ text: track.prompt }] }],
      config: { responseModalities: ['AUDIO'] },
    }),
  );
  const a = inlineParts(res)[0];
  if (!a) throw new Error('no audio returned');
  const mime = (a.inlineData.mimeType ?? 'audio/wav').split(';')[0];
  const data = Buffer.from(a.inlineData.data, 'base64');
  const ext = AUDIO_EXT[mime] ?? 'wav';
  await writeFile(path.join(AUDIO_DIR, `${track.id}.${ext}`), ext === 'wav' && /L16|pcm/i.test(a.inlineData.mimeType) ? pcmToWav(data) : data);
}

// ------------------------------------------------------------------ index

async function writeIndex() {
  const list = async (dir, exts) =>
    (existsSync(dir) ? await readdir(dir) : [])
      .filter((f) => exts.includes(path.extname(f).toLowerCase()))
      .sort()
      .map((f) => ({ key: path.basename(f, path.extname(f)), url: `assets/${path.basename(dir)}/${f}` }));
  const index = {
    images: await list(IMG_DIR, ['.png', '.jpg', '.jpeg', '.webp']),
    audio: await list(AUDIO_DIR, ['.wav', '.mp3', '.ogg']),
  };
  await writeFile(INDEX, JSON.stringify(index, null, 2) + '\n');
  console.log(`assets.json: ${index.images.length} images, ${index.audio.length} sounds`);
}

// ------------------------------------------------------------------ main

async function main() {
  await mkdir(IMG_DIR, { recursive: true });
  await mkdir(AUDIO_DIR, { recursive: true });

  if (flag('list-models')) {
    const pager = await client().models.list();
    for await (const m of pager) {
      if (/image|tts|lyria|imagen|audio/i.test(m.name)) console.log(m.name.replace('models/', ''), '-', m.displayName ?? '');
    }
    return;
  }
  if (flag('index')) return writeIndex();

  const manifest = JSON.parse(await readFile(path.join(ROOT, 'tools/assets/manifest.json'), 'utf8'));
  const dialogue = JSON.parse(await readFile(path.join(ROOT, 'src/data/dialogue.json'), 'utf8'));

  if (flag('rekey')) {
    // Re-run cut-out and resize on the saved originals. No API calls.
    for (const a of manifest.images) {
      if (a.kind === 'recolor') {
        if (wanted(a.id, 'images')) { await recolorFrom(a); console.log('recolored', a.id); }
        continue;
      }
      const rawPath = path.join(ROOT, 'tools/assets/raw', `${a.id}.png`);
      if (wanted(a.id, 'images') && existsSync(rawPath)) {
        await processImage(a, await readFile(rawPath));
        console.log('rekeyed', a.id);
      }
    }
    return writeIndex();
  }

  const jobs = [];
  for (const a of manifest.images)
    if (wanted(a.id, 'images') && (force || !existsSync(path.join(IMG_DIR, `${a.id}.png`))))
      jobs.push({ label: a.id, kind: 'image', run: () => (a.kind === 'recolor' ? recolorFrom(a) : generateImage(a, manifest)) });
  for (const [id, line] of Object.entries(dialogue))
    if (wanted(`vo-${id}`, 'voice') && (force || !existsSync(path.join(AUDIO_DIR, `vo-${id}.wav`))))
      jobs.push({ label: `vo-${id}`, kind: 'voice', run: () => generateVoice(id, line, manifest) });
  for (const t of manifest.music)
    if (wanted(t.id, 'music') && (force || !['wav', 'mp3', 'ogg'].some((e) => existsSync(path.join(AUDIO_DIR, `${t.id}.${e}`)))))
      jobs.push({ label: t.id, kind: 'music', run: () => generateMusic(t) });

  if (!jobs.length) {
    console.log('Nothing to generate (everything already exists, use --force to redo).');
    return writeIndex();
  }
  console.log(`Models: image=${MODELS.image} tts=${MODELS.tts} music=${MODELS.music}`);
  console.log(`${jobs.length} to generate: ${jobs.map((j) => j.label).join(', ')}`);
  if (dryRun) return;

  const failed = [];
  for (const [i, job] of jobs.entries()) {
    process.stdout.write(`[${i + 1}/${jobs.length}] ${job.label} ... `);
    try {
      await job.run();
      console.log('ok');
    } catch (e) {
      console.log('FAILED');
      console.warn(`  ${String(e?.message ?? e).slice(0, 300)}`);
      failed.push(job.label);
    }
  }
  await writeIndex();
  if (failed.length) {
    console.log(`\n${failed.length} failed (the game keeps using placeholders for these): ${failed.join(', ')}`);
    process.exitCode = 1;
  }
}

main();
