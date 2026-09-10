import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

function escape(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const migratedHeaders = {
  "src/app/explore/page.tsx": { eyebrow: "Marketplace", title: "Explore tools" },
  "src/app/explore/riskscan/try/page.tsx": { title: "Try RiskScan" },
  "src/app/explore/riskscan/tool-loop/page.tsx": { title: "RiskScan ToolLoop" },
  "src/app/dashboard/riskscan/page.tsx": { title: "RiskScan workbench" },
  "src/app/dashboard/riskscan/preflight/page.tsx": { title: "RiskScan Quick preflight" },
  "src/app/dashboard/riskscan/compatibility/page.tsx": { title: "Native quote compatibility" },
  "src/app/demo/page.tsx": { eyebrow: "Guided demo", title: "Take the guided tour" },
  "src/app/provider/page.tsx": { eyebrow: "Tool operator", title: "Campaign status", actions: true },
  "src/components/riskscan/detail/riskscan-detail.tsx": { eyebrow: "Read-only detail", title: "RiskScan" },
  "src/components/provider/deploy/provider-deploy-wizard.tsx": { eyebrow: "Provider workspace", title: "Prepare a tool offering" },
};

const outcomeSentences = {
  not_configured: "No campaign backend is configured for this host.",
  absent: "No admitted record exists yet.",
  unavailable: "The campaign backend did not answer.",
  unexpected_response: "The campaign backend returned a record this page cannot read.",
};

test("exposes one presentational PageHeader with the fixed anatomy", async () => {
  const source = await readAppFile("src/components/ui/page-header.tsx");

  assert.doesNotMatch(source, /["']use client["']|useState|useEffect|\bfetch\s*\(|<svg\b|https?:\/\//);
  assert.match(source, /import Link from "next\/link"/);
  assert.match(source, /import \{ Badge \} from "\.\/badge"/);
  assert.match(source, /import \{ buttonVariants \} from "\.\/button"/);
  assert.equal((source.match(/<header\b/g) ?? []).length, 1);
  assert.equal((source.match(/<h1\b/g) ?? []).length, 1);
  assert.match(source, /<Badge variant="outline" className="w-fit">\{eyebrow\}<\/Badge>/);
  assert.match(source, /<h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">\{title\}<\/h1>/);
  assert.match(source, /<p className="text-lg leading-8 text-muted-foreground">\{description\}<\/p>/);
  assert.match(source, /buttonVariants\(\{ variant: index === 0 \? "primary" : "outline" \}\)/);
  assert.match(source, /readonly \[PageHeaderAction, PageHeaderAction, PageHeaderAction\]/);
  assert.doesNotMatch(source, /PageHeaderAction\[\]|readonly \[(?:PageHeaderAction, ){3}PageHeaderAction\]/);
});

test("every listed page and component mounts PageHeader and hand-writes no header", async () => {
  for (const [path, header] of Object.entries(migratedHeaders)) {
    const source = await readAppFile(path);

    assert.match(source, /import \{ PageHeader \} from "(?:\.\.\/)+(?:components\/)?ui\/page-header"/, path);
    assert.equal((source.match(/<PageHeader\b/g) ?? []).length, 1, path);
    assert.equal((source.match(/<h1\b/g) ?? []).length, 0, path);
    assert.equal((source.match(/<header\b/g) ?? []).length, 0, path);
    assert.doesNotMatch(source, /className="underline"/, path);
    assert.match(source, new RegExp(`title="${escape(header.title)}"`), path);
    if (header.eyebrow === undefined) assert.doesNotMatch(source, /eyebrow=/, path);
    else assert.match(source, new RegExp(`eyebrow="${escape(header.eyebrow)}"`), path);
    if (header.actions !== true) assert.doesNotMatch(source, /actions=/, path);
  }
});

test("renders the Campaign page header with its two accepted local links as actions", async () => {
  const page = await readAppFile("src/app/provider/page.tsx");

  assert.match(page, /description="Read the admitted offering and directory records for this campaign without advancing either one\."/);
  assert.match(page, /actions=\{\[\s*\{ href: "\/provider\/deploy", label: "Open the deploy wizard" \},\s*\{ href: "\/explore\/riskscan", label: "Explore RiskScan" \},?\s*\]\}/);
  assert.doesNotMatch(page, /Provider campaign status|import Link from "next\/link"/);
});

test("labels the /provider navigation entry Campaign without changing order or hrefs", async () => {
  const navigation = await readAppFile("src/components/discovery/local-navigation.tsx");
  const links = [...navigation.matchAll(/\{ href: "([^"]+)", label: "([^"]+)" \}/g)].map(([, href, label]) => ({ href, label }));

  assert.deepEqual(links, [
    { href: "/", label: "Home" },
    { href: "/explore", label: "Explore" },
    { href: "/dashboard", label: "Workspace" },
    { href: "/demo", label: "Demo" },
    { href: "/provider", label: "Campaign" },
  ]);
});

test("renders one full sentence per non-loaded provider outcome", async () => {
  const status = await readAppFile("src/components/provider/status/provider-status.tsx");

  for (const [outcome, sentence] of Object.entries(outcomeSentences)) {
    assert.match(status, new RegExp(`${outcome}: "${escape(sentence)}"`), outcome);
  }
  assert.doesNotMatch(status, /replaceAll\("_", " "\)/);
});
