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

const loaderAttributes = new Map([
  ["main", new Set(["className"])],
  ["div", new Set(["className", "data-skeleton-region"])],
  ["Skeleton", new Set()],
]);

const skeletonAttributes = new Map([
  ["div", new Set(["aria-hidden", "className"])],
]);

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

function isExported(statement) {
  return statement.modifiers?.some(
    (modifier) => modifier.kind === typescript.SyntaxKind.ExportKeyword,
  );
}

function isDefaultExport(statement) {
  return statement.modifiers?.some(
    (modifier) => modifier.kind === typescript.SyntaxKind.DefaultKeyword,
  );
}

function importBindings(statement) {
  const clause = statement.importClause;

  assert.ok(clause);
  assert.equal(clause.isTypeOnly, false);
  assert.equal(clause.name, undefined);
  assert.ok(
    clause.namedBindings && typescript.isNamedImports(clause.namedBindings),
  );

  return clause.namedBindings.elements.map((element) => ({
    imported: element.propertyName?.text ?? element.name.text,
    local: element.name.text,
    typeOnly: element.isTypeOnly,
  }));
}

function assertExactImports(sourceFile, expectedImports) {
  const actualImports = [];

  for (const statement of sourceFile.statements) {
    assert.equal(typescript.isImportEqualsDeclaration(statement), false);
    if (!typescript.isImportDeclaration(statement)) {
      continue;
    }

    assert.ok(typescript.isStringLiteral(statement.moduleSpecifier));
    actualImports.push({
      specifier: statement.moduleSpecifier.text,
      bindings: importBindings(statement),
    });
  }

  assert.deepEqual(actualImports, expectedImports);
}

function assertOnlyExpectedExports(sourceFile, expected) {
  const actualExports = [];

  for (const statement of sourceFile.statements) {
    if (!isExported(statement)) {
      continue;
    }

    if (typescript.isFunctionDeclaration(statement) && statement.name) {
      actualExports.push({
        kind: "function",
        name: statement.name.text,
        default: isDefaultExport(statement),
      });
      continue;
    }

    actualExports.push({ kind: typescript.SyntaxKind[statement.kind] });
  }

  assert.deepEqual(actualExports, expected);
}

function assertOnlyExpectedFunctionDeclarations(sourceFile, expectedNames) {
  const declarations = [];
  const unsupportedDefinitions = [];

  function inspect(node) {
    if (typescript.isFunctionDeclaration(node)) {
      declarations.push(node.name?.text ?? null);
    }
    if (
      typescript.isArrowFunction(node)
      || typescript.isClassDeclaration(node)
      || typescript.isClassExpression(node)
      || typescript.isFunctionExpression(node)
      || typescript.isVariableDeclaration(node)
    ) {
      unsupportedDefinitions.push(typescript.SyntaxKind[node.kind]);
    }
    typescript.forEachChild(node, inspect);
  }

  inspect(sourceFile);
  assert.deepEqual(declarations, expectedNames);
  assert.deepEqual(unsupportedDefinitions, []);
}

function assertDirectStaticFunction(sourceFile, name, expectedTag) {
  const declaration = sourceFile.statements.find(
    (statement) =>
      typescript.isFunctionDeclaration(statement)
      && statement.name?.text === name,
  );

  assert.ok(declaration);
  assert.equal(declaration.parameters.length, 0);
  assert.ok(declaration.body);
  assert.equal(declaration.body.statements.length, 1);

  const [statement] = declaration.body.statements;
  assert.ok(typescript.isReturnStatement(statement));
  assert.ok(statement.expression);
  assert.ok(
    typescript.isJsxElement(statement.expression)
    || typescript.isJsxSelfClosingElement(statement.expression),
  );
  const openingElement = typescript.isJsxElement(statement.expression)
    ? statement.expression.openingElement
    : statement.expression;

  assert.equal(jsxTagName(openingElement), expectedTag);
  return openingElement;
}

