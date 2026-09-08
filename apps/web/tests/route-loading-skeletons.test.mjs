import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import typescript from "typescript";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const skeletonPath = "src/components/ui/skeleton.tsx";

const loaders = [
  {
    path: "src/app/explore/loading.tsx",
    importSpecifier: "../../components/ui/skeleton",
    regions: ["heading", "risk-scan-discovery", "directory-inspection"],
  },
  {
    path: "src/app/explore/riskscan/loading.tsx",
    importSpecifier: "../../../components/ui/skeleton",
    regions: [
      "navigation",
      "heading",
      "inputs",
      "result-boundary",
      "configuration-boundary",
    ],
  },
  {
    path: "src/app/explore/riskscan/try/loading.tsx",
    importSpecifier: "../../../../components/ui/skeleton",
    regions: ["heading", "request-boundary"],
  },
  {
    path: "src/app/explore/riskscan/tool-loop/loading.tsx",
    importSpecifier: "../../../../components/ui/skeleton",
    regions: ["heading", "tool-loop-boundary"],
  },
  {
    path: "src/app/dashboard/loading.tsx",
    importSpecifier: "../../components/ui/skeleton",
    regions: ["heading", "guest-context", "overview", "navigation"],
  },
  {
    path: "src/app/dashboard/riskscan/loading.tsx",
    importSpecifier: "../../../components/ui/skeleton",
    regions: [
      "heading",
      "intro",
      "directory-step",
      "compatibility-step",
      "tool-loop-step",
    ],
  },
  {
    path: "src/app/dashboard/riskscan/compatibility/loading.tsx",
    importSpecifier: "../../../../components/ui/skeleton",
    regions: ["heading", "intro", "compatibility-boundary"],
  },
  {
    path: "src/app/dashboard/riskscan/preflight/loading.tsx",
    importSpecifier: "../../../../components/ui/skeleton",
    regions: ["heading", "intro", "preflight-boundary"],
  },
];

const sourcePaths = [skeletonPath, ...loaders.map(({ path }) => path)];

