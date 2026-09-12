import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import test from "node:test";
import * as jsxRuntime from "react/jsx-runtime";
import { Suspense } from "react";
import typescript from "typescript";
import * as viem from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { getFunctionName } from "convex/server";
import { canonicalizeRequirements } from "@tool402/core";
import factoryArtifact from "@hashgraph/asset-tokenization-contracts/artifacts/contracts/factory/Factory.sol/Factory.json" with { type: "json" };

import * as providerTools from "../../../packages/backend/convex/provider_tools.ts";
import * as replay from "../../../packages/backend/convex/wallet_command_replay.ts";
import * as offerings from "../../../packages/backend/convex/offerings.ts";
import * as prepare from "../../../packages/backend/convex/external_prepare_command_admission.ts";
import * as receipts from "../../../packages/backend/convex/ats_candidate_receipts.ts";
import * as verification from "../../../packages/backend/convex/ats_receipt_verification.ts";
import * as directories from "../../../packages/backend/convex/directory_versions.ts";
import { handleProviderSessionIngress } from "../../../packages/backend/convex/provider_session_ingress.ts";
import { handleProviderToolsRequest, handleProviderToolDeploymentRequest } from "../src/lib/provider-tools-server.ts";
import { createChallenge, verifyChallenge } from "../src/lib/dashboard-auth/dashboard-auth.ts";
import { handleCommandRelayPost, signAndRelayCommand } from "../src/lib/wallet/command-relay.ts";
import { buildStageSignatureRequest, providerDeploymentTarget } from "../src/lib/wallet/command-bridge.ts";
import { completeDirectoryRecordLiteral, directoryRecordForProviderTool } from "../src/components/provider/deploy/directory-record-literal.ts";
import { createStageBBrowserProviderBridge } from "../src/lib/ats/stage-b-browser-provider-bridge.ts";
import { loadProviderToolDeployment } from "../src/lib/provider-tool-deployment-client.ts";
import { readProviderProjections } from "../src/lib/offering-projection.ts";
import { createProviderToolAllocationRequest, parseProviderToolAllocation } from "../src/lib/provider-tools-client.ts";
import { campaignFixture } from "../src/components/provider/deploy/campaign-fixture.ts";

const issuer = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
const factory = "0xd1f118a40f3b02883d35909ef2517e7edd78379d";
const origin = "http://localhost:3000";
const site = "https://journey.convex.test";
const mirror = "https://testnet.mirrornode.hedera.com/api/v1/";
const rpc = "https://testnet.hashio.io/api";
const now = Date.parse("2026-09-12T10:00:00.000Z");
// Public, offline-only fixture key already used by command-dispatch.test.mjs.
const signer = privateKeyToAccount("0x59c6995e998f97a5a0044966f094538e2f7d9fca7ca9293b3ff0b8f9b5b0a5b9");
const environment = {
  NODE_ENV: "development",
  TOOL402_DASHBOARD_AUTH_ORIGIN: origin,
  TOOL402_DASHBOARD_AUTH_SECRET: "0123456789abcdef".repeat(4),
  TOOL402_INGRESS_KEY_ID: "journey",
  TOOL402_INGRESS_SECRET: "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f",
  TOOL402_CONVEX_SITE_URL: site,
};
const values = Object.freeze({
  ...Object.fromEntries(["toolName", "customerProblem", "qualifyingResource", "quickPrice", "standardPrice"].map((key) => [key, campaignFixture[key]])),
  targetAgentCustomers: campaignFixture.targetAgentCustomers.join("\n"),
  useOfFunds: campaignFixture.useOfFunds.join("\n"),
  risks: campaignFixture.risks.join("\n"),
});

function json(value, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });
}

// Match the existing component tests' TypeScript loader while retaining the
// host realm: Convex's defensive plain-object checks must still run unchanged.
function loadSource(relativePath, overrides = {}) {
  const url = new URL(relativePath, import.meta.url);
  const require = createRequire(url);
  const { outputText } = typescript.transpileModule(readFileSync(url, "utf8"), {
    fileName: fileURLToPath(url),
    compilerOptions: { target: typescript.ScriptTarget.ES2022, module: typescript.ModuleKind.CommonJS, jsx: typescript.JsxEmit.ReactJSX },
  });
  const module = { exports: {} };
  new Function("exports", "require", outputText)(module.exports, (name) => {
    if (Object.hasOwn(overrides, name)) return overrides[name];
    return require(name.startsWith(".") && existsSync(new URL(`${name}.ts`, url)) ? `${name}.ts` : name);
  });
  return module.exports;
}

