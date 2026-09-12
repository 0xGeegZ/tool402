import assert from "node:assert/strict";
import test from "node:test";

const sourceUrl = new URL("../src/lib/provider-tools-client.ts", import.meta.url);
const tool = {
  toolPublicId: `tool_${"a".repeat(32)}`,
  subjectPublicId: `tool_${"a".repeat(32)}`,
  offeringPublicId: `offering_${"a".repeat(32)}`,
  serviceId: `tool_${"a".repeat(32)}`,
  serviceSlug: `tool-${"a".repeat(32)}`,
  title: "RiskScan",
  state: "ALLOCATED",
};

test("accepts only a closed allocated/replayed provider-tool response", async () => {
  const { parseProviderToolAllocation } = await import(sourceUrl.href);
  assert.deepEqual(parseProviderToolAllocation({ outcome: "allocated", tool }), { outcome: "allocated", tool });
  assert.equal(parseProviderToolAllocation({ outcome: "allocated", tool: { ...tool, offeringPublicId: "offering_other" } }), null);
  assert.equal(parseProviderToolAllocation({ outcome: "rejected" }), null);
});

test("builds only a valid one-field allocation request", async () => {
  const { createProviderToolAllocationRequest } = await import(sourceUrl.href);
  const requestId = "013d5c4d-21d9-4f02-a62b-47f49f3b17ad";
  assert.deepEqual(createProviderToolAllocationRequest(requestId), {
    method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ requestId }),
  });
  assert.equal(createProviderToolAllocationRequest("bad"), null);
});

test("parses an owner-scoped tool page without accepting malformed items", async () => {
  const { parseProviderToolPage } = await import(sourceUrl.href);
  const page = { tools: [tool], nextCursor: null };
  assert.deepEqual(parseProviderToolPage(page), page);
  assert.equal(parseProviderToolPage({ tools: Array.from({ length: 21 }, () => tool), nextCursor: null }), null);
  assert.equal(parseProviderToolPage({ tools: [{ ...tool, state: "UNKNOWN" }], nextCursor: null }), null);
  assert.equal(parseProviderToolPage({ tools: [tool], nextCursor: "" }), null);
});
