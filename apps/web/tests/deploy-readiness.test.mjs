import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));

const finalRuntimePaths = [
  "src/app/icon.svg",
  "src/app/apple-icon.png",
  "src/app/not-found.tsx",
  "src/app/error.tsx",
  "src/app/robots.ts",
  "src/components/boundary/not-found-boundary.tsx",
  "src/components/boundary/error-boundary.tsx",
];

const sourcePaths = [
  "src/app/not-found.tsx",
  "src/app/error.tsx",
  "src/app/robots.ts",
  "src/components/boundary/not-found-boundary.tsx",
  "src/components/boundary/error-boundary.tsx",
];

const moveOnlyPublicIconPaths = [
  "public/brand/icon.svg",
  "public/brand/apple-icon.png",
];

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

async function readFinalSources() {
  const missingPaths = [];

  for (const path of finalRuntimePaths) {
    if (!(await fileExists(path))) {
      missingPaths.push(path);
    }
  }

  assert.deepEqual(
    missingPaths,
    [],
    `S12 final runtime paths are missing: ${missingPaths.join(", ")}`,
  );

  return Promise.all(
    sourcePaths.map(async (path) => [path, await readFile(join(appRoot, path), "utf8")]),
  );
}

function renderedHrefTargets(source) {
  const targets = [];

  for (const [element] of source.matchAll(/<[A-Za-z][\w.:-]*\b[^>]*>/gu)) {
    if (!/\bhref\s*=/u.test(element)) {
      continue;
    }

    const href = element.match(
      /\bhref\s*=\s*(?:\{\s*)?["']([^"']+)["']\s*\}?/u,
    );
    assert.ok(href, `S12 rendered href must be a local string literal: ${element}`);
    targets.push(href[1]);
  }

  return targets;
}

function assertSemanticLocalLinks(source, expectedTargets) {
  assert.doesNotMatch(source, /<a\b/iu);
  assert.deepEqual(renderedHrefTargets(source), expectedTargets);
}

function renderedElementWithSource(source, expectedSource) {
  return [...source.matchAll(/<[A-Za-z][\w.:-]*\b[^>]*>/gu)].find(([element]) =>
    new RegExp(
      `\\bsrc\\s*=\\s*(?:\\{\\s*)?["']${expectedSource.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}["']\\s*\\}?`,
      "u",
    ).test(element),
  );
}

function directDefaultComponentProps(source) {
  const functionProps = source.match(
    /export\s+default\s+(?:async\s+)?function(?:\s+\w+)?\s*\(\s*\{([\s\S]*?)\}\s*(?::|\))/u,
  );

  if (functionProps) {
    return functionProps[1];
  }

  return source.match(
    /export\s+default\s+(?:async\s+)?\(\s*\{([\s\S]*?)\}\s*(?::[^)]*)?\)\s*=>/u,
  )?.[1];
}

async function appSourceFiles(path = "src/app") {
  const entries = await readdir(join(appRoot, path), { withFileTypes: true });
  const children = await Promise.all(
    entries.map(async (entry) => {
      const childPath = `${path}/${entry.name}`;

      return entry.isDirectory() ? appSourceFiles(childPath) : [childPath];
    }),
  );

  return children.flat();
}

async function assertExcludedAppRoutesRemainAbsent() {
  const appFiles = await appSourceFiles();
  const errorBoundaryPaths = appFiles
    .filter((path) => /^src\/app(?:\/.*)?\/error\.(?:ts|tsx|js|jsx)$/u.test(path))
    .sort();
  const globalErrorPaths = appFiles
    .filter((path) => /^src\/app(?:\/.*)?\/global-error\.(?:ts|tsx|js|jsx)$/u.test(path))
    .sort();
  const sitemapRoutePaths = appFiles
    .filter((path) => /^src\/app(?:\/.*)?\/sitemap(?:\.xml)?(?:\/route)?\.(?:ts|tsx|js|jsx)$/u.test(path))
    .sort();

  assert.deepEqual(errorBoundaryPaths, ["src/app/error.tsx"]);
  assert.equal(await fileExists("src/app/global-error.tsx"), false);
  assert.deepEqual(globalErrorPaths, []);
  assert.deepEqual(sitemapRoutePaths, []);
}