async function fileExists(path) {
  try {
    await access(join(appRoot, path));
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

const sourcesPresent = (await Promise.all(sourcePaths.map(fileExists))).every(
  Boolean,
);

async function readSources() {
  return Promise.all(
    sourcePaths.map(async (path) => [
      path,
      await readFile(join(appRoot, path), "utf8"),
    ]),
  );
}

function parseTsx(path, source) {
  const sourceFile = typescript.createSourceFile(
    path,
    source,
    typescript.ScriptTarget.ES2022,
    true,
    typescript.ScriptKind.TSX,
  );

  assert.deepEqual(sourceFile.parseDiagnostics, [], path + " must parse");
  return sourceFile;
}

function jsxTagName(openingElement) {
  return typescript.isIdentifier(openingElement.tagName)
    ? openingElement.tagName.text
    : openingElement.tagName.getText();
}

function jsxAttributeValue(openingElement, name) {
  for (const property of openingElement.attributes.properties) {
    if (
      !typescript.isJsxAttribute(property)
      || property.name.getText() !== name
      || property.initializer === undefined
    ) {
      continue;
    }

    return typescript.isStringLiteral(property.initializer)
      ? property.initializer.text
      : null;
  }

  return null;
}

function staticModuleSpecifiers(sourceFile) {
  const imports = [];
  const prohibitedNodes = [];

  function inspect(node) {
    if (
      (typescript.isCallExpression(node)
        && node.expression.kind === typescript.SyntaxKind.ImportKeyword)
      || (typescript.isMetaProperty(node)
        && node.keywordToken === typescript.SyntaxKind.ImportKeyword)
    ) {
      prohibitedNodes.push(typescript.SyntaxKind[node.kind]);
    }
    if (
      (typescript.isIdentifier(node) || typescript.isStringLiteral(node))
      && (node.text === "eval" || node.text === "Function")
    ) {
      prohibitedNodes.push(node.text);
    }
    typescript.forEachChild(node, inspect);
  }

  for (const statement of sourceFile.statements) {
    assert.equal(typescript.isImportEqualsDeclaration(statement), false);
    if (
      typescript.isImportDeclaration(statement)
      && typescript.isStringLiteral(statement.moduleSpecifier)
    ) {
      imports.push(statement.moduleSpecifier.text);
    }
  }
  inspect(sourceFile);
  assert.deepEqual(prohibitedNodes, []);
  return imports;
}

function findRegionElements(sourceFile) {
  const regionElements = [];

  function inspect(node) {
    if (typescript.isJsxElement(node)) {
      const region = jsxAttributeValue(
        node.openingElement,
        "data-skeleton-region",
      );
      if (region !== null) {
        regionElements.push({ region, element: node });
      }
    }
    typescript.forEachChild(node, inspect);
  }

  inspect(sourceFile);
  return regionElements;
}

function countJsxTag(sourceFile, expectedTag) {
  let count = 0;

  function inspect(node) {
    if (
      (typescript.isJsxElement(node)
        && jsxTagName(node.openingElement) === expectedTag)
      || (typescript.isJsxSelfClosingElement(node)
        && jsxTagName(node) === expectedTag)
    ) {
      count += 1;
    }
    typescript.forEachChild(node, inspect);
  }

  inspect(sourceFile);
  return count;
}

function countSkeletonBlocks(element) {
  let count = 0;

  function inspect(node) {
    if (
      (typescript.isJsxElement(node)
        && jsxTagName(node.openingElement) === "Skeleton")
      || (typescript.isJsxSelfClosingElement(node)
        && jsxTagName(node) === "Skeleton")
    ) {
      count += 1;
      return;
    }
    typescript.forEachChild(node, inspect);
  }

  for (const child of element.children) {
    inspect(child);
  }
  return count;
}

function assertTextFree(path, sourceFile) {
  const textNodes = [];
  const childExpressions = [];

  function inspect(node) {
    if (typescript.isJsxText(node) && node.text.trim() !== "") {
      textNodes.push(node.text.trim());
    }
    if (
      typescript.isJsxExpression(node)
      && node.expression !== undefined
      && (typescript.isJsxElement(node.parent)
        || typescript.isJsxFragment(node.parent))
    ) {
      childExpressions.push(node.expression.getText(sourceFile));
    }
    typescript.forEachChild(node, inspect);
  }

  inspect(sourceFile);
  assert.deepEqual(textNodes, [], path + " must not render text");
  assert.deepEqual(childExpressions, [], path + " must not render values");
}

function assertStaticSource(path, source, sourceFile, expectedImports) {
  assert.deepEqual(
    staticModuleSpecifiers(sourceFile),
    expectedImports,
    path + " must use only its allowlisted static imports",
  );
  assertTextFree(path, sourceFile);

  for (const pattern of [
    /["']use client["']/u,
    /\b(?:useEffect|useRef|useState)\b/u,
    /\bfetch\s*\(/u,
    /\bprocess\.env\b/u,
    /\b(?:window|document|navigator|location|localStorage|sessionStorage|indexedDB|caches)\b/u,
    /\b(?:setInterval|setTimeout|requestAnimationFrame|WebSocket|XMLHttpRequest|EventSource)\b/u,
    /<(?:a|button|form|input|label|p|span|textarea|select)\b/iu,
  ]) {
    assert.doesNotMatch(source, pattern, path + " must remain static layout");
  }
}

test("declares the exact S14 skeleton source paths before GREEN", async () => {
  const missingPaths = [];

  for (const path of sourcePaths) {
    if (!(await fileExists(path))) {
      missingPaths.push(path);
    }
  }

  assert.deepEqual(missingPaths, []);
});

test(
  "uses one decorative reduced-motion skeleton primitive",
  { skip: !sourcesPresent },
  async () => {
    const sources = new Map(await readSources());
    const source = sources.get(skeletonPath);

    assert.ok(source);
    const sourceFile = parseTsx(skeletonPath, source);
    assert.match(source, /aria-hidden=(?:\{true\}|["']true["'])/u);
    assert.match(source, /motion-safe:animate-pulse/u);
    assert.match(source, /motion-reduce:animate-none/u);
    assert.doesNotMatch(source, /\b(?:children|onClick|onKeyDown)\b/u);
    assert.equal(countJsxTag(sourceFile, "div"), 1);
    assertStaticSource(skeletonPath, source, sourceFile, ["./cn"]);
  },
);

test(
  "keeps every loader route-specific, ordered, and text-free",
  { skip: !sourcesPresent },
  async () => {
    const sources = new Map(await readSources());

    for (const { path, importSpecifier, regions } of loaders) {
      const source = sources.get(path);

      assert.ok(source);
      const sourceFile = parseTsx(path, source);
      const regionElements = findRegionElements(sourceFile);
      assert.equal(countJsxTag(sourceFile, "main"), 1);
      assert.deepEqual(
        regionElements.map(({ region }) => region),
        regions,
        path + " must preserve the exact UI-S14 region order",
      );
      assert.deepEqual(
        regionElements.map(({ element }) => countSkeletonBlocks(element)),
        regions.map(() => 1),
        path + " must render exactly one skeleton block per region",
      );
      assertStaticSource(path, source, sourceFile, [importSpecifier]);
    }
  },
);
