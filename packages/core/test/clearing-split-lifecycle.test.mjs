import assert from "node:assert/strict";
import test from "node:test";

import {
  createClearingSplit,
  createPaidTask,
  transitionClearingSplit,
  transitionPaidTask,
} from "@tool402/core";

const expiresAt = "2026-09-07T00:00:00.000Z";
const requirements = {
  x402Version: 2,
  payment: { asset: "tinybar", amount: "20" },
};

async function resultValid() {
  let state = await createPaidTask({
    taskRef: "task-1",
    offeringVersion: "risk-v1",
    requirements,
    expiresAt,
  });

  for (const event of [
    {
      type: "payment_submitted",
      observedAt: "2026-09-06T23:59:59.999Z",
      requirements,
    },
    { type: "payment_settled" },
    { type: "execution_started" },
    { type: "result_valid" },
  ]) {
    state = await transitionPaidTask(state, event);
  }

  assert.equal(state.state, "result_valid");
  return state;
}

function snapshotOf(state) {
  return {
    taskRef: state.taskRef,
    offeringVersion: state.offeringVersion,
    requirementsDigest: state.requirementsDigest,
    expiresAt: state.expiresAt,
  };
}

test("starts only from an issued result_valid and freezes the five-field correlation snapshot", async () => {
  const result = await resultValid();
  const split = createClearingSplit(result);

  assert.equal(split.state, "split_required");
  assert.deepEqual(snapshotOf(split), {
    taskRef: "task-1",
    offeringVersion: "risk-v1",
    requirementsDigest: result.requirementsDigest,
    expiresAt,
  });
  assert.deepEqual(Reflect.ownKeys(split).sort(), [
    "expiresAt",
    "offeringVersion",
    "requirementsDigest",
    "state",
    "taskRef",
  ]);
  assert.equal(Object.isFrozen(split), true);
  assert.throws(() => {
    split.state = "split_submitted";
  });
});

test("consumes only a successfully started issued result and preserves rejected sources", async () => {
  const quoted = await createPaidTask({
    taskRef: "task-2",
    offeringVersion: "risk-v1",
    requirements,
    expiresAt,
  });
  assert.throws(() => createClearingSplit(quoted));
  assert.equal(
    (await transitionPaidTask(quoted, {
      type: "payment_submitted",
      observedAt: "2026-09-06T23:59:59.999Z",
      requirements,
    })).state,
    "payment_submitted",
  );

  const result = await resultValid();
  assert.throws(() => createClearingSplit({ ...result }));
  assert.equal(createClearingSplit(result).state, "split_required");
  assert.throws(() => createClearingSplit(result));
});

test("permits only the complete closed transition table", async () => {
  const legalPaths = [
    [["submit", "split_submitted"]],
    [["submit", "split_submitted"], ["confirm", "split_confirmed"]],
    [["submit", "split_submitted"], ["outcome_unknown", "split_outcome_unknown"]],
    [["submit", "split_submitted"], ["outcome_unknown", "split_outcome_unknown"], ["confirm", "split_confirmed"]],
    [["submit", "split_submitted"], ["outcome_unknown", "split_outcome_unknown"], ["non_execution_proven", "split_required"]],
  ];

  for (const path of legalPaths) {
    let state = createClearingSplit(await resultValid());
    const expectedSnapshot = snapshotOf(state);

    for (const [type, expectedState] of path) {
      state = transitionClearingSplit(state, { type });
      assert.equal(state.state, expectedState);
      assert.deepEqual(snapshotOf(state), expectedSnapshot);
      assert.equal(Object.isFrozen(state), true);
    }
  }
});

test("rejects skipped, duplicate, unknown-outcome retry, and terminal events without consuming a state", async () => {
  const events = ["submit", "confirm", "outcome_unknown", "non_execution_proven"];
  const cases = [
    [[], ["submit"]],
    [["submit"], ["confirm", "outcome_unknown"]],
    [["submit", "outcome_unknown"], ["confirm", "non_execution_proven"]],
    [["submit", "confirm"], []],
  ];

  for (const [path, allowed] of cases) {
    let state = createClearingSplit(await resultValid());
    for (const type of path) {
      state = transitionClearingSplit(state, { type });
    }

    for (const type of events) {
      if (!allowed.includes(type)) {
        assert.throws(() => transitionClearingSplit(state, { type }));
      }
    }

    for (const type of allowed) {
      const retryable = state;
      transitionClearingSplit(retryable, { type });
      assert.throws(() => transitionClearingSplit(retryable, { type }));
    }
  }

  const unknown = transitionClearingSplit(
    transitionClearingSplit(createClearingSplit(await resultValid()), { type: "submit" }),
    { type: "outcome_unknown" },
  );
  assert.throws(() => transitionClearingSplit(unknown, { type: "submit" }));
  assert.equal(
    transitionClearingSplit(unknown, { type: "confirm" }).state,
    "split_confirmed",
  );
});

test("rejects copied, forged, proxied, and accessor-backed sources and states before field access", async () => {
  const result = await resultValid();
  const split = createClearingSplit(result);
  const accessor = {};
  let reads = 0;
  Object.defineProperty(accessor, "state", {
    enumerable: true,
    get() {
      reads += 1;
      throw new Error("unissued field must not be read");
    },
  });

  for (const source of [
    { ...await resultValid() },
    Object.freeze({ state: "result_valid" }),
    new Proxy(await resultValid(), {}),
    accessor,
  ]) {
    assert.throws(() => createClearingSplit(source));
  }
  for (const state of [{ ...split }, Object.freeze({ ...split }), new Proxy(split, {}), accessor]) {
    assert.throws(() => transitionClearingSplit(state, { type: "submit" }));
  }
  assert.equal(reads, 0);
});

test("rejects every non-ordinary event descriptor without invoking an accessor and preserves the state", async () => {
  const inherited = Object.create({ type: "submit" });
  const nonenumerable = {};
  Object.defineProperty(nonenumerable, "type", { value: "submit" });
  const accessor = {};
  let reads = 0;
  Object.defineProperty(accessor, "type", {
    enumerable: true,
    get() {
      reads += 1;
      throw new Error("event accessor must not run");
    },
  });
  const reflectionFailure = new Proxy({}, {
    ownKeys() {
      throw new Error("event reflection must not run through a caller accessor");
    },
  });

  for (const event of [
    {},
    { type: "submit", extra: true },
    { type: "submit", [Symbol("extra")]: true },
    inherited,
    nonenumerable,
    accessor,
    reflectionFailure,
  ]) {
    const split = createClearingSplit(await resultValid());
    assert.throws(() => transitionClearingSplit(split, event));
    assert.equal(transitionClearingSplit(split, { type: "submit" }).state, "split_submitted");
  }
  assert.equal(reads, 0);
});
