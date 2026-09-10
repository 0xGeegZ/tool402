import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

async function readWorkspaceSources() {
  return Promise.all([
    readAppFile("src/components/workspace/workspace-shell.tsx"),
    readAppFile("src/components/workspace/workspace-overview.tsx"),
    readAppFile("src/components/workspace/workspace-navigation.tsx"),
  ]);
}

test("maps dashboard journeys to the six committed local routes", async () => {
  const navigation = await readAppFile("src/components/workspace/workspace-navigation.tsx");
  const journeys = [...navigation.matchAll(/\{\s*href:\s*"([^"]+)",\s*label:\s*"([^"]+)"/g)].map(([, href, label]) => ({ href, label }));

  assert.deepEqual(journeys, [
    { href: "/explore", label: "Explore" },
    { href: "/explore/riskscan", label: "RiskScan" },
    { href: "/explore/riskscan/tool-loop", label: "Tool loop" },
    { href: "/dashboard/riskscan/compatibility", label: "Native compatibility" },
    { href: "/dashboard/riskscan", label: "RiskScan workbench" },
    { href: "/dashboard/riskscan/preflight", label: "Quick preflight" },
  ]);

  for (const title of [
    "Explore tools",
    "Read RiskScan",
    "Open ToolLoop boundary",
    "Check native compatibility",
    "Open RiskScan workbench",
    "Review disclosures",
  ]) {
    assert.match(navigation, new RegExp(`title: "${title}"`));
  }
});

test("keeps the dashboard guest-only and free of unsupported state", async () => {
  const [shell, overview, navigation] = await readWorkspaceSources();
  const workspace = [shell, overview, navigation].join("\n");

  assert.match(workspace, /Guest workspace/);
  assert.match(
    overview,
    /These guest routes stay local\. Nothing is sent until you explicitly submit a journey that supports it\./,
  );
  assert.doesNotMatch(overview, /local and descriptive/i);
  assert.doesNotMatch(
    workspace,
    /\b(?:account|wallet|provider|balance|payment|transaction|receipt|evidence|funding|live)\b/i,
  );
});
