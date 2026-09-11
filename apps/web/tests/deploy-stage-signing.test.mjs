import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import * as jsxRuntime from "react/jsx-runtime";
import typescript from "typescript";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const islandPath = "src/components/provider/deploy/deploy-stage-signing.tsx";
const sourceExists = existsSync(join(appRoot, islandPath));
const implementedTest = sourceExists ? test : test.skip;

async function readIsland() {
  return readFile(join(appRoot, islandPath), "utf8");
}

async function signingIslandHarness(values) {
  const slots = [];
  let cursor = 0;
  const imports = {
    react: {
      useState(initial) {
        const index = cursor++;
        if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
        return [slots[index], (value) => {
          slots[index] = typeof value === "function" ? value(slots[index]) : value;
        }];
      },
      useRef(initial) {
        const index = cursor++;
        if (!(index in slots)) slots[index] = { current: initial };
        return slots[index];
      },
      useEffect(effect) { effect(); },
    },
    "react/jsx-runtime": jsxRuntime,
    "../../../lib/wallet/command-bridge.ts": await import("../src/lib/wallet/command-bridge.ts"),
    "../../../lib/ats/stage-b-ats-create-execution-projection.ts": await import("../src/lib/ats/stage-b-ats-create-execution-projection.ts"),
    "../../wallet/signature-dialog": { SignatureDialog: "SignatureDialog" },
    "../../wallet/wallet-connect": { WalletIsland: "WalletIsland" },
    "./ats-create-configuration": await import("../src/components/provider/deploy/ats-create-configuration.ts"),
    "./directory-record-literal": await import("../src/components/provider/deploy/directory-record-literal.ts"),
    "./provider-deploy-stages": { ProviderDeployStages: "ProviderDeployStages" },
    "./world-issuer-verification": { WorldIssuerVerification: "WorldIssuerVerification" },
    "./provider-deploy-state": await import("../src/components/provider/deploy/provider-deploy-state.ts"),
  };
  const { outputText } = typescript.transpileModule(await readIsland(), {
    fileName: islandPath,
    compilerOptions: {
      target: typescript.ScriptTarget.ES2022,
      module: typescript.ModuleKind.CommonJS,
      jsx: typescript.JsxEmit.ReactJSX,
    },
  });
  const module = { exports: {} };
  runInNewContext(outputText, {
    exports: module.exports,
    require(specifier) {
      assert.ok(Object.hasOwn(imports, specifier), `unexpected signing island import: ${specifier}`);
      return imports[specifier];
    },
  }, { filename: islandPath });
  return {
    render() {
      cursor = 0;
      return module.exports.DeployStageSigning({ values });
    },
    connect(tree) {
      const wallet = elements(tree).find((element) => element.type === "WalletIsland");
      const reporter = wallet.props.children({
        address: "0x7e5f4552091a69125d5dfcb7b8c2659029395bdf",
        provider: { request() { assert.fail("local construction failure must not request the wallet"); } },
      });
      reporter.type(reporter.props);
    },
  };
}

function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (node === null || typeof node !== "object" || !("props" in node)) return [];
  return [node, ...elements(node.props.children)];
}

function visibleText(node) {
  if (Array.isArray(node)) return node.map(visibleText).join(" ");
  if (typeof node === "string" || typeof node === "number") return String(node);
  return node && typeof node === "object" && "props" in node ? visibleText(node.props.children) : "";
}

test("requires the declared S21 signing island source path", () => {
  assert.equal(sourceExists, true, `missing declared S21 source path: ${islandPath}`);
});

