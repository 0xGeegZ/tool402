import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

const sourcePaths = [
  new URL("../src/lib/offering-projection.ts", import.meta.url),
  new URL("../src/app/api/offerings/route.ts", import.meta.url),
];
const sourceExists = sourcePaths.every((url) => existsSync(url));
const implementedTest = sourceExists ? test : test.skip;
let route;

test("requires the declared S17 projection reader and offerings API route before GREEN", () => {
  for (const url of sourcePaths) {
    assert.equal(existsSync(url), true, `missing declared S17 source path: ${url.pathname}`);
  }
});

test.before(async () => {
  if (sourceExists) route = await import(sourcePaths[1].href);
});

implementedTest("returns both explicit not-configured outcomes without a request or upstream detail", async (t) => {
  const original = process.env.TOOL402_CONVEX_SITE_URL;
  delete process.env.TOOL402_CONVEX_SITE_URL;
  t.after(() => {
    if (original === undefined) delete process.env.TOOL402_CONVEX_SITE_URL;
    else process.env.TOOL402_CONVEX_SITE_URL = original;
  });
  t.mock.method(globalThis, "fetch", async () => {
    throw new Error("not-configured must not fetch");
  });

  const response = await route.GET(new Request("https://tool402.example.test/api/offerings?offeringPublicId=riskscan_offering_demo"));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), {
    offering: { outcome: "not_configured" },
    directory: { outcome: "not_configured" },
  });
});

implementedTest("rejects an invalid public id without exposing internal or upstream detail", async () => {
  const response = await route.GET(new Request("https://tool402.example.test/api/offerings?offeringPublicId=not/a/public/id"));
  assert.equal(response.status, 400);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const body = await response.text();
  assert.doesNotMatch(body, /reason|upstream|status|header|body|url|convex|error:/i);
});

implementedTest("contains no route or reader logging path for request or upstream data", async () => {
  const source = await Promise.all(sourcePaths.map((url) => readFile(url, "utf8")));
  for (const text of source) {
    assert.doesNotMatch(text, /\bconsole\s*\.\s*(?:debug|error|info|log|warn)\s*\(/i);
    assert.doesNotMatch(text, /\b(?:logger|log)\s*\.\s*(?:debug|error|info|log|warn)\s*\(/i);
    assert.doesNotMatch(text, /\b(?:logger|log)\s*\([^\n]*(?:request\s*\.\s*(?:url|headers?)|request\s*\.\s*(?:json|text)\s*\(|upstream\s*(?:status|error)|response\s*\.\s*status)/i);
  }
});
