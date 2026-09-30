import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.resolve('assets/branding');
const APPROVED_ICON = path.join(OUT_DIR, 'icon.png');
const SPLASH_ICON = path.join(OUT_DIR, 'splash-icon.png');

if (!fs.existsSync(APPROVED_ICON)) {
  throw new Error(
    'Missing approved Reclaim icon at assets/branding/icon.png. Place the exact approved artwork there; this script will not generate or redraw the logo.',
  );
}

// The approved icon is the single source of truth. Never regenerate or approximate it.
// Splash artwork is intentionally byte-for-byte identical to the approved app icon.
fs.copyFileSync(APPROVED_ICON, SPLASH_ICON);

console.log('Preserved approved Reclaim icon and synchronized splash-icon.png.');