function assertNoRuntimeCapability(sourceFile, allowedCalls) {
  const prohibitedReferences = [];
  const prohibitedSyntax = [];
  const calls = [];
  const prohibitedNames = new Set([
    "caches",
    "document",
    "ethereum",
    "EventSource",
    "eval",
    "fetch",
    "Function",
    "globalThis",
    "indexedDB",
    "localStorage",
    "navigator",
    "process",
    "provider",
    "requestAnimationFrame",
    "sessionStorage",
    "setInterval",
    "setTimeout",
    "WebSocket",
    "window",
    "XMLHttpRequest",
  ]);

  function inspect(node) {
    if (typescript.isIdentifier(node) && prohibitedNames.has(node.text)) {
      prohibitedReferences.push(node.text);
    }
    if (typescript.isCallExpression(node)) {
      calls.push(node.expression.getText(sourceFile));
      if (node.expression.kind === typescript.SyntaxKind.ImportKeyword) {
        prohibitedSyntax.push("dynamic import");
      }
    }
    if (
      typescript.isMetaProperty(node)
      && node.keywordToken === typescript.SyntaxKind.ImportKeyword
    ) {
      prohibitedSyntax.push("import.meta");
    }
    if (
      typescript.isAwaitExpression(node)
      || typescript.isNewExpression(node)
      || typescript.isYieldExpression(node)
    ) {
      prohibitedSyntax.push(typescript.SyntaxKind[node.kind]);
    }
    typescript.forEachChild(node, inspect);
  }

  inspect(sourceFile);
  assert.deepEqual(prohibitedReferences, []);
  assert.deepEqual(prohibitedSyntax, []);
  assert.deepEqual(calls, allowedCalls);
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

function assertSafeClassName(path, className) {
  assert.doesNotMatch(
    className,
    /(?:@import|data:|https?:|javascript:|url\s*\()/iu,
    path + " className must not load or invoke a resource",
  );
}

function assertStaticJsx(path, sourceFile, allowedAttributes) {
  const textNodes = [];
  const childExpressions = [];
  const invalidTags = [];
  const invalidAttributes = [];

  function inspectOpeningElement(openingElement) {
    const tag = jsxTagName(openingElement);
    const permittedAttributes = allowedAttributes.get(tag);

    if (!permittedAttributes) {
      invalidTags.push(tag);
      return;
    }

    for (const property of openingElement.attributes.properties) {
      if (typescript.isJsxSpreadAttribute(property)) {
        invalidAttributes.push(tag + ":spread");
        continue;
      }

      const name = property.name.getText();
      if (!permittedAttributes.has(name)) {
        invalidAttributes.push(tag + ":" + name);
        continue;
      }

      if (typescript.isStringLiteral(property.initializer)) {
        if (name === "className") {
          assertSafeClassName(path, property.initializer.text);
        }
        continue;
      }

      invalidAttributes.push(tag + ":" + name);
    }
  }

  function inspect(node) {
    if (typescript.isJsxElement(node)) {
      inspectOpeningElement(node.openingElement);
    }
    if (typescript.isJsxSelfClosingElement(node)) {
      inspectOpeningElement(node);
    }
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
  assert.deepEqual(invalidTags, [], path + " must use only static layout tags");
  assert.deepEqual(
    invalidAttributes,
    [],
    path + " must use only static safe layout attributes",
  );
}

function assertStaticSource(
  path,
  source,
  sourceFile,
  expectedImports,
  expectedExports,
  expectedRootTag,
  allowedCalls,
  allowedAttributes,
) {
  assert.doesNotMatch(source, /["']use client["']/u);
  assertExactImports(sourceFile, expectedImports);
  assertOnlyExpectedExports(sourceFile, expectedExports);
  assertOnlyExpectedFunctionDeclarations(
    sourceFile,
    expectedExports.map(({ name }) => name),
  );
  const root = assertDirectStaticFunction(
    sourceFile,
    expectedExports[0].name,
    expectedRootTag,
  );
  assertNoRuntimeCapability(sourceFile, allowedCalls);
  assertStaticJsx(path, sourceFile, allowedAttributes);
  return root;
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
    assert.equal(countJsxTag(sourceFile, "div"), 1);
    const root = assertStaticSource(
      skeletonPath,
      source,
      sourceFile,
      [],
      [{ kind: "function", name: "Skeleton", default: false }],
      "div",
      [],
      skeletonAttributes,
    );
    assert.equal(jsxAttributeValue(root, "aria-hidden"), "true");
    const className = jsxAttributeValue(root, "className");

    assert.ok(className);
    assert.match(className, /motion-safe:animate-pulse/u);
    assert.match(className, /motion-reduce:animate-none/u);
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
      assertStaticSource(
        path,
        source,
        sourceFile,
        [
          {
            specifier: importSpecifier,
            bindings: [
              { imported: "Skeleton", local: "Skeleton", typeOnly: false },
            ],
          },
        ],
        [{ kind: "function", name: "Loading", default: true }],
        "main",
        [],
        loaderAttributes,
      );
    }
  },
);
