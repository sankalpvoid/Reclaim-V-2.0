import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const OUT_DIR = path.resolve('assets/branding');
fs.mkdirSync(OUT_DIR, { recursive: true });

const COLORS = {
  background: [10, 10, 15, 255],
  purple: [168, 85, 247, 255],
  white: [255, 255, 255, 255],
  transparent: [0, 0, 0, 0],
};

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n += 1) {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c >>> 0;
}

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data = Buffer.alloc(0)) {
  const name = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, crc]);
}

function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (stride + 1);
    raw[row] = 0;
    rgba.copy(raw, row + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND'),
  ]);
}

function distanceToSegment(px, py, ax, ay, bx, by) {
  const vx = bx - ax;
  const vy = by - ay;
  const wx = px - ax;
  const wy = py - ay;
  const vv = vx * vx + vy * vy;
  const t = Math.max(0, Math.min(1, vv === 0 ? 0 : (wx * vx + wy * vy) / vv));
  const dx = px - (ax + t * vx);
  const dy = py - (ay + t * vy);
  return Math.hypot(dx, dy);
}

function insideMark(x, y, scale = 1) {
  const ux = (x - 0.5) / scale + 0.5;
  const uy = (y - 0.5) / scale + 0.5;

  const cx = 450 / 1024;
  const cy = 555 / 1024;
  const radius = 250 / 1024;
  const halfStroke = 52.5 / 1024;

  const dx = ux - cx;
  const dy = uy - cy;
  let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (angle < 0) angle += 360;

  const onRing = Math.abs(Math.hypot(dx, dy) - radius) <= halfStroke && angle >= 15 && angle <= 320;

  const exitAngle = (320 * Math.PI) / 180;
  const ax = cx + radius * Math.cos(exitAngle);
  const ay = cy + radius * Math.sin(exitAngle);
  const bx = 770 / 1024;
  const by = 230 / 1024;
  const onExit = distanceToSegment(ux, uy, ax, ay, bx, by) <= 50 / 1024;

  return onRing || onExit;
}

function render({ size, background, foreground, scale = 1 }) {
  const rgba = Buffer.alloc(size * size * 4);
  const samples = [
    [0.25, 0.25],
    [0.75, 0.25],
    [0.25, 0.75],
    [0.75, 0.75],
  ];

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let coverage = 0;
      for (const [sx, sy] of samples) {
        if (insideMark((x + sx) / size, (y + sy) / size, scale)) coverage += 1;
      }
      coverage /= samples.length;

      const i = (y * size + x) * 4;
      const alpha = foreground[3] * coverage;
      const inverse = 1 - coverage;
      rgba[i] = Math.round(foreground[0] * coverage + background[0] * inverse);
      rgba[i + 1] = Math.round(foreground[1] * coverage + background[1] * inverse);
      rgba[i + 2] = Math.round(foreground[2] * coverage + background[2] * inverse);
      rgba[i + 3] = Math.round(alpha + background[3] * inverse);
    }
  }

  return rgba;
}

function write(name, options) {
  const rgba = render(options);
  fs.writeFileSync(path.join(OUT_DIR, name), encodePng(options.size, rgba));
}

write('icon.png', {
  size: 1024,
  background: COLORS.background,
  foreground: COLORS.purple,
  scale: 1,
});

write('adaptive-icon.png', {
  size: 1024,
  background: COLORS.transparent,
  foreground: COLORS.purple,
  scale: 0.76,
});

write('monochrome-icon.png', {
  size: 1024,
  background: COLORS.transparent,
  foreground: COLORS.white,
  scale: 0.76,
});

// Keep the splash artwork byte-for-byte identical to the approved app icon.
fs.copyFileSync(
  path.join(OUT_DIR, 'icon.png'),
  path.join(OUT_DIR, 'splash-icon.png'),
);

console.log('Generated Reclaim v1 brand assets in assets/branding/.');
