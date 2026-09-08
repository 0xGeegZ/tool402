import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

const sourceUrl = new URL("../src/app/api/commands/route.ts", import.meta.url);
const sourcePath = fileURLToPath(sourceUrl);
const sourceExists = existsSync(sourcePath);
const relaySourcePath = fileURLToPath(new URL("../src/lib/wallet/command-relay.ts", import.meta.url));
const implementedTest = sourceExists ? test : test.skip;
let api;

test("requires the declared command relay source modules", () => {
  assert.equal(sourceExists, true, `missing declared source module: ${sourcePath}`);
  assert.equal(existsSync(relaySourcePath), true, `missing declared source module: ${relaySourcePath}`);
});

test.before(async () => {
  if (sourceExists) {
    api = await import(sourceUrl.href);
  }
});

implementedTest("refuses an unconfigured relay before reading or forwarding a command body", async () => {
  const response = await api.POST(new Request("http://localhost/api/commands", {
    method: "POST",
    body: '{"command":{},"payload":{}}',
  }));

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { outcome: "not_configured" });
});

implementedTest("exports only the closed server relay outcome vocabulary", () => {
  assert.deepEqual(api.commandRelayOutcomeKinds, [
    "ACCEPTED",
    "REPLAYED",
    "CONFLICT",
    "REJECTED",
    "UNSUPPORTED_TYPE",
    "not_configured",
    "transport_failure",
    "unexpected_response",
  ]);
});
