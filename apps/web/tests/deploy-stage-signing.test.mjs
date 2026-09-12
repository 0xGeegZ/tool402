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

async function signingIslandHarness(values, renderReview, resume = null, onResume = undefined) {
  const slots = [];
  let cursor = 0;
  let connectionRequests = 0;
  let session = {
    state: { kind: "disconnected" },
    provider: null,
    async connect() { connectionRequests += 1; },
  };
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
      useEffect(effect, dependencies) {
        const index = cursor++;
        const previous = slots[index];
        const changed = previous === undefined || dependencies.some((dependency, dependencyIndex) => !Object.is(dependency, previous.dependencies[dependencyIndex]));
        if (!changed) return;
        previous?.cleanup?.();
        slots[index] = { dependencies, cleanup: effect() };
      },
    },
    "react/jsx-runtime": jsxRuntime,
    "../../../lib/wallet/command-bridge.ts": await import("../src/lib/wallet/command-bridge.ts"),
    "../../../lib/provider-campaign-resume.ts": {
      loadProviderCampaignResume() {
        return { then(resolve) { resolve(resume); } };
      },
    },
    "../../wallet/signature-dialog": { SignatureDialog: "SignatureDialog" },
    "../../wallet/wallet-session": {
      useWalletSession: () => session,
      connectedWalletSession(wallet) {
        return wallet.state.kind === "connected" && wallet.provider !== null
          ? { provider: wallet.provider, address: wallet.state.address }
          : null;
      },
    },
    "../../ui/button": { Button: "Button" },
    "../../ui/status": { Status: "Status" },
    "./ats-create-configuration": await import("../src/components/provider/deploy/ats-create-configuration.ts"),
    "./directory-record-literal": await import("../src/components/provider/deploy/directory-record-literal.ts"),
    "./provider-icon": { ProviderGlyph: "ProviderGlyph" },
    "./provider-deploy-stages": { ProviderDeployStages: "ProviderDeployStages" },
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
      return module.exports.DeployStageSigning({ values, renderReview, onResume });
    },
    connect() {
      session = {
        state: { kind: "connected", address: "0x7e5f4552091a69125d5dfcb7b8c2659029395bdf" },
        provider: { request() { assert.fail("local construction failure must not request the wallet"); } },
        async connect() { connectionRequests += 1; },
      };
      this.render();
    },
    seedStageThreeCandidate() {
      slots[0] = {
        transactionId: "0.0.9213391-1789430400-000000001",
        evmAddress: "0x52908400098527886e0f7030069857d2e4169ee7",
      };
      slots[1] = [{ kind: "done" }, { kind: "done" }];
      slots[2] = "AAAAAAAAAAAAAAAAAAAAAA";
    },
    connectionRequests() { return connectionRequests; },
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
  assert.match(island, /import\s*\{[^}]*\buseWalletSession\b[^}]*\}\s+from\s+["']\.\.\/\.\.\/wallet\/wallet-session["']/u);
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
  assert.equal((island.match(/useWalletSession\(\)/gu) ?? []).length, 1);
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

  assert.match(island, /setCandidate\(\(current\) => current \?\? nextCandidate\)/u, "the first candidate must survive rerenders");
  assert.doesNotMatch(island, /\buseRef\b/u, "candidate state must not be mirrored in a ref");
  assert.match(island, /\bsetCandidate\b/u, "a verified candidate belongs only to this browser session");
  assert.match(island, /useState<AtsCreateCandidate \| null>/u);
  assert.doesNotMatch(island, /(?:external\.attachCandidate|eth_signTypedData_v4)/u);
});

