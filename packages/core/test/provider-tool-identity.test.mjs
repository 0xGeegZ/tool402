import assert from "node:assert/strict";
import test from "node:test";

import * as core from "@tool402/core";

test("exports the provider-tool identity boundary", () => {
  assert.equal(
    typeof core.createProviderToolIdentity,
    "function",
    "the server allocator must derive provider-tool identities through the Core export",
  );
  assert.equal(typeof core.parseProviderToolId, "function");
});

test("derives every public identity from exactly 128 bits of server entropy", () => {
  const zero = core.createProviderToolIdentity(new Uint8Array(16));
  const one = core.createProviderToolIdentity(new Uint8Array(16).fill(1));

  assert.deepEqual(zero, {
    toolPublicId: `tool_${"00".repeat(16)}`,
    subjectPublicId: `tool_${"00".repeat(16)}`,
    offeringPublicId: `offering_${"00".repeat(16)}`,
    serviceId: `tool_${"00".repeat(16)}`,
    serviceSlug: `tool-${"00".repeat(16)}`,
  });
  assert.notEqual(zero.toolPublicId, one.toolPublicId);
  assert.equal(Object.isFrozen(zero), true);
  assert.throws(() => core.createProviderToolIdentity(new Uint8Array(15)), /16/u);
  assert.throws(() => core.createProviderToolIdentity(new Uint8Array(17)), /16/u);
});

test("accepts only canonical allocated provider-tool identifiers", () => {
  const id = `tool_${"ab".repeat(16)}`;
  assert.equal(core.parseProviderToolId(id), id);
  for (const invalid of [
    "tool_ABCDEF",
    "tool_",
    "tool_" + "ab".repeat(15),
    "tool_" + "ab".repeat(17),
    "offering_" + "ab".repeat(16),
    ` tool_${"ab".repeat(16)}`,
    null,
  ]) {
    assert.equal(core.parseProviderToolId(invalid), null, String(invalid));
  }
});
