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
    shell,
    /Routes stay local until a supported journey asks you to continue\./,
  );
  assert.doesNotMatch(overview, /local and descriptive/i);
  assert.doesNotMatch(
    workspace,
    /\b(?:account|wallet|provider|balance|payment|transaction|receipt|evidence|funding|live)\b/i,
  );
});

test("adapts the reference dashboard hierarchy to the current guest workspace", async () => {
  const [shell, overview, navigation] = await readWorkspaceSources();
  const dashboard = await readAppFile("src/app/dashboard/page.tsx");

  assert.match(dashboard, /Guest workspace/);
  assert.match(dashboard, /Current local journeys/);
  assert.match(shell, /space-y-8/);
  assert.match(overview, /Current access/);
  assert.match(overview, /Current tool/);
  assert.match(overview, /Current limits/);
  assert.match(navigation, /Current tool path/);
  assert.match(navigation, /Continue a local journey/);
  assert.match(navigation, /rounded-2xl/);
  assert.match(navigation, /shadow-none/);
});

test("reuses the truthful local footer below the guest workspace", async () => {
  const dashboard = await readAppFile("src/app/dashboard/page.tsx");

  assert.match(dashboard, /import \{ LandingFooter \} from "\.\.\/\.\.\/components\/landing\/landing-footer";/);
  assert.match(dashboard, /<LandingFooter\s*\/>/);
});
