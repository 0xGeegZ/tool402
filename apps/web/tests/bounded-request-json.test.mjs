import assert from "node:assert/strict";
import test from "node:test";

import {
  PROTECTED_JSON_MAX_BYTES,
  readBoundedRequestJson,
} from "../src/lib/bounded-request-json.ts";

test("accepts JSON whose encoded body is exactly the protected limit", async () => {
  const value = "x".repeat(PROTECTED_JSON_MAX_BYTES - 2);
  const result = await readBoundedRequestJson(
    new Request("http://tool402.test/protected", { body: JSON.stringify(value), method: "POST" }),
  );

  assert.deepEqual(result, { kind: "value", value });
});

test("rejects a streamed body after its encoded size crosses the protected limit", async () => {
  const result = await readBoundedRequestJson(
    new Request("http://tool402.test/protected", {
      body: JSON.stringify("x".repeat(PROTECTED_JSON_MAX_BYTES - 1)),
      method: "POST",
    }),
  );

  assert.deepEqual(result, { kind: "too_large" });
});
