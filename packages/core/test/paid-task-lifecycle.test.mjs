import assert from "node:assert/strict";
import test from "node:test";

import {
  createPaidTask,
  sha256Requirements,
  transitionPaidTask,
} from "@tool402/core";

const beforeExpiry = "2026-09-06T23:59:59.999Z";
const atExpiry = "2026-09-07T00:00:00.000Z";
const afterExpiry = "2026-09-07T00:00:00.001Z";
const validRequirements = {
  x402Version: 2,
  payment: { asset: "tinybar", amount: "20" },
};

async function quoted(requirements = validRequirements) {
  return createPaidTask({
    taskRef: "task-1",
    offeringVersion: "risk-v1",
    requirements,
    expiresAt: atExpiry,
  });
}

function eventFor(type) {
  if (type === "expire") {
    return { type, observedAt: atExpiry };
  }

  if (type === "payment_submitted") {
    return { type, observedAt: beforeExpiry, requirements: validRequirements };
  }

  return { type };
}

function snapshotOf(state) {
  return {
    taskRef: state.taskRef,
    offeringVersion: state.offeringVersion,
    requirementsDigest: state.requirementsDigest,
    expiresAt: state.expiresAt,
  };
}

async function follow(path) {
  let state = await quoted();

  for (const type of path) {
    state = await transitionPaidTask(state, eventFor(type));
  }

  return state;
}

test("creates a frozen minimal quoted snapshot", async () => {
  const task = await quoted();
  const requirementsDigest = await sha256Requirements(validRequirements);

  assert.equal(task.state, "quoted");
  assert.equal(task.requirementsDigest, requirementsDigest);
  assert.deepEqual(snapshotOf(task), {
    taskRef: "task-1",
    offeringVersion: "risk-v1",
    requirementsDigest,
    expiresAt: atExpiry,
  });
  assert.deepEqual(Reflect.ownKeys(task).sort(), [
    "expiresAt",
    "offeringVersion",
    "requirementsDigest",
    "state",
    "taskRef",
  ]);
  assert.equal(Object.isFrozen(task), true);
  assert.throws(() => {
    task.state = "expired";
  });
});

test("accepts only bounded trimmed task identity and real canonical expiry input", async () => {
  const maximumLengthTaskRef = "t".repeat(96);
  const maximumLengthOfferingVersion = "v".repeat(96);
  const canonicalExpiry = "2026-09-07T00:00:00.000Z";

  const created = await createPaidTask({
    taskRef: maximumLengthTaskRef,
    offeringVersion: maximumLengthOfferingVersion,
    requirements: validRequirements,
    expiresAt: canonicalExpiry,
  });
  assert.equal(created.state, "quoted");
  assert.equal(created.expiresAt, canonicalExpiry);
  assert.equal(new Date(created.expiresAt).toISOString(), created.expiresAt);

  for (const input of [
    { taskRef: "", offeringVersion: "risk-v1", expiresAt: canonicalExpiry },
    { taskRef: "   ", offeringVersion: "risk-v1", expiresAt: canonicalExpiry },
    { taskRef: " task-1", offeringVersion: "risk-v1", expiresAt: canonicalExpiry },
    { taskRef: "task-1 ", offeringVersion: "risk-v1", expiresAt: canonicalExpiry },
    { taskRef: "t".repeat(97), offeringVersion: "risk-v1", expiresAt: canonicalExpiry },
    { taskRef: "task-1", offeringVersion: "", expiresAt: canonicalExpiry },
    { taskRef: "task-1", offeringVersion: "   ", expiresAt: canonicalExpiry },
    { taskRef: "task-1", offeringVersion: " risk-v1", expiresAt: canonicalExpiry },
    { taskRef: "task-1", offeringVersion: "risk-v1 ", expiresAt: canonicalExpiry },
    { taskRef: "task-1", offeringVersion: "v".repeat(97), expiresAt: canonicalExpiry },
    { taskRef: "task-1", offeringVersion: "risk-v1", expiresAt: "2026-09-07T00:00:00Z" },
    { taskRef: "task-1", offeringVersion: "risk-v1", expiresAt: "2026-09-07T02:00:00.000+02:00" },
    { taskRef: "task-1", offeringVersion: "risk-v1", expiresAt: "2026-02-30T00:00:00.000Z" },
  ]) {
    await assert.rejects(() =>
      createPaidTask({ ...input, requirements: validRequirements }),
    );
  }
});

