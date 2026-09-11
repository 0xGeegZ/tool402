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
    "sendBeacon", "require",
  ]);
  const forbiddenConstructors = new Set([
    "XMLHttpRequest", "WebSocket", "EventSource", "Function", "ConvexReactClient", "ConvexHttpClient",
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
    const aliases = collectCapabilityAliases(sourceFile, forbiddenCalls, forbiddenConstructors);

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
          if (aliases.capabilityCallAliases.has(node.expression.text)) report(path, sourceFile, node, "aliased durable/runtime invocation is not permitted");
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
        if (typescript.isIdentifier(node.expression)) {
          if (forbiddenConstructors.has(node.expression.text)) {
            report(path, sourceFile, node, `forbidden constructor: ${node.expression.text}`);
          }
          if (aliases.capabilityConstructorAliases.has(node.expression.text)) {
            report(path, sourceFile, node, "aliased durable/runtime constructor is not permitted");
          }
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

function collectCapabilityAliases(sourceFile, forbiddenCalls, forbiddenConstructors) {
  const runtimeAliases = new Set(["window", "globalThis", "global"]);
  const walletAliases = new Set(["ethereum", "web3"]);
  const walletRequestAliases = new Set();
  const capabilityCallAliases = new Set();
  const capabilityConstructorAliases = new Set();
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

  function isForbiddenCallExpression(node) {
    return isMemberExpression(node) && forbiddenCalls.has(staticMemberName(node));
  }

  function isForbiddenConstructorExpression(node) {
    return (typescript.isIdentifier(node) && forbiddenConstructors.has(node.text)) ||
      (isMemberExpression(node) && forbiddenConstructors.has(staticMemberName(node)));
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
    if (isForbiddenCallExpression(initializer)) addAlias(capabilityCallAliases, name);
    if (isForbiddenConstructorExpression(initializer)) addAlias(capabilityConstructorAliases, name);
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
            if (forbiddenCalls.has(property)) {
              addAlias(capabilityCallAliases, element.name.text);
            }
            if (forbiddenConstructors.has(property)) {
              addAlias(capabilityConstructorAliases, element.name.text);
            }
          }
        }
      }
      typescript.forEachChild(node, visit);
    }
    visit(sourceFile);
  }

  return {
    runtimeAliases,
    walletAliases,
    walletRequestAliases,
    capabilityCallAliases,
    capabilityConstructorAliases,
  };
}

function namedFunctionContext(path, source, name) {
  const sourceFile = typescript.createSourceFile(
    path,
    source,
    typescript.ScriptTarget.ES2022,
    true,
    path.endsWith(".tsx") ? typescript.ScriptKind.TSX : typescript.ScriptKind.TS,
  );
  let declaration;

  function visit(node) {
    if (typescript.isFunctionDeclaration(node) && node.name?.text === name) declaration = node;
    typescript.forEachChild(node, visit);
  }

  visit(sourceFile);
  assert.ok(declaration, `missing ${name} function`);

  const elements = [];
  function collect(node) {
    if (typescript.isJsxOpeningElement(node) || typescript.isJsxSelfClosingElement(node)) elements.push(node);
    typescript.forEachChild(node, collect);
  }
  collect(declaration);

  return { sourceFile, declaration, elements };
}

function jsxAttribute(element, name) {
  return element.attributes.properties.find((attribute) => typescript.isJsxAttribute(attribute) && attribute.name.text === name);
}

function jsxAttributeExpressionText(attribute, sourceFile) {
  if (!attribute?.initializer) return null;
  if (typescript.isStringLiteral(attribute.initializer)) return attribute.initializer.text;
  if (typescript.isJsxExpression(attribute.initializer) && attribute.initializer.expression) {
    return attribute.initializer.expression.getText(sourceFile);
  }
  return null;
}

function jsxElementText(element, sourceFile) {
  return typescript.isJsxOpeningElement(element) && typescript.isJsxElement(element.parent)
    ? element.parent.getText(sourceFile)
    : element.getText(sourceFile);
}

