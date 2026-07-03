/** توليد أيقونات PWA من public/icons/logo.svg */
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const p = (rel) => fileURLToPath(new URL(rel, import.meta.url));
const mark = readFileSync(p('../public/icons/logo.svg'));

const bgSvg = (size, radius) =>
  Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#1CB25A"/>
          <stop offset="1" stop-color="#128843"/>
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${radius}" fill="url(#g)"/>
    </svg>`
  );

async function make(size, out, { radius = 0, markScale = 0.86 } = {}) {
  const markPng = await sharp(mark).resize(Math.round(size * markScale)).png().toBuffer();
  await sharp(bgSvg(size, radius))
    .png()
    .composite([{ input: markPng, gravity: 'centre' }])
    .toFile(p(`../public/icons/${out}`));
  console.log('✓', out);
}

await make(192, 'icon-192.png', { radius: 42 });
await make(512, 'icon-512.png', { radius: 112 });
await make(512, 'icon-512-maskable.png', { radius: 0, markScale: 0.62 });
await make(180, 'apple-touch-icon.png', { radius: 0 });
console.log('تم توليد جميع الأيقونات');
