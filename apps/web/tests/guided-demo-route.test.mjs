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
  ["/", "Product overview", "Read the product overview and continue to Explore."],
  ["/explore", "Explore assessments", "Find the RiskScan entry and its local discovery surface."],
  ["/explore/riskscan", "Read RiskScan", "Review the Quick input, result, and configuration boundaries."],
  ["/explore/riskscan/try", "Try the local request", "Inspect the bounded Quick request surface."],
  ["/explore/riskscan/tool-loop?demo=tool-loop", "Follow ToolLoop", "Inspect the local ToolLoop request boundary."],
  ["/dashboard", "Open the dashboard", "See the guest dashboard shell."],
  ["/dashboard/riskscan", "Review the workbench", "Follow the guest RiskScan workbench sequence."],
  [
    "/dashboard/riskscan/compatibility",
    "Check compatibility",
    "Inspect the guest native quote compatibility surface.",
  ],
  ["/dashboard/riskscan/preflight", "Review disclosures", "Inspect the guest Quick disclosure preflight."],
];

const expectedRouteFiles = {
  "/": "src/app/page.tsx",
  "/explore": "src/app/explore/page.tsx",
  "/explore/riskscan": "src/app/explore/riskscan/page.tsx",
  "/explore/riskscan/try": "src/app/explore/riskscan/try/page.tsx",
  "/explore/riskscan/tool-loop?demo=tool-loop": "src/app/explore/riskscan/tool-loop/page.tsx",
  "/dashboard": "src/app/dashboard/page.tsx",
  "/dashboard/riskscan": "src/app/dashboard/riskscan/page.tsx",
  "/dashboard/riskscan/compatibility": "src/app/dashboard/riskscan/compatibility/page.tsx",
  "/dashboard/riskscan/preflight": "src/app/dashboard/riskscan/preflight/page.tsx",
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

test("keeps the nine guided steps in the exact local order and copy", async (t) => {
  const sources = await readGuidedSources(t);
  if (!sources) return;
  const { steps } = sources;
  const rows = [
    ...steps.matchAll(
      /\{\s*href:\s*["']([^"']+)["']\s*,\s*title:\s*["']([^"']+)["']\s*,\s*observation:\s*["']([^"']+)["']\s*\}/g,
    ),
  ].map(([, href, title, observation]) => [href, title, observation]);

  assert.deepEqual(rows, expectedRows);
  assert.equal((steps.match(/<Link\b/g) ?? []).length, 1);
  assert.doesNotMatch(steps, /<a\b/i);
  assert.match(steps, /from\s+["']next\/link["']/);
  assert.match(steps, /const chapters = \[/);
  assert.match(steps, /steps\.slice\(chapter\.start, chapter\.end\)\.map\(/);
  assert.match(steps, /className="flex flex-col gap-8"/);
  assert.match(steps, /className="grid gap-4 md:grid-cols-2"/);
  assert.match(steps, /<Link\b[^>]*href=\{step\.href\}/);
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
  assert.doesNotMatch(
    sources,
    /\b(?:backing|position|onboarding|verification|reviewer|activity|issue|uptime|price|balance|simulated|illustrative|provider|payment|transaction|live|human|narrat(?:e|ion|ed)|fund(?:ing)?|offering|portfolio|allocation|clearing|snapshot|payout|ats|sign[- ]?in|sign[- ]?up|evidence|receipt|deployment|submission)\b|\bnetwork\s+status\b/i,
  );
  assert.ok([...sources.matchAll(/href\s*=\s*\{?(["'])(\/[^"']*)\1\}?/g)].every(([, , href]) => !href.startsWith("//")));
});

test("preserves four public navigation entries plus the conditional Dashboard entry", async (t) => {
  const sources = await readGuidedSources(t);
  if (!sources) return;
  const { navigation, landingTest } = sources;

  const entries = [
    ...navigation.matchAll(/\{ href: "([^"]+)", label: "([^"]+)" \}/g),
  ].map(([, href, label]) => [href, label]);
  assert.deepEqual(entries, [
    ["/explore", "Explore tools"],
    ["/docs", "Docs"],
    ["/demo", "Guided demo"],
    ["/provider", "Campaign"],
    ["/dashboard", "Dashboard"],
  ]);
  const hrefGuardLines = landingTest
    .split("\n")
    .filter((line) => line.includes("doesNotMatch(navigation") && line.includes("href:"));
  assert.equal(hrefGuardLines.length, 1);
  assert.match(
    hrefGuardLines[0],
    /href: "\(\?!\\?\/explore"\|\\?\/docs"\|\\?\/demo"\|\\?\/provider"\|\\?\/dashboard"\)/,
  );
  assert.equal((hrefGuardLines[0].match(/\|/g) ?? []).length, 4);
});
