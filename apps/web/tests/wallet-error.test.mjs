import assert from "node:assert/strict";
import test from "node:test";

import { isUserRejectedWalletRequest } from "../src/lib/wallet/wallet-error.ts";

test("recognizes only an explicit wallet rejection", () => {
  assert.equal(isUserRejectedWalletRequest({ code: 4001 }), true);
  assert.equal(isUserRejectedWalletRequest({ code: 4902 }), false);
  assert.equal(isUserRejectedWalletRequest(null), false);
});

test("treats hostile error objects as a non-rejection", () => {
  const hostile = new Proxy({}, { get() { throw new Error("no access"); } });

  assert.equal(isUserRejectedWalletRequest(hostile), false);
});
