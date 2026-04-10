import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(webRoot, '..', '..');

const requiredFiles = [
  'apps/web/src/README.md',
  'apps/web/scripts/check-boundaries.mjs',
  'docs/refactoring/frontend-consolidation-baseline.md',
  'docs/refactoring/frontend-duplication-retirement-map.md',
  'docs/refactoring/frontend-boundary-rules.md',
];

const missing = requiredFiles.filter((relativePath) => !fs.existsSync(path.join(repoRoot, relativePath)));
if (missing.length > 0) {
  console.error('Frontend consolidation stabilization check failed. Missing required files:');
  for (const relativePath of missing) {
    console.error(`- ${relativePath}`);
  }
  process.exit(1);
}

const boundaryCheck = spawnSync(process.execPath, [path.join(webRoot, 'scripts/check-boundaries.mjs')], {
  stdio: 'inherit',
});

if (boundaryCheck.status !== 0) {
  process.exit(boundaryCheck.status ?? 1);
}

console.log('Frontend consolidation stabilization checks passed.');
