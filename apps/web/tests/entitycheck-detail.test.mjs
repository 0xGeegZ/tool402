import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

test("locks the descriptive EntityCheck detail boundary", async () => {
  const [page, detail, discoveryCard, loading] = await Promise.all([
    readAppFile("src/app/explore/entitycheck/page.tsx"),
    readAppFile("src/components/entitycheck/detail/entitycheck-detail.tsx"),
    readAppFile("src/components/discovery/entitycheck-discovery-card.tsx"),
    readAppFile("src/app/explore/entitycheck/loading.tsx"),
  ]);
  const sources = [page, detail, discoveryCard, loading].join("\n");
  const limitation =
    "EntityCheck reflects two public sources at the time they were read and does not verify ownership, solvency, or compliance; a clear screen is not a compliance opinion.";
  const withoutLimitation = [page, detail.replace(limitation, ""), discoveryCard, loading].join("\n");

  assert.equal((page.match(/<main\b/g) ?? []).length, 1);
  assert.equal((detail.match(/<h1\b/g) ?? []).length, 1);
  assert.match(page, /<EntityCheckDetail\s*\/>/);
  assert.match(detail, />\s*EntityCheck France\s*</);
  assert.match(detail, />\s*Counterparty verification\s*</);
  assert.match(detail, />\s*Input contract\s*</);
  assert.match(detail, />\s*Result boundary\s*</);
  assert.match(detail, />\s*Sources\s*</);
  assert.match(detail, />\s*Configuration boundary\s*</);

  for (const input of ["requestRef", "jurisdiction", "query", "registrationNumber"]) {
    assert.match(detail, new RegExp(`\\b${input}\\b`));
  }
  for (const value of ["found", "ambiguous", "not_found", "clear", "hit", "not_screened"]) {
    assert.match(detail, new RegExp(`\\b${value}\\b`));
  }

  assert.match(detail, /French registry API/);
  assert.match(detail, /OFAC SDN list/);
  assert.match(detail, new RegExp(limitation.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(detail, /The API returns unavailable until its host supplies both x402 and source configuration\./);
  assert.match(detail, /href=["']\/explore["']/);
  assert.match(discoveryCard, /href=["']\/explore\/entitycheck["']/);

  const hrefs = [...sources.matchAll(/href=["']([^"']+)["']/g)].map(([, href]) => href);
  assert.deepEqual(hrefs, ["/explore", "/explore/entitycheck"]);
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
  assert.doesNotMatch(withoutLimitation, /\b(?:wallet|payment|provider|account|metric|receipt)\b/i);
});
