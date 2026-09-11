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
  "src/app/docs/api/page.tsx",
  "src/app/docs/faq/page.tsx",
  "src/components/docs/documentation-home.tsx",
  "src/components/docs/riskscan-guide.tsx",
  "src/components/docs/provider-riskscan-guide.tsx",
  "src/components/docs/api-reference.tsx",
  "src/components/docs/documentation-faq.tsx",
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
    t.skip("GREEN assertions wait for the ten declared documentation sources");
    return null;
  }

  const [homePage, riskScanPage, providerPage, apiPage, faqPage, home, riskScanGuide, providerGuide, apiReference, faq, navigation, footer] = await Promise.all([
    ...sourcePaths.map(readAppFile),
    readAppFile("src/components/discovery/local-navigation.tsx"),
    readAppFile("src/components/landing/landing-footer.tsx"),
  ]);
  return {
    homePage,
    riskScanPage,
    providerPage,
    apiPage,
    faqPage,
    home,
    riskScanGuide,
    providerGuide,
    apiReference,
    faq,
    navigation,
    footer,
  };
}

test("requires every declared documentation source before GREEN", async () => {
  assert.deepEqual(await Promise.all(sourcePaths.map(fileExists)), Array.from({ length: sourcePaths.length }, () => true));
});

test("composes the five server-rendered documentation routes", async (t) => {
  const sources = await readDocumentationSources(t);
  if (!sources) return;
  const { homePage, riskScanPage, providerPage, apiPage, faqPage } = sources;

  for (const page of [homePage, riskScanPage, providerPage, apiPage, faqPage]) {
    assert.equal((page.match(/<main\b/g) ?? []).length, 1);
    assert.match(page, /<LandingFooter\s*\/>/);
    assert.doesNotMatch(page, /["']use client["']/);
  }
  assert.match(homePage, /<DocumentationHome\s*\/>/);
  assert.match(riskScanPage, /<RiskScanGuide\s*\/>/);
  assert.match(providerPage, /<ProviderRiskScanGuide\s*\/>/);
  assert.match(apiPage, /<ApiReference\s*\/>/);
  assert.match(faqPage, /<DocumentationFaq\s*\/>/);
});

test("keeps the documentation entry and RiskScan guide factual and local", async (t) => {
  const sources = await readDocumentationSources(t);
  if (!sources) return;
  const { home, riskScanGuide } = sources;

  assert.match(home, /<PageHeader\b/);
  assert.match(riskScanGuide, /<PageHeader\b/);
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

  assert.match(providerGuide, /<PageHeader\b/);
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
  const docs = [
    sources.homePage,
    sources.riskScanPage,
    sources.providerPage,
    sources.home,
    sources.riskScanGuide,
    sources.providerGuide,
    sources.apiReference,
    sources.faq,
  ].join("\n");
  const declaredHrefLiterals = new Set([
    "/docs",
    "/docs/riskscan",
    "/docs/providers",
    "/docs/api",
    "/docs/faq",
    "/explore/riskscan",
    "/explore/riskscan/tool-loop",
    "/demo",
    "/provider",
    "/provider/deploy",
    "#scope",
    "#request-shape",
    "#result-boundary",
    "#local-routes",
    "#provider-preview",
    "#five-steps",
    "#control-boundary",
    "#local-next-steps",
  ]);
  const hrefLiterals = [
    ...docs.matchAll(/\bhref:\s*["']([^"']+)["']/g),
    ...docs.matchAll(/\bhref\s*=\s*["']([^"']+)["']/g),
  ].map(([, href]) => href);

  assert.ok(hrefLiterals.every((href) => declaredHrefLiterals.has(href)));
  assert.doesNotMatch(
    docs,
    /["']use client["']|\bfetch\s*\(|process\.env|localStorage|sessionStorage|indexedDB|\b(?:useState|useEffect|useReducer|useRef|useMemo|useCallback)\b|\b(?:axios|ky|useSWR|useQuery|useMutation|trpc|convex)\b|\b(?:analytics|gtag|posthog|segment)\b/i,
  );
  assert.doesNotMatch(docs, /<(?:button|form|input|select|textarea)\b/i);
  assert.doesNotMatch(docs, /(?:https?:\/\/|mailto:|target\s*=\s*["']_blank["']|href\s*=\s*["']\/\/)/i);
  assert.doesNotMatch(docs, /(?:next\/image|<img\b|<Image\b|\bsrc\s*=|\burl\()/i);
  assert.doesNotMatch(
    docs,
    /\b(?:is live|is available now|has raised|generates revenue|pays out|delivers returns|accepts payment|processes payment|confirms payment|executes a transaction|creates an asset|issues an asset|deploys an asset|offers a public campaign|funds a campaign)\b/i,
  );
  assert.match(sources.providerGuide, /not an ATS deployment/i);
  assert.match(docs, /\bshadow-none\b/);
  assert.match(docs, /\blg:sticky\b/);
  assert.match(docs, /\bfocus-visible:outline\b/);
  assert.ok((docs.match(/<h2\b/g) ?? []).length >= 4);
  assert.match(sources.navigation, /\{ href: "\/docs", label: "Docs" \}/);
  assert.match(sources.footer, /<Link href="\/docs\/providers"[^>]*>Provider documentation<\/Link>/);
});
