import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const sourceUrl = new URL("../convex/provider_tools.ts", import.meta.url);
const schemaUrl = new URL("../convex/schema.ts", import.meta.url);
const sourceExists = existsSync(fileURLToPath(sourceUrl));
const implementedTest = sourceExists ? test : test.skip;
const canonicalSignerAddress = "0xc89f87052c3e080b4a9b021d4930055031ef378e";
const requestId = "013d5c4d-21d9-4f02-a62b-47f49f3b17ad";

function authority(overrides = {}) {
  return {
    _id: "commandAuthorities:issuer",
    _creationTime: 1,
    principalPublicId: "tool402_ats_issuer_testnet_v1",
    canonicalSignerAddress,
    chainId: 296,
    role: "ISSUER",
    ownedSubjectPublicIds: ["riskscan_revenue_note_demo"],
    authorityVersion: "ats_issuer_testnet_v1",
    enabled: true,
    ...overrides,
  };
}

function database({ authorities = [], tools = [], offerings = [], serializeSameRequestReads = false } = {}) {
  const rows = {
    commandAuthorities: structuredClone(authorities),
    providerTools: structuredClone(tools),
    offerings: structuredClone(offerings),
  };
  const writes = [];
  let sameRequestReads = 0;
  let releaseConflictedRead;
  const firstWrite = new Promise((resolve) => { releaseConflictedRead = resolve; });
  const ctx = {
    db: {
      query(table) {
        assert.ok(Object.hasOwn(rows, table), `unexpected table ${table}`);
        return {
          withIndex(index, select) {
            const filters = [];
            const range = {
              eq(field, value) {
                filters.push([field, value]);
                return range;
              },
            };
            select(range);
            const matches = () => rows[table].filter((row) => filters.every(([field, value]) => row[field] === value));
            return {
              async take(limit) {
                if (serializeSameRequestReads && table === "providerTools" && index === "by_owner_and_chain_and_request" && ++sameRequestReads === 2) {
                  // Convex reruns a conflicting mutation after the first transaction commits.
                  await firstWrite;
                }
                return matches().slice(0, limit);
              },
              order() {
                return {
                  async paginate({ cursor, numItems }) {
                    const start = cursor === null ? 0 : Number.parseInt(cursor, 10);
                    assert.ok(Number.isSafeInteger(start) && start >= 0);
                    const rows = matches();
                    const page = rows.slice(start, start + numItems);
                    return {
                      page,
                      isDone: start + page.length >= rows.length,
                      continueCursor: String(start + page.length),
                    };
                  },
                };
              },
            };
          },
        };
      },
      async insert(table, document) {
        assert.equal(table, "providerTools");
        const row = { _id: `providerTools:${rows.providerTools.length}`, _creationTime: 1, ...structuredClone(document) };
        rows.providerTools.push(row);
        writes.push(row);
        releaseConflictedRead();
        return row._id;
      },
    },
  };
  return { ctx, rows, writes };
}

function tool(overrides = {}) {
  const suffix = overrides.suffix ?? "ab".repeat(16);
  return {
    _id: `providerTools:${suffix}`,
    _creationTime: 1,
    toolPublicId: `tool_${suffix}`,
    subjectPublicId: `tool_${suffix}`,
    offeringPublicId: `offering_${suffix}`,
    serviceId: `tool_${suffix}`,
    serviceSlug: `tool-${suffix}`,
    canonicalSignerAddress,
    chainId: 296,
    principalPublicId: "tool402_ats_issuer_testnet_v1",
    authorityVersion: "ats_issuer_testnet_v1",
    requestId,
    offeringVersion: 1,
    directoryVersion: 1,
    createdAt: 1n,
    ...overrides,
  };
}

function offeringFor(toolRecord, overrides = {}) {
  return {
    _id: `offerings:${toolRecord.toolPublicId}`,
    _creationTime: 1,
    offeringPublicId: toolRecord.offeringPublicId,
    subjectPublicId: toolRecord.subjectPublicId,
    canonicalSignerAddress: toolRecord.canonicalSignerAddress,
    principalPublicId: toolRecord.principalPublicId,
    authorityVersion: toolRecord.authorityVersion,
    version: 1,
    narrative: { title: "Deployed RiskScan" },
    state: "DRAFT",
    ...overrides,
  };
}

test("requires the declared provider-tool allocation module before GREEN", () => {
  assert.equal(
    sourceExists,
    true,
    `missing declared M55 Task 1 source module: ${fileURLToPath(sourceUrl)}`,
  );
});

