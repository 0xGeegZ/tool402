import assert from "node:assert/strict";
import test from "node:test";

import { coreFoundation } from "@tool402/core";

test("exports the pure-domain foundation value", () => {
  assert.deepEqual(coreFoundation, { packageName: "@tool402/core" });
});
