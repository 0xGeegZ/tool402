import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const validator = join(dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'queue-check.mjs');

function write(root, path, contents) {
  const file = join(root, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, contents);
}

function fixture(mutate = () => {}) {
  const root = mkdtempSync(join(tmpdir(), 'queue-check-'));
  const manifest = {
    name: 'fixture', version: '0.0.0', private: true, packageManager: 'npm@10.9.4',
    engines: { node: '>=22 <23', npm: '>=10 <11' }, workspaces: ['apps/*', 'packages/*'],
    scripts: {
      typecheck: 'true', lint: 'true', test: 'true', build: 'true',
      'queue:check': 'node scripts/queue-check.mjs',
    },
  };
  const rows = [
    ['P00-T010', 'Product', 'CORE_P0', '60-done', 'docs/work-queue/queue/60-done/P00-T010.md', 'none', 'none', 'none', 'none'],
    ['M01-T090', 'Foundation', 'CORE_P0', '00-inbox', 'docs/work-queue/queue/00-inbox/M01-T090.md', 'P00-T010 accepted', 'none', 'none', 'none'],
  ];
  const files = {
    'README.md': '# Fixture\n',
    'docs/specs/fixture.md': '# Specification\n',
    'docs/work-queue/STATE.md': '# State\n\n- CURRENT_TASK: M01-T090 (00-inbox)\n- LOCAL_SPECIFICATIONS: docs/specs/fixture.md\n',
    'docs/work-queue/queue/60-done/P00-T010.md': '# P00\n\n- Tier: CORE_P0\n- Queue state: 60-done\n',
    'docs/work-queue/queue/00-inbox/M01-T090.md': '# M01\n\n- Tier: CORE_P0\n- Queue state: 00-inbox\n',
  };
  mutate({ manifest, rows, files });
  files['docs/work-queue/TASK-CATALOG.md'] = [
    '# Catalog', '',
    '| Task ID | Module | Tier | State | Local record | Dependencies | Owned paths/resources | Human actions | Validation |',
    '|---|---|---|---|---|---|---|---|---|',
    ...rows.map((row) => `| ${row.join(' | ')} |`),
    '',
  ].join('\n');
  write(root, 'package.json', `${JSON.stringify(manifest, null, 2)}\n`);
  for (const [path, contents] of Object.entries(files)) write(root, path, contents);
  return root;
}

function run(root) {
  try {
    const stdout = execFileSync(process.execPath, [validator, '--root', root], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { status: 0, stdout, stderr: '' };
  } catch (error) {
    return { status: error.status, stdout: error.stdout?.toString() ?? '', stderr: error.stderr?.toString() ?? '' };
  }
}

function withFixture(mutate, assertion) {
  const root = fixture(mutate);
  try { assertion(run(root)); } finally { rmSync(root, { recursive: true, force: true }); }
}

test('accepts a coherent queue repository', () => {
  withFixture(() => {}, ({ status, stdout }) => {
    assert.equal(status, 0);
    assert.equal(stdout, 'QUEUE_CHECK_OK\n');
  });
});

test('rejects root package workspace drift', () => {
  withFixture(({ manifest }) => { manifest.workspaces = ['apps/*']; }, ({ status, stderr }) => {
    assert.equal(status, 1); assert.match(stderr, /PACKAGE_CONTRACT_INVALID/);
  });
});

test('rejects a card state differing from its catalog row', () => {
  withFixture(({ files }) => { files['docs/work-queue/queue/00-inbox/M01-T090.md'] = '# M01\n\n- Tier: CORE_P0\n- Queue state: 20-active\n'; }, ({ status, stderr }) => {
    assert.equal(status, 1); assert.match(stderr, /TASK_STATE_MISMATCH/);
  });
});

test('rejects a dependency outside 60-done', () => {
  withFixture(({ rows }) => { rows[0][3] = '00-inbox'; rows[0][4] = 'docs/work-queue/queue/00-inbox/P00-T010.md'; }, ({ status, stderr }) => {
    assert.equal(status, 1); assert.match(stderr, /DEPENDENCY_NOT_ACCEPTED/);
  });
});

test('rejects a missing local specification', () => {
  withFixture(({ files }) => { files['docs/work-queue/STATE.md'] = '# State\n\n- CURRENT_TASK: M01-T090 (00-inbox)\n- LOCAL_SPECIFICATIONS: docs/specs/missing.md\n'; }, ({ status, stderr }) => {
    assert.equal(status, 1); assert.match(stderr, /LOCAL_SPECIFICATION_MISSING/);
  });
});

test('rejects a missing local Markdown link', () => {
  withFixture(({ files }) => { files['README.md'] = '# Fixture\n\n[missing](missing.md)\n'; }, ({ status, stderr }) => {
    assert.equal(status, 1); assert.match(stderr, /LOCAL_REFERENCE_MISSING/);
  });
});
