import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { join } from 'path';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outDir = join(process.cwd(), 'public', 'icons');

/* Amber harvest brand — matches app UI tokens (#0b0d13 base, #f59e0b accent) */
const svgTemplate = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#0b0d13"/>
  <g transform="translate(256, 256)">
    <!-- Palm leaf -->
    <path d="M0-140c-12 18-34 42-56 54 18-3 34 3 46 16-24 14-38 34-38 56 7-7 16-14 28-18-7 18 0 36 14 48 4-14 10-26 22-38-8 22 0 40 18 48 4-10 8-26 4-40-14 10-28 14-40 8 14-14 22-36 18-52 18 4 32 4 44-4-22-18-44-40-54-58z" fill="#f59e0b"/>
    <!-- Trunk -->
    <line x1="0" y1="10" x2="0" y2="80" stroke="#d97706" stroke-width="10" stroke-linecap="round"/>
    <!-- Ground -->
    <ellipse cx="0" cy="86" rx="30" ry="6" fill="#92400e" opacity="0.55"/>
  </g>
</svg>`;

async function generate() {
  await mkdir(outDir, { recursive: true });

  for (const size of sizes) {
    const svg = svgTemplate(size);
    const outPath = join(outDir, `icon-${size}x${size}.png`);
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`Generated: icon-${size}x${size}.png`);
  }

  console.log('All icons generated.');
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
