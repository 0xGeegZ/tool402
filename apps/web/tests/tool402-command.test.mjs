import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { hashTypedData, keccak256, recoverTypedDataAddress, toHex } from "viem";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { privateKeyToAccount } from "viem/accounts";

const sourceUrl = new URL("../src/lib/wallet/tool402-command.ts", import.meta.url);
const sourcePath = fileURLToPath(sourceUrl);
const sourceExists = existsSync(sourcePath);
const implementedTest = sourceExists ? test : test.skip;
let api;

const signer = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
const issuedAt = "2026-09-09T00:00:00.000Z";
const payloadExpiresAt = "2026-09-09T00:05:00.000Z";
const payloadBytes = new TextEncoder().encode(
  '{"expiresAt":"2026-09-09T00:05:00.000Z","operationKind":"ATS_CREATE"}',
);
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

implementedTest("binds buildTool402CommandRequest to the expiry encoded in payload bytes", () => {
  const mismatchedPayloadBytes = new TextEncoder().encode(
    '{"expiresAt":"2026-09-09T00:04:59.999Z","operationKind":"ATS_CREATE"}',
  );

  assert.throws(
    () =>
      api.buildTool402CommandRequest({
        signer,
        payloadBytes: mismatchedPayloadBytes,
        issuedAt,
        payloadExpiresAt,
        nonceBytes,
      }),
    TypeError,
  );
});

// Lane contracts (work/s15), block-scoped beside the root's contracts above.
{
const appRoot = fileURLToPath(new URL("..", import.meta.url));

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

function loadCommandModule() {
  return import("../src/lib/wallet/tool402-command.ts");
}

// A public fixed vector, not a runtime credential.
const testAccount = privateKeyToAccount(
  "0x0000000000000000000000000000000000000000000000000000000000000001",
);
const signer = testAccount.address.toLowerCase();
const issuedAt = "2026-09-07T19:00:00.000Z";
const expiresAt = "2026-09-07T19:04:00.000Z";
const nonce = "AbCdEfGhIjKlMnOpQrStUw";
const canonicalPayloadText =
  '{"canonicalParametersHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","chainId":296,"expectedTarget":"0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","expiresAt":"2026-09-07T19:04:00.000Z","idempotencyKey":"AAAAAAAAAAAAAAAAAAAAAA","network":"hedera:testnet","operationKind":"ATS_CREATE","subjectPublicId":"subject_42"}';
const canonicalPayloadBytes = new TextEncoder().encode(canonicalPayloadText);
const expectedTypes = {
  EIP712Domain: [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "chainId", type: "uint256" },
  ],
  Tool402Command: [
    { name: "version", type: "uint8" },
    { name: "type", type: "string" },
    { name: "signer", type: "address" },
    { name: "nonce", type: "string" },
    { name: "issuedAt", type: "string" },
    { name: "expiresAt", type: "string" },
    { name: "payloadHash", type: "bytes32" },
  ],
};

function unsignedInput(overrides = {}) {
  return {
    type: "external.prepare",
    signer,
    nonce,
    issuedAt,
    expiresAt,
    canonicalPayloadBytes,
    ...overrides,
  };
}

function createSigningProvider(options = {}) {
  const calls = [];
  return {
    calls,
    async request({ method, params }) {
      calls.push({ method, params });
      if (method !== "eth_signTypedData_v4") {
        throw new Error(`unexpected method ${method}`);
      }
      if (options.signature !== undefined) {
        return options.signature;
      }
      const typedData = JSON.parse(params[1]);
      const { EIP712Domain, ...types } = typedData.types;
      assert.deepEqual(EIP712Domain, expectedTypes.EIP712Domain);
      return testAccount.signTypedData({
        domain: typedData.domain,
        types,
        primaryType: typedData.primaryType,
        message: typedData.message,
      });
    },
  };
}

