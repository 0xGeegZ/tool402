import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
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
    devDependencies: { marked: '18.0.11' },
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

function assertFailure(result, code) {
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, new RegExp(`(?:^|\\n)${code}: .+\\n`));
}

test('accepts a coherent queue repository', () => {
  withFixture(() => {}, ({ status, stdout }) => {
    assert.equal(status, 0);
    assert.equal(stdout, 'QUEUE_CHECK_OK\n');
  });
});

test('rejects root package workspace drift', () => {
  withFixture(({ manifest }) => { manifest.workspaces = ['apps/*']; }, ({ status, stderr }) => {
    assertFailure({ status, stdout: '', stderr }, 'PACKAGE_CONTRACT_INVALID');
  });
});

test('rejects a card state differing from its catalog row', () => {
  withFixture(({ files }) => { files['docs/work-queue/queue/00-inbox/M01-T090.md'] = '# M01\n\n- Tier: CORE_P0\n- Queue state: 20-active\n'; }, ({ status, stderr }) => {
    assertFailure({ status, stdout: '', stderr }, 'TASK_STATE_MISMATCH');
  });
});

test('rejects a dependency outside 60-done', () => {
  withFixture(({ rows }) => { rows[0][3] = '00-inbox'; rows[0][4] = 'docs/work-queue/queue/00-inbox/P00-T010.md'; }, ({ status, stderr }) => {
    assertFailure({ status, stdout: '', stderr }, 'DEPENDENCY_NOT_ACCEPTED');
  });
});

test('rejects a missing local specification', () => {
  withFixture(({ files }) => { files['docs/work-queue/STATE.md'] = '# State\n\n- CURRENT_TASK: M01-T090 (00-inbox)\n- LOCAL_SPECIFICATIONS: docs/specs/missing.md\n'; }, ({ status, stderr }) => {
    assertFailure({ status, stdout: '', stderr }, 'LOCAL_SPECIFICATION_MISSING');
  });
});

test('rejects a missing local Markdown link', () => {
  withFixture(({ files }) => { files['README.md'] = '# Fixture\n\n[missing](missing.md)\n'; }, ({ status, stderr }) => {
    assertFailure({ status, stdout: '', stderr }, 'LOCAL_REFERENCE_MISSING');
  });
});

test('rejects catalog cards symlinked outside the repository', () => {
  const root = fixture();
  const outside = mkdtempSync(join(tmpdir(), 'queue-check-outside-'));
  try {
    write(outside, 'card.md', '# P00\n\n- Tier: CORE_P0\n- Queue state: 60-done\n');
    rmSync(join(root, 'docs/work-queue/queue/60-done/P00-T010.md'));
    symlinkSync(join(outside, 'card.md'), join(root, 'docs/work-queue/queue/60-done/P00-T010.md'));
    assertFailure(run(root), 'LOCAL_RECORD_MISSING');
  } finally { rmSync(root, { recursive: true, force: true }); rmSync(outside, { recursive: true, force: true }); }
});

test('rejects local specifications symlinked outside the repository', () => {
  const root = fixture();
  const outside = mkdtempSync(join(tmpdir(), 'queue-check-outside-'));
  try {
    write(outside, 'spec.md', '# Outside\n');
    rmSync(join(root, 'docs/specs/fixture.md'));
    symlinkSync(join(outside, 'spec.md'), join(root, 'docs/specs/fixture.md'));
    assertFailure(run(root), 'LOCAL_SPECIFICATION_MISSING');
  } finally { rmSync(root, { recursive: true, force: true }); rmSync(outside, { recursive: true, force: true }); }
});

