import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const repositoryRoot = fileURLToPath(new URL("../../..", import.meta.url));
const actionPath = join(appRoot, "src/components/provider/deploy/ats-create-action.tsx");
const stagesPath = join(appRoot, "src/components/provider/deploy/provider-deploy-stages.tsx");
const dotenvMockPath = join(appRoot, "src/lib/ats/browser/dotenv-mock.ts");
const winstonMockPath = join(appRoot, "src/lib/ats/browser/winston-mock.ts");

test("pins the exact official ATS SDK package and registry integrity", async () => {
  const [manifestText, lockText] = await Promise.all([
    readFile(join(appRoot, "package.json"), "utf8"),
    readFile(join(repositoryRoot, "package-lock.json"), "utf8"),
  ]);
  const manifest = JSON.parse(manifestText);
  const lock = JSON.parse(lockText);

  assert.equal(manifest.dependencies["@hashgraph/asset-tokenization-sdk"], "8.0.0");
  assert.equal(lock.packages["node_modules/@hashgraph/asset-tokenization-sdk"]?.version, "8.0.0");
  assert.equal(
    lock.packages["node_modules/@hashgraph/asset-tokenization-sdk"]?.integrity,
    "sha512-V5Tg6IrWhMwxEWzzvv7fZWu4a8zXDj8vAk5OCO9W0dtact32hljstahPIY5dLvlpyNWwNXaepzpvDj77DoccsA==",
  );
});

test("mounts one non-executing client SDK probe at the stage 3 first sub-step", async () => {
  assert.equal(existsSync(actionPath), true, "missing ATS SDK bundle-gate client island");

  const [action, stages] = await Promise.all([
    readFile(actionPath, "utf8"),
    readFile(stagesPath, "utf8"),
  ]);

  assert.match(action, /^"use client";/);
  assert.match(action, /import\s+\{\s*Bond\s*\}\s+from\s+"@hashgraph\/asset-tokenization-sdk";/);
  assert.match(
    action,
    /const sdkAvailable\s*=\s*typeof Bond === "object"\s*&&\s*Bond !== null\s*&&\s*typeof Bond\.create === "function";/,
  );
  assert.match(action, /<Button\b[^>]*\bdisabled\b[^>]*\bdata-sdk-bundle=/);
  assert.match(action, /Create revenue note — unavailable/);
  assert.doesNotMatch(action, /\b(?:onClick|Network\.\w+|Bond\.create\s*\(|wallet|provider|configuration|transaction)\b/i);

  assert.match(stages, /import\s+\{\s*AtsCreateAction\s*\}\s+from\s+"\.\/ats-create-action";/);
  assert.equal((stages.match(/<AtsCreateAction\b/g) ?? []).length, 1);
  assert.match(
    stages,
    /"returnsCandidate" in substep\s*\?\s*\(\s*<>\s*\{index === 2 && substepIndex === 0 \? <AtsCreateAction\b/s,
  );
});

test("uses the ATS browser aliases and the BBS package's own WASM fallback in Turbopack", async () => {
  const config = await readFile(join(appRoot, "next.config.ts"), "utf8");

  for (const moduleName of [
    "dotenv",
    "winston",
    "winston-daily-rotate-file",
    "winston-transport",
  ]) {
    assert.match(config, new RegExp(`["']?${moduleName}["']?:\\s*\\{\\s*browser:`));
  }
  assert.match(config, /turbopack:\s*\{\s*resolveAlias:/);
  assert.match(
    config,
    /serverExternalPackages:\s*\[\s*"@mattrglobal\/node-bbs-signatures"\s*\]/,
  );
  assert.match(
    config,
    /"@mattrglobal\/node-bbs-signatures":\s*\{\s*browser:\s*"@mattrglobal\/bbs-signatures\/lib\/wasm_module\.js",?\s*\}/,
  );
  assert.doesNotMatch(config, /(?:nodePolyfills|resolveAlias:\s*\{[^}]*\bfs\b)/s);

  assert.equal(existsSync(dotenvMockPath), true, "missing browser dotenv adapter");
  assert.equal(existsSync(winstonMockPath), true, "missing browser Winston adapter");

  const [dotenvMock, winstonMock] = await Promise.all([
    readFile(dotenvMockPath, "utf8"),
    readFile(winstonMockPath, "utf8"),
  ]);
  assert.match(dotenvMock, /export const config\s*=\s*\(\)\s*=>\s*\(\{\}\)/);
  assert.match(winstonMock, /export const createLogger/);
  assert.match(winstonMock, /export const format/);
  assert.match(winstonMock, /export const transports/);
});
