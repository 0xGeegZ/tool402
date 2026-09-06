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

test("renders the guest workspace route without a fabricated session", async () => {
  const [page, shell, navigation, overview] = await Promise.all([
    readAppFile("src/app/dashboard/page.tsx"),
    readAppFile("src/components/workspace/workspace-shell.tsx"),
    readAppFile("src/components/workspace/workspace-navigation.tsx"),
    readAppFile("src/components/workspace/workspace-overview.tsx"),
  ]);

  assert.equal((page.match(/<main\b/g) ?? []).length, 1);
  assert.equal((page.match(/<h1\b/g) ?? []).length, 1);
  assert.match(page, /Workspace preview/);
  assert.match(shell, /no session is connected/i);
  assert.match(shell, /guest/i);
  assert.match(shell, /unconfigured/i);
  assert.match(shell, /<Badge\b/);
  assert.match(overview, /<Card\b/);

  const hrefs = [...navigation.matchAll(/\{ href: "([^"]+)", label: "[^"]+" \}/g)].map(([, href]) => href);
  assert.deepEqual(hrefs, [
    "/explore",
    "/explore/riskscan",
    "/explore/riskscan/tool-loop",
    "/dashboard/riskscan/compatibility",
    "/dashboard/riskscan",
  ]);
  assert.match(navigation, /<Link\b[^>]*href=\{link\.href\}/);
  assert.doesNotMatch(navigation, /<(?:a|button)\b/i);
});

test("adds only the Workspace route to local navigation", async () => {
  const navigation = await readAppFile("src/components/discovery/local-navigation.tsx");

  assert.match(navigation, /\{ href: "\/dashboard", label: "Workspace" \}/);
  const links = [...navigation.matchAll(/\{ href: "([^"]+)", label: "([^"]+)" \}/g)].map(([, href, label]) => ({ href, label }));
  assert.deepEqual(links, [
    { href: "/", label: "Home" },
    { href: "/explore", label: "Explore" },
    { href: "/dashboard", label: "Workspace" },
  ]);
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
