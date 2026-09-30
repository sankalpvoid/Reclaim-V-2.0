import fs from 'node:fs';
import path from 'node:path';

const requiredAssets = [
  'approved-icon-master.png',
  'icon.png',
  'adaptive-icon.png',
  'monochrome-icon.png',
];

const brandingDir = path.resolve('assets/branding');
const missing = requiredAssets.filter((name) => !fs.existsSync(path.join(brandingDir, name)));

if (missing.length > 0) {
  throw new Error(
    `Missing approved Reclaim artwork: ${missing.join(', ')}. ` +
      'Restore the source-controlled files; do not procedurally redraw the logo.',
  );
}

console.log('Approved Reclaim brand assets are present. No artwork was regenerated.');
