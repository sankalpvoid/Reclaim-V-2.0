import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.resolve('assets/branding');
const REQUIRED = [
  'icon.png',
  'adaptive-icon.png',
  'monochrome-icon.png',
  'splash-icon.png',
];

function readPngSize(filePath) {
  const buffer = fs.readFileSync(filePath);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(signature)) {
    throw new Error(`${filePath} is not a valid PNG.`);
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

for (const file of REQUIRED) {
  const filePath = path.join(OUT_DIR, file);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing approved Reclaim brand asset: ${filePath}`);
  }

  const { width, height } = readPngSize(filePath);
  if (width !== 1024 || height !== 1024) {
    throw new Error(
      `${filePath} must remain a 1024x1024 approved master (received ${width}x${height}).`,
    );
  }
}

console.log(
  'Approved Reclaim icon masters verified. Brand assets are intentionally preserved, not regenerated.',
);
