// Fails on high/critical npm advisories in production dependencies, except advisories
// explicitly accepted below. Accepted entries must be build-tooling only (never in the app
// bundle) and have no upstream fix. Re-check on every Expo SDK bump.
import { execSync } from 'node:child_process';

const ACCEPTED = {
  // node-forge is used by @expo/cli (EAS/dev tooling for code signing). Latest release (1.4.0)
  // is affected; no fixed version exists. Not bundled into the shipped app.
  'GHSA-86w9-cpqp-85rv': 'node-forge via @expo/cli (build tooling, no upstream fix)',
};

let raw;
try {
  raw = execSync('npm audit --omit=dev --json', { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
} catch (error) {
  raw = error.stdout?.toString() ?? '';
}

const report = JSON.parse(raw);
const blocking = [];
const accepted = [];

for (const [name, vuln] of Object.entries(report.vulnerabilities ?? {})) {
  if (vuln.severity !== 'high' && vuln.severity !== 'critical') continue;
  const advisories = vuln.via.filter((entry) => typeof entry === 'object');
  // Packages that are high only because a dependency is (no advisory of their own) are covered
  // by the advisory that causes them; only direct advisories are judged here.
  for (const advisory of advisories) {
    const id = advisory.url?.split('/').pop();
    if (advisory.severity !== 'high' && advisory.severity !== 'critical') continue;
    if (id && ACCEPTED[id]) accepted.push(`${name}: ${id} (${ACCEPTED[id]})`);
    else blocking.push(`${name}: ${advisory.title} ${advisory.url}`);
  }
}

for (const line of accepted) console.log(`accepted  ${line}`);
for (const line of blocking) console.error(`BLOCKING  ${line}`);

if (blocking.length > 0) {
  process.exit(1);
}
console.log('audit gate passed');