function hooks() {
  const slots = [];
  let cursor = 0;
  return {
    reset() { cursor = 0; },
    dispose() { for (const slot of slots) slot?.cleanup?.(); },
    react: {
      useState(initial) {
        const index = cursor++;
        if (!(index in slots)) slots[index] = initial;
        return [slots[index], (value) => { slots[index] = typeof value === "function" ? value(slots[index]) : value; }];
      },
      useRef(initial) {
        const index = cursor++;
        return slots[index] ??= { current: initial };
      },
      useMemo(factory, dependencies) {
        const index = cursor++;
        if (!slots[index] || dependencies.some((value, i) => value !== slots[index].dependencies[i])) slots[index] = { dependencies, value: factory() };
        return slots[index].value;
      },
      useEffect(effect, dependencies) {
        const index = cursor++;
        if (!slots[index] || dependencies.some((value, i) => value !== slots[index].dependencies[i])) {
          slots[index]?.cleanup?.();
          slots[index] = { dependencies, cleanup: effect() };
        }
      },
    },
  };
}

function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements);
  return node && typeof node === "object" && "props" in node ? [node, ...elements(node.props.children)] : [];
}

async function settled(render, ready) {
  for (let i = 0; i < 100; i += 1) {
    const result = render();
    if (ready(result)) return result;
    await new Promise((resolve) => setImmediate(resolve));
  }
  assert.fail("the actual component did not settle its local requests");
}