implementedTest("hides the embedded MetaMask action after the shared session connects", async () => {
  const values = {
    toolName: "RiskScan",
    customerProblem: "Tool operators need a bounded way to assess request risk before they continue a workflow.",
    qualifyingResource: "riskscan-local-assessment",
    quickPrice: "0.1",
    standardPrice: "0.1",
    targetAgentCustomers: "Security-oriented agent operators",
    useOfFunds: "Maintain the local assessment workflow and provider documentation.",
    risks: "Testnet terms do not promise yield, principal, or return.",
  };
  let embeddedLayout = null;
  const harness = await signingIslandHarness(values, (layout) => {
    embeddedLayout = layout;
    return [layout.connect, layout.stages];
  });

  const beforeConnection = harness.render();
  assert.ok(embeddedLayout, "the embedded review must receive the conditional shared-session action");
  assert.ok(elements(beforeConnection).some((element) => element.props["data-ui"] === "provider-deploy-connect"));

  harness.connect();
  await Promise.resolve();
  const afterConnection = harness.render();
  const stages = elements(afterConnection).find((element) => element.type === "ProviderDeployStages");
  assert.equal(embeddedLayout.connect, null, "the embedded MetaMask action must disappear when the shared session is active");
  assert.equal(stages.props.enabledStage, 0, "the embedded stage list must receive the connected wallet session");
});

implementedTest("notifies the wizard when a connected issuer has a durable campaign to resume", async () => {
  const values = {
    toolName: "RiskScan",
    customerProblem: "Tool operators need a bounded way to assess request risk before they continue a workflow.",
    qualifyingResource: "riskscan-local-assessment",
    quickPrice: "0.1",
    standardPrice: "0.1",
    targetAgentCustomers: "Security-oriented agent operators",
    useOfFunds: "Maintain the local assessment workflow and provider documentation.",
    risks: "Testnet terms do not promise yield, principal, or return.",
  };
  let resumeCount = 0;
  const harness = await signingIslandHarness(
    values,
    undefined,
    { attemptPublicId: "JBSWY3DPEBLW64TMMQ" },
    () => { resumeCount += 1; },
  );

  harness.connect(harness.render());
  await Promise.resolve();
  harness.render();

  assert.equal(resumeCount, 1, "a recovered durable campaign must return the wizard to its review step");
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
  validHarness.connect();
  const validStages = elements(validHarness.render()).find((element) => element.type === "ProviderDeployStages");
  validStages.props.onActivate(0);
  const validTree = validHarness.render();
  assert.equal(elements(validTree).find((element) => element.type === "ProviderDeployStages").props.states[0].kind, "in_progress");
  assert.equal(elements(validTree).some((element) => element.type === "SignatureDialog"), true);

  for (const invalidValue of [{ qualifyingResource: "" }, { quickPrice: "0" }]) {
    const harness = await signingIslandHarness({ ...values, ...invalidValue });
    harness.connect();
    const before = harness.render();
    const stages = elements(before).find((element) => element.type === "ProviderDeployStages");
    assert.equal(stages.props.enabledStage, 0);
    assert.equal(stages.props.states[0].kind, "actionable");
    assert.doesNotThrow(() => stages.props.onActivate(0), "request construction errors must be handled in the signing island");

    const after = harness.render();
    const nextStages = elements(after).find((element) => element.type === "ProviderDeployStages");
    assert.deepEqual(nextStages.props.states, stages.props.states, "a local construction failure must not record a stage result");
    assert.equal(nextStages.props.enabledStage, 0);
    assert.equal(elements(after).some((element) => element.type === "SignatureDialog"), false);
    const feedback = elements(after).find((element) =>
      ["alert", "status"].includes(element.props.role) || element.props["aria-live"] === "polite",
    );
    assert.ok(feedback, "local request rejection must render accessible feedback");
    assert.match(visibleText(feedback), /review|check|correct|fix|update/i);
    assert.doesNotMatch(visibleText(feedback), /RangeError|TypeError|qualifyingResource|quickPrice|canonical|idempotency/u);
  }
});

