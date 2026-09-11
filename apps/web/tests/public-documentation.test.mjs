import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));

const sourcePaths = [
  "src/app/docs/page.tsx",
  "src/app/docs/riskscan/page.tsx",
  "src/app/docs/providers/page.tsx",
  "src/components/docs/documentation-home.tsx",
  "src/components/docs/riskscan-guide.tsx",
  "src/components/docs/provider-riskscan-guide.tsx",
];

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

async function fileExists(path) {
  try {
    await access(join(appRoot, path));
    return true;
  } catch {
    return false;
  }
}

async function readDocumentationSources(t) {
  const exists = await Promise.all(sourcePaths.map(fileExists));
  if (!exists.every(Boolean)) {
    t.skip("GREEN assertions wait for the six declared documentation sources");
    return null;
  }

  const [homePage, riskScanPage, providerPage, home, riskScanGuide, providerGuide, navigation, footer] = await Promise.all([
    ...sourcePaths.map(readAppFile),
    readAppFile("src/components/discovery/local-navigation.tsx"),
    readAppFile("src/components/landing/landing-footer.tsx"),
  ]);
  return { homePage, riskScanPage, providerPage, home, riskScanGuide, providerGuide, navigation, footer };
}

test("requires the six declared documentation sources before GREEN", async () => {
  assert.deepEqual(await Promise.all(sourcePaths.map(fileExists)), Array.from({ length: sourcePaths.length }, () => true));
});

test("composes the three server-rendered documentation routes", async (t) => {
  const sources = await readDocumentationSources(t);
  if (!sources) return;
  const { homePage, riskScanPage, providerPage } = sources;

  for (const page of [homePage, riskScanPage, providerPage]) {
    assert.equal((page.match(/<main\b/g) ?? []).length, 1);
    assert.match(page, /<LandingFooter\s*\/>/);
    assert.doesNotMatch(page, /["']use client["']/);
  }
  assert.match(homePage, /<DocumentationHome\s*\/>/);
  assert.match(riskScanPage, /<RiskScanGuide\s*\/>/);
  assert.match(providerPage, /<ProviderRiskScanGuide\s*\/>/);
});

test("keeps the documentation entry and RiskScan guide factual and local", async (t) => {
  const sources = await readDocumentationSources(t);
  if (!sources) return;
  const { home, riskScanGuide } = sources;

  assert.equal((home.match(/<h1\b/g) ?? []).length, 1);
  assert.equal((riskScanGuide.match(/<h1\b/g) ?? []).length, 1);
  assert.match(home, /href: "\/docs\/riskscan"/);
  assert.match(home, /href: "\/docs\/providers"/);
  assert.match(riskScanGuide, /GET \/api\/tools/);
  assert.match(riskScanGuide, /POST \/api\/riskscan/);
  assert.match(riskScanGuide, /requestRef/);
  assert.match(riskScanGuide, /subjectRef/);
  assert.match(riskScanGuide, /context/);
  assert.match(riskScanGuide, /declarations/);
  for (const declaration of ["identity", "pricing", "limitations", "evidence"]) {
    assert.match(riskScanGuide, new RegExp(`>${declaration}<|["']${declaration}["']`));
  }
  assert.match(riskScanGuide, /caller-supplied declarations/i);
  assert.match(riskScanGuide, /host-specific/i);
  assert.match(riskScanGuide, /unavailable boundary/i);
  assert.match(riskScanGuide, /href: "\/explore\/riskscan"/);
  assert.match(riskScanGuide, /href: "\/explore\/riskscan\/tool-loop"/);
  assert.match(riskScanGuide, /href: "\/demo"/);
});

test("keeps the Provider guide within the current preview boundary", async (t) => {
  const sources = await readDocumentationSources(t);
  if (!sources) return;
  const { providerGuide } = sources;

  assert.equal((providerGuide.match(/<h1\b/g) ?? []).length, 1);
  for (const title of [
    "Tool details",
    "Interface and capability",
    "Pricing and target agent customers",
    "Funding and revenue-note terms",
    "Review and sign",
  ]) {
    assert.match(providerGuide, new RegExp(`title: ["']${title}["']`));
  }
  assert.match(providerGuide, /first four steps/i);
  assert.match(providerGuide, /non-editable/i);
  assert.match(providerGuide, /read-only/i);
  assert.match(providerGuide, /conditionally gated/i);
  assert.match(providerGuide, /href: "\/provider"/);
  assert.match(providerGuide, /href: "\/provider\/deploy"/);
  assert.match(providerGuide, /href: "\/explore\/riskscan"/);
  assert.match(providerGuide, /href: "\/demo"/);
});

test("keeps the guides static, flat, focusable, and free of public-capability claims", async (t) => {
  const sources = await readDocumentationSources(t);
  if (!sources) return;
  const docs = [sources.home, sources.riskScanGuide, sources.providerGuide].join("\n");

  assert.doesNotMatch(docs, /["']use client["']|\bfetch\s*\(|process\.env|localStorage|sessionStorage|indexedDB/i);
  assert.doesNotMatch(docs, /<(?:button|form|input|select|textarea)\b/i);
  assert.doesNotMatch(docs, /(?:https?:\/\/|mailto:|target\s*=|href\s*=\s*["']\/\/)/i);
  assert.doesNotMatch(docs, /\b(?:is live|is available|has raised|generates revenue|pays out|delivers returns)\b/i);
  assert.match(docs, /\bshadow-none\b/);
  assert.match(docs, /\blg:sticky\b/);
  assert.match(docs, /\bfocus-visible:outline\b/);
  assert.ok((docs.match(/<h2\b/g) ?? []).length >= 4);
  assert.match(sources.navigation, /\{ href: "\/docs", label: "Docs" \}/);
  assert.match(sources.footer, /<Link href="\/docs\/providers"[^>]*>Provider documentation<\/Link>/);
});
