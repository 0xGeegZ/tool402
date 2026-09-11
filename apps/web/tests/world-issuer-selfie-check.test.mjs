import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const modulePath = fileURLToPath(
  new URL("../src/lib/world/issuer-selfie-check.ts", import.meta.url),
);

test("declares the server-only World issuer verification boundary", () => {
  assert.equal(
    existsSync(modulePath),
    true,
    `missing declared World boundary: ${modulePath}`,
  );
});

test("creates a short-lived staging request and binds a tamper-evident browser session to one canonical issuer", async () => {
  const world = await import("../src/lib/world/issuer-selfie-check.ts");
  const env = {
    WORLD_APP_ID: "app_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    WORLD_RP_ID: "rp_aaaaaaaaaaaaaaaa",
    WORLD_RP_SIGNING_KEY: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    WORLD_ENVIRONMENT: "staging",
  };
  const address = "0x7e5f4552091a69125d5dfcb7b8c2659029395bdf";
  const request = world.createWorldRequest(address, env);

  assert.equal(request.app_id, env.WORLD_APP_ID);
  assert.equal(request.action, "issuer-publish");
  assert.equal(request.environment, "staging");
  assert.equal(typeof request.rp_context.sig, "string");
  const cookie = await world.createWorldIssuerCookie(address, env, 1_000);
  assert.equal(await world.hasWorldIssuerCookie(cookie, address, env, 1_001), true);
  assert.equal(await world.hasWorldIssuerCookie(cookie, "0x8ba1f109551bd432803012645ac136ddd64dba72", env, 1_001), false);
  assert.equal(await world.hasWorldIssuerCookie(`${cookie}x`, address, env, 1_001), false);
  assert.equal(await world.hasWorldIssuerCookie(cookie, address, env, 601_001), false);
});
