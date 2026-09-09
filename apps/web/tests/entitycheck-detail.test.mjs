import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const declaredPaths = [
  "src/components/discovery/entitycheck-discovery-card.tsx",
  "src/app/explore/entitycheck/page.tsx",
  "src/app/explore/entitycheck/loading.tsx",
  "src/components/entitycheck/detail/entitycheck-detail.tsx",
];
const sourceExists = declaredPaths.every((path) =>
  existsSync(join(appRoot, path)),
);
const implementedTest = sourceExists ? test : test.skip;

const baselineLimitation =
  "EntityCheck reflects two public sources at the time they were read and does not verify ownership, solvency, or compliance; a clear screen is not a compliance opinion.";

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

test("requires the declared S23 card, route, loader, and detail paths before GREEN", () => {
  for (const path of declaredPaths) {
    assert.equal(
      existsSync(join(appRoot, path)),
      true,
      `missing declared S23 path: ${path}`,
    );
  }
});

implementedTest("locks the read-only EntityCheck detail boundary", async () => {
  const [page, detail, discoveryCard] = await Promise.all([
    readAppFile("src/app/explore/entitycheck/page.tsx"),
    readAppFile("src/components/entitycheck/detail/entitycheck-detail.tsx"),
    readAppFile("src/components/discovery/entitycheck-discovery-card.tsx"),
  ]);
  const sources = [page, detail, discoveryCard].join("\n");
  const sourcesWithoutRequiredLimitation = [
    page,
    detail.replace(baselineLimitation, ""),
    discoveryCard,
  ].join("\n");

  assert.equal((page.match(/<main\b/g) ?? []).length, 1);
  assert.equal((detail.match(/<h1\b/g) ?? []).length, 1);
  assert.match(page, /<EntityCheckDetail\s*\/>/);
  assert.match(detail, />\s*EntityCheck France\s*</);

  for (const input of [
    "requestRef",
    "jurisdiction",
    "query",
    "registrationNumber",
  ]) {
    assert.match(detail, new RegExp(`\\b${input}\\b`));
  }
  assert.match(detail, /\boptional\b/i);
  for (const disposition of ["found", "ambiguous", "not_found"]) {
    assert.match(detail, new RegExp(`\\b${disposition}\\b`));
  }
  for (const screen of ["clear", "hit", "not_screened"]) {
    assert.match(detail, new RegExp(`\\b${screen}\\b`));
  }
  assert.match(detail, /recherche-entreprises|French company registry/i);
  assert.match(detail, /OFAC/);
  assert.match(detail, /SDN/);
  assert.match(
    detail,
    new RegExp(baselineLimitation.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
  );
  assert.match(
    detail,
    /returns unavailable until its host supplies both x402 and source configuration/,
  );
  assert.match(detail, /href=["']\/explore["']/);
  assert.match(discoveryCard, /href=["']\/explore\/entitycheck["']/);

  const hrefs = [...sources.matchAll(/href=["']([^"']+)["']/g)].map(
    ([, href]) => href,
  );
  assert.deepEqual(hrefs, ["/explore", "/explore/entitycheck"]);
  assert.doesNotMatch(sources, /<(?:form|button|input|select|textarea)\b/i);
  assert.doesNotMatch(sources, /\bon[A-Z][A-Za-z]+\s*=|\baction\s*=/);
  assert.doesNotMatch(sources, /["']use client["']|fetch\(|process\.env\b/i);
  assert.doesNotMatch(sources, /https?:\/\/|mailto:|target=/i);
  assert.doesNotMatch(
    sources,
    /\$\d|\b(?:price|cost|fee|amount)\b|\b(?:USD|USDC|EUR|ETH)\s*\d/iu,
  );
  assert.doesNotMatch(
    sources,
    /\b(?:request will be accepted|request accepted|guaranteed acceptance|submit request|live availability|available now|mock)\b/i,
  );
  assert.doesNotMatch(
    sourcesWithoutRequiredLimitation,
    /\b(?:wallet|payment|provider|account|metric|receipt|evidence)\b/i,
  );
});

implementedTest(
  "gives the EntityCheck card the UI-S20 anatomy and the fixed catalog copy",
  async () => {
    const card = await readAppFile(
      "src/components/discovery/entitycheck-discovery-card.tsx",
    );

    assert.match(card, />\s*EntityCheck\s*</);
    assert.match(card, /Counterparty verification/);
    assert.match(card, /In discovery/);
    assert.match(
      card,
      /A bounded lookup of a French company(?:&apos;|')s public registry record with a sanctions screen, cited to its sources\./,
    );
    assert.match(card, /This surface is descriptive only\./);
    assert.match(card, />\s*View details\s*</);
    assert.match(card, /<Link\b[^>]*href=["']\/explore\/entitycheck["']/);
    assert.match(card, /aria-hidden=["']true["']/);
    assert.doesNotMatch(card, /<(?:a|button|form|input|select|textarea)\b/i);
    assert.doesNotMatch(card, /["']use client["']/);
  },
);
