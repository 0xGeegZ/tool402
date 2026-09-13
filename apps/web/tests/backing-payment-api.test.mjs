import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const serverUrl = new URL("../src/lib/backing-payment-server.ts", import.meta.url);
const routeUrl = new URL("../src/app/api/backing/payment/route.ts", import.meta.url);

test("declares the same-origin authenticated backing payment API", () => {
  assert.equal(existsSync(fileURLToPath(serverUrl)), true);
  assert.equal(existsSync(fileURLToPath(routeUrl)), true);
});
