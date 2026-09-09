import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const httpUrl = new URL("../convex/http.ts", import.meta.url);
const dispatchUrl = new URL("../convex/command_dispatch.ts", import.meta.url);
const replayUrl = new URL("../convex/wallet_command_replay.ts", import.meta.url);
const schemaUrl = new URL("../convex/schema.ts", import.meta.url);
const sourcePaths = [httpUrl, dispatchUrl, replayUrl].map(fileURLToPath);
const sourcesExist = sourcePaths.every((path) => existsSync(path));
const implementedTest = sourcesExist ? test : test.skip;

const string = { type: "string" };
const bigint = { type: "bigint" };
const literal = (value) => ({ type: "literal", value });
const array = (value) => ({ type: "array", value });
const union = (...values) => ({ type: "union", value: values.map(literal) });
const object = (fields) => ({
  type: "object",
  value: Object.fromEntries(
    Object.entries(fields).map(([key, fieldType]) => [key, { fieldType, optional: false }]),
  ),
});

function tableContract(table) {
  return {
    documentType: table.documentType,
    indexes: table.indexes.map(({ indexDescriptor, fields }) => [indexDescriptor, fields]),
    searchIndexes: table.searchIndexes,
    vectorIndexes: table.vectorIndexes,
  };
}

function walletCommandReplayDatabase({ ingressClaims = [], authorities = [] } = {}) {
  const rows = {
    ingressCommandReplayClaims: structuredClone(ingressClaims),
    commandAuthorities: structuredClone(authorities),
  };
  const reads = [];
  const writes = [];
  const forbidden = () => {
    throw new Error("unexpected database or external operation");
  };
  return {
    reads,
    writes,
    rows,
    ctx: {
      db: {
        query(table) {
          assert.ok(Object.hasOwn(rows, table), `unexpected table: ${table}`);
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
              return {
                async take(limit) {
                  assert.equal(limit, 2, `${table} must use a bounded two-row lookup`);
                  reads.push({ table, index, filters: [...filters], limit });
                  return rows[table].slice(0, limit);
                },
              };
            },
          };
        },
        async insert(table, document) {
          assert.equal(table, "ingressCommandReplayClaims");
          const id = `ingressCommandReplayClaims:${rows.ingressCommandReplayClaims.length}`;
          const copy = structuredClone(document);
          rows.ingressCommandReplayClaims.push({
            _id: id,
            _creationTime: 1,
            ...copy,
          });
          writes.push({ table, id, document: copy });
          return id;
        },
        get: forbidden,
        patch: forbidden,
        replace: forbidden,
        delete: forbidden,
      },
      runAction: forbidden,
      runMutation: forbidden,
      runQuery: forbidden,
      scheduler: { runAfter: forbidden, runAt: forbidden },
    },
  };
}

function commandAuthorityDocument(overrides = {}) {
  return {
    _id: "commandAuthorities:private",
    _creationTime: 1,
    principalPublicId: "principal_42",
    canonicalSignerAddress: "0xbfb8ea59964b307a79d4f0b98201db95e6dfa454",
    chainId: 296,
    role: "ISSUER",
    ownedSubjectPublicIds: ["subject_42"],
    authorityVersion: "authority-v1",
    enabled: true,
    privateNote: "must never be projected",
    ...overrides,
  };
}

test("requires the declared M41 HTTP source modules before route behavior can be exercised", () => {
  for (const path of sourcePaths) {
    assert.equal(existsSync(path), true, `missing declared M41 source module: ${path}`);
  }
});

test("reserves exactly the M41 transport-replay table and bounded lookup index", async () => {
  const { default: schema } = await import(schemaUrl);
  const exported = JSON.parse(schema.export());
  const contracts = Object.fromEntries(
    exported.tables
      .filter(({ tableName }) => tableName === "ingressCommandReplayClaims")
      .map((table) => [table.tableName, tableContract(table)]),
  );
  assert.deepEqual(contracts, {
    ingressCommandReplayClaims: {
      documentType: object({ replayIdentity: string, claimedAt: bigint }),
      indexes: [["by_replay_identity", ["replayIdentity"]]],
      searchIndexes: [],
      vectorIndexes: [],
    },
  });
});

implementedTest("registers exactly the protected command route and the two public read prefixes", async () => {
  const http = await import(httpUrl);
  assert.deepEqual(Object.keys(http), ["default"]);
  const routes = http.default.getRoutes().map(([path, method]) => [path, method]);
  assert.deepEqual(routes, [
    ["/internal/commands", "POST"],
    ["/public/directory/*", "GET"],
    ["/public/offerings/*", "GET"],
  ]);
  for (const [path, method] of routes) {
    assert.notEqual(method, "OPTIONS");
    assert.notEqual(path, "*");
  }
  assert.equal(http.default.lookup("/internal/commands", "GET"), null);
  assert.equal(http.default.lookup("/public/offerings", "GET"), null);
  assert.equal(http.default.lookup("/public/directory", "GET"), null);
});

implementedTest("wires the live protected command route to production ingress handling rather than the direct-test seam", async () => {
  const [http, dispatch] = await Promise.all([import(httpUrl), import(dispatchUrl)]);
  const match = http.default.lookup("/internal/commands", "POST");
  assert.notEqual(match, null);
  const [handler, method, path] = match;
  assert.equal(method, "POST");
  assert.equal(path, "/internal/commands");
  assert.equal(handler.isHttp, true);
  assert.equal(handler._handler, dispatch.handleCommandIngress);
  assert.notEqual(handler._handler, dispatch.handleCommandIngressForTest);
});