test("permits every legal edge and preserves its issued snapshot", async () => {
  const legalPaths = [
    ["expire"],
    ["payment_submitted"],
    ["payment_submitted", "payment_rejected"],
    ["payment_submitted", "payment_outcome_unknown"],
    ["payment_submitted", "payment_settled"],
    ["payment_submitted", "payment_settled", "execution_started"],
    ["payment_submitted", "payment_settled", "execution_started", "result_valid"],
    ["payment_submitted", "payment_settled", "execution_started", "execution_failed"],
    ["payment_submitted", "payment_settled", "execution_started", "response_outcome_unknown"],
  ];
  const expectedStates = [
    "expired",
    "payment_submitted",
    "payment_rejected",
    "payment_outcome_unknown",
    "payment_settled",
    "execution_started",
    "result_valid",
    "execution_failed",
    "response_outcome_unknown",
  ];

  const requirementsDigest = await sha256Requirements(validRequirements);

  for (const [index, path] of legalPaths.entries()) {
    const task = await quoted();
    const expectedSnapshot = {
      taskRef: "task-1",
      offeringVersion: "risk-v1",
      requirementsDigest,
      expiresAt: atExpiry,
    };
    let state = task;

    for (const type of path) {
      state = await transitionPaidTask(state, eventFor(type));
      assert.deepEqual(snapshotOf(state), expectedSnapshot);
      assert.equal(Object.isFrozen(state), true);
    }

    assert.equal(state.state, expectedStates[index]);
  }
});

test("requires exact explicit expiry boundaries without reading a clock", async () => {
  const beforeExpiryTask = await quoted();
  await assert.rejects(() =>
    transitionPaidTask(beforeExpiryTask, { type: "expire", observedAt: beforeExpiry }),
  );
  assert.equal(
    (await transitionPaidTask(beforeExpiryTask, {
      type: "expire",
      observedAt: atExpiry,
    })).state,
    "expired",
  );

  const expired = await transitionPaidTask(await quoted(), {
    type: "expire",
    observedAt: atExpiry,
  });
  assert.equal(expired.state, "expired");

  const expiredAfter = await transitionPaidTask(await quoted(), {
    type: "expire",
    observedAt: afterExpiry,
  });
  assert.equal(expiredAfter.state, "expired");

  const task = await quoted();
  await assert.rejects(() =>
    transitionPaidTask(task, {
      type: "payment_submitted",
      observedAt: atExpiry,
      requirements: validRequirements,
    }),
  );
  assert.equal(
    (await transitionPaidTask(task, eventFor("payment_submitted"))).state,
    "payment_submitted",
  );

  const malformedTimestampTask = await quoted();
  await assert.rejects(() =>
    transitionPaidTask(malformedTimestampTask, {
      type: "expire",
      observedAt: "2026-09-07T00:00:00Z",
    }),
  );
  assert.equal(
    (await transitionPaidTask(malformedTimestampTask, eventFor("expire"))).state,
    "expired",
  );
});

test("matches the complete requirements object only at payment submission", async () => {
  const reordered = {
    payment: { amount: "20", asset: "tinybar" },
    x402Version: 2,
  };
  assert.equal(
    (await transitionPaidTask(await quoted(), {
      type: "payment_submitted",
      observedAt: beforeExpiry,
      requirements: reordered,
    })).state,
    "payment_submitted",
  );

  const accessor = {};
  Object.defineProperty(accessor, "payment", {
    enumerable: true,
    get() {
      throw new Error("requirements accessor must not run");
    },
  });

  const hostile = new Proxy(validRequirements, {
    ownKeys() {
      throw new Error("requirements proxy must not run");
    },
  });

  for (const requirements of [
    { ...validRequirements, payment: { asset: "tinybar", amount: "21" } },
    { ...validRequirements, extra: true },
    { x402Version: 2 },
    [],
    accessor,
    hostile,
  ]) {
    const task = await quoted();
    await assert.rejects(() =>
      transitionPaidTask(task, {
        type: "payment_submitted",
        observedAt: beforeExpiry,
        requirements,
      }),
    );
    assert.equal(
      (await transitionPaidTask(task, eventFor("payment_submitted"))).state,
      "payment_submitted",
    );
  }
});