// Only persistence and Convex function routing are emulated. Every admission,
// authority, replay, lifecycle and receipt decision belongs to its real handler.
function runtime() {
  const modules = { provider_tools: providerTools, wallet_command_replay: replay, offerings, external_prepare_command_admission: prepare, ats_candidate_receipts: receipts, ats_receipt_verification: verification, directory_versions: directories };
  let rows = {
    commandAuthorities: [{ _id: "commandAuthorities:issuer", _creationTime: 1, principalPublicId: "tool402_ats_issuer_testnet_v1", canonicalSignerAddress: issuer, chainId: 296, role: "ISSUER", ownedSubjectPublicIds: ["riskscan_revenue_note_demo"], authorityVersion: "ats_issuer_testnet_v1", enabled: true }],
    providerTools: [], offerings: [], externalPrepareCommandAttempts: [], providerToolReceiptBindings: [], directoryVersions: [],
    ingressCommandReplayClaims: [], walletCommandReplayClaims: [], externalPrepareCommandReplayClaims: [],
  };
  // Existing legacy records are fixtures, never generated by the A/B journey.
  const legacyOffering = {
    _id: "offerings:legacy", _creationTime: 1,
    offeringPublicId: "riskscan_revenue_note_demo", subjectPublicId: "riskscan_revenue_note_demo",
    canonicalSignerAddress: issuer, principalPublicId: "tool402_ats_issuer_testnet_v1", authorityVersion: "ats_issuer_testnet_v1",
    payloadHash: `0x${"d".repeat(64)}`, idempotencyKey: "EEEEEEEEEEEEEEEEEEEEEw",
    advertisedQuickPriceTinybars: "10", advertisedStandardPriceTinybars: "25", version: 1, acceptedAt: 1n, updatedAt: 1n,
    definition: { schemaVersion: 1, terms: {
      version: "riskscan-revenue-note-v1", fundingTargetTinybars: "1000", noteUnitPriceTinybars: "10", maximumNoteUnits: "100",
      minimumPurchaseUnits: "1", reserveShareBps: "2000", issuerShareBps: "8000", platformFeeBps: "0", payoutCapTinybars: "1500",
    }, maturityAt: "2026-12-31T00:00:00.000Z", qualifyingResource: "riskscan.quick" },
    narrative: { title: "Legacy RiskScan", customerProblem: "Risk", customerUseCases: ["Check"], useOfFunds: ["Build"], risks: ["Market"] },
    state: "OPEN", atsAttemptId: "externalPrepareCommandAttempts:legacy", atsAssetEvmAddress: `0x${"d".repeat(40)}`, activeDirectoryVersionId: "directoryVersions:legacy",
  };
  const legacyDirectory = {
    _id: "directoryVersions:legacy", _creationTime: 1,
    offeringPublicId: legacyOffering.offeringPublicId, offeringVersion: 1, directoryVersion: 1, serviceSlug: "riskscan",
    canonicalSignerAddress: issuer,
    payloadHash: `0x${"e".repeat(64)}`, idempotencyKey: "FFFFFFFFFFFFFFFFFFFFFw", state: "ACTIVE", acceptedAt: 1n,
    record: { schemaVersion: 1, serviceId: "riskscan", serviceSlug: "riskscan", offeringPublicId: legacyOffering.offeringPublicId,
      offeringVersion: 1, capabilities: ["evm-contract-risk-signals"], x402Endpoint: "https://legacy.example.test/riskscan",
      paymentProtocol: "x402", paymentNetwork: "hedera-testnet", asset: "HBAR", advertisedTiers: ["quick", "standard"],
      issuerRevenueAccount: "0.0.10430887", clearingAccount: "0.0.456", status: "active", publishedAt: "2026-09-11T10:00:00.000Z" },
  };
  rows.offerings.push(legacyOffering);
  rows.directoryVersions.push(legacyDirectory);
  rows.externalPrepareCommandAttempts.push({
    _id: legacyOffering.atsAttemptId, _creationTime: 1, version: 1, type: "external.prepare", chainId: 296,
    canonicalSignerAddress: issuer, principalPublicId: legacyOffering.principalPublicId, role: "ISSUER", authorityVersion: legacyOffering.authorityVersion,
    payloadHash: `0x${"f".repeat(64)}`, operationKind: "ATS_CREATE", subjectPublicId: legacyOffering.subjectPublicId,
    network: "hedera:testnet", expectedTarget: factory, canonicalParametersHash: "1880065c5ae64b3fc6279cfdd8c85a6880d43e98ce129ed697c72372204296f9",
    idempotencyKey: "DDDDDDDDDDDDDDDDDDDDDw", expiresAt: "2026-09-11T10:04:00.000Z", state: "CONFIRMED",
    candidateTransactionId: "0.0.10430887-1789120800-000000001", candidateEvmAddress: legacyOffering.atsAssetEvmAddress, acceptedAt: 1n,
  });
  const scheduled = [];
  const events = [];
  const db = {
    async get(id) { return structuredClone(Object.values(rows).flat().find((row) => row._id === id) ?? null); },
    query(table) {
      assert.ok(Object.hasOwn(rows, table), `unexpected database table ${table}`);
      return { withIndex(_index, select) {
        const filters = [];
        const range = { eq(field, value) { filters.push([field, value]); return range; } };
        select(range);
        const matches = () => rows[table].filter((row) => filters.every(([field, value]) => row[field] === value));
        return {
          async take(limit) { return structuredClone(matches().slice(0, limit)); },
          order(direction) {
            const ordered = () => direction === "desc" ? [...matches()].reverse() : matches();
            return {
              async take(limit) { return structuredClone(ordered().slice(0, limit)); },
              async paginate({ cursor, numItems }) {
                const all = ordered();
                const start = cursor === null ? 0 : Number(cursor);
                const page = all.slice(start, start + numItems);
                return structuredClone({ page, isDone: start + page.length >= all.length, continueCursor: String(start + page.length) });
              },
            };
          },
        };
      } };
    },
    async insert(table, document) {
      const _id = `${table}:${rows[table].length}`;
      rows[table].push({ _id, _creationTime: now, ...structuredClone(document) });
      return _id;
    },
    async patch(id, patch) {
      const row = Object.values(rows).flat().find((row) => row._id === id);
      assert.ok(row, `missing patch target ${id}`);
      Object.assign(row, structuredClone(patch));
    },
  };
  async function invoke(reference, args, mutation = false) {
    const name = getFunctionName(reference);
    const [module, handler] = name.split(":");
    assert.equal(typeof modules[module]?.[handler]?._handler, "function", `unexpected Convex function ${name}`);
    events.push({ name, args: structuredClone(args) });
    const before = mutation ? structuredClone(rows) : null;
    try { return await modules[module][handler]._handler(ctx, args); }
    catch (error) { if (before) rows = before; events.push({ name: "error", function: name, error: String(error) }); throw error; }
  }
  const ctx = {
    db,
    runQuery: (reference, args) => invoke(reference, args),
    runMutation: (reference, args) => invoke(reference, args, true),
    scheduler: { async runAfter(delay, reference, args) {
      assert.equal(delay, 0);
      scheduled.push({ reference, args });
      events.push({ name: "scheduled", args: structuredClone(args) });
    } },
  };
  return {
    ctx, events, scheduled,
    get rows() { return rows; },
    async verifyNext() {
      const job = scheduled.shift();
      assert.ok(job, "attachment must schedule the independent server verifier");
      assert.equal(getFunctionName(job.reference), "ats_receipt_verification:verifyAtsCandidateReceipt");
      return invoke(job.reference, job.args);
    },
  };
}