implementedTest("exposes internal owner-scoped allocation and reads without a public writer", async () => {
  const providerTools = await import(sourceUrl.href);
  assert.deepEqual(Object.keys(providerTools).sort(), [
    "allocateForIssuer",
    "listOwnedTools",
    "readOwnedTool",
    "readOwnedToolDeployment",
  ]);
  assert.equal(providerTools.allocateForIssuer.isInternal, true);
  assert.equal(providerTools.allocateForIssuer.isMutation, true);
  assert.equal(providerTools.listOwnedTools.isInternal, true);
  assert.equal(providerTools.listOwnedTools.isQuery, true);
  assert.equal(providerTools.readOwnedTool.isInternal, true);
  assert.equal(providerTools.readOwnedTool.isQuery, true);
  assert.equal(providerTools.readOwnedToolDeployment.isInternal, true);
  assert.equal(providerTools.readOwnedToolDeployment.isQuery, true);
  for (const operation of Object.values(providerTools)) {
    assert.equal(operation.isPublic, undefined);
  }
});

implementedTest("reserves a providerTools schema table with owner and request replay indexes", async () => {
  const { default: schema } = await import(schemaUrl.href);
  const exported = JSON.parse(schema.export());
  const table = exported.tables.find(({ tableName }) => tableName === "providerTools");
  assert.notEqual(table, undefined);
  assert.deepEqual(
    table.indexes.map(({ indexDescriptor, fields }) => [indexDescriptor, fields]).sort(),
    [
      ["by_offering_public_id", ["offeringPublicId"]],
      ["by_owner_and_chain_and_created", ["canonicalSignerAddress", "chainId", "createdAt"]],
      ["by_owner_and_chain_and_request", ["canonicalSignerAddress", "chainId", "requestId"]],
      ["by_tool_public_id", ["toolPublicId"]],
    ],
  );
});

implementedTest("allocates once for one current issuer and replays the same owned tool", async () => {
  const { allocateForIssuer } = await import(sourceUrl.href);
  const db = database({ authorities: [authority()] });
  const first = await allocateForIssuer._handler(db.ctx, { canonicalSignerAddress, requestId });
  const replay = await allocateForIssuer._handler(db.ctx, { canonicalSignerAddress, requestId });

  assert.equal(first.outcome, "allocated");
  assert.equal(replay.outcome, "replayed");
  assert.deepEqual(replay.tool, first.tool);
  assert.equal(db.writes.length, 1);
  assert.match(first.tool.toolPublicId, /^tool_[0-9a-f]{32}$/u);
  assert.equal(first.tool.subjectPublicId, first.tool.toolPublicId);
  assert.equal(first.tool.offeringPublicId, `offering_${first.tool.toolPublicId.slice(5)}`);
  assert.equal(first.tool.serviceId, first.tool.toolPublicId);
  assert.equal(first.tool.serviceSlug, `tool-${first.tool.toolPublicId.slice(5)}`);
  assert.equal(first.tool.title, "RiskScan");
  assert.equal(db.writes[0].canonicalSignerAddress, canonicalSignerAddress);
  assert.equal(db.writes[0].chainId, 296);
  assert.equal(db.writes[0].offeringVersion, 1);
  assert.equal(db.writes[0].directoryVersion, 1);
  assert.equal(Object.hasOwn(db.writes[0], "state"), false);
});

implementedTest("rejects revoked, non-issuer, and ambiguous authorities without allocating", async () => {
  const { allocateForIssuer } = await import(sourceUrl.href);
  for (const authorities of [
    [authority({ enabled: false })],
    [authority({ role: "BACKER" })],
    [authority({ principalPublicId: "sandbox_issuer" })],
    [authority(), authority({ _id: "commandAuthorities:duplicate" })],
  ]) {
    const db = database({ authorities });
    assert.deepEqual(
      await allocateForIssuer._handler(db.ctx, { canonicalSignerAddress, requestId }),
      { outcome: "rejected" },
    );
    assert.equal(db.writes.length, 0);
  }
});

implementedTest("does not replay an allocation after its issuer authority is revoked", async () => {
  const { allocateForIssuer } = await import(sourceUrl.href);
  const currentAuthority = authority();
  const db = database({ authorities: [currentAuthority] });
  await allocateForIssuer._handler(db.ctx, { canonicalSignerAddress, requestId });
  db.rows.commandAuthorities[0].enabled = false;
  assert.deepEqual(
    await allocateForIssuer._handler(db.ctx, { canonicalSignerAddress, requestId }),
    { outcome: "rejected" },
  );
  assert.equal(db.writes.length, 1);
});

implementedTest("allocates distinct identities for distinct idempotency requests", async () => {
  const { allocateForIssuer } = await import(sourceUrl.href);
  const db = database({ authorities: [authority()] });
  const first = await allocateForIssuer._handler(db.ctx, { canonicalSignerAddress, requestId });
  const second = await allocateForIssuer._handler(db.ctx, {
    canonicalSignerAddress,
    requestId: "f3a098ca-a4b1-4a67-91a7-76137dce5dbd",
  });
  assert.equal(first.outcome, "allocated");
  assert.equal(second.outcome, "allocated");
  assert.notEqual(first.tool.toolPublicId, second.tool.toolPublicId);
  assert.equal(db.writes.length, 2);
});

