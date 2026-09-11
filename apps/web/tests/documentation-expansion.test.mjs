import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));

const newSourcePaths = [
  "src/app/docs/api/page.tsx",
  "src/app/docs/faq/page.tsx",
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

async function readExpansionSources(t) {
  const exists = await Promise.all(newSourcePaths.map(fileExists));
  if (!exists.every(Boolean)) {
    t.skip("GREEN assertions wait for the four declared S35 documentation sources");
    return null;
  }

  const [apiPage, faqPage, apiReference, faq, home, footer] = await Promise.all([
    ...newSourcePaths.map(readAppFile),
    readAppFile("src/components/docs/documentation-home.tsx"),
    readAppFile("src/components/landing/landing-footer.tsx"),
  ]);
  return { apiPage, faqPage, apiReference, faq, home, footer };
}

test("requires the declared API and FAQ documentation sources before GREEN", async () => {
  assert.deepEqual(await Promise.all(newSourcePaths.map(fileExists)), [true, true, true, true]);
});

test("composes static API and FAQ routes", async (t) => {
  const sources = await readExpansionSources(t);
  if (!sources) return;

  for (const page of [sources.apiPage, sources.faqPage]) {
    assert.equal((page.match(/<main\b/g) ?? []).length, 1);
    assert.match(page, /<LandingFooter\s*\/>/);
    assert.doesNotMatch(page, /["']use client["']/);
  }
  assert.match(sources.apiPage, /<ApiReference\s*\/>/);
  assert.match(sources.faqPage, /<DocumentationFaq\s*\/>/);
});

test("adds every new Docs destination to the home and footer", async (t) => {
  const sources = await readExpansionSources(t);
  if (!sources) return;

  assert.match(sources.home, /title: "API reference"/);
  assert.match(sources.home, /title: "FAQ"/);
  assert.match(sources.home, /href: "\/docs\/api"/);
  assert.match(sources.home, /href: "\/docs\/faq"/);
  assert.match(sources.footer, /<nav aria-label="Documentation links">/);
  assert.match(sources.footer, /<Link href="\/docs"[^>]*>Documentation<\/Link>/);
  assert.match(sources.footer, /<Link href="\/docs\/api"[^>]*>API reference<\/Link>/);
  assert.match(sources.footer, /<Link href="\/docs\/faq"[^>]*>FAQ<\/Link>/);

  const documentationNav = sources.footer.match(
    /<nav aria-label="Documentation links">([\s\S]*?)<\/nav>/,
  )?.[1];
  assert.ok(documentationNav);
  assert.deepEqual(
    [...documentationNav.matchAll(/<Link href="([^"]+)"/g)].map(([, href]) => href),
    ["/docs", "/docs/api", "/docs/faq"],
  );
});

test("keeps the API reference and FAQ factual, static, and local", async (t) => {
  const sources = await readExpansionSources(t);
  if (!sources) return;

  assert.match(sources.apiReference, /GET \/api\/tools/);
  assert.match(sources.apiReference, /POST \/api\/riskscan/);
  for (const field of ["requestRef", "subjectRef", "context", "declarations", "identity", "pricing", "limitations", "evidence"]) {
    assert.match(sources.apiReference, new RegExp(field));
  }
  assert.match(sources.apiReference, /host-specific/i);
  assert.match(sources.apiReference, /unavailable/i);
  assert.match(sources.apiReference, /public MCP endpoint is not part of the current local routes/i);
  assert.match(sources.faq, /testnet/i);
  assert.match(sources.faq, /caller-supplied/i);
  assert.match(sources.faq, /not proof of a completed payment/i);
  assert.match(sources.faq, /not an ATS deployment/i);

  const docs = [sources.apiPage, sources.faqPage, sources.apiReference, sources.faq].join("\n");
  const hrefs = [
    ...docs.matchAll(/\bhref:\s*["']([^"']+)["']/g),
    ...docs.matchAll(/\bhref\s*=\s*["']([^"']+)["']/g),
  ].map(([, href]) => href);
  assert.ok(hrefs.every((href) => ["/docs", "/docs/riskscan", "/docs/providers", "/docs/api", "/docs/faq"].includes(href)));
  assert.doesNotMatch(docs, /["']use client["']|\bfetch\s*\(|process\.env|localStorage|sessionStorage|indexedDB|\b(?:useState|useEffect|useReducer|useRef|useMemo|useCallback)\b|\b(?:axios|ky|useSWR|useQuery|useMutation|trpc|convex)\b/i);
  assert.doesNotMatch(docs, /<(?:button|form|input|select|textarea)\b/i);
  assert.doesNotMatch(docs, /(?:https?:\/\/|mailto:|target\s*=\s*["']_blank["']|href\s*=\s*["']\/\/)/i);
  assert.doesNotMatch(docs, /\b(?:is live|is available now|has raised|generates revenue|pays out|delivers returns|accepts payment|processes payment|confirms payment|executes a transaction|creates an asset|issues an asset|deploys an asset|offers a public campaign|funds a campaign|MCP endpoint is available|MCP server supports requests|payment succeeded|successful payment)\b/i);
  assert.match(docs, /\bshadow-none\b/);
  assert.match(docs, /\bfocus-visible:outline\b|\bbuttonVariants\(/);
});
