import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webRoot = path.resolve(__dirname, '..');
const srcRoot = path.join(webRoot, 'src');

const SOURCE_EXTENSIONS = ['.ts', '.tsx'];
const INDEX_CANDIDATES = SOURCE_EXTENSIONS.map((ext) => `index${ext}`);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }
    if (!SOURCE_EXTENSIONS.includes(path.extname(entry.name))) continue;
    if (entry.name.endsWith('.d.ts')) continue;
    files.push(fullPath);
  }
  return files;
}

function normalizePath(value) {
  return value.split(path.sep).join('/');
}

function toSrcRelative(absolutePath) {
  return normalizePath(path.relative(srcRoot, absolutePath));
}

function isTestFile(srcRelativePath) {
  return srcRelativePath.startsWith('__tests__/');
}

function parseImportStatements(sourceText) {
  const statements = [];
  const pattern = /(?:^|\n)\s*(import|export)\s+(type\s+)?[\s\S]*?from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = pattern.exec(sourceText)) !== null) {
    const full = match[0];
    const specifier = match[3];
    const importClauseMatch = full.match(/(?:import|export)\s+([\s\S]*?)\s+from\s+['"]/);
    const clause = importClauseMatch ? importClauseMatch[1].trim() : '';
    const isTypeOnly = Boolean(match[2]) || clause.startsWith('type ') || /^\{\s*type\b/.test(clause);
    statements.push({ specifier, clause, isTypeOnly });
  }
  return statements;
}

function resolveImportPath(importerAbsolutePath, specifier) {
  if (!specifier.startsWith('.')) return null;
  const candidateBase = path.resolve(path.dirname(importerAbsolutePath), specifier);
  const directCandidates = [
    candidateBase,
    ...SOURCE_EXTENSIONS.map((ext) => `${candidateBase}${ext}`),
    ...INDEX_CANDIDATES.map((indexName) => path.join(candidateBase, indexName)),
  ];
  for (const candidate of directCandidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return null;
}

function matchesPrefix(target, prefix) {
  return target === prefix || target.startsWith(`${prefix}/`);
}

function hasNamedValueImport(statement, names) {
  if (statement.isTypeOnly) return false;
  return names.some((name) => new RegExp(`\\b${name}\\b`).test(statement.clause));
}


function isAllowedGraphStageImport(importedSrcPath, allowedEntrypoints) {
  return allowedEntrypoints.includes(importedSrcPath);
}

const files = walk(srcRoot);
const violations = [];

const snapshotCacheRuntimeOwners = new Set([
  'api/index.ts',
  'browser-snapshot/application/runtime.ts',
  'browser-snapshot/application/ports/preparedSnapshotCache.ts',
  'saved-canvas/application/runtime.ts',
  'saved-canvas/application/ports/snapshotCache.ts',
]);

const snapshotCacheTypeOwners = new Set([
  ...snapshotCacheRuntimeOwners,
]);

function isSnapshotCacheInternal(pathname) {
  return matchesPrefix(pathname, 'api/snapshot-cache');
}

for (const absolutePath of files) {
  const srcRelativePath = toSrcRelative(absolutePath);
  const content = fs.readFileSync(absolutePath, 'utf8');
  const importStatements = parseImportStatements(content);

  for (const statement of importStatements) {
    const resolvedAbsoluteImport = resolveImportPath(absolutePath, statement.specifier);
    const importedSrcPath = resolvedAbsoluteImport ? toSrcRelative(resolvedAbsoluteImport) : statement.specifier;

    if (!resolvedAbsoluteImport) {
      continue;
    }

    const record = (message) => {
      violations.push(`${srcRelativePath} -> ${importedSrcPath}: ${message}`);
    };

    if (matchesPrefix(srcRelativePath, 'components') && [
      'api/httpClient.ts',
      'api/platformApi.ts',
            'api/snapshot-cache/index.ts',
      'api/snapshot-cache/runtime.ts',
    ].includes(importedSrcPath)) {
      record('components must not import transport/cache implementation modules directly; pass data or callbacks in from a higher layer.');
    }

    if (matchesPrefix(srcRelativePath, 'browser-routing') && (matchesPrefix(importedSrcPath, 'views') || matchesPrefix(importedSrcPath, 'components'))) {
      record('browser-routing is a generic algorithm layer and must not depend on page/view or React component code.');
    }

    if (matchesPrefix(srcRelativePath, 'browser-auto-layout') && (matchesPrefix(importedSrcPath, 'views') || matchesPrefix(importedSrcPath, 'components'))) {
      record('browser-auto-layout must stay free of page/view and React component dependencies.');
    }

    if (matchesPrefix(srcRelativePath, 'browser-canvas-placement') && (matchesPrefix(importedSrcPath, 'views') || matchesPrefix(importedSrcPath, 'components'))) {
      record('browser-canvas-placement must stay in the graph algorithm layer and not depend on page/view or React component code.');
    }

    if (matchesPrefix(srcRelativePath, 'browser-routing') && matchesPrefix(importedSrcPath, 'browser-projection') && !isAllowedGraphStageImport(importedSrcPath, ['browser-projection/index.ts'])) {
      record('browser-routing must consume projection through the browser-projection entrypoint rather than projection internals.');
    }

    if (matchesPrefix(srcRelativePath, 'browser-auto-layout') && matchesPrefix(importedSrcPath, 'browser-canvas-placement') && !isAllowedGraphStageImport(importedSrcPath, ['browser-canvas-placement/stage.ts'])) {
      record('browser-auto-layout must consume placement through browser-canvas-placement/stage.ts instead of placement internals.');
    }

    if (matchesPrefix(srcRelativePath, 'browser-canvas-placement') && matchesPrefix(importedSrcPath, 'browser-auto-layout') && !isAllowedGraphStageImport(importedSrcPath, ['browser-auto-layout/stage.ts'])) {
      record('browser-canvas-placement must consume auto-layout through browser-auto-layout/stage.ts instead of the broader auto-layout entrypoint or internals.');
    }

    if ((matchesPrefix(srcRelativePath, 'browser-canvas-placement') || matchesPrefix(srcRelativePath, 'browser-auto-layout')) && matchesPrefix(importedSrcPath, 'browser-graph/canvas') && !isAllowedGraphStageImport(importedSrcPath, ['browser-graph/canvas/stage.ts'])) {
      record('graph placement/layout stages must consume canvas sizing and placement-policy helpers through browser-graph/canvas/stage.ts instead of the broader canvas entrypoint or internals.');
    }

    if (matchesPrefix(srcRelativePath, 'components/browser-graph-workspace') && importedSrcPath === 'browser-auto-layout/debug.ts') {
      record('graph workspace components must import auto-layout diagnostics through the browser-auto-layout entrypoint, not the debug implementation file.');
    }

    if (matchesPrefix(srcRelativePath, 'saved-canvas/domain') && (
      matchesPrefix(importedSrcPath, 'views') ||
      matchesPrefix(importedSrcPath, 'components') ||
      matchesPrefix(importedSrcPath, 'api') ||
      matchesPrefix(importedSrcPath, 'contexts') ||
      matchesPrefix(importedSrcPath, 'hooks')
    )) {
      record('saved-canvas/domain must remain framework-agnostic and may not depend on views, components, hooks, contexts, or transport code.');
    }

    if (matchesPrefix(srcRelativePath, 'saved-canvas/application') && (
      matchesPrefix(importedSrcPath, 'views') ||
      matchesPrefix(importedSrcPath, 'components') ||
      matchesPrefix(importedSrcPath, 'contexts') ||
      matchesPrefix(importedSrcPath, 'hooks')
    )) {
      record('saved-canvas/application owns workflows, not page/view composition or React hooks/contexts.');
    }

    if (matchesPrefix(srcRelativePath, 'saved-canvas/adapters') && (matchesPrefix(importedSrcPath, 'views') || matchesPrefix(importedSrcPath, 'components'))) {
      record('saved-canvas/adapters may integrate outward, but they must not depend directly on page/view or React component code.');
    }

    if (importedSrcPath === 'api/snapshot-cache/runtime.ts') {
      const allowedValueImport = isSnapshotCacheInternal(srcRelativePath) || snapshotCacheRuntimeOwners.has(srcRelativePath) || isTestFile(srcRelativePath);
      const allowedTypeOnly = isSnapshotCacheInternal(srcRelativePath) || snapshotCacheTypeOwners.has(srcRelativePath) || isTestFile(srcRelativePath);
      if (statement.isTypeOnly) {
        if (!allowedTypeOnly) {
          record('snapshot cache contracts must flow through browser-snapshot/application or saved-canvas/application ownership seams.');
        }
      } else if (!allowedValueImport) {
        record('snapshot cache runtime ownership is restricted to api/index and the browser-snapshot/saved-canvas application runtime seams.');
      }
    }

    if (importedSrcPath === 'api/snapshot-cache/types.ts') {
      const allowedTypeOnly = isSnapshotCacheInternal(srcRelativePath) || snapshotCacheTypeOwners.has(srcRelativePath) || isTestFile(srcRelativePath);
      if (!statement.isTypeOnly || !allowedTypeOnly) {
        record('snapshot cache type contracts must flow through browser-snapshot/application or saved-canvas/application ownership seams as type-only imports.');
      }
    }

    if (matchesPrefix(importedSrcPath, 'views/browser-view') && path.basename(importedSrcPath).startsWith('useBrowserView') && !matchesPrefix(srcRelativePath, 'views/browser-view') && !isTestFile(srcRelativePath)) {
      record('BrowserView compatibility facades must not become cross-subsystem dependencies; import from views/browser-view or views/browser-view/controllers instead.');
    }

    if ((importedSrcPath === 'browser-session/index.ts' || importedSrcPath === 'browser-session/browserSessionStore.ts') && !matchesPrefix(srcRelativePath, 'browser-session') && !isTestFile(srcRelativePath)) {
      record('browser-session root facades are legacy broad entrypoints; consumers must import from browser-session category entrypoints such as browser-session/types, state, lifecycle-api, navigation-api, canvas-api, viewpoints-api, facts-panel-api, or commands-api.');
    }

    if (importedSrcPath === 'browser-session/commands/index.ts' && !matchesPrefix(srcRelativePath, 'browser-session') && !isTestFile(srcRelativePath)) {
      record('browser-session/commands/index.ts is an internal grouped command surface; consumers should prefer browser-session/commands-api for the screen-facing command API.');
    }

  }
}

if (violations.length > 0) {
  console.error('Frontend boundary check failed.');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log(`Frontend boundary check passed for ${files.length} source files.`);