test("fixes the EIP-712 domain, primary type, and the seven message fields in order", async () => {
  const {
    TOOL402_COMMAND_PRIMARY_TYPE,
    TOOL402_TYPED_DATA_DOMAIN,
    TOOL402_TYPED_DATA_TYPES,
    MAX_COMMAND_LIFETIME_SECONDS,
  } = await loadCommandModule();

  assert.deepEqual(TOOL402_TYPED_DATA_DOMAIN, {
    name: "Tool402",
    version: "1",
    chainId: 296,
  });
  assert.equal(TOOL402_COMMAND_PRIMARY_TYPE, "Tool402Command");
  assert.deepEqual(TOOL402_TYPED_DATA_TYPES, expectedTypes);
  assert.equal(MAX_COMMAND_LIFETIME_SECONDS, 300);
  assert.equal(Object.isFrozen(TOOL402_TYPED_DATA_DOMAIN), true);
  assert.equal(Object.isFrozen(TOOL402_TYPED_DATA_TYPES), true);
  assert.equal(Object.isFrozen(TOOL402_TYPED_DATA_TYPES.Tool402Command), true);
});

test("renders a nonce as 22 canonical unpadded base64url characters from 16 bytes", async () => {
  const { createCommandNonce } = await loadCommandModule();

  assert.equal(
    createCommandNonce(() => new Uint8Array(16)),
    "AAAAAAAAAAAAAAAAAAAAAA",
  );
  const allOnes = new Uint8Array(16).fill(0xff);
  assert.equal(
    createCommandNonce(() => allOnes),
    Buffer.from(allOnes).toString("base64url"),
  );
  const sequence = Uint8Array.from({ length: 16 }, (_, index) => index * 17);
  assert.equal(
    createCommandNonce(() => sequence),
    Buffer.from(sequence).toString("base64url"),
  );

  const first = createCommandNonce();
  const second = createCommandNonce();
  assert.match(first, /^[A-Za-z0-9_-]{21}[AQgw]$/u);
  assert.match(second, /^[A-Za-z0-9_-]{21}[AQgw]$/u);
  assert.notEqual(first, second);

  assert.throws(() => createCommandNonce(() => new Uint8Array(15)));
  assert.throws(() => createCommandNonce(() => new Uint8Array(17)));
});

test("formats canonical millisecond timestamps and bounds the lifetime at 300 seconds", async () => {
  const { createCommandTimestamps, formatCommandTimestamp } =
    await loadCommandModule();
  const now = Date.UTC(2026, 8, 7, 19, 0, 0, 0);

  assert.equal(formatCommandTimestamp(now), issuedAt);
  assert.deepEqual(createCommandTimestamps(now), {
    issuedAt,
    expiresAt: "2026-09-07T19:05:00.000Z",
  });
  assert.deepEqual(createCommandTimestamps(now, 240), { issuedAt, expiresAt });
  assert.equal(Object.isFrozen(createCommandTimestamps(now)), true);

  assert.throws(() => createCommandTimestamps(now, 301));
  assert.throws(() => createCommandTimestamps(now, 0));
  assert.throws(() => createCommandTimestamps(now, 1.5));
  assert.throws(() => createCommandTimestamps(now + 0.5));
  assert.throws(() => createCommandTimestamps(Number.NaN));
  assert.throws(() => formatCommandTimestamp(-1));
});

test("hashes caller-supplied canonical payload bytes with lower-case Keccak-256", async () => {
  const { hashCommandPayload } = await loadCommandModule();

  const digest = hashCommandPayload(canonicalPayloadBytes);
  assert.equal(digest, keccak256(canonicalPayloadBytes));
  assert.match(digest, /^0x[0-9a-f]{64}$/u);
  assert.throws(() => hashCommandPayload("not bytes"));
});

