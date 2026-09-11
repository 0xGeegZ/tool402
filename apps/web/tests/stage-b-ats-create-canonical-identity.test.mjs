import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const identityUrl = new URL(
  "../src/lib/ats/stage-b-ats-create-canonical-identity.ts",
  import.meta.url,
);
const identityPath = fileURLToPath(identityUrl);
const identityExists = existsSync(identityPath);
const implementedTest = identityExists ? test : test.skip;
const canonicalParametersHash =
  "1880065c5ae64b3fc6279cfdd8c85a6880d43e98ce129ed697c72372204296f9";
const consumers = [
  new URL("../src/components/provider/deploy/ats-create-configuration.ts", import.meta.url),
  new URL("../src/lib/ats/stage-b-ats-create-command-projection.ts", import.meta.url),
  new URL("../src/lib/ats/stage-b-ats-create-execution-projection.ts", import.meta.url),
  new URL("../src/lib/ats/stage-b-browser-provider-bridge.ts", import.meta.url),
];

test("requires the shared public Stage-B canonical identity module", () => {
  assert.equal(identityExists, true, `missing shared identity module: ${identityPath}`);
});

implementedTest("keeps the visible, command, execution, and guard consumers on the shared identity", async () => {
  const identity = await import(identityUrl.href);

  assert.deepEqual(Object.keys(identity), ["STAGE_B_ATS_CREATE_CANONICAL_PARAMETERS_HASH"]);
  assert.equal(identity.STAGE_B_ATS_CREATE_CANONICAL_PARAMETERS_HASH, canonicalParametersHash);
  for (const consumer of consumers) {
    const source = readFileSync(consumer, "utf8");
    assert.match(source, /stage-b-ats-create-canonical-identity/u, consumer.pathname);
    assert.match(source, /STAGE_B_ATS_CREATE_CANONICAL_PARAMETERS_HASH/u, consumer.pathname);
  }
});