test("two identical forms reach independent OPEN tools through signed orchestration; reloaded C needs an explicit receipt recheck", async (t) => {
  t.mock.method(Date, "now", () => now);
  const previousEnvironment = Object.fromEntries(Object.keys(environment).map((key) => [key, process.env[key]]));
  Object.assign(process.env, environment);
  t.after(() => {
    for (const [key, value] of Object.entries(previousEnvironment)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  });
  const state = runtime();
  const legacyRows = structuredClone(Object.values(state.rows).flat());
  const walletCalls = [];
  const wireCommands = [];
  const serverReads = [];
  const transactions = new Map();
  let selectedTransaction;
  let serverEvidence = "valid";
  let receiptAlias = null;

  // ATS pins a real public issuer whose private key must never enter a test.
  // Verify every fixture signature cryptographically, then substitute only its
  // recovered identity at the wallet boundary. The normalizer itself is real.
  const normalizer = loadSource("../../../packages/backend/src/ingress/authenticated-wallet-command-normalizer.ts", {
    viem: { ...viem, async recoverTypedDataAddress(input) {
      const recovered = await viem.recoverTypedDataAddress(input);
      assert.equal(recovered.toLowerCase(), signer.address.toLowerCase());
      return issuer;
    } },
  });
  const dispatch = loadSource("../../../packages/backend/convex/command_dispatch.ts", {
    "../src/ingress/authenticated-wallet-command-normalizer.ts": normalizer,
  });
  const provider = { async request(input) {
    walletCalls.push(structuredClone(input));
    if (input.method === "eth_chainId") return "0x128";
    if (input.method === "eth_accounts") return [issuer];
    if (input.method === "eth_signTypedData_v4") {
      assert.equal(input.params[0], issuer);
      return signer.signTypedData(JSON.parse(input.params[1]));
    }
    if (input.method === "eth_sendTransaction") {
      const tx = input.params[0];
      assert.deepEqual(Object.keys(tx).sort(), ["data", "from", "to", "value"]);
      assert.equal(tx.from, issuer);
      assert.equal(tx.to, factory);
      assert.equal(tx.value, "0x0");
      const index = transactions.size + 1;
      const hash = `0x${String(index).repeat(64)}`;
      const asset = `0x${["a", "b", "c"][index - 1].repeat(40)}`;
      const timestamp = `178920720${index}.000000001`;
      const transactionId = `0.0.10430887-${timestamp.replace(".", "-")}`;
      const decoded = viem.decodeFunctionData({ abi: factoryArtifact.abi, data: tx.data });
      assert.equal(decoded.functionName, "deployBond");
      const event = factoryArtifact.abi.find((item) => item.type === "event" && item.name === "BondDeployed");
      const log = {
        address: factory,
        data: viem.encodeAbiParameters(event.inputs.filter((item) => !item.indexed), [asset, ...decoded.args]),
        topics: viem.encodeEventTopics({ abi: factoryArtifact.abi, eventName: "BondDeployed", args: { deployer: issuer } }),
      };
      selectedTransaction = { hash, asset, timestamp, transactionId, log, transaction: { hash, chainId: "0x128", from: issuer, to: factory, input: tx.data }, receipt: { transactionHash: hash, status: "0x1", to: factory, logs: [log] } };
      transactions.set(hash, selectedTransaction);
      return hash;
    }
    if (input.method === "eth_getTransactionReceipt") return transactions.get(input.params[0]).receipt;
    assert.fail(`unexpected wallet operation ${input.method}`);
  } };

  const challenge = await createChallenge({ address: issuer, env: environment });
  const session = await verifyChallenge({ challengeCookie: challenge.cookie, message: challenge.message, signature: await signer.signMessage({ message: challenge.message }), origin, env: environment }, {
    async verifyMessage(input) { return viem.verifyMessage({ ...input, address: signer.address }); },
  });
  assert.equal(session.kind, "authenticated");

  t.mock.method(globalThis, "fetch", async (input, init = {}) => {
    const url = new URL(String(input), origin);
    const headers = new Headers(init.headers);
    if (url.origin === origin) {
      headers.set("cookie", `tool402-local-dashboard-session=${session.sessionCookie}`);
      if (init.method === "POST") headers.set("origin", origin);
      const request = new Request(url, { ...init, headers });
      if (url.pathname === "/api/provider/tools") return handleProviderToolsRequest(request, environment);
      const deployment = /^\/api\/provider\/tools\/(tool_[0-9a-f]{32})\/deployment$/u.exec(url.pathname);
      if (deployment) return handleProviderToolDeploymentRequest(request, environment, deployment[1]);
      if (url.pathname === "/api/commands") {
        const command = JSON.parse(init.body);
        wireCommands.push(command);
        const response = await handleCommandRelayPost(request, environment);
        command.outcome = (await response.clone().json()).outcome;
        return response;
      }
      if (url.pathname === "/api/provider-directory-configuration") return json({ directoryConfiguration: { x402Endpoint: "https://service.example.test/api/riskscan", clearingAccount: "0.0.456" } });
    }
    if (url.origin === site) {
      const request = new Request(url, init);
      if (url.pathname === "/internal/provider-tools") return handleProviderSessionIngress(state.ctx, request);
      if (url.pathname === "/internal/commands") return dispatch.handleCommandIngress(state.ctx, request);
      if (url.pathname.startsWith("/public/offerings/")) return dispatch.handleOfferingProjection(state.ctx, request);
      if (url.pathname.startsWith("/public/directory/")) return dispatch.handleActiveDirectory(state.ctx, request);
    }
    if (String(url).startsWith(mirror) && url.search === "") {
      serverReads.push({ url: String(url), method: init.method });
      assert.equal(init.credentials, "omit");
      assert.equal(init.redirect, "error");
      assert.ok(init.signal instanceof AbortSignal);
      if (serverEvidence === "unknown") return json({}, 404);
      const transaction = [...transactions.values()].find((tx) => url.pathname.endsWith(tx.transactionId));
      assert.ok(transaction, "server reader must use the attached durable transaction ID");
      return json({ hash: (receiptAlias ?? transaction).hash });
    }
    if (String(url) === rpc) {
      const body = JSON.parse(init.body);
      serverReads.push({ url: String(url), method: body.method, params: body.params });
      assert.equal(init.credentials, "omit");
      const transaction = transactions.get(body.params[0]);
      assert.ok(transaction);
      assert.ok(["eth_getTransactionByHash", "eth_getTransactionReceipt"].includes(body.method));
      return json({ jsonrpc: "2.0", id: body.id, result: body.method === "eth_getTransactionByHash" ? transaction.transaction : transaction.receipt });
    }
    assert.fail(`network outside the declared local test boundaries: ${url}`);
  });

  function mountSigning(toolPublicId) {
    const renderer = hooks();
    const component = loadSource("../src/components/provider/deploy/deploy-stage-signing.tsx", {
      react: renderer.react, "react/jsx-runtime": jsxRuntime,
      "../../wallet/wallet-session": { useWalletSession: () => ({ state: { kind: "connected", address: issuer }, provider }), connectedWalletSession: (wallet) => ({ address: wallet.state.address, provider: wallet.provider }) },
      "../../wallet/signature-dialog": { SignatureDialog: "SignatureDialog" },
      "../../ui/button": { Button: "Button" },
      "./provider-icon": { ProviderGlyph: "ProviderGlyph" },
      "./provider-deploy-stages": { ProviderDeployStages: "ProviderDeployStages" },
      "./ats-create-configuration": createRequire(import.meta.url)("../src/components/provider/deploy/ats-create-configuration.ts"),
    });
    const render = () => { renderer.reset(); return component.DeployStageSigning({ values, selectedToolPublicId: toolPublicId, renderReview: (layout) => layout }); };
    return { render, dispose: renderer.dispose, ready() {
      render();
      return settled(render, (layout) => layout.resumeNotice === null);
    } };
  }

  async function signStage(mounted, stage, expected = "ACCEPTED") {
    let layout = await mounted.ready();
    assert.equal(layout.stages.props.enabledStage, stage);
    layout.stages.props.onActivate(stage);
    layout = mounted.render();
    assert.ok(layout.dialog, `stage ${stage} must require its own signature`);
    const result = await signAndRelayCommand(provider, layout.dialog.props.request);
    assert.deepEqual(result, { kind: "relayed", outcome: expected });
    layout.dialog.props.onResult({ phase: "complete", outcome: result.outcome });
    return mounted.ready();
  }

  async function allocateAndAttach(index, attach = true) {
    const requestId = `013d5c4d-21d9-4f02-a62b-47f49f3b17a${index}`;
    const response = await fetch("/api/provider/tools", createProviderToolAllocationRequest(requestId));
    assert.equal(response.status, 200);
    const body = await response.json();
    const allocation = parseProviderToolAllocation(body);
    assert.ok(allocation, JSON.stringify(body));
    const tool = allocation.tool;
    const mounted = mountSigning(tool.toolPublicId);
    await signStage(mounted, 0);
    const deployment = await loadProviderToolDeployment(tool.toolPublicId);
    assert.equal(deployment.state, "DRAFT");
    assert.deepEqual(deployment.durableValues, values, "the actual form data must survive protected reload");
    await signStage(mounted, 1);
    assert.equal((await loadProviderToolDeployment(tool.toolPublicId)).state, "ASSET_PENDING");
    const bridge = createStageBBrowserProviderBridge({ provider, configuration: deployment.ats.configuration, async fetch(input) {
      const url = new URL(input);
      assert.equal(url.origin + "/api/v1/", mirror);
      const tx = selectedTransaction;
      if (url.pathname.endsWith("/transactions")) return json({ transactions: [{ name: "ETHEREUMTRANSACTION", result: "SUCCESS", nonce: 0, consensus_timestamp: tx.timestamp, transaction_id: tx.transactionId }] });
      assert.ok(url.pathname.endsWith(tx.hash) || url.pathname.endsWith(tx.transactionId));
      return json({ hash: tx.hash, chain_id: "0x128", result: "SUCCESS", status: "0x1", from: issuer, to: factory, timestamp: tx.timestamp, logs: [tx.log], function_parameters: tx.transaction.input });
    } });
    const created = await bridge.execute();
    assert.equal(created.kind, "candidate");
    const transaction = selectedTransaction;
    if (!attach) return { tool, mounted, deployment, transaction };
    (await mounted.ready()).stages.props.onCandidate(created.candidate);
    await signStage(mounted, 2);
    assert.equal((await loadProviderToolDeployment(tool.toolPublicId)).state, "ASSET_PENDING");
    assert.equal((await mounted.ready()).stages.props.enabledStage, 2, "attachment alone cannot enable publication");
    assert.equal(state.scheduled.length, 1);
    return { tool, mounted, deployment, transaction };
  }

  async function viewPublished(tool) {
    const renderer = hooks();
    const list = loadSource("../src/components/dashboard/provider-tool-list.tsx", {
      react: renderer.react, "react/jsx-runtime": jsxRuntime, "next/link": { default: "Link" },
      "../ui/badge": { Badge: "Badge" }, "../ui/button": { buttonVariants: () => "" },
    });
    const render = () => { renderer.reset(); return list.ProviderToolList(); };
    const tree = await settled(render, (node) => elements(node).some((item) => item.props["aria-label"] === "Your tools"));
    const links = elements(tree).filter((node) => node.props.children === "View");
    const link = links.find((node) => node.props.href === `/provider?tool=${tool.toolPublicId}`);
    assert.ok(link, "published View must preserve this tool's selection");
    const url = new URL(link.props.href, origin);
    const page = loadSource("../src/app/provider/page.tsx", {
      "react/jsx-runtime": jsxRuntime, react: { Suspense },
      "../../components/landing/landing-footer": { LandingFooter: "LandingFooter" },
      "../../components/provider/status/provider-status": { ProviderStatus: "ProviderStatus" },
      "../../lib/offering-projection": createRequire(import.meta.url)("../src/lib/offering-projection.ts"),
      "../../lib/dashboard-campaign": createRequire(import.meta.url)("../src/lib/dashboard-campaign.ts"),
      "next/navigation": { notFound() { assert.fail("selected Provider route must exist"); } },
    });
    const routeTree = await page.default({ searchParams: Promise.resolve(Object.fromEntries(url.searchParams)) });
    const region = elements(routeTree).find((node) => typeof node.type === "function" && node.type.name === "ProviderStatusRegions");
    assert.ok(region);
    const status = await region.type(region.props);
    assert.equal(status.props.projections.offering.outcome, "loaded", JSON.stringify(state.events.filter((event) => event.name === "error")));
    assert.equal(status.props.projections.offering.record.offeringPublicId, tool.offeringPublicId);
    assert.equal(status.props.projections.offering.record.state, "OPEN");
    assert.equal(status.props.projections.directory.outcome, "loaded");
    assert.equal(status.props.projections.directory.record.serviceSlug, tool.serviceSlug);
    renderer.dispose();
    return links.map((node) => node.props.href);
  }

  async function verifyAndPublish(result) {
    const readsBefore = serverReads.length;
    assert.deepEqual(await state.verifyNext(), { outcome: "CONFIRMED" });
    assert.equal(serverReads.length - readsBefore, 3, "verification must independently read Mirror, transaction and receipt");
    const durable = await loadProviderToolDeployment(result.tool.toolPublicId);
    assert.equal(durable.state, "READY");
    assert.equal(state.rows.directoryVersions.filter((row) => row.offeringPublicId === result.tool.offeringPublicId).length, 0);
    result.mounted.dispose();
    result.mounted = mountSigning(result.tool.toolPublicId);
    const before = wireCommands.length;
    await signStage(result.mounted, 3);
    assert.equal(wireCommands.length, before + 1);
    assert.equal(wireCommands.at(-1).command.type, "directory.publish");
    assert.equal((await loadProviderToolDeployment(result.tool.toolPublicId)).state, "OPEN");
    await viewPublished(result.tool);
  }

  const legacyBefore = await readProviderProjections(environment, fetch, "riskscan_revenue_note_demo");
  assert.equal(legacyBefore.offering.outcome, "loaded");
  assert.equal(legacyBefore.directory.outcome, "loaded");
  const a = await allocateAndAttach(1);
  assert.equal(serverReads.length, 0, "the browser candidate must not be treated as final server evidence");
  const attachment = wireCommands.find(({ command }) => command.type === "external.attachCandidate");
  for (const injected of [{ receipt: a.transaction.receipt }, { rpcNodeBaseUrl: "https://browser-selected.invalid" }]) {
    const forged = {
      type: "external.attachCandidate", issuedAt: attachment.command.issuedAt, expiresAt: attachment.command.expiresAt,
      canonicalPayloadBytes: new TextEncoder().encode(canonicalizeRequirements({ ...attachment.payload, ...injected })),
    };
    assert.deepEqual(await signAndRelayCommand(provider, forged), { kind: "relayed", outcome: "REJECTED" }, "browser-supplied receipt or RPC selection must be rejected by signed dispatch");
    assert.equal(state.scheduled.length, 1, "untrusted fields must not schedule another verification");
    assert.equal(state.rows.providerToolReceiptBindings.length, 0);
  }
  const earlyPublish = buildStageSignatureRequest({
    stage: 3, states: [{ kind: "done" }, { kind: "done" }, { kind: "done" }], values,
    candidate: null, attemptPublicId: null, deploymentTarget: providerDeploymentTarget(a.tool.toolPublicId),
    record: completeDirectoryRecordLiteral(directoryRecordForProviderTool(a.tool.toolPublicId), { x402Endpoint: "https://service.example.test/api/riskscan", clearingAccount: "0.0.456" }),
    nowMilliseconds: now,
  });
  assert.deepEqual(await signAndRelayCommand(provider, earlyPublish), { kind: "relayed", outcome: "REJECTED" }, "even a signed browser-forced publication cannot bypass durable READY");
  assert.equal((await loadProviderToolDeployment(a.tool.toolPublicId)).state, "ASSET_PENDING");
  await verifyAndPublish(a);
  const aRows = structuredClone(Object.values(state.rows).flat().filter((row) => row.offeringPublicId === a.tool.offeringPublicId || row.subjectPublicId === a.tool.subjectPublicId));
  const b = await allocateAndAttach(2, false);
  const bAttemptBeforeRecovery = structuredClone(state.rows.externalPrepareCommandAttempts.find((row) => row.subjectPublicId === b.tool.subjectPublicId));
  const sendsBeforeWrongRecovery = walletCalls.filter((call) => call.method === "eth_sendTransaction").length;
  const attachmentsBeforeWrongRecovery = wireCommands.filter(
    ({ command }) => command.type === "external.attachCandidate",
  ).length;
  async function recoverCandidate(configuration, transaction) {
    return createStageBBrowserProviderBridge({ provider, configuration, async fetch(input) {
      const url = new URL(input);
      assert.equal(url.origin + "/api/v1/", mirror);
      if (url.pathname.endsWith("/transactions")) return json({ transactions: [{ name: "ETHEREUMTRANSACTION", result: "SUCCESS", nonce: 0, consensus_timestamp: transaction.timestamp, transaction_id: transaction.transactionId }] });
      assert.ok(url.pathname.endsWith(transaction.hash) || url.pathname.endsWith(transaction.transactionId));
      return json({ hash: transaction.hash, chain_id: "0x128", result: "SUCCESS", status: "0x1", from: issuer, to: factory, timestamp: transaction.timestamp, logs: [transaction.log], function_parameters: transaction.transaction.input });
    } }).recover(transaction.hash);
  }
  assert.deepEqual(
    await recoverCandidate(b.deployment.ats.configuration, a.transaction),
    { kind: "submission_unknown", transactionHash: a.transaction.hash },
    "B must reject A's valid Factory transaction before an attachment is recorded",
  );
  assert.equal(walletCalls.filter((call) => call.method === "eth_sendTransaction").length, sendsBeforeWrongRecovery, "read-only recovery must not send another transaction");
  assert.deepEqual(state.rows.externalPrepareCommandAttempts.find((row) => row.subjectPublicId === b.tool.subjectPublicId), bAttemptBeforeRecovery, "wrong-hash recovery must leave B's attempt unchanged");
  assert.equal(
    wireCommands.filter(({ command }) => command.type === "external.attachCandidate").length,
    attachmentsBeforeWrongRecovery,
    "wrong-hash recovery must not issue an attachment command",
  );
  assert.equal(state.scheduled.length, 0, "wrong-hash recovery must not schedule server verification");
  const ownRecoveredCandidate = await recoverCandidate(b.deployment.ats.configuration, b.transaction);
  assert.equal(ownRecoveredCandidate.kind, "candidate", "B can subsequently recover its own transaction");
  (await b.mounted.ready()).stages.props.onCandidate(ownRecoveredCandidate.candidate);
  await signStage(b.mounted, 2);
  receiptAlias = a.transaction;
  assert.deepEqual(await state.verifyNext(), { outcome: "REJECTED" }, "A's independent receipt must never validate B");
  assert.equal((await loadProviderToolDeployment(b.tool.toolPublicId)).state, "ASSET_PENDING");
  assert.equal(state.rows.providerToolReceiptBindings.length, 1);
  receiptAlias = null;
  await signStage(b.mounted, 2, "REPLAYED");
  await verifyAndPublish(b);
  assert.deepEqual(Object.values(state.rows).flat().filter((row) => row.offeringPublicId === a.tool.offeringPublicId || row.subjectPublicId === a.tool.subjectPublicId), aRows, "B must not overwrite any A record");
  for (const field of ["toolPublicId", "subjectPublicId", "offeringPublicId", "serviceId", "serviceSlug"]) assert.notEqual(a.tool[field], b.tool[field], field);
  assert.notEqual(a.deployment.ats.command.canonicalParametersHash, b.deployment.ats.command.canonicalParametersHash);
  assert.notEqual(a.transaction.transaction.input, b.transaction.transaction.input);
  assert.notEqual(a.transaction.asset, b.transaction.asset);
  assert.notEqual(state.rows.providerToolReceiptBindings[0].attemptId, state.rows.providerToolReceiptBindings[1].attemptId);
  assert.notEqual(state.rows.providerToolReceiptBindings[0].evmTransactionHash, state.rows.providerToolReceiptBindings[1].evmTransactionHash);
  for (const result of [a, b]) {
    const binding = state.rows.providerToolReceiptBindings.find((row) => row.offeringPublicId === result.tool.offeringPublicId);
    assert.equal(binding.assetEvmAddress, result.transaction.asset);
    assert.equal(binding.candidateTransactionId, result.transaction.transactionId);
    assert.equal(binding.evmTransactionHash, result.transaction.hash);
    assert.equal(state.rows.externalPrepareCommandAttempts.find((row) => row._id === binding.attemptId).subjectPublicId, result.tool.subjectPublicId);
  }
  assert.deepEqual((await viewPublished(b.tool)).sort(), [`/provider?tool=${a.tool.toolPublicId}`, `/provider?tool=${b.tool.toolPublicId}`].sort());

  const c = await allocateAndAttach(3);
  c.mounted.dispose();
  const sendsBeforeReload = walletCalls.filter((call) => call.method === "eth_sendTransaction").length;
  const readsBeforeReload = serverReads.length;
  c.mounted = mountSigning(c.tool.toolPublicId);
  let layout = await c.mounted.ready();
  assert.equal(layout.stages.props.enabledStage, 2);
  assert.deepEqual(layout.stages.props.candidate, { transactionId: c.transaction.transactionId, evmAddress: c.transaction.asset });
  assert.equal(serverReads.length, readsBeforeReload, "reload must not itself run receipt verification");
  serverEvidence = "unknown";
  assert.deepEqual(await state.verifyNext(), { outcome: "OUTCOME_UNKNOWN" });
  assert.equal((await loadProviderToolDeployment(c.tool.toolPublicId)).state, "ASSET_PENDING");
  assert.equal(state.scheduled.length, 0, "an unknown reader outcome must not schedule retries");
  assert.equal(state.rows.providerToolReceiptBindings.length, 2);
  const signaturesBefore = wireCommands.length;
  await signStage(c.mounted, 2, "REPLAYED");
  assert.equal(wireCommands.length, signaturesBefore + 1);
  assert.equal(wireCommands.at(-1).command.type, "external.attachCandidate");
  assert.deepEqual(await state.verifyNext(), { outcome: "OUTCOME_UNKNOWN" });
  layout = await c.mounted.ready();
  assert.equal(layout.stages.props.enabledStage, 2);
  assert.equal(layout.stages.props.states[3].kind, "blocked");
  assert.equal(walletCalls.filter((call) => call.method === "eth_sendTransaction").length, sendsBeforeReload);
  assert.equal(sendsBeforeReload, 3, "each tool must send exactly one transaction");
  assert.ok(wireCommands.filter(({ outcome }) => outcome === "ACCEPTED" || outcome === "REPLAYED").every(({ payload }) => !Object.hasOwn(payload, "rpcNodeBaseUrl") && !Object.hasOwn(payload, "receipt")));
  assert.deepEqual(wireCommands.filter(({ command, outcome }) => command.type === "directory.publish" && outcome === "ACCEPTED").map(({ payload }) => payload.offeringPublicId), [a.tool.offeringPublicId, b.tool.offeringPublicId]);
  for (const legacy of legacyRows) assert.deepEqual(Object.values(state.rows).flat().find((row) => row._id === legacy._id), legacy, `legacy record ${legacy._id} changed`);
  assert.deepEqual(await readProviderProjections(environment, fetch, "riskscan_revenue_note_demo"), legacyBefore);
  for (const result of [a, b, c]) result.mounted.dispose();
});
