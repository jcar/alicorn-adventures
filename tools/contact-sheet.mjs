// Art review: each new picture next to the styleRefs it should match.
//   node tools/contact-sheet.mjs out.png friend-bea friend-millie ...
import sharp from 'sharp';
import fs from 'node:fs';
const m = JSON.parse(fs.readFileSync('tools/assets/manifest.json', 'utf8'));
const [out, ...ids] = process.argv.slice(2);
const img = (id) => `public/assets/images/${id}.webp`;
const C = 220;
const bg = { r: 235, g: 228, b: 245, alpha: 1 };
const cell = async (id) => fs.existsSync(img(id)) ? sharp(img(id)).resize(C - 10, C - 30, { fit: 'contain', background: bg }).flatten({ background: bg }).png().toBuffer() : null;
const label = (t) => Buffer.from(`<svg width="${C}" height="24"><text x="4" y="17" font-size="15" font-family="sans-serif" fill="#222">${t}</text></svg>`);
const tiles = [];
let y = 0;
for (const id of ids) {
  const e = m.images.find((i) => i.id === id);
  const row = [id, ...(e?.styleRefs ?? [])];
  for (const [i, r] of row.entries()) {
    const b = await cell(r);
    if (b) tiles.push({ input: b, left: i * C + 5, top: y + 26 });
    tiles.push({ input: label((i ? 'ref: ' : 'NEW: ') + r), left: i * C, top: y });
  }
  y += C;
}
await sharp({ create: { width: C * 3, height: y, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } }).composite(tiles).png().toFile(out);
