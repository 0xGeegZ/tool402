import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const skeletonPath = "src/components/ui/skeleton.tsx";

const loaders = [
  {
    path: "src/app/explore/loading.tsx",
    regions: ["heading", "risk-scan-discovery", "directory-inspection"],
  },
  {
    path: "src/app/explore/riskscan/loading.tsx",
    regions: [
      "navigation",
      "heading",
      "inputs",
      "result-boundary",
      "configuration-boundary",
    ],
  },
  {
    path: "src/app/explore/riskscan/try/loading.tsx",
    regions: ["heading", "request-boundary"],
  },
  {
    path: "src/app/explore/riskscan/tool-loop/loading.tsx",
    regions: ["heading", "tool-loop-boundary"],
  },
  {
    path: "src/app/dashboard/loading.tsx",
    regions: ["heading", "guest-context", "overview", "navigation"],
  },
  {
    path: "src/app/dashboard/riskscan/loading.tsx",
    regions: [
      "heading",
      "intro",
      "directory-step",
      "compatibility-step",
      "tool-loop-step",
    ],
  },
  {
    path: "src/app/dashboard/riskscan/compatibility/loading.tsx",
    regions: ["heading", "intro", "compatibility-boundary"],
  },
  {
    path: "src/app/dashboard/riskscan/preflight/loading.tsx",
    regions: ["heading", "intro", "preflight-boundary"],
  },
];

const sourcePaths = [skeletonPath, ...loaders.map(({ path }) => path)];

async function fileExists(path) {
  try {
    await access(join(appRoot, path));
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

const sourcesPresent = (await Promise.all(sourcePaths.map(fileExists))).every(
  Boolean,
);

async function readSources() {
  return Promise.all(
    sourcePaths.map(async (path) => [path, await readFile(join(appRoot, path), "utf8")]),
  );
}

function skeletonRegions(source) {
  return [...source.matchAll(/data-skeleton-region="([^"]+)"/gu)].map(
    ([, region]) => region,
  );
}

function assertStaticSource(path, source) {
  for (const pattern of [
    /["']use client["']/u,
    /\b(?:useEffect|useRef|useState)\b/u,
    /\bfetch\s*\(/u,
    /\bprocess\.env\b/u,
    /\b(?:window|document|localStorage|sessionStorage|indexedDB|caches)\b/u,
    /\b(?:setInterval|setTimeout|requestAnimationFrame)\s*\(/u,
    /<(?:button|form|input|label|p|span|textarea)\b/iu,
  ]) {
    assert.doesNotMatch(source, pattern, path + " must remain static layout");
  }
}

test("declares the exact S14 skeleton source paths before GREEN", async () => {
  const missingPaths = [];

  for (const path of sourcePaths) {
    if (!(await fileExists(path))) {
      missingPaths.push(path);
    }
  }

  assert.deepEqual(missingPaths, []);
});

test(
  "uses one decorative reduced-motion skeleton primitive",
  { skip: !sourcesPresent },
  async () => {
    const sources = new Map(await readSources());
    const source = sources.get(skeletonPath);

    assert.ok(source);
    assert.match(source, /aria-hidden=(?:\{true\}|["']true["'])/u);
    assert.match(source, /motion-safe:animate-pulse/u);
    assert.match(source, /motion-reduce:animate-none/u);
    assert.doesNotMatch(source, /\b(?:children|onClick|onKeyDown)\b/u);
    assertStaticSource(skeletonPath, source);
  },
);

test(
  "keeps every loader route-specific, ordered, and text-free",
  { skip: !sourcesPresent },
  async () => {
    const sources = new Map(await readSources());

    for (const { path, regions } of loaders) {
      const source = sources.get(path);

      assert.ok(source);
      assert.match(source, /<main\b/u);
      assert.match(source, /\bSkeleton\b/u);
      assert.deepEqual(skeletonRegions(source), regions, path);
      assertStaticSource(path, source);
    }
  },
);