test("builds a frozen unsigned command that binds the payload expiry byte for byte", async () => {
  const { createUnsignedCommand } = await loadCommandModule();

  const command = createUnsignedCommand(unsignedInput());
  assert.deepEqual(Object.keys(command), [
    "version",
    "type",
    "signer",
    "nonce",
    "issuedAt",
    "expiresAt",
    "payloadHash",
  ]);
  assert.equal(command.version, 1);
  assert.equal(command.type, "external.prepare");
  assert.equal(command.signer, signer);
  assert.equal(command.nonce, nonce);
  assert.equal(command.issuedAt, issuedAt);
  assert.equal(command.expiresAt, expiresAt);
  assert.equal(command.payloadHash, keccak256(canonicalPayloadBytes));
  assert.equal(Object.isFrozen(command), true);

  const differentExpiry = new TextEncoder().encode(
    canonicalPayloadText.replace(
      "2026-09-07T19:04:00.000Z",
      "2026-09-07T19:04:00.001Z",
    ),
  );
  assert.throws(() =>
    createUnsignedCommand(
      unsignedInput({ canonicalPayloadBytes: differentExpiry }),
    ),
  );
  assert.throws(() =>
    createUnsignedCommand(
      unsignedInput({ expiresAt: "2026-09-07T19:05:00.001Z" }),
    ),
  );
  assert.throws(() =>
    createUnsignedCommand(unsignedInput({ expiresAt: issuedAt })),
  );
  assert.throws(() =>
    createUnsignedCommand(unsignedInput({ issuedAt: "2026-09-07T19:00:00Z" })),
  );
  assert.throws(() =>
    createUnsignedCommand(
      unsignedInput({ issuedAt: "2026-09-07T19:00:00.000+00:00" }),
    ),
  );
  assert.throws(() =>
    createUnsignedCommand(unsignedInput({ signer: testAccount.address })),
  );
  assert.throws(() =>
    createUnsignedCommand(unsignedInput({ signer: `${signer}0` })),
  );
  assert.throws(() =>
    createUnsignedCommand(unsignedInput({ nonce: "AbCdEfGhIjKlMnOpQrStUx" })),
  );
  assert.throws(() =>
    createUnsignedCommand(unsignedInput({ nonce: "AbCdEfGhIjKlMnOpQrStU" })),
  );
  assert.throws(() => createUnsignedCommand(unsignedInput({ type: "" })));
  assert.throws(() => createUnsignedCommand(unsignedInput({ type: 42 })));
  assert.throws(() =>
    createUnsignedCommand(unsignedInput({ type: "external.attachCandidate" })),
  );
  assert.throws(() =>
    createUnsignedCommand(
      unsignedInput({ canonicalPayloadBytes: new TextEncoder().encode("[]") }),
    ),
  );
  assert.throws(() =>
    createUnsignedCommand(
      unsignedInput({ canonicalPayloadBytes: new TextEncoder().encode("{}") }),
    ),
  );
  assert.throws(() =>
    createUnsignedCommand(
      unsignedInput({ canonicalPayloadBytes: Uint8Array.from([0xff, 0xfe]) }),
    ),
  );
});

test("emits typed data whose digest equals the accepted server construction", async () => {
  const { createTypedDataJson, createUnsignedCommand } =
    await loadCommandModule();
  const command = createUnsignedCommand(unsignedInput());

  const json = createTypedDataJson(command);
  const typedData = JSON.parse(json);
  assert.deepEqual(Object.keys(typedData), [
    "types",
    "primaryType",
    "domain",
    "message",
  ]);
  assert.deepEqual(typedData.types, expectedTypes);
  assert.equal(typedData.primaryType, "Tool402Command");
  assert.deepEqual(typedData.domain, {
    name: "Tool402",
    version: "1",
    chainId: 296,
  });
  assert.deepEqual(Object.keys(typedData.message), Object.keys(command));
  assert.deepEqual(typedData.message, { ...command });

  const serverDigest = hashTypedData({
    domain: { name: "Tool402", version: "1", chainId: 296 },
    types: { Tool402Command: expectedTypes.Tool402Command },
    primaryType: "Tool402Command",
    message: { ...command },
  });
  assert.equal(hashTypedData(typedData), serverDigest);
});