function assertNoRuntimeOrUnsupportedCopy(sources) {
  const forbiddenPatterns = [
    /\bprocess\.env\b/u,
    /\b(?:https?:\/\/|localhost(?::\d+)?|vercel\.app)\b/iu,
    /\bfetch\s*\(/u,
    /\b(?:localStorage|sessionStorage|indexedDB|caches)\b/u,
    /\b(?:setTimeout|setInterval|requestAnimationFrame)\s*\(/u,
    /\b(?:funds?|payments?|receipts?|transactions?|evidence|backing|portfolio|funding|ats|sign(?:-|\s)?in|onboarding|verification|provider|activity|issue)\b/iu,
  ];

  for (const [path, source] of sources) {
    for (const pattern of forbiddenPatterns) {
      assert.doesNotMatch(source, pattern, `${path} crosses the S12 boundary`);
    }
  }
}

test("keeps the S12 deploy-readiness boundary at its exact final state", async () => {
  const sources = await readFinalSources();
  const sourceByPath = new Map(sources);
  const notFoundRoute = sourceByPath.get("src/app/not-found.tsx");
  const errorRoute = sourceByPath.get("src/app/error.tsx");
  const robotsRoute = sourceByPath.get("src/app/robots.ts");
  const notFoundBoundary = sourceByPath.get(
    "src/components/boundary/not-found-boundary.tsx",
  );
  const errorBoundary = sourceByPath.get(
    "src/components/boundary/error-boundary.tsx",
  );

  assert.ok(notFoundRoute);
  assert.ok(errorRoute);
  assert.ok(robotsRoute);
  assert.ok(notFoundBoundary);
  assert.ok(errorBoundary);

  assert.deepEqual(
    await Promise.all(moveOnlyPublicIconPaths.map(fileExists)),
    [false, false],
  );
  assert.equal(await fileExists("public/brand/mascot-flag.png"), true);

  const notFoundSources = [notFoundRoute, notFoundBoundary].join("\n");
  assert.doesNotMatch(notFoundSources, /["']use client["']/u);
  assert.equal((notFoundSources.match(/<h1\b/gu) ?? []).length, 1);
  const mascot = renderedElementWithSource(notFoundBoundary, "/brand/mascot-flag.png");
  assert.ok(mascot);
  assert.match(mascot[0], /\balt\s*=\s*(?:\{\s*)?["']["']\s*\}?/u);
  assert.doesNotMatch(notFoundRoute, /mascot-flag\.png/u);
  assertSemanticLocalLinks(notFoundSources, ["/", "/explore"]);

  assert.match(errorRoute, /^["']use client["'];/u);
  const errorProps = directDefaultComponentProps(errorRoute);
  assert.ok(errorProps);
  assert.match(errorProps, /\berror\b/u);
  assert.match(errorProps, /\breset\b/u);
  assert.match(
    errorBoundary,
    /\bonClick\s*=\s*\{[^}]*\breset(?:\s*\(\s*\))?[^}]*\}/u,
  );

  const errorSources = [errorRoute, errorBoundary].join("\n");
  assertSemanticLocalLinks(errorSources, ["/"]);
  assert.doesNotMatch(errorSources, /\berror\.(?:message|stack|digest)\b/u);
  assert.doesNotMatch(errorSources, /\berror\s*=\s*\{\s*error\s*\}/u);
  assert.doesNotMatch(
    errorSources,
    /\b(?:console|logger|capture\w*|report\w*)\s*(?:\.|\()/u,
  );

  assert.match(robotsRoute, /\buserAgent\s*:\s*["']\*["']/u);
  assert.match(robotsRoute, /\ballow\s*:\s*["']\/["']/u);
  assert.doesNotMatch(robotsRoute, /\bsitemap\b/u);

  await assertExcludedAppRoutesRemainAbsent();
  assertNoRuntimeOrUnsupportedCopy(sources);
});