implementedTest("keeps HTTP routing free of environment access, direct-test seams, and CORS policy", async () => {
  const source = readFileSync(httpUrl, "utf8");
  assert.doesNotMatch(source, /process\s*\.\s*env|import\.meta\.env/u);
  assert.doesNotMatch(source, /handleCommandIngressForTest/u);
  assert.doesNotMatch(source, /access-control-allow-/iu);
  assert.doesNotMatch(source, /(?:fetch|runAction|runMutation|runQuery|@hashgraph|wagmi|createWalletClient|createPublicClient)/u);
});

implementedTest("registers the exact internal transport-replay and authority-read interfaces", async () => {
  const replay = await import(replayUrl);
  assert.deepEqual(Object.keys(replay).sort(), [
    "claimIngressReplayIdentity",
    "readCommandAuthorities",
  ]);

  const claim = replay.claimIngressReplayIdentity;
  assert.equal(claim.isInternal, true);
  assert.equal(claim.isMutation, true);
  for (const flag of ["isPublic", "isQuery", "isAction"]) assert.equal(claim[flag], undefined);
  assert.deepEqual(JSON.parse(claim.exportArgs()), object({ replayIdentity: string }));
  assert.deepEqual(
    JSON.parse(claim.exportReturns()),
    union("claimed", "already_claimed"),
  );

  const authorities = replay.readCommandAuthorities;
  assert.equal(authorities.isInternal, true);
  assert.equal(authorities.isQuery, true);
  for (const flag of ["isPublic", "isMutation", "isAction"]) assert.equal(authorities[flag], undefined);
  assert.deepEqual(JSON.parse(authorities.exportArgs()), object({
    chainId: literal(296),
    canonicalSignerAddress: string,
  }));
  assert.deepEqual(JSON.parse(authorities.exportReturns()), array(object({
    principalPublicId: string,
    canonicalSignerAddress: string,
    chainId: literal(296),
    role: union("ISSUER", "BACKER"),
    ownedSubjectPublicIds: array(string),
    authorityVersion: string,
    enabled: { type: "boolean" },
  })));
});

implementedTest("claims a transport replay identity once and treats existing, duplicate, or malformed rows as already claimed", async () => {
  const { claimIngressReplayIdentity } = await import(replayUrl);
  const replayIdentity = "key-A:AbCdEfGhIjKlMnOpQrStUw";
  const expectedRead = [{
    table: "ingressCommandReplayClaims",
    index: "by_replay_identity",
    filters: [["replayIdentity", replayIdentity]],
    limit: 2,
  }];

  const fresh = walletCommandReplayDatabase();
  assert.equal(
    await claimIngressReplayIdentity._handler(fresh.ctx, { replayIdentity }),
    "claimed",
  );
  assert.deepEqual(fresh.reads, expectedRead);
  assert.equal(fresh.writes.length, 1);
  assert.equal(fresh.writes[0].table, "ingressCommandReplayClaims");
  assert.deepEqual(fresh.writes[0].document, {
    replayIdentity,
    claimedAt: fresh.writes[0].document.claimedAt,
  });
  assert.equal(typeof fresh.writes[0].document.claimedAt, "bigint");

  for (const [name, ingressClaims] of [
    ["existing", [{ replayIdentity, claimedAt: 1n }]],
    ["duplicate", [{ replayIdentity, claimedAt: 1n }, { replayIdentity, claimedAt: 2n }]],
    ["malformed null", [null]],
    ["malformed row", [{ replayIdentity, claimedAt: "not-an-int64" }]],
  ]) {
    const db = walletCommandReplayDatabase({ ingressClaims });
    assert.equal(
      await claimIngressReplayIdentity._handler(db.ctx, { replayIdentity }),
      "already_claimed",
      name,
    );
    assert.deepEqual(db.reads, expectedRead, name);
    assert.deepEqual(db.writes, [], name);
  }
});

implementedTest("reads command authorities through the exact bounded index and projects no document fields", async () => {
  const { readCommandAuthorities } = await import(replayUrl);
  const authority = commandAuthorityDocument();
  const db = walletCommandReplayDatabase({ authorities: [authority] });
  const result = await readCommandAuthorities._handler(db.ctx, {
    chainId: 296,
    canonicalSignerAddress: authority.canonicalSignerAddress,
  });

  assert.deepEqual(db.reads, [{
    table: "commandAuthorities",
    index: "by_chain_id_and_canonical_signer_address",
    filters: [
      ["chainId", 296],
      ["canonicalSignerAddress", authority.canonicalSignerAddress],
    ],
    limit: 2,
  }]);
  assert.deepEqual(db.writes, []);
  assert.deepEqual(result, [{
    principalPublicId: authority.principalPublicId,
    canonicalSignerAddress: authority.canonicalSignerAddress,
    chainId: 296,
    role: authority.role,
    ownedSubjectPublicIds: authority.ownedSubjectPublicIds,
    authorityVersion: authority.authorityVersion,
    enabled: authority.enabled,
  }]);
  for (const record of result) {
    assert.equal(Object.hasOwn(record, "_id"), false);
    assert.equal(Object.hasOwn(record, "_creationTime"), false);
    assert.equal(Object.hasOwn(record, "privateNote"), false);
  }
});
