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

function sourceFileFor(source) {
  return typescript.createSourceFile(
    "src/components/discovery/explore-catalog.tsx",
    source,
    typescript.ScriptTarget.ES2022,
    true,
    typescript.ScriptKind.TSX,
  );
}

function propertyName(node) {
  if (typescript.isIdentifier(node) || typescript.isStringLiteral(node)) return node.text;
  return null;
}

function stringValue(node) {
  return typescript.isStringLiteral(node) || typescript.isNoSubstitutionTemplateLiteral(node)
    ? node.text
    : null;
}

function catalogEntries(sourceFile) {
  let entries = null;

  function visit(node) {
    if (
      typescript.isVariableDeclaration(node) &&
      typescript.isIdentifier(node.name) &&
      node.name.text === "CATALOG" &&
      node.initializer &&
      typescript.isCallExpression(node.initializer) &&
      typescript.isPropertyAccessExpression(node.initializer.expression) &&
      node.initializer.expression.expression.getText(sourceFile) === "Object" &&
      node.initializer.expression.name.text === "freeze" &&
      node.initializer.arguments.length === 1 &&
      typescript.isArrayLiteralExpression(node.initializer.arguments[0])
    ) {
      entries = node.initializer.arguments[0].elements;
    }
    typescript.forEachChild(node, visit);
  }

  visit(sourceFile);
  return entries;
}

function jsxViolations(sourceFile) {
  const violations = [];
  const allowedComponents = new Set([
    "Badge",
    "Card",
    "CardHeader",
    "CardTitle",
    "CardDescription",
    "CardContent",
    "CardFooter",
    "RiskScanDiscoveryCard",
    "EntityCheckDiscoveryCard",
  ]);
  const forbiddenElements = new Set(["a", "button", "form", "input", "select", "textarea", "Link"]);
  const forbiddenAttributes = new Set(["href", "role", "tabIndex"]);

  function tagName(node) {
    if (typescript.isIdentifier(node.tagName)) return node.tagName.text;
    return node.tagName.getText(sourceFile);
  }

  function checkOpening(node) {
    const tag = tagName(node);
    if (forbiddenElements.has(tag)) violations.push(`forbidden element <${tag}>`);
    if (/^[A-Z]/.test(tag) && !allowedComponents.has(tag)) {
      violations.push(`unexpected component <${tag}>`);
    }
    for (const attribute of node.attributes.properties) {
      if (!typescript.isJsxAttribute(attribute)) continue;
      const name = attribute.name.text;
      if (forbiddenAttributes.has(name) || /^on[A-Z]/.test(name)) {
        violations.push(`forbidden JSX attribute ${name}`);
      }
      if (/^aria-(?:controls|expanded|pressed|selected)$/.test(name)) {
        violations.push(`forbidden interactive aria attribute ${name}`);
      }
    }
  }

  function visit(node) {
    if (typescript.isJsxOpeningElement(node) || typescript.isJsxSelfClosingElement(node)) checkOpening(node);
    typescript.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}

test("defines the two-entry static Explore catalog without interactive controls", async () => {
  const source = await readAppFile("src/components/discovery/explore-catalog.tsx");
  const sourceFile = sourceFileFor(source);
  const entries = catalogEntries(sourceFile);

  assert.equal(sourceFile.parseDiagnostics.length, 0);
  assert.ok(entries, "CATALOG must be Object.freeze([two entries])");
  assert.equal(entries.length, 2, "CATALOG must contain exactly two tools");
  const values = entries.map((entry) => {
    assert.ok(typescript.isObjectLiteralExpression(entry), "catalog entry must be a data record");
    const record = Object.fromEntries(entry.properties.map((property) => {
      assert.ok(typescript.isPropertyAssignment(property), "catalog entry must contain only data properties");
      const name = propertyName(property.name);
      const value = stringValue(property.initializer);
      assert.ok(name && value !== null, "catalog fields must be literal strings");
      return [name, value];
    }));
    assert.equal(entry.properties.length, 7);
    return record;
  });

  assert.deepEqual(values, [
    {
      id: "riskscan",
      name: "RiskScan",
      category: "Risk assessment",
      status: "In discovery",
      access: "Read-only preview",
      href: "/explore/riskscan",
      description: "A read-only introduction to a bounded assessment for considering a tool's risk signals with care.",
    },
    {
      id: "entitycheck",
      name: "EntityCheck",
      category: "Counterparty verification",
      status: "In discovery",
      access: "Read-only preview",
      href: "/explore/entitycheck",
      description: "A bounded lookup of a French company's public registry record with a sanctions screen, cited to its sources.",
    },
  ]);

  assert.match(source, /\{\s*CATALOG\.length\s*\}\s*tools/);
  assert.match(source, /\bCategory\b/);
  assert.match(source, /\bStatus\b/);
  assert.match(source, /\bAccess\b/);
  assert.match(source, /\bAll tools\b/);
  assert.match(source, /CATALOG\.map\(\s*tool\s*=>\s*tool\[field\]\s*\)/);
  assert.match(source, /CATALOG\.filter\(\s*tool\s*=>\s*tool\[field\]\s*===\s*value\s*\)\.length/);
  assert.match(source, /\.filter\(\s*\(?\s*row\s*\)?\s*=>\s*row\.count\s*>\s*0\s*\)/);
  assert.match(source, /More tools to come/);
  assert.match(source, /New tools appear here once their journey is accepted\./);
  assert.match(source, /<RiskScanDiscoveryCard\s*\/>/);
  assert.match(source, /<EntityCheckDiscoveryCard\s*\/>/);
  assert.match(source, /lg:grid-cols-\[19\.5rem_minmax\(0,1fr\)\]/);
  assert.match(source, /\bmin-w-0\b/);
  assert.match(source, /\bsm:grid-cols-2\b/);
  assert.deepEqual(jsxViolations(sourceFile), []);
  assert.doesNotMatch(source, /["']use client["']/);
  assert.doesNotMatch(source, /\b(?:useState|useEffect|useMemo|fetch|localStorage|sessionStorage)\b/);
  assert.doesNotMatch(source, /from\s+["']next\/link["']/);
});
