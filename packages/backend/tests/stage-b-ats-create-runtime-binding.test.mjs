import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

import typescript from "typescript";
import { keccak256, stringToHex } from "viem";

const require = createRequire(import.meta.url);
const sourceUrl = new URL("../convex/stage_b_ats_create_runtime_binding.ts", import.meta.url);
const sourcePath = fileURLToPath(sourceUrl);
const sourceExists = existsSync(sourcePath);
const implementedTest = sourceExists ? test : test.skip;
const m42AuthorityUrl = new URL(
  "../src/ats/stage-b-issuer-ats-create-authority.ts",
  import.meta.url,
);

const realCanonicalParametersHash =
  "1880065c5ae64b3fc6279cfdd8c85a6880d43e98ce129ed697c72372204296f9";
const syntheticDisplayCanonicalParametersHash =
  "39a4d53db2aa60dd40b50c97738f53a888fdadcb350e1e85984fbd4dd76abc9a";
const realSigner = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
const payloadKeys = Object.freeze([
  "canonicalParametersHash",
  "chainId",
  "expectedTarget",
  "expiresAt",
  "idempotencyKey",
  "network",
  "operationKind",
  "subjectPublicId",
]);
let api;
let m42;

function payloadHash(payload) {
  return keccak256(stringToHex(JSON.stringify(
    Object.fromEntries(payloadKeys.map((key) => [key, payload[key]])),
  )));
}

function m32NormalizedAtsCreate({ context = {}, payload = {} } = {}) {
  const normalizedPayload = {
    operationKind: "ATS_CREATE",
    subjectPublicId: "riskscan_revenue_note_demo",
    network: "hedera:testnet",
    chainId: 296,
    expectedTarget: "0xd1f118a40f3b02883d35909ef2517e7edd78379d",
    canonicalParametersHash: realCanonicalParametersHash,
    idempotencyKey: "AAAAAAAAAAAAAAAAAAAAAA",
    expiresAt: "2026-09-10T18:05:00.000Z",
    ...payload,
  };
  return {
    version: 1,
    type: "external.prepare",
    chainId: 296,
    canonicalSignerAddress: realSigner,
    principalPublicId: "tool402_ats_issuer_testnet_v1",
    role: "ISSUER",
    authorityVersion: "ats_issuer_testnet_v1",
    payloadHash: payloadHash(normalizedPayload),
    payload: normalizedPayload,
    ...context,
  };
}

function authorityWithMismatchedOwner(authority) {
  const parameters = Object.freeze({
    ...authority.atsCreateConfiguration.parameters,
    diamondOwnerAccount: "0x1111111111111111111111111111111111111111",
  });
  return Object.freeze({
    ...authority,
    atsCreateConfiguration: Object.freeze({
      ...authority.atsCreateConfiguration,
      parameters,
    }),
    canonicalPreimage: Object.freeze({
      ...authority.canonicalPreimage,
      parameters,
    }),
  });
}

function bindingWithAuthority(authority) {
  const { outputText } = typescript.transpileModule(readFileSync(sourceUrl, "utf8"), {
    fileName: sourcePath,
    compilerOptions: {
      target: typescript.ScriptTarget.ES2022,
      module: typescript.ModuleKind.CommonJS,
    },
  });
  const module = { exports: {} };
  runInNewContext(outputText, {
    TypeError,
    exports: module.exports,
    module,
    require(specifier) {
      if (
        specifier === "../src/ats/stage-b-issuer-ats-create-authority"
        || specifier === "../src/ats/stage-b-issuer-ats-create-authority.ts"
      ) return { createStageBIssuerAtsCreateAuthority: () => authority };
      return require(specifier);
    },
  }, { filename: sourcePath });
  return module.exports;
}

test("requires the declared private M47 Stage-B runtime binding source module", () => {
  assert.equal(sourceExists, true, `missing declared source module: ${sourcePath}`);
});

test.before(async () => {
  if (!sourceExists) return;
  [api, m42] = await Promise.all([import(sourceUrl.href), import(m42AuthorityUrl.href)]);
});

implementedTest("exports one private assertion and accepts only the exact real M42/M32 tuple", () => {
  assert.deepEqual(Object.keys(api).sort(), ["assertStageBAtsCreateRuntimeBinding"]);
  const command = m32NormalizedAtsCreate();
  assert.match(command.payloadHash, /^0x[0-9a-f]{64}$/u);
  assert.doesNotThrow(() => api.assertStageBAtsCreateRuntimeBinding(command));
});

implementedTest("rejects every M32 signer, principal, role, and authority-version drift", () => {
  for (const [field, value] of [
    ["canonicalSignerAddress", "0x1111111111111111111111111111111111111111"],
    ["principalPublicId", "tool402_ats_issuer_testnet_v2"],
    ["role", "BACKER"],
    ["authorityVersion", "ats_issuer_testnet_v2"],
  ]) {
    assert.throws(
      () => api.assertStageBAtsCreateRuntimeBinding(
        m32NormalizedAtsCreate({ context: { [field]: value } }),
      ),
      TypeError,
      field,
    );
  }
});

implementedTest("rejects the S16 synthetic digest and every fixed Stage-B payload drift", () => {
  for (const [field, value] of [
    ["canonicalParametersHash", syntheticDisplayCanonicalParametersHash],
    ["network", "hedera:mainnet"],
    ["chainId", 295],
    ["subjectPublicId", "caller_selected_subject"],
    ["operationKind", "ATS_ISSUE"],
    ["expectedTarget", "0x1111111111111111111111111111111111111111"],
  ]) {
    assert.throws(
      () => api.assertStageBAtsCreateRuntimeBinding(
        m32NormalizedAtsCreate({ payload: { [field]: value } }),
      ),
      TypeError,
      field,
    );
  }
});

implementedTest("rejects a planned signer that no longer equals the real M42 diamond owner", () => {
  const isolated = bindingWithAuthority(
    authorityWithMismatchedOwner(m42.createStageBIssuerAtsCreateAuthority()),
  );
  assert.throws(
    () => isolated.assertStageBAtsCreateRuntimeBinding(m32NormalizedAtsCreate()),
    TypeError,
  );
});

implementedTest("keeps the binding private, deterministic, and free of I/O or live authority", () => {
  const source = readFileSync(sourceUrl, "utf8");
  assert.match(sourcePath.split("/").at(-1), /^[a-z0-9_]+\.ts$/u);
  assert.match(
    source,
    /from\s+["']\.\.\/src\/ats\/stage-b-issuer-ats-create-authority(?:\.ts)?["']/u,
  );
  assert.doesNotMatch(
    source,
    /\b(?:queryGeneric|mutationGeneric|actionGeneric|internalActionGeneric|httpActionGeneric|fetch|runAction|runMutation|runQuery|process\s*\.\s*env|import\.meta\.env|@hashgraph|wagmi|viem\/accounts|viem\/actions|createWalletClient|createPublicClient|_generated|convex\/nextjs|Date|performance|setTimeout|setInterval|WebSocket|XMLHttpRequest)\b/u,
  );
  assert.doesNotMatch(source, /(?:ats_prepare_authority|external_prepare_command_admission)/u);
});
