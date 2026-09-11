import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { parse } from "dotenv";

export function rootEnvironmentPath(gitCommonDirectory) {
  return resolve(dirname(gitCommonDirectory), ".env.local");
}

export function loadRootEnvironment(path, environment = process.env) {
  let source;
  try {
    source = readFileSync(path, "utf8");
  } catch {
    throw new Error(`Root environment file is required: ${path}`);
  }
  Object.assign(environment, parse(source));
}
