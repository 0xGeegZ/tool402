import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const assetPaths = [
  "public/brand/demo-guide-trio.png",
  "public/brand/explore-publish-trio.png",
  "public/brand/deploy-review-trio.png",
  "public/brand/route-loader-trio.png",
];
const nestedLoaders = [
  "src/app/explore/loading.tsx",
  "src/app/explore/riskscan/loading.tsx",
  "src/app/explore/entitycheck/loading.tsx",
  "src/app/explore/riskscan/try/loading.tsx",
  "src/app/explore/riskscan/tool-loop/loading.tsx",
  "src/app/dashboard/loading.tsx",
  "src/app/dashboard/riskscan/loading.tsx",
  "src/app/dashboard/riskscan/compatibility/loading.tsx",
  "src/app/dashboard/riskscan/preflight/loading.tsx",
];

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

test("ships four transparent PNG mascot assets without rasterized copy", async () => {
  await Promise.all(assetPaths.map((path) => access(join(appRoot, path))));
  const assets = await Promise.all(assetPaths.map((path) => readFile(join(appRoot, path))));

  for (const asset of assets) {
    assert.deepEqual([...asset.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    assert.equal(asset[25], 6, "PNG must use RGBA colour type");
  }
});

test("adds the decorative guide trio beside the existing demo introduction", async () => {
  const page = await readAppFile("src/app/demo/page.tsx");

  assert.match(page, /from "next\/image"/);
  assert.match(page, /data-ui="demo-guide-art"/);
  assert.match(page, /src="\/brand\/demo-guide-trio\.png"/);
  assert.match(page, /alt=""/);
  assert.match(page, /<GuidedDemoSteps\s*\/>/);
});

test("adds one provider CTA after the unchanged Explore catalogue grid", async () => {
  const catalog = await readAppFile("src/components/discovery/explore-catalog.tsx");
  const gridEnd = catalog.indexOf("</div>", catalog.indexOf("<RiskScanDiscoveryCard"));
  const cta = catalog.indexOf('data-ui="explore-provider-cta"');

  assert.ok(gridEnd >= 0 && cta > gridEnd, "provider CTA must follow the catalogue grid");
  assert.match(catalog, /src="\/brand\/explore-publish-trio\.png"/);
  assert.match(catalog, /href="\/provider\/deploy"/);
  assert.equal((catalog.match(/data-ui="explore-provider-cta"/g) ?? []).length, 1);
  assert.doesNotMatch(catalog, /\b(?:fetch|useEffect|useState|localStorage|sessionStorage)\b/);
});

test("renders deploy artwork only from the final ReviewStep", async () => {
  const wizard = await readAppFile("src/components/provider/deploy/provider-deploy-wizard.tsx");
  const reviewStart = wizard.indexOf("function ReviewStep");
  const wizardStart = wizard.indexOf("export function ProviderDeployWizard");
  const reviewSource = wizard.slice(reviewStart, wizardStart);

  assert.ok(reviewStart >= 0 && wizardStart > reviewStart);
  assert.match(reviewSource, /data-ui="provider-deploy-review-art"/);
  assert.match(reviewSource, /src="\/brand\/deploy-review-trio\.png"/);
  assert.equal((wizard.match(/src="\/brand\/deploy-review-trio\.png"/g) ?? []).length, 1);
});

test("reveals one cancellable brand loading cue after 300 ms", async () => {
  const component = await readAppFile("src/components/ui/brand-route-loader.tsx");

  assert.match(component, /^"use client";/);
  assert.match(component, /setTimeout\([^;]+, 300\)/s);
  assert.match(component, /clearTimeout\(/);
  assert.match(component, /role="status"/);
  assert.match(component, /aria-live="polite"/);
  assert.match(component, /src="\/brand\/route-loader-trio\.png"/);
  assert.doesNotMatch(component, /\b(?:fetch|localStorage|sessionStorage|process\.env)\b/);
});

test("mounts the cue without changing route-specific skeleton order", async () => {
  const root = await readAppFile("src/app/loading.tsx");
  assert.match(root, /<BrandRouteLoader\s*\/>/);

  for (const path of nestedLoaders) {
    const source = await readAppFile(path);
    const cue = source.indexOf("<BrandRouteLoader />");
    const firstSkeleton = source.indexOf("data-skeleton-region");
    assert.ok(cue >= 0 && firstSkeleton > cue, `${path} must mount the cue before its skeleton regions`);
  }
});
