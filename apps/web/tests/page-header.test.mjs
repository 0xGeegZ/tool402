import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));

async function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

async function readHeaderSource() {
  try {
    return await readAppFile("src/components/ui/page-header.tsx");
  } catch {
    return "";
  }
}

test("defines the fixed server-safe PageHeader anatomy and action hierarchy", async () => {
  const source = await readHeaderSource();

  assert.match(source, /import Link from "next\/link";/);
  assert.match(source, /import \{ Badge \} from "\.\/badge";/);
  assert.match(source, /import \{ buttonVariants \} from "\.\/button";/);
  assert.match(source, /export function PageHeader\(/);
  assert.match(source, /readonly title: string/);
  assert.match(source, /readonly description\?: string/);
  assert.match(source, /readonly eyebrow\?: string/);
  assert.match(source, /type PageHeaderActions =/);
  assert.match(source, /readonly \[PageHeaderAction, PageHeaderAction, PageHeaderAction\]/);
  assert.match(source, /readonly actions\?: PageHeaderActions/);
  assert.match(source, /<header className="max-w-3xl space-y-5">/);
  assert.match(source, /<Badge variant="outline" className="w-fit">/);
  assert.match(source, /<h1 className="text-4xl font-extrabold tracking-\[-0\.045em\] sm:text-5xl">/);
  assert.match(source, /<p className="text-lg leading-8 text-muted-foreground">/);
  assert.match(source, /<div className="flex flex-wrap gap-3 pt-2">/);
  assert.match(source, /variant: index === 0 \? "primary" : "outline"/);
  assert.match(source, /size: "md"/);
  assert.doesNotMatch(source, /["']use client["']|use(?:Effect|State|Memo|Callback)|https?:\/\//);
});

test("migrates only the declared headers and fixes the two page-level action sets", async () => {
  const targets = [
    ["src/app/explore/page.tsx", "Explore tools"],
    ["src/app/explore/riskscan/try/page.tsx", "Try RiskScan"],
    ["src/app/explore/riskscan/tool-loop/page.tsx", "Run RiskScan through ToolLoop"],
    ["src/app/dashboard/page.tsx", "Your campaign"],
    ["src/app/dashboard/riskscan/page.tsx", "RiskScan workbench"],
    ["src/app/dashboard/riskscan/preflight/page.tsx", "RiskScan Quick preflight"],
    ["src/app/dashboard/riskscan/compatibility/page.tsx", "Native quote compatibility"],
    ["src/app/demo/page.tsx", "Record the Tool402 story"],
    ["src/components/riskscan/detail/riskscan-detail.tsx", "RiskScan"],
  ];

  for (const [path, title] of targets) {
    const source = await readAppFile(path);
    assert.match(source, /import \{ PageHeader \} from /);
    assert.match(source, /<PageHeader\b/);
    assert.match(source, new RegExp(`title="${title}"`));
    assert.doesNotMatch(source, /<h1\b/);
  }

  const [provider, detail] = await Promise.all([
    readAppFile("src/app/provider/page.tsx"),
    readAppFile("src/components/riskscan/detail/riskscan-detail.tsx"),
  ]);
  assert.doesNotMatch(provider, /import \{ PageHeader \} from |<PageHeader\b/);
  assert.match(provider, /aria-label="Tool operator Campaign status"/);
  assert.doesNotMatch(provider, /<h1\b/);
  assert.doesNotMatch(provider, /actions=/);
  assert.match(detail, /href: "\/explore\/riskscan\/try", label: "Try RiskScan"/);
  assert.match(detail, /href: "\/explore\/riskscan\/tool-loop", label: "Explore RiskScan ToolLoop"/);
});
