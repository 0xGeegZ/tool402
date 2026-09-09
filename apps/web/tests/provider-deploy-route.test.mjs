import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import typescript from "typescript";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const sourcePaths = [
  "src/app/provider/deploy/page.tsx",
  "src/components/provider/deploy/provider-deploy-wizard.tsx",
  "src/components/provider/deploy/provider-deploy-stages.tsx",
  "src/components/provider/deploy/provider-deploy-state.ts",
  "src/components/provider/deploy/campaign-fixture.ts",
  "src/components/provider/deploy/ats-create-configuration.ts",
];
const sourceExists = sourcePaths.every((path) => existsSync(join(appRoot, path)));
const implementedTest = sourceExists ? test : test.skip;

async function readS16Sources() {
  const entries = await Promise.all(sourcePaths.map(async (path) => [path, await readFile(join(appRoot, path), "utf8")]));
  return Object.fromEntries(entries);
}

function capabilityViolations(sources) {
  const violations = [];
  const forbiddenModule = /(?:^|\/)(?:viem(?:\/|$)|wagmi(?:\/|$)|metamask(?:\/|$)|walletconnect(?:\/|$)|command-relay(?:\/|$)|commands?(?:\/|$)|asset-tokenization-sdk(?:\/|$)|@hashgraph\/asset-tokenization-sdk(?:\/|$)|axios(?:\/|$)|node:(?:http|https)(?:\/|$)|(?:http|https)(?:\/|$)|lib\/wallet\/(?:metamask-provider|tool402-command|command-relay)(?:\.ts)?$)/i;
  const forbiddenCalls = new Set([
    "fetch", "sendCommand", "relayCommand", "submitCommand", "dispatchCommand",
  ]);
  const forbiddenConstructors = new Set(["XMLHttpRequest", "WebSocket", "Function"]);

  function report(path, sourceFile, node, message) {
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    violations.push(`${path}:${line + 1}:${character + 1} ${message}`);
  }

  for (const [path, source] of Object.entries(sources)) {
    const sourceFile = typescript.createSourceFile(
      path,
      source,
      typescript.ScriptTarget.ES2022,
      true,
      path.endsWith(".tsx") ? typescript.ScriptKind.TSX : typescript.ScriptKind.TS,
    );

    function visit(node) {
      if (typescript.isImportDeclaration(node) && typescript.isStringLiteral(node.moduleSpecifier) && forbiddenModule.test(node.moduleSpecifier.text)) {
        report(path, sourceFile, node, `forbidden module import: ${node.moduleSpecifier.text}`);
      }
      if (typescript.isImportEqualsDeclaration(node) && typescript.isExternalModuleReference(node.moduleReference)) {
        report(path, sourceFile, node, "require-style import equals is not permitted");
      }
      if (typescript.isExportDeclaration(node) && typescript.isStringLiteral(node.moduleSpecifier) && forbiddenModule.test(node.moduleSpecifier.text)) {
        report(path, sourceFile, node, `forbidden module export: ${node.moduleSpecifier.text}`);
      }
      if (typescript.isMetaProperty(node) && node.keywordToken === typescript.SyntaxKind.ImportKeyword) {
        report(path, sourceFile, node, "import.meta is not permitted");
      }
      if (typescript.isCallExpression(node)) {
        if (node.expression.kind === typescript.SyntaxKind.ImportKeyword) {
          report(path, sourceFile, node, "dynamic import is not permitted");
        }
        if (typescript.isIdentifier(node.expression)) {
          if (node.expression.text === "require") report(path, sourceFile, node, "require is not permitted");
          if (node.expression.text === "eval") report(path, sourceFile, node, "eval is not permitted");
          if (node.expression.text === "Function") report(path, sourceFile, node, "Function is not permitted");
          if (forbiddenCalls.has(node.expression.text)) report(path, sourceFile, node, `forbidden invocation: ${node.expression.text}`);
        }
        if (isMemberExpression(node.expression)) {
          const receiver = node.expression.expression;
          const member = staticMemberName(node.expression);
          if (member === "request" && isWalletGlobal(receiver)) report(path, sourceFile, node, "provider request is not permitted");
          if ((member === "fetch" || member === "eval" || member === "Function") && isRuntimeGlobal(receiver)) report(path, sourceFile, node, `forbidden global invocation: ${member}`);
          if (member !== null && forbiddenCalls.has(member)) report(path, sourceFile, node, `forbidden invocation: ${member}`);
        }
      }
      if (typescript.isNewExpression(node)) {
        if (typescript.isIdentifier(node.expression) && forbiddenConstructors.has(node.expression.text)) {
          report(path, sourceFile, node, `forbidden constructor: ${node.expression.text}`);
        }
        if (isMemberExpression(node.expression)) {
          const member = staticMemberName(node.expression);
          if (member !== null && forbiddenConstructors.has(member) && isRuntimeGlobal(node.expression.expression)) {
            report(path, sourceFile, node, `forbidden global constructor: ${member}`);
          }
        }
      }
      if (typescript.isIdentifier(node) && (node.text === "ethereum" || node.text === "web3")) {
        report(path, sourceFile, node, `runtime wallet/provider global is not permitted: ${node.text}`);
      }
      typescript.forEachChild(node, visit);
    }

    function isRuntimeGlobal(node) {
      return typescript.isIdentifier(node) && ["window", "globalThis", "global"].includes(node.text);
    }

    function isWalletGlobal(node) {
      return (typescript.isIdentifier(node) && ["ethereum", "web3"].includes(node.text)) ||
        (isMemberExpression(node) && isRuntimeGlobal(node.expression) && ["ethereum", "web3"].includes(staticMemberName(node)));
    }

    function isMemberExpression(node) {
      return typescript.isPropertyAccessExpression(node) || typescript.isElementAccessExpression(node);
    }

    function staticMemberName(node) {
      if (typescript.isPropertyAccessExpression(node)) return node.name.text;
      if (typescript.isElementAccessExpression(node) && node.argumentExpression && (typescript.isStringLiteral(node.argumentExpression) || typescript.isNoSubstitutionTemplateLiteral(node.argumentExpression))) {
        return node.argumentExpression.text;
      }
      return null;
    }

    visit(sourceFile);
  }

  return violations;
}

