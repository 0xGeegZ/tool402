import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { keccak256, toHex } from "viem";

const sourceUrl = new URL("../src/lib/wallet/tool402-command.ts", import.meta.url);
const sourcePath = fileURLToPath(sourceUrl);
const sourceExists = existsSync(sourcePath);
const implementedTest = sourceExists ? test : test.skip;
let api;

const signer = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
const issuedAt = "2026-09-09T00:00:00.000Z";
const payloadExpiresAt = "2026-09-09T00:05:00.000Z";
const payloadBytes = new TextEncoder().encode('{"operationKind":"ATS_CREATE"}');
const nonceBytes = Uint8Array.from({ length: 16 }, (_, index) => index);

test("requires the declared Tool402 command source module", () => {
  assert.equal(sourceExists, true, `missing declared source module: ${sourcePath}`);
});

test.before(async () => {
  if (sourceExists) {
    api = await import(sourceUrl.href);
  }
});

implementedTest("builds the fixed Tool402 EIP-712 request from caller-supplied canonical bytes", () => {
  const request = api.buildTool402CommandRequest({
    signer,
    payloadBytes,
    issuedAt,
    payloadExpiresAt,
    nonceBytes,
  });

  assert.deepEqual(request.typedData.domain, {
    name: "Tool402",
    version: "1",
    chainId: 296,
  });
  assert.equal(request.typedData.primaryType, "Tool402Command");
  assert.deepEqual(request.typedData.types, {
    Tool402Command: [
      { name: "version", type: "uint8" },
      { name: "type", type: "string" },
      { name: "signer", type: "address" },
      { name: "nonce", type: "string" },
      { name: "issuedAt", type: "string" },
      { name: "expiresAt", type: "string" },
      { name: "payloadHash", type: "bytes32" },
    ],
  });
  assert.deepEqual(request.command, {
    version: 1,
    type: "external.prepare",
    chainId: 296,
    signer,
    nonce: "AAECAwQFBgcICQoLDA0ODw",
    issuedAt,
    expiresAt: payloadExpiresAt,
    payloadHash: keccak256(toHex(payloadBytes)),
  });
  assert.deepEqual(request.typedData.message, {
    version: 1,
    type: "external.prepare",
    signer,
    nonce: "AAECAwQFBgcICQoLDA0ODw",
    issuedAt,
    expiresAt: payloadExpiresAt,
    payloadHash: keccak256(toHex(payloadBytes)),
  });
});

implementedTest("rejects noncanonical signing inputs before any signature request", () => {
  for (const input of [
    { signer: signer.toUpperCase() },
    { issuedAt: "2026-09-09T00:00:00Z" },
    { payloadExpiresAt: "2026-09-09T00:05:00Z" },
    { payloadExpiresAt: "2026-09-09T00:05:00.001Z" },
    { nonceBytes: Uint8Array.from({ length: 15 }) },
  ]) {
    assert.throws(() => api.buildTool402CommandRequest({
      signer,
      payloadBytes,
      issuedAt,
      payloadExpiresAt,
      nonceBytes,
      ...input,
    }), TypeError);
  }
});