implementedTest("retains each closed relay outcome after its signature dialog is dismissed", async () => {
  const { campaignFixture } = await import("../src/components/provider/deploy/campaign-fixture.ts");
  const values = {
    ...campaignFixture,
    targetAgentCustomers: campaignFixture.targetAgentCustomers.join("\n"),
    useOfFunds: campaignFixture.useOfFunds.join("\n"),
    risks: campaignFixture.risks.join("\n"),
  };

  for (const { phase, outcome, kind } of [
    { phase: "failed", outcome: "not_configured", kind: "unavailable" },
    { phase: "unknown", outcome: "transport_failure", kind: "unknown" },
    { phase: "unknown", outcome: "unexpected_response", kind: "unknown" },
  ]) {
    const harness = await signingIslandHarness(values);
    harness.connect();
    await Promise.resolve();
    harness.seedStageThreeCandidate();
    const before = harness.render();
    const stages = elements(before).find((element) => element.type === "ProviderDeployStages");
    assert.equal(stages.props.enabledStage, 2, "only Stage 3 is actionable after its durable predecessors and candidate are present");
    stages.props.onActivate(2);

    const pending = harness.render();
    const dialog = elements(pending).find((element) => element.type === "SignatureDialog");
    assert.ok(dialog, `${outcome} must be returned through the dialog`);
    dialog.props.onResult({ phase, outcome });

    const after = harness.render();
    const afterStages = elements(after).find((element) => element.type === "ProviderDeployStages");
    assert.equal(afterStages.props.states[2].kind, kind, `${outcome} must remain visible after dismissal`);
    assert.equal(elements(after).some((element) => element.type === "SignatureDialog"), false);
  }
});
implementedTest("uses the shared connected session without an issuer-specific local gate", async () => {
  const { campaignFixture } = await import("../src/components/provider/deploy/campaign-fixture.ts");
  const values = {
    ...campaignFixture,
    targetAgentCustomers: campaignFixture.targetAgentCustomers.join("\n"),
    useOfFunds: campaignFixture.useOfFunds.join("\n"),
    risks: campaignFixture.risks.join("\n"),
  };
  const harness = await signingIslandHarness(values);
  harness.connect("0x7e5f4552091a69125d5dfcb7b8c2659029395bdf");
  const tree = harness.render();
  const stages = elements(tree).find((element) => element.type === "ProviderDeployStages");

  assert.equal(stages.props.enabledStage, 0);
  assert.match(await readIsland(), /connectedWalletSession\(wallet\)/u);
  const island = await readIsland();
  assert.doesNotMatch(island, /\b(?:isIssuerAdvisory|issuerEvmAddress|notIssuer|approved issuer)\b/u);
});

implementedTest("offers one explicit deploy-form MetaMask connection while the shared session is disconnected", async () => {
  const { campaignFixture } = await import("../src/components/provider/deploy/campaign-fixture.ts");
  const values = {
    ...campaignFixture,
    targetAgentCustomers: campaignFixture.targetAgentCustomers.join("\n"),
    useOfFunds: campaignFixture.useOfFunds.join("\n"),
    risks: campaignFixture.risks.join("\n"),
  };
  const harness = await signingIslandHarness(values);
  const disconnectedTree = harness.render();
  const connectSection = elements(disconnectedTree).find((element) => element.props["data-ui"] === "provider-deploy-connect");

  assert.ok(connectSection, "the final deploy form must offer a disconnected wallet action");
  assert.match(visibleText(connectSection), /Connect MetaMask on Hedera Testnet to enable the first signing step\./u);
  assert.doesNotMatch(visibleText(disconnectedTree), /Connect MetaMask to sign\./u);
  const connectButton = elements(connectSection).find((element) => element.type === "Button" && visibleText(element) === "Connect MetaMask");
  assert.ok(connectButton, "the deploy-form section must expose one labelled connect button");
  connectButton.props.onClick();
  assert.equal(harness.connectionRequests(), 1, "only the explicit button click may invoke the shared connect action");

  harness.connect();
  assert.equal(
    elements(harness.render()).some((element) => element.props["data-ui"] === "provider-deploy-connect"),
    false,
    "the deploy-form action must disappear once the shared session is connected",
  );
});
