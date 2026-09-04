import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { resolve, relative, dirname, extname } from 'node:path';
import { marked } from 'marked';

const states = new Set(['00-inbox', '10-ready', '20-active', '30-task-review', '40-module-review', '50-blocked', '60-done', '90-cancelled']);
const requiredScripts = ['typecheck', 'lint', 'test', 'build', 'queue:check'];
const dependencyKeys = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies', 'bundledDependencies', 'bundleDependencies'];
const catalogHeaders = ['Task ID', 'Module', 'Tier', 'State', 'Local record', 'Dependencies', 'Owned paths/resources', 'Human actions', 'Validation'];

function main(args) {
  const diagnostics = [];
  const add = (code, message) => diagnostics.push({ code, message });
  if (args.length !== 0 && (args.length !== 2 || args[0] !== '--root' || !args[1])) return finish([{ code: 'ARGUMENT_ERROR', message: 'expected --root PATH' }]);
  const requestedRoot = resolve(args.length === 0 ? process.cwd() : args[1]);
  const root = existsSync(requestedRoot) ? realpathSync(requestedRoot) : requestedRoot;
  const physicalRoot = root;
  const inside = (path, boundary = physicalRoot) => relative(boundary, path) === '' || !relative(boundary, path).startsWith('..');
  const file = (path) => {
    try { return inside(realpathSync(path)) && statSync(path).isFile(); } catch { return false; }
  };
  const localFile = (path) => {
    if (!path || path.startsWith('/') || path.includes('\\')) return null;
    const resolved = resolve(root, path);
    return inside(resolved, root) ? resolved : null;
  };

  let manifest;
  try { manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')); } catch { add('PACKAGE_CONTRACT_INVALID', 'root package manifest is unreadable'); }
  if (manifest && (!manifest.private || manifest.packageManager !== 'npm@10.9.4' || manifest.engines?.node !== '>=22 <23' || manifest.engines?.npm !== '>=10 <11' || JSON.stringify(manifest.workspaces) !== JSON.stringify(['apps/*', 'packages/*']) || requiredScripts.some((name) => typeof manifest.scripts?.[name] !== 'string') || manifest.scripts?.['queue:check'] !== 'node scripts/queue-check.mjs' || dependencyKeys.filter((key) => key !== 'devDependencies').some((key) => Object.hasOwn(manifest, key)) || JSON.stringify(manifest.devDependencies) !== JSON.stringify({ marked: '18.0.11' }))) add('PACKAGE_CONTRACT_INVALID', 'root package contract does not match the foundation specification');

  const catalogPath = resolve(root, 'docs/work-queue/TASK-CATALOG.md');
  let rows = [];
  try {
    const lines = readFileSync(catalogPath, 'utf8').split(/\r?\n/);
    const header = lines.findIndex((line) => /^\|\s*Task ID\s*\|/.test(line));
    const headerFields = header < 0 ? [] : lines[header].split('|').slice(1, -1).map((value) => value.trim());
    const separatorFields = header < 0 ? [] : (lines[header + 1] ?? '').split('|').slice(1, -1).map((value) => value.trim());
    if (header < 0 || JSON.stringify(headerFields) !== JSON.stringify(catalogHeaders) || separatorFields.length !== 9 || separatorFields.some((value) => !/^:?-{3,}:?$/.test(value))) throw new Error('header');
    for (const line of lines.slice(header + 2)) {
      if (!line.trim()) break;
      if (!line.startsWith('|')) throw new Error('row');
      const fields = line.split('|').slice(1, -1).map((value) => value.trim());
      if (fields.length !== 9 || fields.some((value) => !value)) throw new Error('row');
      rows.push({ id: fields[0], tier: fields[2], state: fields[3], record: fields[4], dependencies: fields[5] });
    }
  } catch { add('CATALOG_PARSE_ERROR', 'task catalog is malformed'); }
  const ids = new Set();
  for (const row of rows) {
    if (ids.has(row.id)) add('DUPLICATE_TASK_ID', `duplicate task ${row.id}`);
    ids.add(row.id);
    const record = localFile(row.record);
    if (!states.has(row.state) || !record || !file(record) || !inside(resolve(root, 'docs/work-queue/queue', row.state)) || !record.startsWith(`${resolve(root, 'docs/work-queue/queue', row.state)}/`)) {
      add('LOCAL_RECORD_MISSING', `local record for ${row.id} is invalid`);
      continue;
    }
    const card = readFileSync(record, 'utf8');
    const cardState = card.match(/^\s*-\s*Queue state:\s*(\S+)/mi)?.[1];
    const cardTier = card.match(/^\s*-\s*Tier:\s*(\S+)/mi)?.[1];
    if (cardState !== row.state) add('TASK_STATE_MISMATCH', `card state differs for ${row.id}`);
    if (cardTier !== row.tier) add('TASK_TIER_MISMATCH', `card tier differs for ${row.id}`);
  }
  for (const row of rows) {
    if (row.dependencies.toLowerCase() === 'none') continue;
    for (const item of row.dependencies.split(',')) {
      const dependency = item.trim().match(/^([A-Z]\d+-T\d+)\s+accepted$/)?.[1];
      const target = rows.find((item) => item.id === dependency);
      if (dependency === row.id || !target || target.state !== '60-done') add('DEPENDENCY_NOT_ACCEPTED', `dependency ${dependency} is not accepted for ${row.id}`);
    }
  }

  let stateText = '';
  try { stateText = readFileSync(resolve(root, 'docs/work-queue/STATE.md'), 'utf8'); } catch { add('CURRENT_TASK_MISMATCH', 'queue state is unreadable'); }
  const current = stateText.match(/^\s*-\s*CURRENT_TASK:\s*([A-Z]\d+-T\d+)\s*\(([^)]+)\)/mi);
  if (!current || !rows.some((row) => row.id === current?.[1] && row.state === current?.[2])) add('CURRENT_TASK_MISMATCH', 'current task does not match the catalog');
  const specs = stateText.match(/^\s*-\s*LOCAL_SPECIFICATIONS:\s*(.+)$/mi)?.[1]?.trim();
  if (!specs || (specs !== 'none' && specs.split(',').some((item) => { const path = localFile(item.trim()); return !path || !file(path); }))) add('LOCAL_SPECIFICATION_MISSING', 'local specification path is missing');

  for (const markdown of markdownFiles(root)) {
    for (const target of markdownTargets(readFileSync(markdown, 'utf8'))) validateReference(target, markdown, root, inside, file, add);
  }
  finish(diagnostics);
}