test('rejects Markdown targets symlinked outside the repository', () => {
  const root = fixture(({ files }) => { files['README.md'] = '# Fixture\n\n[target](docs/specs/fixture.md)\n'; });
  const outside = mkdtempSync(join(tmpdir(), 'queue-check-outside-'));
  try {
    write(outside, 'target.md', '# Outside\n');
    rmSync(join(root, 'docs/specs/fixture.md'));
    symlinkSync(join(outside, 'target.md'), join(root, 'docs/specs/fixture.md'));
    assertFailure(run(root), 'LOCAL_REFERENCE_ESCAPE');
  } finally { rmSync(root, { recursive: true, force: true }); rmSync(outside, { recursive: true, force: true }); }
});

test('rejects a missing reference-style Markdown link', () => {
  withFixture(({ files }) => { files['README.md'] = '# Fixture\n\n[missing][target]\n\n[target]: missing.md\n'; }, (result) => {
    assertFailure(result, 'LOCAL_REFERENCE_MISSING');
  });
});

test('ignores broken links inside tilde fenced code blocks', () => {
  withFixture(({ files }) => { files['README.md'] = '# Fixture\n\n~~~md\n[missing](missing.md)\n~~~\n'; }, ({ status, stdout, stderr }) => {
    assert.equal(status, 0); assert.equal(stdout, 'QUEUE_CHECK_OK\n'); assert.equal(stderr, '');
  });
});

test('reports malformed percent encoding as a stable diagnostic', () => {
  withFixture(({ files }) => { files['README.md'] = '# Fixture\n\n[bad](%ZZ.md)\n'; }, (result) => {
    assertFailure(result, 'LOCAL_REFERENCE_MISSING');
  });
});

