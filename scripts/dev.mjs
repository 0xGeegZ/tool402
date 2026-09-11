import { readFileSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = new URL('..', import.meta.url);
const rootPath = fileURLToPath(root);
const environmentPath = fileURLToPath(new URL('.env.local', root));
const keyIdPattern = /^[A-Za-z0-9_-]{1,64}$/u;
const secretPattern = /^[0-9a-f]{64}$/u;

export function parseDevEnvironment(text) {
  const values = new Map();
  for (const line of text.split(/\r?\n/u)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/u);
    if (!match) continue;
    const [, key, raw] = match;
    const quoted = raw.match(/^(?:"([\s\S]*)"|'([\s\S]*)')$/u);
    values.set(key, quoted ? (quoted[1] ?? quoted[2] ?? '') : raw);
  }
  const deployment = values.get('CONVEX_DEPLOYMENT');
  const site = values.get('CONVEX_SITE_URL');
  if (typeof deployment !== 'string' || !deployment.startsWith('dev:')) {
    throw new Error('CONVEX_DEPLOYMENT must name a development deployment');
  }
  if (typeof site !== 'string') throw new Error('CONVEX_SITE_URL is required');
  let url;
  try {
    url = new URL(site);
  } catch {
    throw new Error('CONVEX_SITE_URL must be an HTTPS URL');
  }
  if (
    url.protocol !== 'https:' ||
    url.username !== '' ||
    url.password !== '' ||
    url.pathname !== '/' ||
    url.search !== '' ||
    url.hash !== '' ||
    !url.hostname.endsWith('.convex.site')
  ) {
    throw new Error('CONVEX_SITE_URL must be a Convex site URL');
  }
  return Object.freeze({ deployment, site: url.origin });
}

function readIngressValue(name, deployment) {
  const result = spawnSync(
    'npm',
    ['exec', '--workspace', '@tool402/backend', '--', 'convex', 'env', 'get', name, '--deployment', deployment.slice('dev:'.length)],
    { cwd: rootPath, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
  if (result.status !== 0) throw new Error(`could not read development ${name}`);
  return result.stdout.trim();
}

function readRuntimeEnvironment() {
  let parsed;
  try {
    parsed = parseDevEnvironment(readFileSync(environmentPath, 'utf8'));
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'invalid development environment');
  }
  const keyId = readIngressValue('TOOL402_INGRESS_KEY_ID', parsed.deployment);
  const secret = readIngressValue('TOOL402_INGRESS_SECRET', parsed.deployment);
  if (!keyIdPattern.test(keyId) || !secretPattern.test(secret)) {
    throw new Error('development ingress relay is not configured');
  }
  return Object.freeze({
    ...parsed,
    keyId,
    secret,
  });
}

function start() {
  const runtime = readRuntimeEnvironment();
  const environment = {
    ...process.env,
    CONVEX_DEPLOYMENT: runtime.deployment,
    TOOL402_CONVEX_SITE_URL: runtime.site,
    TOOL402_INGRESS_KEY_ID: runtime.keyId,
    TOOL402_INGRESS_SECRET: runtime.secret,
  };
  const convex = spawn(
    'npm',
    ['exec', '--workspace', '@tool402/backend', '--', 'convex', 'dev', '--env-file', '.env.local', '--tail-logs', 'pause-on-deploy'],
    { cwd: rootPath, env: environment, stdio: 'inherit' },
  );
  const web = spawn('npm', ['run', 'dev', '--workspace=@tool402/web'], {
    cwd: rootPath,
    env: environment,
    stdio: 'inherit',
  });
  const children = [convex, web];
  let closing = false;
  const close = (signal, exitCode = 0) => {
    if (closing) return;
    closing = true;
    for (const child of children) child.kill(signal);
    process.exitCode = exitCode;
  };
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => close(signal));
  for (const child of children) child.once('exit', (code) => {
    if (!closing) close('SIGTERM', code === 0 ? 0 : 1);
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    start();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : 'could not start development'}\n`);
    process.exitCode = 1;
  }
}
