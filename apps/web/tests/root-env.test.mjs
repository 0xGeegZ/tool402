import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const sourceUrl = new URL("../scripts/root-env.mjs", import.meta.url);
const sourcePath = fileURLToPath(sourceUrl);
const implementedTest = existsSync(sourcePath) ? test : test.skip;

test("requires the root environment loader for the web development server", () => {
  assert.equal(existsSync(sourcePath), true, `missing root environment loader: ${sourcePath}`);
});

implementedTest("overrides a divergent web environment with the repository root configuration", async () => {
  const { loadRootEnvironment } = await import(sourceUrl.href);
  const directory = await mkdtemp(join(tmpdir(), "tool402-root-env-"));
  const environmentPath = join(directory, ".env.local");
  await writeFile(environmentPath, [
    "TOOL402_CONVEX_SITE_URL=https://correct-demo.convex.site",
    "TOOL402_CLEARING_ACCOUNT_ID=0.0.10403477",
  ].join("\n"));
  const environment = {
    TOOL402_CONVEX_SITE_URL: "https://stale-web-copy.convex.site",
    TOOL402_CLEARING_ACCOUNT_ID: "0.0.1",
  };

  loadRootEnvironment(environmentPath, environment);

  assert.deepEqual(environment, {
    TOOL402_CONVEX_SITE_URL: "https://correct-demo.convex.site",
    TOOL402_CLEARING_ACCOUNT_ID: "0.0.10403477",
  });
});

implementedTest("refuses to start without the repository root environment file", async () => {
  const { loadRootEnvironment } = await import(sourceUrl.href);
  const missingPath = join(await mkdtemp(join(tmpdir(), "tool402-root-env-missing-")), ".env.local");

  assert.throws(
    () => loadRootEnvironment(missingPath, {}),
    /root environment file/i,
  );
});

implementedTest("resolves the shared repository environment beside the Git common directory", async () => {
  const { rootEnvironmentPath } = await import(sourceUrl.href);

  assert.equal(
    rootEnvironmentPath("/workspace/tool402/.git"),
    "/workspace/tool402/.env.local",
  );
});
