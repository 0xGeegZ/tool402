import { createRequire } from "node:module";
import { execFileSync, spawn } from "node:child_process";

import { loadRootEnvironment, rootEnvironmentPath } from "./root-env.mjs";

const require = createRequire(import.meta.url);
const gitCommonDirectory = execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], {
  cwd: process.cwd(),
  encoding: "utf8",
}).trim();

loadRootEnvironment(rootEnvironmentPath(gitCommonDirectory));

const next = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "dev", ...process.argv.slice(2)], {
  env: process.env,
  stdio: "inherit",
});

next.once("exit", (code, signal) => {
  if (signal !== null) process.kill(process.pid, signal);
  process.exitCode = code ?? 1;
});
