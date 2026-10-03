import sharp from 'sharp';
const [out, ...ids] = process.argv.slice(2);
const cell = async (file) => sharp(file).resize(320, 240, { fit: 'contain', background: '#ffffff' }).png().toBuffer();
const tiles = [];
for (const [i, id] of ids.entries()) {
  tiles.push({ input: await cell(`tools/assets/raw/previous/${id}.png`), left: i * 320, top: 0 });
  tiles.push({ input: await cell(`tools/assets/raw/${id}.png`), left: i * 320, top: 240 });
}
await sharp({ create: { width: 320 * ids.length, height: 480, channels: 4, background: '#ffffff' } }).composite(tiles).png().toFile(out);