function normalizedSource(value) {
  return value.replace(/\s+/g, "");
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

  assert.doesNotMatch(sources, /\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\bEventSource\b/);
  assert.doesNotMatch(sources, /\b(?:navigator\.sendBeacon|module\.require)\b/);
  assert.doesNotMatch(sources, /\b(?:localStorage|sessionStorage|indexedDB|document\.cookie)\b/);
  assert.doesNotMatch(sources, /\b(?:process\.env|import\.meta\.env)\b/);
  assert.doesNotMatch(sources, /\b(?:setInterval|setTimeout|requestAnimationFrame)\s*\(/);
});

implementedTest("keeps the presentation boundary clear of direct wallet, provider, SDK, relay, and command calls", async () => {
  assert.deepEqual(capabilityViolations(await readS16Sources()), []);
});

test("rejects durable, transport, and aliased wallet/provider capability paths", () => {
  const cases = {
    "convex-import.ts": 'import { useMutation as mutate } from "convex/react"; mutate();',
    "convex-generated.ts": 'import { api } from "../../convex/_generated/api"; api.campaigns.create();',
    "convex-client.ts": 'const invoke = client.mutation; invoke(api.campaigns.create);',
    "convex-destructure.ts": 'const { mutation: invoke } = client; invoke(api.campaigns.create);',
    "wallet-global-alias.ts": 'const browser = globalThis; const injected = browser["ethereum"];',
    "wallet-alias.ts": 'const browser = globalThis; const injected = browser["ethereum"]; injected.request({ method: "eth_requestAccounts" });',
    "wallet-request-alias.ts": 'const provider = window["web3"]; const request = provider.request; request({ method: "eth_signTypedData_v4" });',
    "wallet-destructure.ts": 'const browser = globalThis; const { ethereum: provider } = browser; provider.request({ method: "eth_requestAccounts" });',
    "navigator-beacon.ts": 'navigator.sendBeacon("/provider/deploy");',
    "navigator-beacon-alias.ts": 'const browser = globalThis; const navigatorClient = browser.navigator; const send = navigatorClient.sendBeacon; send("/provider/deploy");',
    "event-source.ts": 'new EventSource("/provider/deploy");',
    "event-source-alias.ts": 'const browser = globalThis; const Stream = browser.EventSource; new Stream("/provider/deploy");',
    "module-require.ts": 'module.require("convex");',
    "module-require-alias.ts": 'const localModule = module; const load = localModule.require; load("convex");',
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

implementedTest("keeps fixed ATS routing values inside the sole configuration literal", async () => {
  const sources = await readS16Sources();
  const configurationPath = "src/components/provider/deploy/ats-create-configuration.ts";
  const fixedRoutingValues = [
    "ats_sdk_8_0_0_testnet_v2",
    "0xd1f118a40f3b02883d35909ef2517e7edd78379d",
  ];

  for (const value of fixedRoutingValues) {
    assert.match(sources[configurationPath], new RegExp(value));
    for (const [path, source] of Object.entries(sources)) {
      if (path === configurationPath) continue;
      assert.doesNotMatch(source, new RegExp(value), `${path} must not carry fixed ATS routing value ${value}`);
    }
  }
  assert.match(
    sources[configurationPath],
    /STAGE_B_ATS_CREATE_CANONICAL_PARAMETERS_HASH/u,
  );
});

implementedTest("connects each local validation error to its editable control", async () => {
  const wizard = (await readS16Sources())["src/components/provider/deploy/provider-deploy-wizard.tsx"];
  const editableValidationFields = [
    "toolName",
    "customerProblem",
    "quickPrice",
    "standardPrice",
    "targetAgentCustomers",
    "useOfFunds",
    "risks",
  ];

  assert.match(wizard, /providerDeployFieldErrors/);
  assert.match(wizard, /aria-invalid=/);
  assert.match(wizard, /aria-describedby=/);
  assert.match(wizard, /id=\{errorId\}/);
  for (const field of editableValidationFields) {
    assert.match(wizard, new RegExp(`fieldErrors\\.${field}`));
  }
});

implementedTest("links the step-two resource input to its current field error", async () => {
  const wizard = (await readS16Sources())["src/components/provider/deploy/provider-deploy-wizard.tsx"];
  const context = namedFunctionContext("provider-deploy-wizard.tsx", wizard, "InterfaceStep");
  const resourceInput = context.elements.find((element) =>
    element.tagName.getText(context.sourceFile) === "input" &&
    jsxAttributeExpressionText(jsxAttribute(element, "value"), context.sourceFile) === "values.qualifyingResource",
  );
  assert.ok(resourceInput, "the editable qualifying resource input must exist");
  const invalid = jsxAttributeExpressionText(jsxAttribute(resourceInput, "aria-invalid"), context.sourceFile);
  const describedBy = jsxAttributeExpressionText(jsxAttribute(resourceInput, "aria-describedby"), context.sourceFile);
  assert.match(invalid ?? "", /fieldErrors\.qualifyingResource/u, "resource errors must mark the input invalid");
  assert.match(describedBy ?? "", /fieldErrors\.qualifyingResource/u, "resource errors must describe the input");
  assert.match(describedBy ?? "", /fieldErrorId\(["']qualifyingResource["']\)/u);
  const field = context.elements.find((element) =>
    element.tagName.getText(context.sourceFile) === "Field" &&
    jsxAttributeExpressionText(jsxAttribute(element, "error"), context.sourceFile) === "fieldErrors.qualifyingResource",
  );
  assert.ok(field, "the resource field must render its current error");
  assert.match(jsxAttributeExpressionText(jsxAttribute(field, "errorId"), context.sourceFile) ?? "", /fieldErrorId\(["']qualifyingResource["']\)/u);
  const parent = namedFunctionContext("provider-deploy-wizard.tsx", wizard, "ProviderDeployWizard");
  const step = parent.elements.find((element) => element.tagName.getText(parent.sourceFile) === "InterfaceStep");
  assert.equal(jsxAttributeExpressionText(jsxAttribute(step, "fieldErrors"), parent.sourceFile), "fieldErrors");
});

implementedTest("keeps visible validation errors derived from the current editable values", async () => {
  const wizard = (await readS16Sources())["src/components/provider/deploy/provider-deploy-wizard.tsx"];
  const changeText = namedFunctionContext("provider-deploy-wizard.tsx", wizard, "changeText");
  const changeCategory = namedFunctionContext("provider-deploy-wizard.tsx", wizard, "changeCategory");
  const changeAcknowledgement = namedFunctionContext("provider-deploy-wizard.tsx", wizard, "changeAcknowledgement");

  assert.match(normalizedSource(wizard), /constfieldErrors=showValidationErrors\?providerDeployFieldErrors\(values,currentStep\):emptyFieldErrors;/);
  for (const context of [changeText, changeCategory, changeAcknowledgement]) {
    const source = context.declaration.getText(context.sourceFile);
    assert.doesNotMatch(source, /setFieldErrors|setValidationMessage/);
  }
});

implementedTest("renders explanatory inert stage controls instead of implying that signing is available", async () => {
  const stages = (await readS16Sources())["src/components/provider/deploy/provider-deploy-stages.tsx"];
  const { sourceFile, elements } = namedFunctionContext(
    "provider-deploy-stages.tsx",
    stages,
    "ProviderDeployStages",
  );

  const stageControl = elements.find((element) => {
    if (!["button", "Button"].includes(element.tagName.getText(sourceFile))) return false;
    const describedBy = jsxAttributeExpressionText(jsxAttribute(element, "aria-describedby"), sourceFile);
    const disabled = jsxAttributeExpressionText(jsxAttribute(element, "disabled"), sourceFile);
    return describedBy !== null && normalizedSource(disabled ?? "") === "control.disabled" && jsxElementText(element, sourceFile).includes("control.label");
  });

  assert.ok(stageControl, "each inert stage control must bind its label, disabled state, and description");
  const descriptionReference = jsxAttributeExpressionText(jsxAttribute(stageControl, "aria-describedby"), sourceFile);
  const description = elements.find((element) => {
    if (element.tagName.getText(sourceFile) !== "p") return false;
    return jsxAttributeExpressionText(jsxAttribute(element, "id"), sourceFile) === descriptionReference &&
      jsxElementText(element, sourceFile).includes("control.description");
  });

  assert.match(stages, /providerDeployStageControl\s*\(/);
  assert.ok(description, "aria-describedby must reference the control's explanatory description");
  assert.doesNotMatch(stages, /Signing is available in its separate screen/i);
});

implementedTest("keeps progress responsive and lets only completed steps receive focusable return controls", async () => {
  const wizard = (await readS16Sources())["src/components/provider/deploy/provider-deploy-wizard.tsx"];
  const progress = namedFunctionContext("provider-deploy-wizard.tsx", wizard, "StepProgress");
  const progressControl = progress.elements.find((element) => {
    if (!["button", "Button"].includes(element.tagName.getText(progress.sourceFile))) return false;
    const type = jsxAttributeExpressionText(jsxAttribute(element, "type"), progress.sourceFile);
    const ariaLabel = jsxAttributeExpressionText(jsxAttribute(element, "aria-label"), progress.sourceFile);
    const disabled = jsxAttributeExpressionText(jsxAttribute(element, "disabled"), progress.sourceFile);
    const onClick = jsxAttributeExpressionText(jsxAttribute(element, "onClick"), progress.sourceFile);
    return type === "button" && ariaLabel?.includes("step.label") &&
      normalizedSource(disabled ?? "") === "index>=currentStep" &&
      normalizedSource(onClick ?? "") === "()=>onStepSelect(index)";
  });
  const wizardContext = namedFunctionContext("provider-deploy-wizard.tsx", wizard, "ProviderDeployWizard");
  const progressBoundary = wizardContext.elements.find((element) => element.tagName.getText(wizardContext.sourceFile) === "StepProgress");
  const onStepSelect = progressBoundary
    ? jsxAttributeExpressionText(jsxAttribute(progressBoundary, "onStepSelect"), wizardContext.sourceFile)
    : null;
  const returnToStep = namedFunctionContext("provider-deploy-wizard.tsx", wizard, "returnToStep");

  assert.doesNotMatch(progress.declaration.getText(progress.sourceFile), /\boverflow-x-auto\b|\bmin-w-max\b/);
  assert.ok(progressControl, "StepProgress must own labelled button controls that return only to completed steps");
  assert.equal(normalizedSource(onStepSelect ?? ""), "returnToStep");
  assert.match(returnToStep.declaration.getText(returnToStep.sourceFile), /setCurrentStep\(step\)/);
  assert.match(returnToStep.declaration.getText(returnToStep.sourceFile), /setShowValidationErrors\(false\)/);
});

implementedTest("keeps the signing island mounted before review so a durable campaign can resume", async () => {
  const sources = await readS16Sources();
  const wizard = sources["src/components/provider/deploy/provider-deploy-wizard.tsx"];
  const stages = sources["src/components/provider/deploy/provider-deploy-stages.tsx"];

  assert.match(wizard, /import\s*\{\s*DeployStageSigning\s*\}\s+from\s+["']\.\/deploy-stage-signing["']/);
  const shell = namedFunctionContext("provider-deploy-wizard.tsx", wizard, "ProviderDeployWizard");
  const island = shell.elements.find((element) => element.tagName.getText(shell.sourceFile) === "DeployStageSigning");
  assert.ok(island, "ProviderDeployWizard must mount DeployStageSigning");
  assert.match(island.getText(shell.sourceFile), /reviewing=\{currentStep === lastStep\}/);
  assert.match(island.getText(shell.sourceFile), /onResume=\{resumeDurableCampaign\}/);
  assert.match(wizard, /\{layout\.connect\}/, "both deploy layouts must receive the shared-session connect action");
  assert.doesNotMatch(wizard, /layout\.wallet/, "the deploy layouts must not remount a wallet-local control");
  assert.match(wizard, /const resumeDurableCampaign = useCallback\(\(\) =>/);
  assert.match(wizard, /setCurrentStep\(lastStep\)/);
  assert.match(wizard, /setShowValidationErrors\(false\)/);
  assert.doesNotMatch(shell.declaration.getText(shell.sourceFile), /<ProviderDeployStages\b/);
  assert.doesNotMatch(wizard, /providerDeployStageStates/);

  const stageList = namedFunctionContext("provider-deploy-stages.tsx", stages, "ProviderDeployStages");
  const control = stageList.elements.find((element) => {
    if (!["button", "Button"].includes(element.tagName.getText(stageList.sourceFile))) return false;
    const disabled = jsxAttributeExpressionText(jsxAttribute(element, "disabled"), stageList.sourceFile);
    return normalizedSource(disabled ?? "") === "control.disabled" && jsxAttribute(element, "onClick") !== undefined;
  });
  assert.ok(control, "the stage control must bind its activation to the bridge callback");
  assert.match(stages, /providerDeployStageControl\s*\(\s*index\s*,\s*stage\s*,\s*enabledStage\s*===\s*index\s*\)/);
});