function markdownFiles(root) {
  const files = [];
  if (!existsSync(root) || !statSync(root).isDirectory()) return files;
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile() && extname(path) === '.md') files.push(path);
    }
  };
  const docs = resolve(root, 'docs');
  if (existsSync(docs)) visit(docs);
  for (const entry of readdirSync(root, { withFileTypes: true })) if (entry.isFile() && extname(entry.name) === '.md') files.push(resolve(root, entry.name));
  return files;
}

function validateReference(target, markdown, root, inside, file, add) {
  if (!target || target.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('//')) return;
  const path = resolveLocalTarget(target, markdown, root, inside);
  if (path === 'escape') add('LOCAL_REFERENCE_ESCAPE', `local reference escapes from ${relative(root, markdown)}`);
  else if (!path || !file(path)) add('LOCAL_REFERENCE_MISSING', `local reference is missing from ${relative(root, markdown)}`);
}

function resolveLocalTarget(target, markdown, root, inside) {
  let decoded;
  try { decoded = decodeURIComponent(target.split('#')[0]); } catch { return null; }
  if (!decoded || decoded.startsWith('/')) return 'escape';
  let path = dirname(markdown);
  for (const component of decoded.split('/')) {
    if (!component || component === '.') continue;
    path = component === '..' ? dirname(path) : resolve(path, component);
    if (!inside(path, root)) return 'escape';
    if (existsSync(path)) {
      try { path = realpathSync(path); } catch { return null; }
      if (!inside(path)) return 'escape';
    }
  }
  return path;
}

function markdownTargets(text) {
  const targets = [];
  collectLinkTargets(marked.lexer(text), targets);
  return targets;
}

function collectLinkTargets(tokens, targets) {
  for (const token of tokens) {
    if (token.type === 'link' || token.type === 'image') targets.push(token.href);
    if (Array.isArray(token.tokens)) collectLinkTargets(token.tokens, targets);
    if (Array.isArray(token.items)) collectLinkTargets(token.items, targets);
  }
}

function finish(diagnostics) {
  if (diagnostics.length === 0) process.stdout.write('QUEUE_CHECK_OK\n');
  else for (const { code, message } of diagnostics) process.stderr.write(`${code}: ${message}\n`);
  process.exitCode = diagnostics.length === 0 ? 0 : 1;
}

main(process.argv.slice(2));