implementedTest("concurrent identical requests converge on one allocated tool", async () => {
  const { allocateForIssuer } = await import(sourceUrl.href);
  const db = database({ authorities: [authority()], serializeSameRequestReads: true });
  const outcomes = await Promise.all([
    allocateForIssuer._handler(db.ctx, { canonicalSignerAddress, requestId }),
    allocateForIssuer._handler(db.ctx, { canonicalSignerAddress, requestId }),
  ]);
  assert.deepEqual(new Set(outcomes.map((outcome) => outcome.outcome)), new Set(["allocated", "replayed"]));
  assert.equal(outcomes[0].tool.toolPublicId, outcomes[1].tool.toolPublicId);
  assert.equal(db.writes.length, 1);
});

implementedTest("retries a generated public-id collision before inserting", async (t) => {
  const { allocateForIssuer } = await import(sourceUrl.href);
  const collision = tool({ requestId: "f3a098ca-a4b1-4a67-91a7-76137dce5dbd", suffix: "00".repeat(16) });
  const db = database({ authorities: [authority()], tools: [collision] });
  let entropy = 0;
  t.mock.method(globalThis.crypto, "getRandomValues", (bytes) => {
    bytes.fill(entropy++ === 0 ? 0 : 1);
    return bytes;
  });
  const outcome = await allocateForIssuer._handler(db.ctx, { canonicalSignerAddress, requestId });
  assert.equal(outcome.outcome, "allocated");
  assert.notEqual(outcome.tool.toolPublicId, collision.toolPublicId);
  assert.equal(db.writes.length, 1);
});

implementedTest("keeps every allocated tool owner-scoped while listing history after revocation", async () => {
  const { listOwnedTools, readOwnedTool } = await import(sourceUrl.href);
  const mine = tool();
  const foreign = tool({
    suffix: "cd".repeat(16),
    canonicalSignerAddress: "0x7e5f4552091a69125d5dfcb7b8c2659029395bdf",
    principalPublicId: "principal_77",
  });
  const db = database({ tools: [mine, foreign] });
  const page = await listOwnedTools._handler(db.ctx, { canonicalSignerAddress, cursor: null });
  assert.deepEqual(page, {
    tools: [{
      toolPublicId: mine.toolPublicId,
      subjectPublicId: mine.subjectPublicId,
      offeringPublicId: mine.offeringPublicId,
      serviceId: mine.serviceId,
      serviceSlug: mine.serviceSlug,
      title: "RiskScan",
      state: "ALLOCATED",
    }],
    nextCursor: null,
  });
  assert.deepEqual(
    await readOwnedTool._handler(db.ctx, {
      canonicalSignerAddress: foreign.canonicalSignerAddress,
      toolPublicId: mine.toolPublicId,
    }),
    null,
  );
  assert.deepEqual(
    await readOwnedTool._handler(db.ctx, { canonicalSignerAddress, toolPublicId: mine.toolPublicId }),
    page.tools[0],
  );
});

implementedTest("derives safe offering title and state instead of storing lifecycle on the tool", async () => {
  const { listOwnedTools, readOwnedTool } = await import(sourceUrl.href);
  const mine = tool();
  const db = database({ tools: [mine], offerings: [offeringFor(mine, { state: "OPEN", narrative: { title: "Same-name RiskScan" } })] });
  const page = await listOwnedTools._handler(db.ctx, { canonicalSignerAddress, cursor: null });
  assert.deepEqual(page, {
    tools: [{
      toolPublicId: mine.toolPublicId,
      subjectPublicId: mine.subjectPublicId,
      offeringPublicId: mine.offeringPublicId,
      serviceId: mine.serviceId,
      serviceSlug: mine.serviceSlug,
      title: "Same-name RiskScan",
      state: "OPEN",
    }],
    nextCursor: null,
  });
  assert.deepEqual(
    await readOwnedTool._handler(db.ctx, { canonicalSignerAddress, toolPublicId: mine.toolPublicId }),
    page.tools[0],
  );
});

