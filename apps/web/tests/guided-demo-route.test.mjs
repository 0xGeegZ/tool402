import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const sourcePaths = [
  "src/app/demo/page.tsx",
  "src/components/demo/guided-demo-steps.tsx",
];

const expectedRows = [
  ["/", "Introduce Tool402"],
  ["/explore", "Find RiskScan"],
  ["/explore/riskscan", "Explain the tool"],
  ["/explore/riskscan/tool-loop?demo=tool-loop", "Inspect one request"],
  ["/provider/deploy", "Prepare a campaign"],
  ["/sign-in", "Open your dashboard"],
];

const expectedRouteFiles = {
  "/": "src/app/page.tsx",
  "/explore": "src/app/explore/page.tsx",
  "/explore/riskscan": "src/app/explore/riskscan/page.tsx",
  "/explore/riskscan/tool-loop?demo=tool-loop": "src/app/explore/riskscan/tool-loop/page.tsx",
  "/provider/deploy": "src/app/provider/deploy/page.tsx",
  "/sign-in": "src/app/sign-in/page.tsx",
};

async function fileExists(path) {
  try {
    await access(join(appRoot, path));
    return true;
  } catch {
    return false;
  }
}

async function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

async function readGuidedSources(t) {
  const exists = await Promise.all(sourcePaths.map(fileExists));
  if (!exists.every(Boolean)) {
    t.skip("GREEN assertions wait for both guided-demo source files");
    return null;
  }
  const [page, steps, navigation, landingTest] = await Promise.all([
    readAppFile(sourcePaths[0]),
    readAppFile(sourcePaths[1]),
    readAppFile("src/components/discovery/local-navigation.tsx"),
    readAppFile("tests/landing-explore.test.mjs"),
  ]);
  return { page, steps, navigation, landingTest };
}

test("requires the exact guided-demo source before GREEN", async () => {
  assert.deepEqual(await Promise.all(sourcePaths.map(fileExists)), [true, true]);
});

test("composes one server page with the named guided step component", async (t) => {
  const sources = await readGuidedSources(t);
  if (!sources) return;
  const { page } = sources;

  assert.equal((page.match(/<main\b/g) ?? []).length, 1);
  assert.equal((page.match(/<PageHeader\b/g) ?? []).length, 1);
  assert.match(page, /import\s*\{\s*GuidedDemoSteps\s*\}\s+from\s+["'][^"']*guided-demo-steps["']/);
  assert.match(page, /<GuidedDemoSteps\s*\/>/);
});

test("keeps one request and the campaign journey in six reachable main steps", async (t) => {
  const sources = await readGuidedSources(t);
  if (!sources) return;
  const { steps } = sources;
  const rows = [
    ...steps.matchAll(
      /\{\s*href:\s*["']([^"']+)["']\s*,\s*title:\s*["']([^"']+)["']\s*,\s*observation:\s*["']([^"']+)["']\s*\}/g,
    ),
  ].map(([, href, title]) => [href, title]);

  assert.deepEqual(rows, expectedRows);
  assert.equal((steps.match(/<Link\b/g) ?? []).length, 1);
  assert.doesNotMatch(steps, /<a\b/i);
  assert.match(steps, /from\s+["']next\/link["']/);
  assert.match(steps, /const chapters = \[/);
  assert.match(steps, /steps\.slice\(chapter\.start, chapter\.end\)\.map\(/);
  assert.match(steps, /className="flex flex-col gap-8"/);
  assert.match(steps, /className="grid gap-4 md:grid-cols-2"/);
  assert.match(steps, /<Link\b[^>]*href=\{withTour\(step\.href\)\}/);
  assert.deepEqual(
    [...steps.matchAll(/href:\s*["']([^"']+)["']/g)].map(([, href]) => href),
    expectedRows.map(([href]) => href),
  );
  assert.deepEqual(
    Object.entries(expectedRouteFiles),
    expectedRows.map(([href]) => [href, expectedRouteFiles[href]]),
  );
  assert.deepEqual(
    await Promise.all(Object.values(expectedRouteFiles).map(fileExists)),
    Array.from({ length: expectedRows.length }, () => true),
  );
});

test("keeps the demo route local, static, and outside excluded authority claims", async (t) => {
  const loaded = await readGuidedSources(t);
  if (!loaded) return;
  const { page, steps } = loaded;
  const sources = `${page}\n${steps}`;

  assert.doesNotMatch(sources, /["']use client["']/i);
  assert.doesNotMatch(sources, /\bfetch\s*\(|\b(?:setTimeout|setInterval|clearTimeout|clearInterval)\s*\(/);
  assert.doesNotMatch(sources, /\b(?:localStorage|sessionStorage|indexedDB|process\.env|import\.meta\.env)\b/i);
  assert.doesNotMatch(sources, /\b(?:analytics|gtag|posthog|segment)\b/i);
  assert.doesNotMatch(sources, /(?:https?:\/\/|mailto:|target\s*=|href\s*=\s*["']\/\/)/i);
  assert.doesNotMatch(sources, /guest (?:dashboard|workspace)|current guest surfaces/i);
  assert.match(page, /<details\b/);
  for (const href of ["/explore/riskscan/try", "/dashboard/riskscan", "/dashboard/riskscan/compatibility", "/dashboard/riskscan/preflight", "/provider"]) {
    assert.ok(page.includes(`href="${href}"`));
    await access(join(appRoot, `src/app${href}/page.tsx`));
  }
  await access(join(appRoot, "src/app/dashboard/page.tsx"));
  assert.ok([...sources.matchAll(/href\s*=\s*\{?(["'])(\/[^"']*)\1\}?/g)].every(([, , href]) => !href.startsWith("//")));
});

test("preserves two public navigation entries plus the conditional Dashboard entry", async (t) => {
  const sources = await readGuidedSources(t);
  if (!sources) return;
  const { navigation, landingTest } = sources;

  const entries = [
    ...navigation.matchAll(/\{ href: "([^"]+)", label: "([^"]+)" \}/g),
  ].map(([, href, label]) => [href, label]);
  assert.deepEqual(entries, [
    ["/explore", "Explore tools"],
    ["/demo", "Guided demo"],
    ["/dashboard", "Dashboard"],
  ]);
  const hrefGuardLines = landingTest
    .split("\n")
    .filter((line) => line.includes("doesNotMatch(navigation") && line.includes("href:"));
  assert.equal(hrefGuardLines.length, 1);
  assert.match(
    hrefGuardLines[0],
    /href: "\(\?!\\?\/explore"\|\\?\/demo"\|\\?\/dashboard"\)/,
  );
  assert.equal((hrefGuardLines[0].match(/\|/g) ?? []).length, 2);
});
