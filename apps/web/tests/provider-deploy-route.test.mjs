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
  const forbiddenModule = /(?:^|\/)(?:viem(?:\/|$)|wagmi(?:\/|$)|metamask(?:\/|$)|walletconnect(?:\/|$)|command-relay(?:\/|$)|commands?(?:\/|$)|asset-tokenization-sdk(?:\/|$)|@hashgraph\/asset-tokenization-sdk(?:\/|$)|convex(?:\/|$)|_generated\/(?:api|server)(?:\.[jt]sx?)?$|@tool402\/backend(?:\/|$)|axios(?:\/|$)|node:(?:http|https)(?:\/|$)|(?:http|https)(?:\/|$)|lib\/wallet\/(?:metamask-provider|tool402-command|command-relay)(?:\.ts)?$)/i;
  const forbiddenCalls = new Set([
    "fetch", "sendCommand", "relayCommand", "submitCommand", "dispatchCommand",
    "mutation", "action", "query", "useMutation", "useAction", "useQuery",
    "runMutation", "runAction", "runQuery", "insert", "patch", "replace", "delete",
  ]);
  const forbiddenConstructors = new Set([
    "XMLHttpRequest", "WebSocket", "Function", "ConvexReactClient", "ConvexHttpClient",
  ]);

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
    const aliases = collectCapabilityAliases(sourceFile);

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
          if (aliases.walletRequestAliases.has(node.expression.text)) report(path, sourceFile, node, "aliased wallet/provider request is not permitted");
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
      if (isMemberExpression(node)) {
        const member = staticMemberName(node);
        if (member !== null && forbiddenCalls.has(member)) {
          report(path, sourceFile, node, `forbidden durable/runtime capability reference: ${member}`);
        }
        if (["ethereum", "web3"].includes(member) && isRuntimeGlobal(node.expression)) {
          report(path, sourceFile, node, `runtime wallet/provider global is not permitted: ${member}`);
        }
        if (member === "request" && isWalletGlobal(node.expression, aliases)) {
          report(path, sourceFile, node, "wallet/provider request reference is not permitted");
        }
      }
      if (typescript.isBindingElement(node)) {
        const member = node.propertyName
          ? staticMemberName(node.propertyName)
          : typescript.isIdentifier(node.name) ? node.name.text : null;
        if (member !== null && forbiddenCalls.has(member)) {
          report(path, sourceFile, node, `forbidden durable/runtime capability binding: ${member}`);
        }
      }
      if (typescript.isIdentifier(node) && (node.text === "ethereum" || node.text === "web3")) {
        report(path, sourceFile, node, `runtime wallet/provider global is not permitted: ${node.text}`);
      }
      typescript.forEachChild(node, visit);
    }

    function isRuntimeGlobal(node) {
      return typescript.isIdentifier(node) && aliases.runtimeAliases.has(node.text);
    }

    function isWalletGlobal(node) {
      return (typescript.isIdentifier(node) && aliases.walletAliases.has(node.text)) ||
        (isMemberExpression(node) && isRuntimeGlobal(node.expression) && ["ethereum", "web3"].includes(staticMemberName(node)));
    }

    function isMemberExpression(node) {
      return typescript.isPropertyAccessExpression(node) || typescript.isElementAccessExpression(node);
    }

    function staticMemberName(node) {
      if (typescript.isIdentifier(node)) return node.text;
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

function collectCapabilityAliases(sourceFile) {
  const runtimeAliases = new Set(["window", "globalThis", "global"]);
  const walletAliases = new Set(["ethereum", "web3"]);
  const walletRequestAliases = new Set();
  let changed = true;

  function isMemberExpression(node) {
    return typescript.isPropertyAccessExpression(node) || typescript.isElementAccessExpression(node);
  }

  function staticMemberName(node) {
    if (typescript.isIdentifier(node)) return node.text;
    if (typescript.isPropertyAccessExpression(node)) return node.name.text;
    if (typescript.isElementAccessExpression(node) && node.argumentExpression && (typescript.isStringLiteral(node.argumentExpression) || typescript.isNoSubstitutionTemplateLiteral(node.argumentExpression))) {
      return node.argumentExpression.text;
    }
    return null;
  }

  function isRuntimeExpression(node) {
    return typescript.isIdentifier(node) && runtimeAliases.has(node.text);
  }

  function isWalletExpression(node) {
    return (typescript.isIdentifier(node) && walletAliases.has(node.text)) ||
      (isMemberExpression(node) && isRuntimeExpression(node.expression) && ["ethereum", "web3"].includes(staticMemberName(node)));
  }

  function isWalletRequestExpression(node) {
    return isMemberExpression(node) && staticMemberName(node) === "request" && isWalletExpression(node.expression);
  }

  function addAlias(aliases, name) {
    if (aliases.has(name)) return;
    aliases.add(name);
    changed = true;
  }

  function addBindingAlias(name, initializer) {
    if (isRuntimeExpression(initializer)) addAlias(runtimeAliases, name);
    if (isWalletExpression(initializer)) addAlias(walletAliases, name);
    if (isWalletRequestExpression(initializer)) addAlias(walletRequestAliases, name);
  }

  while (changed) {
    changed = false;
    function visit(node) {
      if (typescript.isVariableDeclaration(node) && node.initializer) {
        if (typescript.isIdentifier(node.name)) {
          addBindingAlias(node.name.text, node.initializer);
        }
        if (typescript.isObjectBindingPattern(node.name)) {
          for (const element of node.name.elements) {
            if (!typescript.isIdentifier(element.name)) continue;
            const property = element.propertyName
              ? staticMemberName(element.propertyName)
              : element.name.text;
            if (isRuntimeExpression(node.initializer) && ["ethereum", "web3"].includes(property)) {
              addAlias(walletAliases, element.name.text);
            }
            if (isWalletExpression(node.initializer) && property === "request") {
              addAlias(walletRequestAliases, element.name.text);
            }
          }
        }
      }
      typescript.forEachChild(node, visit);
    }
    visit(sourceFile);
  }

  return { runtimeAliases, walletAliases, walletRequestAliases };
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

test("rejects Convex durable and aliased wallet/provider capability paths", () => {
  const cases = {
    "convex-import.ts": 'import { useMutation as mutate } from "convex/react"; mutate();',
    "convex-generated.ts": 'import { api } from "../../convex/_generated/api"; api.campaigns.create();',
    "convex-client.ts": 'const invoke = client.mutation; invoke(api.campaigns.create);',
    "convex-destructure.ts": 'const { mutation: invoke } = client; invoke(api.campaigns.create);',
    "wallet-global-alias.ts": 'const browser = globalThis; const injected = browser["ethereum"];',
    "wallet-alias.ts": 'const browser = globalThis; const injected = browser["ethereum"]; injected.request({ method: "eth_requestAccounts" });',
    "wallet-request-alias.ts": 'const provider = window["web3"]; const request = provider.request; request({ method: "eth_signTypedData_v4" });',
    "wallet-destructure.ts": 'const browser = globalThis; const { ethereum: provider } = browser; provider.request({ method: "eth_requestAccounts" });',
  };

  for (const [path, source] of Object.entries(cases)) {
    assert.notDeepEqual(capabilityViolations({ [path]: source }), [], path);
  }
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

implementedTest("renders explanatory inert stage controls instead of implying that signing is available", async () => {
  const stages = (await readS16Sources())["src/components/provider/deploy/provider-deploy-stages.tsx"];

  assert.match(stages, /providerDeployStageControl\s*\(/);
  assert.match(stages, /aria-describedby=/);
  assert.match(stages, /disabled=\{[^}]*disabled[^}]*\}/);
  assert.doesNotMatch(stages, /Signing is available in its separate screen/i);
});

implementedTest("keeps progress responsive and lets only completed steps receive focusable return controls", async () => {
  const wizard = (await readS16Sources())["src/components/provider/deploy/provider-deploy-wizard.tsx"];

  assert.doesNotMatch(wizard, /\boverflow-x-auto\b|\bmin-w-max\b/);
  assert.match(wizard, /function StepProgress\s*\(\{[^}]*onStepSelect/);
  assert.match(wizard, /type=["']button["']/);
  assert.match(wizard, /aria-label=/);
  assert.match(wizard, /disabled=\{index\s*>=\s*currentStep\}/);
  assert.match(wizard, /onClick=\{\(\)\s*=>\s*onStepSelect\(index\)\}/);
  assert.match(wizard, /onStepSelect=\{\(step\)\s*=>\s*setCurrentStep\(step\)\}/);
});
