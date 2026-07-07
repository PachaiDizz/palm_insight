const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outDir = path.join(__dirname, '..', 'public', 'icons');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function createPNG(width, height, pixels) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Image data: each row starts with filter byte (0 = none)
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0; // filter none
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = y * (1 + width * 4) + 1 + x * 4;
      rawData[dstIdx] = pixels[srcIdx];
      rawData[dstIdx + 1] = pixels[srcIdx + 1];
      rawData[dstIdx + 2] = pixels[srcIdx + 2];
      rawData[dstIdx + 3] = pixels[srcIdx + 3];
    }
  }

  const compressed = zlib.deflateSync(rawData);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeB = Buffer.from(type, 'ascii');
    const crcData = Buffer.concat([typeB, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(crcData), 0);
    return Buffer.concat([len, typeB, data, crc]);
  }

  // CRC32 table
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
  }

  function crc32(buf) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
      crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function generateIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= radius) {
        // Dark green background
        pixels[idx] = 15;     // R
        pixels[idx + 1] = 26; // G
        pixels[idx + 2] = 15; // B
        pixels[idx + 3] = 255; // A

        // Palm leaf shape (centered, within 80% safe zone)
        const nx = (x - cx) / (size * 0.3);
        const ny = (y - (cy - size * 0.08)) / (size * 0.3);

        // Leaf: ellipse rotated and shaped
        const leafX = nx * 0.9;
        const leafY = (ny + 0.15) * 1.2;
        const leafDist = Math.sqrt(leafX * leafX + leafY * leafY);

        if (leafDist < 0.85 && ny < 0.4 && ny > -0.9) {
          // Green leaf
          pixels[idx] = 16;     // #10b981 R
          pixels[idx + 1] = 185; // G
          pixels[idx + 2] = 129; // B
          pixels[idx + 3] = 255;
        }

        // Trunk
        if (Math.abs(nx) < 0.08 && ny > 0.2 && ny < 0.9) {
          pixels[idx] = 5;      // #059669 R
          pixels[idx + 1] = 150; // G
          pixels[idx + 2] = 105; // B
          pixels[idx + 3] = 255;
        }
      } else {
        // Transparent outside circle
        pixels[idx] = 0;
        pixels[idx + 1] = 0;
        pixels[idx + 2] = 0;
        pixels[idx + 3] = 0;
      }
    }
  }

  return createPNG(size, size, pixels);
}

for (const size of sizes) {
  const png = generateIcon(size);
  const filePath = path.join(outDir, `icon-${size}x${size}.png`);
  fs.writeFileSync(filePath, png);
  console.log(`Generated icon-${size}x${size}.png (${png.length} bytes)`);
}

console.log('All PWA icons generated successfully.');
