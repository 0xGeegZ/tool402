import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

const fabricatedWorkspaceState = /\bsigner\b|\b(?:authenticated|active)\s+session\b|\bsession\s+is\s+(?:active|authenticated)\b/i;

test("presents the guest workspace as a dashboard rather than a preview", async () => {
  const [page, shell, navigation, overview] = await Promise.all([
    readAppFile("src/app/dashboard/page.tsx"),
    readAppFile("src/components/workspace/workspace-shell.tsx"),
    readAppFile("src/components/workspace/workspace-navigation.tsx"),
    readAppFile("src/components/workspace/workspace-overview.tsx"),
  ]);

  assert.equal((page.match(/<main\b/g) ?? []).length, 1);
  assert.equal((page.match(/<PageHeader\b/g) ?? []).length, 1);
  assert.match(page, /title="Dashboard"/);
  assert.doesNotMatch(page, /Workspace preview/);
  assert.match(shell, /aria-label="Guest workspace"/);
  assert.match(shell, /guest/i);
  assert.match(shell, /<Badge\b/);
  assert.match(overview, /<Card\b/);
  assert.match(navigation, /<nav\b[^>]*aria-label="Dashboard journeys"/);
  assert.match(navigation, /<Link\b[^>]*href=\{link\.href\}/);
  assert.doesNotMatch(navigation, /<(?:a|button)\b/i);
});

test("preserves the exact five-entry local navigation", async () => {
  const navigation = await readAppFile("src/components/discovery/local-navigation.tsx");

  assert.match(navigation, /\{ href: "\/dashboard", label: "Workspace" \}/);
  const links = [...navigation.matchAll(/\{ href: "([^"]+)", label: "([^"]+)" \}/g)].map(([, href, label]) => ({ href, label }));
  assert.deepEqual(links, [
    { href: "/", label: "Home" },
    { href: "/explore", label: "Explore" },
    { href: "/dashboard", label: "Workspace" },
    { href: "/demo", label: "Demo" },
    { href: "/provider", label: "Campaign" },
  ]);
});

test("keeps the shared local navigation list responsive without a width workaround", async () => {
  const navigation = await readAppFile("src/components/discovery/local-navigation.tsx");
  const listOpenings = [...navigation.matchAll(/<ul\b([^>]*)>/gu)];

  assert.equal(listOpenings.length, 1);
  assert.equal(
    listOpenings[0][1],
    ' className="flex flex-wrap items-center gap-1 text-sm font-medium"',
  );
});

test("keeps the workspace shell static and local", async () => {
  const sources = await Promise.all([
    readAppFile("src/app/dashboard/page.tsx"),
    readAppFile("src/components/workspace/workspace-shell.tsx"),
    readAppFile("src/components/workspace/workspace-navigation.tsx"),
    readAppFile("src/components/workspace/workspace-overview.tsx"),
  ]);

  const workspaceSource = sources.join("\n");

  assert.doesNotMatch(
    workspaceSource,
    /["']use client["']|\bfetch\b|process\.env|localStorage|sessionStorage|setTimeout|setInterval|analytics|currentUser|connectWallet|signOut|\b(?:identity|account|wallet|provider|balance|position|notification|activity|payment|result|receipt|evidence|transaction|deployment|live)\b|https?:\/\//i,
  );
  assert.doesNotMatch(workspaceSource, fabricatedWorkspaceState);
  assert.match("Signer: 0x123", fabricatedWorkspaceState);
  assert.match("An authenticated session is active", fabricatedWorkspaceState);
});