test("rejects skipped and duplicate edges from the closed transition matrix", async () => {
  const allEvents = [
    "expire",
    "payment_submitted",
    "payment_rejected",
    "payment_outcome_unknown",
    "payment_settled",
    "execution_started",
    "result_valid",
    "execution_failed",
    "response_outcome_unknown",
  ];
  const stateCases = [
    [[], ["expire", "payment_submitted"]],
    [["expire"], []],
    [["payment_submitted"], ["payment_rejected", "payment_outcome_unknown", "payment_settled"]],
    [["payment_submitted", "payment_rejected"], []],
    [["payment_submitted", "payment_outcome_unknown"], []],
    [["payment_submitted", "payment_settled"], ["execution_started"]],
    [["payment_submitted", "payment_settled", "execution_started"], ["result_valid", "execution_failed", "response_outcome_unknown"]],
    [["payment_submitted", "payment_settled", "execution_started", "result_valid"], []],
    [["payment_submitted", "payment_settled", "execution_started", "execution_failed"], []],
    [["payment_submitted", "payment_settled", "execution_started", "response_outcome_unknown"], []],
  ];

  for (const [path, allowedEvents] of stateCases) {
    for (const type of allEvents) {
      if (allowedEvents.includes(type)) {
        continue;
      }

      await assert.rejects(async () =>
        transitionPaidTask(await follow(path), eventFor(type)),
      );
    }

    for (const type of allowedEvents) {
      const state = await follow(path);
      await transitionPaidTask(state, eventFor(type));
      await assert.rejects(() => transitionPaidTask(state, eventFor(type)));
    }
  }

  const quotedTask = await quoted();
  await assert.rejects(() =>
    transitionPaidTask(quotedTask, eventFor("payment_settled")),
  );
  assert.equal(
    (await transitionPaidTask(quotedTask, eventFor("payment_submitted"))).state,
    "payment_submitted",
  );
});

test("rejects non-issued states before it trusts their visible fields", async () => {
  const task = await quoted();
  const copied = { ...task };
  const frozenLookalike = Object.freeze({ ...task });
  const proxied = new Proxy(task, {});
  const accessor = {};
  let accessorReads = 0;
  Object.defineProperty(accessor, "state", {
    enumerable: true,
    get() {
      accessorReads += 1;
      throw new Error("unissued state field must not be read");
    },
  });

  for (const state of [copied, frozenLookalike, proxied, accessor]) {
    await assert.rejects(() => transitionPaidTask(state, eventFor("expire")));
  }
  assert.equal(accessorReads, 0);
});

test("rejects nested and concurrent transitions while hashing, and only consumes on success", async () => {
  const task = await quoted();
  let nestedRejection;
  const outer = transitionPaidTask(task, {
    type: "payment_submitted",
    observedAt: beforeExpiry,
    get requirements() {
      nestedRejection = assert.rejects(
        transitionPaidTask(task, eventFor("expire")),
      );
      return validRequirements;
    },
  });

  const concurrentRejection = assert.rejects(
    transitionPaidTask(task, eventFor("expire")),
  );
  const submitted = await outer;
  assert.equal(submitted.state, "payment_submitted");
  assert.ok(nestedRejection);
  await nestedRejection;
  await concurrentRejection;
  await assert.rejects(() => transitionPaidTask(task, eventFor("expire")));

  const rejectedReadTask = await quoted();
  const readFailure = new Error("event read failed");
  await assert.rejects(
    () => transitionPaidTask(rejectedReadTask, {
      get type() {
        throw readFailure;
      },
    }),
    readFailure,
  );
  assert.equal(
    (await transitionPaidTask(rejectedReadTask, eventFor("payment_submitted"))).state,
    "payment_submitted",
  );

  const retryable = await quoted();
  await assert.rejects(() =>
    transitionPaidTask(retryable, {
      type: "payment_submitted",
      observedAt: beforeExpiry,
      requirements: { x402Version: 2 },
    }),
  );
  assert.equal(
    (await transitionPaidTask(retryable, eventFor("payment_submitted"))).state,
    "payment_submitted",
  );
});
