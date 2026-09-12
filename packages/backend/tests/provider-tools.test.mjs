import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const sourceUrl = new URL("../convex/provider_tools.ts", import.meta.url);
const schemaUrl = new URL("../convex/schema.ts", import.meta.url);
const sourceExists = existsSync(fileURLToPath(sourceUrl));
const implementedTest = sourceExists ? test : test.skip;
const canonicalSignerAddress = "0xbfb8ea59964b307a79d4f0b98201db95e6dfa454";
const requestId = "013d5c4d-21d9-4f02-a62b-47f49f3b17ad";

function authority(overrides = {}) {
  return {
    _id: "commandAuthorities:issuer",
    _creationTime: 1,
    principalPublicId: "principal_42",
    canonicalSignerAddress,
    chainId: 296,
    role: "ISSUER",
    ownedSubjectPublicIds: ["riskscan"],
    authorityVersion: "authority-v1",
    enabled: true,
    ...overrides,
  };
}

function database({ authorities = [], tools = [], serializeSameRequestReads = false } = {}) {
  const rows = {
    commandAuthorities: structuredClone(authorities),
    providerTools: structuredClone(tools),
  };
  const writes = [];
  let sameRequestReads = 0;
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
                if (serializeSameRequestReads && table === "providerTools" && index === "by_owner_and_request" && ++sameRequestReads === 2) {
                  await Promise.resolve();
                }
                return matches().slice(0, limit);
              },
              order() { return { async take(limit) { return matches().slice(0, limit); } }; },
            };
          },
        };
      },
      async insert(table, document) {
        assert.equal(table, "providerTools");
        const row = { _id: `providerTools:${rows.providerTools.length}`, _creationTime: 1, ...structuredClone(document) };
        rows.providerTools.push(row);
        writes.push(row);
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
    principalPublicId: "principal_42",
    authorityVersion: "authority-v1",
    requestId,
    state: "ALLOCATED",
    createdAt: 1n,
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
  ]);
  assert.equal(providerTools.allocateForIssuer.isInternal, true);
  assert.equal(providerTools.allocateForIssuer.isMutation, true);
  assert.equal(providerTools.listOwnedTools.isInternal, true);
  assert.equal(providerTools.listOwnedTools.isQuery, true);
  assert.equal(providerTools.readOwnedTool.isInternal, true);
  assert.equal(providerTools.readOwnedTool.isQuery, true);
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
      ["by_owner_and_created", ["canonicalSignerAddress", "createdAt"]],
      ["by_owner_and_request", ["canonicalSignerAddress", "requestId"]],
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
  assert.equal(db.writes[0].canonicalSignerAddress, canonicalSignerAddress);
  assert.equal(db.writes[0].state, "ALLOCATED");
});

implementedTest("rejects revoked, non-issuer, and ambiguous authorities without allocating", async () => {
  const { allocateForIssuer } = await import(sourceUrl.href);
  for (const authorities of [
    [authority({ enabled: false })],
    [authority({ role: "BACKER" })],
    [authority(), authority({ _id: "commandAuthorities:duplicate", principalPublicId: "principal_43" })],
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