implementedTest("composes the accepted wallet island, signature dialog, and stage list exactly once", async () => {
  const island = await readIsland();

  assert.match(island, /^["']use client["'];/u);
  assert.match(island, /import\s*\{[^}]*\bWalletIsland\b[^}]*\}\s+from\s+["']\.\.\/\.\.\/wallet\/wallet-connect["']/u);
  assert.match(island, /import\s*\{[^}]*\bSignatureDialog\b[^}]*\}\s+from\s+["']\.\.\/\.\.\/wallet\/signature-dialog["']/u);
  assert.match(island, /import\s*\{[^}]*\bProviderDeployStages\b[^}]*\}\s+from\s+["']\.\/provider-deploy-stages["']/u);
  assert.match(island, /import\s*\{[^}]*\bbuildStageSignatureRequest\b[^}]*\}\s+from\s+["'][^"']*lib\/wallet\/command-bridge(?:\.ts)?["']/u);
  assert.match(island, /\bstageStateForSignatureResult\b/u);
  assert.match(island, /\bproviderDeployStageStates\s*\(/u);
  assert.match(island, /\bisDirectoryRecordComplete\s*\(/u);
  assert.match(island, /\batsCreateConfiguration\b/u, "the S16 display literal must remain available for stage presentation");
  const activate = island.slice(island.indexOf("function activate"), island.indexOf("function finish"));
  assert.match(activate, /\bbuildStageSignatureRequest\s*\(/u);
  assert.doesNotMatch(activate, /\bprojection\s*:/u, "the signing island must not pass a stage-2 projection");
  assert.equal((island.match(/<WalletIsland\b/gu) ?? []).length, 1);
  assert.equal((island.match(/<SignatureDialog\b/gu) ?? []).length, 1);
  assert.match(island, /<SignatureDialog\b[^>]*\bonResult=/u);
  assert.match(island, /<ProviderDeployStages\b[^>]*\bonActivate=/u);
  assert.match(island, /<ProviderDeployStages\b[^>]*\benabledStage=/u);
});

implementedTest("keeps stage state session-only and truthful with no persistence, retry, environment, or transport", async () => {
  const island = await readIsland();

  assert.match(island, /reload/iu);
  assert.match(island, /not an on-chain fact/iu);
  assert.match(island, /not an authority/iu);
  assert.doesNotMatch(island, /\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\bEventSource\b|\bsendBeacon\b/u);
  assert.doesNotMatch(island, /\b(?:localStorage|sessionStorage|indexedDB|document\.cookie)\b/u);
  assert.doesNotMatch(island, /\b(?:process\.env|import\.meta\.env)\b/u);
  assert.doesNotMatch(island, /\b(?:setInterval|setTimeout|requestAnimationFrame)\s*\(/u);
  assert.doesNotMatch(island, /\b(?:convex|_generated|useMutation|useAction|useQuery)\b/u);
  assert.doesNotMatch(island, /0x[0-9a-fA-F]{40}/u);
  assert.doesNotMatch(island, /\b(?:href|<a\b)/u);
});

implementedTest("holds the M49 candidate in this session and passes one stable action controller through the stage view", async () => {
  const island = await readIsland();

  assert.match(island, /\buseRef\b/u, "the action controller must survive rerenders");
  assert.match(island, /\bsetCandidate\b/u, "a verified candidate belongs only to this browser session");
  assert.match(island, /useState<AtsCreateCandidate \| null>/u);
  assert.doesNotMatch(island, /(?:external\.attachCandidate|eth_signTypedData_v4)/u);
});

implementedTest("keeps a rejected local request out of the dialog and stage results with actionable feedback", async () => {
  const { campaignFixture } = await import("../src/components/provider/deploy/campaign-fixture.ts");
  const values = {
    ...campaignFixture,
    targetAgentCustomers: campaignFixture.targetAgentCustomers.join("\n"),
    useOfFunds: campaignFixture.useOfFunds.join("\n"),
    risks: campaignFixture.risks.join("\n"),
  };
  const validHarness = await signingIslandHarness(values);
  validHarness.connect(validHarness.render());
  const validStages = elements(validHarness.render()).find((element) => element.type === "ProviderDeployStages");
  validStages.props.onActivate(0);
  const validTree = validHarness.render();
  assert.equal(elements(validTree).find((element) => element.type === "ProviderDeployStages").props.states[0].kind, "in_progress");
  const validWallet = elements(validTree).find((element) => element.type === "WalletIsland");
  assert.equal(elements(validWallet.props.children({ provider: {}, address: "unused" })).some((element) => element.type === "SignatureDialog"), true);

  for (const invalidValue of [{ qualifyingResource: "" }, { quickPrice: "0" }]) {
    const harness = await signingIslandHarness({ ...values, ...invalidValue });
    harness.connect(harness.render());
    const before = harness.render();
    const stages = elements(before).find((element) => element.type === "ProviderDeployStages");
    assert.equal(stages.props.enabledStage, 0);
    assert.equal(stages.props.states[0].kind, "actionable");
    assert.doesNotThrow(() => stages.props.onActivate(0), "request construction errors must be handled in the signing island");

    const after = harness.render();
    const nextStages = elements(after).find((element) => element.type === "ProviderDeployStages");
    assert.deepEqual(nextStages.props.states, stages.props.states, "a local construction failure must not record a stage result");
    assert.equal(nextStages.props.enabledStage, 0);
    const wallet = elements(after).find((element) => element.type === "WalletIsland");
    const walletContent = wallet.props.children({ provider: {}, address: "unused" });
    assert.equal(elements(walletContent).some((element) => element.type === "SignatureDialog"), false);
    const feedback = elements(after).find((element) =>
      ["alert", "status"].includes(element.props.role) || element.props["aria-live"] === "polite",
    );
    assert.ok(feedback, "local request rejection must render accessible feedback");
    assert.match(visibleText(feedback), /review|check|correct|fix|update/i);
    assert.doesNotMatch(visibleText(feedback), /RangeError|TypeError|qualifyingResource|quickPrice|canonical|idempotency/u);
  }
});
