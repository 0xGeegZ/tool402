import assert from "node:assert/strict";
import test from "node:test";

const publicCommandName = /^(action|command|create|delete|execute|mutate|send|submit|update)/i;

test("imports the local backend public entry", async () => {
  const backend = await import("@tool402/backend");

  assert.equal(backend.backendBoundary.runtime, "local");
});

test("does not expose public state-changing commands", async () => {
  const backend = await import("@tool402/backend");
  const publicCommands = Object.keys(backend).filter((name) => publicCommandName.test(name));

  assert.deepEqual(publicCommands, []);
});