test("requires all six declared S16 source paths before route GREEN", () => {
  for (const path of sourcePaths) {
    assert.equal(existsSync(join(appRoot, path)), true, `missing declared S16 source path: ${path}`);
  }
});

implementedTest("renders the direct provider deploy route as a server page over the labelled local fixture", async () => {
  const sources = await readS16Sources();
  const page = sources["src/app/provider/deploy/page.tsx"];
  const fixture = sources["src/components/provider/deploy/campaign-fixture.ts"];

  assert.match(page, /import\s*\{\s*ProviderDeployWizard\s*\}\s+from\s+["'][^"']*provider-deploy-wizard["']/);
  assert.match(page, /<ProviderDeployWizard\s*\/>/);
  assert.doesNotMatch(page, /["']use client["']/);
  assert.match(fixture, /PREPARED\s*\/\s*DEMO DATA/);
  assert.match(fixture, /Object\.freeze/);
});

implementedTest("keeps the route and every step transition local with no external or persistent read", async () => {
  const sources = Object.values(await readS16Sources()).join("\n");

  assert.doesNotMatch(sources, /\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b/);
  assert.doesNotMatch(sources, /\b(?:localStorage|sessionStorage|indexedDB|document\.cookie)\b/);
  assert.doesNotMatch(sources, /\b(?:process\.env|import\.meta\.env)\b/);
  assert.doesNotMatch(sources, /\b(?:setInterval|setTimeout|requestAnimationFrame)\s*\(/);
});

implementedTest("keeps the presentation boundary clear of direct wallet, provider, SDK, relay, and command calls", async () => {
  assert.deepEqual(capabilityViolations(await readS16Sources()), []);
});

implementedTest("keeps unavailable configuration rows blank and stage outcomes accessible without claiming a cause", async () => {
  const sources = await readS16Sources();
  const wizard = sources["src/components/provider/deploy/provider-deploy-wizard.tsx"];
  const stages = sources["src/components/provider/deploy/provider-deploy-stages.tsx"];

  assert.match(wizard, /not configured/i);
  assert.match(stages, /aria-live=["']polite["']/);
  assert.match(stages, /server gave no reason/i);
  assert.match(stages, /nothing was recorded/i);
  assert.doesNotMatch(sources["src/app/provider/deploy/page.tsx"], /(?:attempt|transaction|account|asset|digest)/i);
});
