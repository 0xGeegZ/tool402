import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import typescript from "typescript";

const appRoot = fileURLToPath(new URL("..", import.meta.url));

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

function directPageLinkViolations(source) {
  const sourceFile = typescript.createSourceFile(
    "src/app/explore/page.tsx",
    source,
    typescript.ScriptTarget.ES2022,
    true,
    typescript.ScriptKind.TSX,
  );
  const violations = [];

  function report(node, message) {
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    violations.push(`${line + 1}:${character + 1} ${message}`);
  }

  function propertyName(node) {
    if (typescript.isIdentifier(node) || typescript.isStringLiteral(node)) return node.text;
    return null;
  }

  function visit(node) {
    if (
      typescript.isImportDeclaration(node) &&
      typescript.isStringLiteral(node.moduleSpecifier) &&
      node.moduleSpecifier.text === "next/link"
    ) {
      report(node, "direct next/link import");
    }
    if (
      typescript.isCallExpression(node) &&
      node.expression.kind === typescript.SyntaxKind.ImportKeyword &&
      typescript.isStringLiteral(node.arguments[0]) &&
      node.arguments[0].text === "next/link"
    ) {
      report(node, "direct next/link import");
    }
    if (typescript.isJsxAttribute(node) && node.name.text === "href") {
      report(node, "direct JSX href");
    }
    if (typescript.isPropertyAssignment(node) && propertyName(node.name) === "href") {
      report(node, "direct href property");
    }
    if ((typescript.isJsxOpeningElement(node) || typescript.isJsxSelfClosingElement(node)) && typescript.isIdentifier(node.tagName)) {
      if (["a", "Link"].includes(node.tagName.text)) report(node, `direct ${node.tagName.text} element`);
    }
    typescript.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}

test("renders labeled navigation between the committed local routes", async () => {
  const navigation = await readAppFile("src/components/discovery/local-navigation.tsx");
  const layout = await readAppFile("src/app/layout.tsx");

  assert.match(navigation, /<nav\b[^>]*aria-label=["']Main navigation["']/);
  assert.match(navigation, /\{ href: "\/explore", label: "Explore tools" \}/);
  assert.match(navigation, /\{ href: "\/docs", label: "Docs" \}/);
  assert.match(navigation, /\{ href: "\/demo", label: "Guided demo" \}/);
  assert.match(navigation, /\{ href: "\/provider", label: "Campaign" \}/);
  assert.match(navigation, /<Link\s+href=\{link\.href\}/);
  assert.doesNotMatch(navigation, /\{ href: "(?!\/explore"|\/docs"|\/demo"|\/provider")[^"]+/);
  assert.match(navigation, /["']use client["']/);
  assert.match(navigation, /aria-label="Open menu"/);
  assert.match(navigation, /<SheetContent side="right"/);
  assert.match(navigation, /\blg:hidden\b/);
  assert.match(navigation, /matchMedia\("\(min-width: 1024px\)"\)/);
  assert.match(layout, /<Link href="\/" aria-label="Tool402 home"/);
  assert.match(layout, /<Link href="\/provider\/deploy"/);
  assert.match(layout, />\s*Prepare a tool\s*</);
});

test("renders a single landing main landmark and page heading", async () => {
  const [page, hero] = await Promise.all([
    readAppFile("src/app/page.tsx"),
    readAppFile("src/components/landing/landing-hero.tsx"),
  ]);

  assert.match(page, /<main\b/);
  assert.equal((page.match(/<main\b/g) ?? []).length, 1);
  assert.equal((hero.match(/<h1\b/g) ?? []).length, 1);
  assert.match(page, /<LandingHero\s*\/>/);
});

test("gives the decorative landing artwork an explicit responsive width", async () => {
  const hero = await readAppFile("src/components/landing/landing-hero.tsx");

  assert.match(hero, /\/brand\/hero-trio\.png/);
  assert.match(hero, /\bw-full\s+max-w-sm\b/);
  assert.match(hero, /\blg:grid-cols-\[minmax\(0,1fr\)_minmax\(0,1fr\)\]/);
});

test("renders a single read-only Explore marketplace catalog", async () => {
  const [page, card] = await Promise.all([
    readAppFile("src/app/explore/page.tsx"),
    readAppFile("src/components/discovery/riskscan-discovery-card.tsx"),
  ]);

  assert.match(page, /<main\b/);
  assert.equal((page.match(/<main\b/g) ?? []).length, 1);
  assert.equal((page.match(/<PageHeader\b/g) ?? []).length, 1);
  assert.match(page, /<ExploreCatalog\s*\/>/);
  assert.doesNotMatch(page, /\bRiskScanDirectoryDiscovery\b/);
  assert.doesNotMatch(page, /<RiskScanDiscoveryCard\s*\/>/);
  assert.match(page, /eyebrow="Marketplace"/);
  assert.match(page, /title="Explore tools"/);
  assert.match(page, /Two local tools with clear routes to inspect what each one covers\./);
  assert.deepEqual(directPageLinkViolations(page), []);
  assert.match(card, /RiskScan/);
  assert.match(card, /read-only/i);
  assert.match(card, /Risk assessment/);
  assert.match(card, /In discovery/);
  assert.match(card, /This surface is descriptive only\./);
  assert.match(card, />\s*View details\s*</);
  assert.match(card, /<Link\b[^>]*href=["']\/explore\/riskscan["']/);
  const hrefs = [...card.matchAll(/href=["']([^"']+)["']/g)].map(([, href]) => href);
  assert.deepEqual(hrefs, ["/explore/riskscan"]);
  assert.doesNotMatch(card, /<(?:a|button|form|input|select|textarea)\b/i);
});

test("keeps the Explore eyebrow readable against the local background", async () => {
  const page = await readAppFile("src/app/explore/page.tsx");

  assert.doesNotMatch(page, /\btext-brand-purple\b/);
});

test("keeps the marketplace thesis local while discovery remains read-only", async () => {
  const sources = await Promise.all([
    readAppFile("src/app/page.tsx"),
    readAppFile("src/components/landing/landing-hero.tsx"),
    readAppFile("src/components/discovery/riskscan-discovery-card.tsx"),
  ]);
  const [page, hero, discoveryCard] = sources;

  assert.match(hero, /Back the tools\s*<span[^>]*>agents pay<\/span>\s*to use\./);
  assert.match(hero, /<span className=["'][^"']*\btext-brand-purple\b[^"']*["']>agents pay<\/span>/);
  assert.match(hero, /<Link\b[^>]*href=["']\/demo["'][^>]*>\s*Open guided demo\s*<\/Link>/);
  assert.match(discoveryCard, /read-only/i);
  assert.match(page, /<LandingHero\s*\/>/);
});