implementedTest("fails closed when a matching offering diverges from its allocated ownership context", async () => {
  const { listOwnedTools, readOwnedTool } = await import(sourceUrl.href);
  const mine = tool();
  const foreignSigner = "0xbfb8ea59964b307a79d4f0b98201db95e6dfa454";
  const corruptedOfferingIdentity = tool({ offeringPublicId: `offering_${"cd".repeat(16)}` });
  const cases = [
    ["principal", mine, offeringFor(mine, { principalPublicId: "different_principal" })],
    ["authority version", mine, offeringFor(mine, { authorityVersion: "different_authority" })],
    ["signer", mine, offeringFor(mine, { canonicalSignerAddress: foreignSigner })],
    ["subject", mine, offeringFor(mine, { subjectPublicId: `tool_${"cd".repeat(16)}` })],
    ["offering version", mine, offeringFor(mine, { version: 2 })],
    ["offering identity", corruptedOfferingIdentity, offeringFor(corruptedOfferingIdentity)],
  ];
  for (const [label, allocatedTool, offering] of cases) {
    const db = database({ tools: [allocatedTool], offerings: [offering] });
    assert.deepEqual(
      await listOwnedTools._handler(db.ctx, { canonicalSignerAddress, cursor: null }),
      { tools: [], nextCursor: null },
      label,
    );
    assert.equal(
      await readOwnedTool._handler(db.ctx, { canonicalSignerAddress, toolPublicId: allocatedTool.toolPublicId }),
      null,
      label,
    );
  }
});

implementedTest("keeps an allocated tool allocated only while its matching offering is absent", async () => {
  const { listOwnedTools, readOwnedTool } = await import(sourceUrl.href);
  const mine = tool();
  const db = database({ tools: [mine] });
  const expected = {
    toolPublicId: mine.toolPublicId,
    subjectPublicId: mine.subjectPublicId,
    offeringPublicId: mine.offeringPublicId,
    serviceId: mine.serviceId,
    serviceSlug: mine.serviceSlug,
    title: "RiskScan",
    state: "ALLOCATED",
  };
  assert.deepEqual(await listOwnedTools._handler(db.ctx, { canonicalSignerAddress, cursor: null }), {
    tools: [expected], nextCursor: null,
  });
  assert.deepEqual(
    await readOwnedTool._handler(db.ctx, { canonicalSignerAddress, toolPublicId: mine.toolPublicId }),
    expected,
  );
});

implementedTest("uses the indexed opaque cursor to page every owner-scoped tool", async () => {
  const { listOwnedTools } = await import(sourceUrl.href);
  const tools = Array.from({ length: 21 }, (_, index) => tool({
    suffix: index.toString(16).padStart(32, "0"),
    requestId: `${index.toString(16).padStart(8, "0")}-21d9-4f02-a62b-47f49f3b17ad`,
  }));
  const db = database({ tools });
  const first = await listOwnedTools._handler(db.ctx, { canonicalSignerAddress, cursor: null });
  assert.equal(first.tools.length, 20);
  assert.equal(first.nextCursor, "20");
  const second = await listOwnedTools._handler(db.ctx, { canonicalSignerAddress, cursor: first.nextCursor });
  assert.deepEqual(second, {
    tools: [{
      toolPublicId: tools[20].toolPublicId,
      subjectPublicId: tools[20].subjectPublicId,
      offeringPublicId: tools[20].offeringPublicId,
      serviceId: tools[20].serviceId,
      serviceSlug: tools[20].serviceSlug,
      title: "RiskScan",
      state: "ALLOCATED",
    }],
    nextCursor: null,
  });
});

implementedTest("returns ATS configuration only from the exact durable selected-tool offering", async () => {
  const { readOwnedToolDeployment } = await import(sourceUrl.href);
  const mine = tool();
  const allocated = await readOwnedToolDeployment._handler(
    database({ tools: [mine] }).ctx,
    { canonicalSignerAddress, toolPublicId: mine.toolPublicId },
  );
  assert.deepEqual(allocated, {
    tool: {
      toolPublicId: mine.toolPublicId,
      subjectPublicId: mine.subjectPublicId,
      offeringPublicId: mine.offeringPublicId,
      serviceId: mine.serviceId,
      serviceSlug: mine.serviceSlug,
      title: "RiskScan",
      state: "ALLOCATED",
    },
    atsCreateConfigurationJson: null,
  });

  const admitted = offeringFor(mine, { narrative: { title: "Second RiskScan" } });
  const deployment = await readOwnedToolDeployment._handler(
    database({ tools: [mine], offerings: [admitted] }).ctx,
    { canonicalSignerAddress, toolPublicId: mine.toolPublicId },
  );
  assert.equal(deployment.tool.state, "DRAFT");
  const configuration = JSON.parse(deployment.atsCreateConfigurationJson);
  assert.equal(configuration.subjectPublicId, mine.toolPublicId);
  assert.equal(configuration.parameters.name, "Second RiskScan");

  const mismatched = offeringFor(mine, { principalPublicId: "different_principal" });
  assert.equal(
    await readOwnedToolDeployment._handler(
      database({ tools: [mine], offerings: [mismatched] }).ctx,
      { canonicalSignerAddress, toolPublicId: mine.toolPublicId },
    ),
    null,
  );
});
