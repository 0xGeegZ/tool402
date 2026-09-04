import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const sourceDirectory = fileURLToPath(new URL("../src/", import.meta.url));

async function collectTypeScriptFiles(directory) {
  let entries;

  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      return [];
    }

    throw error;
  }

  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectTypeScriptFiles(path)));
    } else if (entry.isFile() && path.endsWith(".ts")) {
      files.push(path);
    }
  }

  return files;
}

function importedSpecifiers(source) {
  const matches = source.matchAll(
    /(?:^|\n)\s*(?:import|export)\s+(?:(?:type\s+)?[\s\S]*?\s+from\s+)?["']([^"']+)["']/gu,
  );

  return [...matches].map((match) => match[1]);
}

function assertPureDomainImport(specifier) {
  assert.match(
    specifier,
    /^\.\.?(?:\/|$)/u,
    `prohibited runtime-adapter import: ${specifier}`,
  );
}

test("rejects prohibited I/O import specifiers", () => {
  assert.throws(
    () => assertPureDomainImport("node:fs/promises"),
    /prohibited runtime-adapter import/u,
  );
});

test("core source imports only local pure-domain modules", async () => {
  const files = await collectTypeScriptFiles(sourceDirectory);

  assert.ok(files.length > 0, "core source must contain a TypeScript module");

  for (const file of files) {
    const source = await readFile(file, "utf8");

    for (const specifier of importedSpecifiers(source)) {
      assertPureDomainImport(specifier);
    }
  }
});
