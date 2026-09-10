import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const actionPath = join(appRoot, "src/components/provider/deploy/ats-create-action.tsx");
const stagesPath = join(appRoot, "src/components/provider/deploy/provider-deploy-stages.tsx");
const signingPath = join(appRoot, "src/components/provider/deploy/deploy-stage-signing.tsx");

async function sources() {
  return Promise.all([readFile(actionPath, "utf8"), readFile(stagesPath, "utf8"), readFile(signingPath, "utf8")]);
}

test("wires the Stage-B action through its isolated local bridge instead of a disabled artifact-only placeholder", async () => {
  const [action, stages, signing] = await sources();

  assert.match(action, /stage-b-browser-provider-bridge/u);
  assert.match(action, /\buseRef\b/u, "one controller must survive render cycles");
  assert.match(action, /\bonClick\b/u, "execution remains an explicit click only");
  assert.match(action, /\bonCandidate\b/u, "the action returns a candidate through a callback only");
  assert.doesNotMatch(action, /Create revenue note — unavailable/u);
  assert.match(stages, /<AtsCreateAction\b[^>]*\bonCandidate=/u);
  assert.match(signing, /\bsetCandidate\b/u, "candidate ownership is browser-session React state");
});

test("keeps Stage-B UI interaction local, manual, and free of persistence or automatic attach/signing", async () => {
  const [action, stages, signing] = await sources();
  const combined = `${action}\n${stages}\n${signing}`;

  assert.doesNotMatch(combined, /(?:localStorage|sessionStorage|indexedDB|document\.cookie|fetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|setInterval|setTimeout|requestAnimationFrame|process\.env|import\.meta\.env)/u);
  assert.doesNotMatch(action, /(?:external\.attachCandidate|eth_signTypedData_v4|eth_sendTransaction)/u);
  assert.match(action, /(?:role="status"|aria-live="polite")/u, "safe feedback must be accessible");
});