test("signs through eth_signTypedData_v4 only and submits the nine-field command unaltered", async () => {
  const { createUnsignedCommand, signCommand } = await loadCommandModule();
  const command = createUnsignedCommand(unsignedInput());
  const provider = createSigningProvider();

  const signed = await signCommand(provider, command);
  assert.deepEqual(
    provider.calls.map((call) => call.method),
    ["eth_signTypedData_v4"],
  );
  assert.equal(provider.calls[0].params[0], signer);
  assert.equal(typeof provider.calls[0].params[1], "string");
  assert.deepEqual(Object.keys(signed), [
    "version",
    "type",
    "chainId",
    "signer",
    "nonce",
    "issuedAt",
    "expiresAt",
    "payloadHash",
    "signature",
  ]);
  assert.equal(signed.chainId, 296);
  assert.match(signed.signature, /^0x[0-9a-f]{130}$/u);
  assert.equal(Object.isFrozen(signed), true);

  const recovered = await recoverTypedDataAddress({
    domain: { name: "Tool402", version: "1", chainId: 296 },
    types: { Tool402Command: expectedTypes.Tool402Command },
    primaryType: "Tool402Command",
    message: { ...command },
    signature: signed.signature,
  });
  assert.equal(recovered.toLowerCase(), signer);

  const upperCase = createSigningProvider({
    signature: `0x${"A".repeat(130)}`,
  });
  await assert.rejects(signCommand(upperCase, command));
  const shortSignature = createSigningProvider({
    signature: `0x${"a".repeat(128)}`,
  });
  await assert.rejects(signCommand(shortSignature, command));
  const nonString = createSigningProvider({ signature: 42 });
  await assert.rejects(signCommand(nonString, command));

  const highS =
    "0x" +
    "01".padStart(64, "0") +
    "fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141" +
    "1b";
  await assert.rejects(
    signCommand(createSigningProvider({ signature: highS }), command),
  );

  const invalidRecovery = `${signed.signature.slice(0, -2)}02`;
  await assert.rejects(
    signCommand(createSigningProvider({ signature: invalidRecovery }), command),
  );

  for (const recovery of ["00", "01", "1b", "1c"]) {
    const wireSignature = `${signed.signature.slice(0, -2)}${recovery}`;
    const accepted = await signCommand(
      createSigningProvider({ signature: wireSignature }),
      command,
    );
    assert.equal(accepted.signature, wireSignature);
  }
});

test("creates the two-key transport body with the canonical payload text embedded verbatim", async () => {
  const { createCommandBody, createUnsignedCommand, signCommand } =
    await loadCommandModule();
  const command = createUnsignedCommand(unsignedInput());
  const signed = await signCommand(createSigningProvider(), command);

  const body = createCommandBody(signed, canonicalPayloadBytes);
  assert.equal(
    body,
    `{"command":${JSON.stringify(signed)},"payload":${canonicalPayloadText}}`,
  );
  const parsed = JSON.parse(body);
  assert.deepEqual(Object.keys(parsed), ["command", "payload"]);
  assert.deepEqual(parsed.command, { ...signed });
  assert.deepEqual(parsed.payload, JSON.parse(canonicalPayloadText));

  const differentExpiry = new TextEncoder().encode(
    canonicalPayloadText.replace(
      "2026-09-07T19:04:00.000Z",
      "2026-09-07T19:04:00.001Z",
    ),
  );
  assert.throws(() => createCommandBody(signed, differentExpiry));
  assert.throws(() =>
    createCommandBody(signed, new TextEncoder().encode("[]")),
  );
  assert.throws(() => createCommandBody(signed, Uint8Array.from([0xff])));
  assert.throws(() => createCommandBody({ ...signed }, canonicalPayloadBytes));
});

test("holds no provider, storage, network, or logging reference and signs with one method only", async () => {
  const source = await readAppFile("src/lib/wallet/tool402-command.ts");

  assert.doesNotMatch(
    source,
    /\b(?:window|document|localStorage|sessionStorage|fetch|console)\b/u,
  );
  assert.doesNotMatch(source, /\bfrom\s+["']node:/u);
  assert.deepEqual(
    [...source.matchAll(/["']eth_[A-Za-z0-9_]+["']/gu)].map(([match]) => match),
    ['"eth_signTypedData_v4"'],
  );
  assert.doesNotMatch(source, /toLowerCase\(\)/u);
});
}
