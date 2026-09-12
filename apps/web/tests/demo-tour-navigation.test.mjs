import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

const navigationUrl = new URL("../src/components/demo/demo-tour-navigation.ts", import.meta.url);

test("keeps the validated dashboard tour redirect fixed", async (t) => {
  assert.ok(existsSync(navigationUrl), "the shared tour navigation contract must exist");
  const { dashboardTourHref } = await import(navigationUrl.href);

  await t.test("only a scalar 1 selects the dashboard tour destination", () => {
    assert.equal(dashboardTourHref("1"), "/dashboard?tour=1");
    assert.equal(dashboardTourHref("1", "provider-sign-in"), "/dashboard?tour=1&demoStep=provider-sign-in");
    assert.equal(dashboardTourHref("1", "unknown-step"), "/dashboard?tour=1");
    for (const value of [undefined, null, "", "0", "true", "unknown", 1, true, ["1"], ["1", "1"], "https://evil.example", "//evil.example", { tour: "1" }]) {
      assert.equal(dashboardTourHref(value), "/dashboard");
    }
  });
});
