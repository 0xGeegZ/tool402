import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { inflateSync } from "node:zlib";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const assetPaths = [
  "public/brand/demo-guide-trio.png",
  "public/brand/explore-publish-trio.png",
  "public/brand/deploy-review-trio.png",
  "public/brand/route-loader-trio.png",
  "public/brand/dashboard-empty-mascot.png",
];
const nestedLoadersWithCue = [
  "src/app/explore/loading.tsx",
  "src/app/explore/riskscan/loading.tsx",
  "src/app/explore/entitycheck/loading.tsx",
  "src/app/explore/riskscan/try/loading.tsx",
  "src/app/explore/riskscan/tool-loop/loading.tsx",
  "src/app/dashboard/riskscan/loading.tsx",
  "src/app/dashboard/riskscan/compatibility/loading.tsx",
  "src/app/dashboard/riskscan/preflight/loading.tsx",
];

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

function hasTransparentPixel(source) {
  const width = source.readUInt32BE(16);
  const height = source.readUInt32BE(20);
  const chunks = [];
  for (let offset = 8; offset < source.length;) {
    const length = source.readUInt32BE(offset);
    const type = source.toString("ascii", offset + 4, offset + 8);
    if (type === "IDAT") chunks.push(source.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
  }
  const decoded = inflateSync(Buffer.concat(chunks));
  const stride = width * 4;
  const rows = Buffer.alloc(stride * height);
  let inputOffset = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = decoded[inputOffset];
    inputOffset += 1;
    for (let x = 0; x < stride; x += 1) {
      const raw = decoded[inputOffset + x];
      const left = x >= 4 ? rows[y * stride + x - 4] : 0;
      const up = y > 0 ? rows[(y - 1) * stride + x] : 0;
      const upperLeft = y > 0 && x >= 4 ? rows[(y - 1) * stride + x - 4] : 0;
      let predictor = 0;
      if (filter === 1) predictor = left;
      if (filter === 2) predictor = up;
      if (filter === 3) predictor = Math.floor((left + up) / 2);
      if (filter === 4) {
        const p = left + up - upperLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upperLeft);
        predictor = pa <= pb && pa <= pc ? left : pb <= pc ? up : upperLeft;
      }
      assert.ok(filter >= 0 && filter <= 4, "PNG must use a supported filter");
      rows[y * stride + x] = (raw + predictor) & 255;
    }
    inputOffset += stride;
  }
  return rows.some((value, index) => index % 4 === 3 && value < 255);
}

test("ships five RGBA mascot assets with real transparency", async () => {
  await Promise.all(assetPaths.map((path) => access(join(appRoot, path))));
  const assets = await Promise.all(assetPaths.map((path) => readFile(join(appRoot, path))));

  for (const asset of assets) {
    assert.deepEqual([...asset.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    assert.equal(asset[24], 8, "PNG must use 8-bit pixels");
    assert.equal(asset[25], 6, "PNG must use RGBA colour type");
    assert.equal(asset[28], 0, "PNG must not be interlaced");
    assert.equal(hasTransparentPixel(asset), true, "PNG must contain transparent pixels");
  }
});

test("adds one decorative mascot to the signed dashboard empty state", async () => {
  const dashboard = await readAppFile("src/components/dashboard/dashboard-campaign.tsx");

  assert.match(dashboard, /from "next\/image"/);
  assert.match(dashboard, /data-ui="dashboard-empty-mascot"/);
  assert.match(dashboard, /data-ui="dashboard-empty-mascot"[^>]*aria-hidden="true"/s);
  assert.match(dashboard, /src="\/brand\/dashboard-empty-mascot\.png"[^>]*alt=""/s);
  assert.equal((dashboard.match(/src="\/brand\/dashboard-empty-mascot\.png"/g) ?? []).length, 1);
});

test("adds the decorative guide trio beside the existing demo introduction", async () => {
  const page = await readAppFile("src/app/demo/page.tsx");

  assert.match(page, /from "next\/image"/);
  assert.match(page, /data-ui="demo-guide-art"/);
  assert.match(page, /src="\/brand\/demo-guide-trio\.png"/);
  assert.match(page, /alt=""/);
  assert.match(page, /data-ui="demo-guide-art"[^>]*aria-hidden="true"/s);
  assert.match(page, /<GuidedDemoSteps\s*\/>/);
});

test("adds one provider CTA after the unchanged Explore catalogue grid", async () => {
  const catalog = await readAppFile("src/components/discovery/explore-catalog.tsx");
  const gridEnd = catalog.indexOf("</div>", catalog.indexOf("<RiskScanDiscoveryCard"));
  const cta = catalog.indexOf('data-ui="explore-provider-cta"');

  assert.ok(gridEnd >= 0 && cta > gridEnd, "provider CTA must follow the catalogue grid");
  assert.match(catalog, /src="\/brand\/explore-publish-trio\.png"/);
  assert.match(catalog, /data-ui="explore-provider-cta-art"[^>]*aria-hidden="true"/s);
  assert.match(catalog, /src="\/brand\/explore-publish-trio\.png"[^>]*alt=""/s);
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
  assert.match(reviewSource, /data-ui="provider-deploy-review-art"[^>]*aria-hidden="true"/s);
  assert.match(reviewSource, /src="\/brand\/deploy-review-trio\.png"[^>]*alt=""/s);
  assert.equal((wizard.match(/src="\/brand\/deploy-review-trio\.png"/g) ?? []).length, 1);
});

test("reveals one cancellable brand loading cue after 300 ms", async () => {
  const component = await readAppFile("src/components/ui/brand-route-loader.tsx");

  assert.match(component, /^"use client";/);
  assert.match(component, /setTimeout\([^;]+, 300\)/s);
  assert.match(component, /clearTimeout\(/);
  assert.match(component, /const \[showArtwork, setShowArtwork\] = useState\(false\)/);
  assert.match(component, /setTimeout\(\(\) => setShowArtwork\(true\), 300\)/);
  assert.match(component, /return \(\) => window\.clearTimeout\(timer\)/);
  assert.match(component, /showArtwork\s*\?/);
  assert.match(component, /role="status"/);
  assert.match(component, /aria-live="polite"/);
  assert.match(component, /data-ui="brand-route-loader"[^>]*aria-hidden="true"/s);
  assert.match(component, /src="\/brand\/route-loader-trio\.png"[^>]*alt=""/s);
  assert.match(component, /motion-reduce:animate-none/);
  assert.doesNotMatch(component, /\b(?:fetch|localStorage|sessionStorage|process\.env)\b/);
});

test("mounts the cue before non-Dashboard route skeletons", async () => {
  const root = await readAppFile("src/app/loading.tsx");
  assert.match(root, /<BrandRouteLoader\s*\/>/);

  for (const path of nestedLoadersWithCue) {
    const source = await readAppFile(path);
    const cue = source.indexOf("<BrandRouteLoader />");
    const firstSkeleton = source.indexOf("data-skeleton-region");
    assert.ok(cue >= 0 && firstSkeleton > cue, `${path} must mount the cue before its skeleton regions`);
  }
});

test("keeps Dashboard loading cue-free with a full-width skeleton", async () => {
  const dashboard = await readAppFile("src/app/dashboard/loading.tsx");

  assert.doesNotMatch(dashboard, /BrandRouteLoader/);
  assert.doesNotMatch(dashboard, /max-w-/);
  assert.equal((dashboard.match(/className="[^"]*\bw-full\b[^"]*"/g) ?? []).length, 4);
});