test('rejects renamed catalog headers', () => {
  const root = fixture();
  try {
    write(root, 'docs/work-queue/TASK-CATALOG.md', '# Catalog\n\n| Identifier | Module | Tier | State | Local record | Dependencies | Owned paths/resources | Human actions | Validation |\n|---|---|---|---|---|---|---|---|---|\n');
    assertFailure(run(root), 'CATALOG_PARSE_ERROR');
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('rejects a missing shortcut reference-style Markdown link', () => {
  withFixture(({ files }) => { files['README.md'] = '# Fixture\n\n[missing]\n\n[missing]: missing.md\n'; }, (result) => {
    assertFailure(result, 'LOCAL_REFERENCE_MISSING');
  });
});

test('accepts angle-bracket reference destinations with spaces', () => {
  withFixture(({ files }) => {
    files['README.md'] = '# Fixture\n\n[guide][guide]\n\n[guide]: <docs/my file.md>\n';
    files['docs/my file.md'] = '# Guide\n';
  }, ({ status, stdout, stderr }) => {
    assert.equal(status, 0); assert.equal(stdout, 'QUEUE_CHECK_OK\n'); assert.equal(stderr, '');
  });
});

test('keeps links after an invalid tilde fence closer inside the fence', () => {
  withFixture(({ files }) => { files['README.md'] = '# Fixture\n\n~~~\n~~~not-a-close\n[missing](missing.md)\n~~~\n'; }, ({ status, stdout, stderr }) => {
    assert.equal(status, 0); assert.equal(stdout, 'QUEUE_CHECK_OK\n'); assert.equal(stderr, '');
  });
});

test('reports an in-repository directory target as missing', () => {
  withFixture(({ files }) => { files['README.md'] = '# Fixture\n\n[docs](docs)\n'; }, (result) => {
    assertFailure(result, 'LOCAL_REFERENCE_MISSING');
  });
});

test('does not resolve escaped or inline-code shortcut labels', () => {
  withFixture(({ files }) => { files['README.md'] = '# Fixture\n\n\\[x]\n\n`[x]`\n\n[x]: missing.md\n'; }, ({ status, stdout, stderr }) => {
    assert.equal(status, 0); assert.equal(stdout, 'QUEUE_CHECK_OK\n'); assert.equal(stderr, '');
  });
});

test('accepts inline destinations with spaces and balanced parentheses', () => {
  withFixture(({ files }) => {
    files['README.md'] = '# Fixture\n\n[space](<docs/my file.md>)\n\n[paren](docs/(guide).md)\n';
    files['docs/my file.md'] = '# Space\n';
    files['docs/(guide).md'] = '# Parentheses\n';
  }, ({ status, stdout, stderr }) => {
    assert.equal(status, 0); assert.equal(stdout, 'QUEUE_CHECK_OK\n'); assert.equal(stderr, '');
  });
});

test('uses the first duplicate reference definition', () => {
  withFixture(({ files }) => { files['README.md'] = '# Fixture\n\n[x]\n\n[x]: missing.md\n[x]: docs/specs/fixture.md\n'; }, (result) => {
    assertFailure(result, 'LOCAL_REFERENCE_MISSING');
  });
});

test('does not treat a backtick in fence info as a fence opener', () => {
  withFixture(({ files }) => { files['README.md'] = '# Fixture\n\n```md`invalid\n[missing](missing.md)\n'; }, (result) => {
    assertFailure(result, 'LOCAL_REFERENCE_MISSING');
  });
});

test('reports missing leaves under outward symlinked directories as escapes', () => {
  const root = fixture(({ files }) => { files['README.md'] = '# Fixture\n\n[missing](docs/external/missing.md)\n'; });
  const outside = mkdtempSync(join(tmpdir(), 'queue-check-outside-'));
  try {
    symlinkSync(outside, join(root, 'docs/external'));
    assertFailure(run(root), 'LOCAL_REFERENCE_ESCAPE');
  } finally { rmSync(root, { recursive: true, force: true }); rmSync(outside, { recursive: true, force: true }); }
});

test('rejects raw dot-dot traversal after an outward symlink', () => {
  const root = fixture(({ files }) => {
    files['README.md'] = '# Fixture\n\n[decoy](docs/out/../decoy.md)\n';
    files['docs/decoy.md'] = '# Decoy\n';
  });
  const outside = mkdtempSync(join(tmpdir(), 'queue-check-outside-'));
  try {
    symlinkSync(outside, join(root, 'docs/out'));
    assertFailure(run(root), 'LOCAL_REFERENCE_ESCAPE');
  } finally { rmSync(root, { recursive: true, force: true }); rmSync(outside, { recursive: true, force: true }); }
});

test('accepts an existing titled inline link', () => {
  withFixture(({ files }) => { files['README.md'] = '# Fixture\n\n[x](docs/specs/fixture.md "title")\n'; }, ({ status, stdout, stderr }) => {
    assert.equal(status, 0); assert.equal(stdout, 'QUEUE_CHECK_OK\n'); assert.equal(stderr, '');
  });
});

test('rejects a missing titled angle-bracket inline link', () => {
  withFixture(({ files }) => { files['README.md'] = '# Fixture\n\n[x](<missing.md> "title")\n'; }, (result) => {
    assertFailure(result, 'LOCAL_REFERENCE_MISSING');
  });
});

test('accepts escaped punctuation in an inline destination', () => {
  withFixture(({ files }) => {
    files['README.md'] = '# Fixture\n\n[x](docs/a\\(b\\).md)\n';
    files['docs/a(b).md'] = '# Escaped\n';
  }, ({ status, stdout, stderr }) => {
    assert.equal(status, 0); assert.equal(stdout, 'QUEUE_CHECK_OK\n'); assert.equal(stderr, '');
  });
});

test('does not let an unmatched backtick mask a broken link', () => {
  withFixture(({ files }) => { files['README.md'] = '# Fixture\n\n`unclosed [x](missing.md)\n'; }, (result) => {
    assertFailure(result, 'LOCAL_REFERENCE_MISSING');
  });
});

test('rejects nested link text with a missing target', () => {
  withFixture(({ files }) => { files['README.md'] = '# Fixture\n\n[outer [inner]](missing.md)\n'; }, (result) => {
    assertFailure(result, 'LOCAL_REFERENCE_MISSING');
  });
});
