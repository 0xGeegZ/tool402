import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

test("locks the read-only RiskScan detail boundary", async () => {
  const [page, detail, discoveryCard] = await Promise.all([
    readAppFile("src/app/explore/riskscan/page.tsx"),
    readAppFile("src/components/riskscan/detail/riskscan-detail.tsx"),
    readAppFile("src/components/discovery/riskscan-discovery-card.tsx"),
  ]);
  const sources = [page, detail, discoveryCard].join("\n");
  const requiredLimitation =
    "Quick reflects caller-supplied declarations and does not verify a service, payment, or evidence record.";
  const sourcesWithoutRequiredLimitation = [page, detail.replace(requiredLimitation, ""), discoveryCard].join("\n");

  assert.equal((page.match(/<main\b/g) ?? []).length, 1);
  assert.equal((detail.match(/<h1\b/g) ?? []).length, 1);
  assert.match(page, /<RiskScanDetail\s*\/>/);

  for (const input of ["requestRef", "subjectRef", "context", "identity", "pricing", "limitations", "evidence"]) {
    assert.match(detail, new RegExp(`\\b${input}\\b`));
  }
  for (const disposition of ["needs_disclosure", "disclosures_reported"]) {
    assert.match(detail, new RegExp(`\\b${disposition}\\b`));
  }

  assert.match(detail, /Quick reflects caller-supplied declarations and does not verify a service, payment, or evidence record\./);
  assert.match(detail, /The endpoint remains unavailable until its host supplies valid supported configuration\./);
  assert.match(detail, /href=["']\/explore["']/);
  assert.match(discoveryCard, /href=["']\/explore\/riskscan["']/);

  const hrefs = [...sources.matchAll(/href=["']([^"']+)["']/g)].map(([, href]) => href);
  assert.deepEqual(hrefs, ["/explore", "/explore/riskscan/try", "/explore/riskscan/tool-loop", "/explore/riskscan"]);
  assert.doesNotMatch(sources, /<(?:form|button|input|select|textarea)\b/i);
  assert.doesNotMatch(sources, /\bon[A-Z][A-Za-z]+\s*=|\baction\s*=/);
  assert.doesNotMatch(sources, /["']use client["']|fetch\(|process\.env\b/i);
  assert.doesNotMatch(sources, /https?:\/\/|mailto:|target=/i);
  assert.doesNotMatch(sources, /\$\d|\b(?:price|cost|fee|amount)\b|\b(?:USD|USDC|EUR|ETH)\s*\d|\b\d+(?:\.\d+)?\s*(?:USD|USDC|EUR|ETH)\b/iu);
  assert.doesNotMatch(sources, /\b(?:request will be accepted|request accepted|guaranteed acceptance|submit request)\b/i);
  assert.doesNotMatch(
    sources,
    /\b(?:pay now|wallet connected|payment complete|receipt available|evidence (?:available|recorded|verified)|provider configured|account connected|metric available|mock(?:ed)?|fixture|sample result|available now|live)\b/i,
  );
  assert.doesNotMatch(sourcesWithoutRequiredLimitation, /\b(?:wallet|payment|provider|account|metric|receipt)\b/i);
});
