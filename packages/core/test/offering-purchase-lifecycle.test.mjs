import assert from "node:assert/strict";
import test from "node:test";

import {
  createOfferingPurchase,
  createOfferingRequirementsQuote,
  createOfferingTerms,
  parseNoteUnits,
  transitionOfferingPurchase,
} from "@tool402/core";

const beforeExpiry = "2026-09-06T17:59:59.999Z";
const atExpiry = "2026-09-06T18:00:00.000Z";

const validTermsInput = {
  version: "offering-v1",
  fundingTargetTinybars: "100",
  noteUnitPriceTinybars: "10",
  maximumNoteUnits: "10",
  minimumPurchaseUnits: "2",
  reserveShareBps: "2000",
  issuerShareBps: "8000",
  platformFeeBps: "0",
  payoutCapTinybars: "150",
};

function noteUnits(value) {
  const parsed = parseNoteUnits(value);
  assert.notEqual(parsed, undefined);
  return parsed;
}

async function validQuote(expiresAt = atExpiry) {
  return createOfferingRequirementsQuote(createOfferingTerms(validTermsInput), {
    expectedTermsVersion: "offering-v1",
    requestedUnits: noteUnits("2"),
    confirmedAllocatedUnits: noteUnits("3"),
    requirements: {
      x402Version: 2,
      payment: { amount: "20", asset: "tinybar" },
    },
    expiresAt,
  });
}

function eventFor(type) {
  if (type === "open" || type === "payment_submitted") {
    return { type, observedAt: beforeExpiry };
  }

  if (type === "expire") {
    return { type, observedAt: atExpiry };
  }

  return { type };
}

function snapshotOf(state) {
  return {
    termsVersion: state.termsVersion,
    requestedUnits: state.requestedUnits,
    paymentTinybars: state.paymentTinybars,
    requirementsDigest: state.requirementsDigest,
    expiresAt: state.expiresAt,
  };
}

test("creates a frozen issued draft with only the permitted quote snapshot", async () => {
  const quote = await validQuote();
  const draft = createOfferingPurchase(quote);

  assert.equal(draft.state, "draft");
  assert.deepEqual(snapshotOf(draft), {
    termsVersion: quote.termsVersion,
    requestedUnits: quote.requestedUnits,
    paymentTinybars: quote.paymentTinybars,
    requirementsDigest: quote.requirementsDigest,
    expiresAt: quote.expiresAt,
  });
  assert.deepEqual(Reflect.ownKeys(draft).sort(), [
    "expiresAt",
    "paymentTinybars",
    "requestedUnits",
    "requirementsDigest",
    "state",
    "termsVersion",
  ]);
  assert.equal(Object.isFrozen(draft), true);
  assert.throws(() => {
    draft.state = "awaiting_payment";
  });
});

test("accepts only an exact issued quote before it reads quote fields", async () => {
  const quote = await validQuote();
  const copiedQuote = { ...quote };
  const frozenLookalike = Object.freeze({ ...quote });
  const proxiedQuote = new Proxy(quote, {});
  const mutableLookalike = { ...quote };

  for (const lookalike of [
    copiedQuote,
    frozenLookalike,
    proxiedQuote,
    mutableLookalike,
  ]) {
    assert.throws(() => createOfferingPurchase(lookalike));
  }

  const accessFailure = new Error("quote field must not be read");
  const accessorLookalike = {};
  Object.defineProperty(accessorLookalike, "termsVersion", {
    enumerable: true,
    get() {
      throw accessFailure;
    },
  });
  assert.throws(
    () => createOfferingPurchase(accessorLookalike),
    /invalid offering purchase quote/u,
  );
});

test("permits every closed legal edge and preserves the frozen quote snapshot", async () => {
  const quote = await validQuote();
  const expectedSnapshot = {
    termsVersion: quote.termsVersion,
    requestedUnits: quote.requestedUnits,
    paymentTinybars: quote.paymentTinybars,
    requirementsDigest: quote.requirementsDigest,
    expiresAt: quote.expiresAt,
  };
  const legalPaths = [
    [["open", "awaiting_payment"]],
    [["open", "awaiting_payment"], ["expire", "expired"]],
    [["open", "awaiting_payment"], ["payment_submitted", "payment_submitted"]],
    [["open", "awaiting_payment"], ["payment_submitted", "payment_submitted"], ["payment_rejected", "payment_rejected"]],
    [["open", "awaiting_payment"], ["payment_submitted", "payment_submitted"], ["payment_outcome_unknown", "payment_outcome_unknown"]],
    [["open", "awaiting_payment"], ["payment_submitted", "payment_submitted"], ["payment_confirmed", "payment_confirmed"]],
    [["open", "awaiting_payment"], ["payment_submitted", "payment_submitted"], ["payment_confirmed", "payment_confirmed"], ["allocation_pending", "allocation_pending"]],
    [["open", "awaiting_payment"], ["payment_submitted", "payment_submitted"], ["payment_confirmed", "payment_confirmed"], ["allocation_pending", "allocation_pending"], ["allocation_submitted", "allocation_submitted"]],
    [["open", "awaiting_payment"], ["payment_submitted", "payment_submitted"], ["payment_confirmed", "payment_confirmed"], ["allocation_pending", "allocation_pending"], ["allocation_submitted", "allocation_submitted"], ["complete", "complete"]],
    [["open", "awaiting_payment"], ["payment_submitted", "payment_submitted"], ["payment_confirmed", "payment_confirmed"], ["allocation_pending", "allocation_pending"], ["allocation_submitted", "allocation_submitted"], ["allocation_outcome_unknown", "allocation_outcome_unknown"]],
    [["open", "awaiting_payment"], ["payment_submitted", "payment_submitted"], ["payment_confirmed", "payment_confirmed"], ["allocation_pending", "allocation_pending"], ["refund_required", "refund_required"]],
    [["open", "awaiting_payment"], ["payment_submitted", "payment_submitted"], ["payment_confirmed", "payment_confirmed"], ["allocation_pending", "allocation_pending"], ["manual_reconciliation", "manual_reconciliation"]],
    [["open", "awaiting_payment"], ["payment_submitted", "payment_submitted"], ["payment_confirmed", "payment_confirmed"], ["allocation_pending", "allocation_pending"], ["refund_required", "refund_required"], ["refund_submitted", "refund_submitted"]],
    [["open", "awaiting_payment"], ["payment_submitted", "payment_submitted"], ["payment_confirmed", "payment_confirmed"], ["allocation_pending", "allocation_pending"], ["refund_required", "refund_required"], ["manual_reconciliation", "manual_reconciliation"]],
    [["open", "awaiting_payment"], ["payment_submitted", "payment_submitted"], ["payment_confirmed", "payment_confirmed"], ["allocation_pending", "allocation_pending"], ["refund_required", "refund_required"], ["refund_submitted", "refund_submitted"], ["refunded", "refunded"]],
    [["open", "awaiting_payment"], ["payment_submitted", "payment_submitted"], ["payment_confirmed", "payment_confirmed"], ["allocation_pending", "allocation_pending"], ["refund_required", "refund_required"], ["refund_submitted", "refund_submitted"], ["refund_outcome_unknown", "refund_outcome_unknown"]],
  ];

  for (const path of legalPaths) {
    let state = createOfferingPurchase(quote);

    for (const [type, expectedState] of path) {
      state = transitionOfferingPurchase(state, eventFor(type));
      assert.equal(state.state, expectedState);
      assert.deepEqual(snapshotOf(state), expectedSnapshot);
      assert.equal(Object.isFrozen(state), true);
    }
  }
});

test("applies the exact explicit expiry rules without reading a clock", async () => {
  const quote = await validQuote();
  const draft = createOfferingPurchase(quote);

  assert.throws(() =>
    transitionOfferingPurchase(draft, { type: "open", observedAt: atExpiry }),
  );
  const awaitingPayment = transitionOfferingPurchase(draft, {
    type: "open",
    observedAt: beforeExpiry,
  });

  assert.throws(() =>
    transitionOfferingPurchase(awaitingPayment, {
      type: "expire",
      observedAt: beforeExpiry,
    }),
  );
  const expired = transitionOfferingPurchase(awaitingPayment, {
    type: "expire",
    observedAt: atExpiry,
  });
  assert.equal(expired.state, "expired");

  const anotherAwaitingPayment = transitionOfferingPurchase(
    createOfferingPurchase(quote),
    { type: "open", observedAt: beforeExpiry },
  );
  assert.throws(() =>
    transitionOfferingPurchase(anotherAwaitingPayment, {
      type: "payment_submitted",
      observedAt: atExpiry,
    }),
  );
  assert.equal(
    transitionOfferingPurchase(anotherAwaitingPayment, {
      type: "payment_submitted",
      observedAt: beforeExpiry,
    }).state,
    "payment_submitted",
  );

  assert.throws(() =>
    transitionOfferingPurchase(createOfferingPurchase(quote), {
      type: "open",
      observedAt: "2026-09-06T18:00:00Z",
    }),
  );
});

test("consumes only successful issued sources and rejects structural copies", async () => {
  const quote = await validQuote();
  const draft = createOfferingPurchase(quote);

  assert.throws(() => transitionOfferingPurchase(draft, { type: "complete" }));
  const awaitingPayment = transitionOfferingPurchase(draft, {
    type: "open",
    observedAt: beforeExpiry,
  });
  assert.throws(() =>
    transitionOfferingPurchase(draft, { type: "open", observedAt: beforeExpiry }),
  );
  assert.throws(() => transitionOfferingPurchase(draft, { type: "expire", observedAt: atExpiry }));

  assert.throws(() =>
    transitionOfferingPurchase(awaitingPayment, { type: "payment_confirmed" }),
  );
  const paymentSubmitted = transitionOfferingPurchase(awaitingPayment, {
    type: "payment_submitted",
    observedAt: beforeExpiry,
  });
  const paymentRejected = transitionOfferingPurchase(paymentSubmitted, {
    type: "payment_rejected",
  });
  assert.equal(paymentRejected.state, "payment_rejected");
  assert.throws(() =>
    transitionOfferingPurchase(paymentSubmitted, { type: "payment_confirmed" }),
  );

  const forged = { ...awaitingPayment };
  assert.throws(() =>
    transitionOfferingPurchase(forged, {
      type: "payment_submitted",
      observedAt: beforeExpiry,
    }),
  );
});

test("rejects reentrant transitions without consuming a source after a rejected read", async () => {
  const quote = await validQuote();
  const draft = createOfferingPurchase(quote);
  let typeReentryState;
  let typeReentryError;

  const typeReentryResult = transitionOfferingPurchase(draft, {
    get type() {
      try {
        typeReentryState = transitionOfferingPurchase(draft, {
          type: "open",
          observedAt: beforeExpiry,
        });
      } catch (error) {
        typeReentryError = error;
      }

      return "open";
    },
    observedAt: beforeExpiry,
  });

  assert.equal(typeReentryResult.state, "awaiting_payment");
  assert.equal(typeReentryState, undefined);
  assert.ok(typeReentryError instanceof TypeError);

  const anotherDraft = createOfferingPurchase(quote);
  let observedAtReentryState;
  let observedAtReentryError;

  const observedAtReentryResult = transitionOfferingPurchase(anotherDraft, {
    type: "open",
    get observedAt() {
      try {
        observedAtReentryState = transitionOfferingPurchase(anotherDraft, {
          type: "open",
          observedAt: beforeExpiry,
        });
      } catch (error) {
        observedAtReentryError = error;
      }

      return beforeExpiry;
    },
  });

  assert.equal(observedAtReentryResult.state, "awaiting_payment");
  assert.equal(observedAtReentryState, undefined);
  assert.ok(observedAtReentryError instanceof TypeError);

  const rejectedReadDraft = createOfferingPurchase(quote);
  const readFailure = new Error("event read failed");

  assert.throws(
    () =>
      transitionOfferingPurchase(rejectedReadDraft, {
        get type() {
          throw readFailure;
        },
      }),
    readFailure,
  );
  assert.equal(
    transitionOfferingPurchase(rejectedReadDraft, {
      type: "open",
      observedAt: beforeExpiry,
    }).state,
    "awaiting_payment",
  );
});

test("rejects every skipped edge and every duplicate from the closed transition matrix", async () => {
  const quote = await validQuote();
  const allEventTypes = [
    "open",
    "expire",
    "payment_submitted",
    "payment_rejected",
    "payment_outcome_unknown",
    "payment_confirmed",
    "allocation_pending",
    "allocation_submitted",
    "allocation_outcome_unknown",
    "refund_required",
    "refund_submitted",
    "refund_outcome_unknown",
    "complete",
    "refunded",
    "manual_reconciliation",
  ];
  const states = [
    ["draft", [], ["open"]],
    ["awaiting_payment", ["open"], ["expire", "payment_submitted"]],
    ["expired", ["open", "expire"], []],
    ["payment_submitted", ["open", "payment_submitted"], ["payment_rejected", "payment_outcome_unknown", "payment_confirmed"]],
    ["payment_rejected", ["open", "payment_submitted", "payment_rejected"], []],
    ["payment_outcome_unknown", ["open", "payment_submitted", "payment_outcome_unknown"], []],
    ["payment_confirmed", ["open", "payment_submitted", "payment_confirmed"], ["allocation_pending"]],
    ["allocation_pending", ["open", "payment_submitted", "payment_confirmed", "allocation_pending"], ["allocation_submitted", "refund_required", "manual_reconciliation"]],
    ["allocation_submitted", ["open", "payment_submitted", "payment_confirmed", "allocation_pending", "allocation_submitted"], ["complete", "allocation_outcome_unknown"]],
    ["allocation_outcome_unknown", ["open", "payment_submitted", "payment_confirmed", "allocation_pending", "allocation_submitted", "allocation_outcome_unknown"], []],
    ["refund_required", ["open", "payment_submitted", "payment_confirmed", "allocation_pending", "refund_required"], ["refund_submitted", "manual_reconciliation"]],
    ["refund_submitted", ["open", "payment_submitted", "payment_confirmed", "allocation_pending", "refund_required", "refund_submitted"], ["refunded", "refund_outcome_unknown"]],
    ["refund_outcome_unknown", ["open", "payment_submitted", "payment_confirmed", "allocation_pending", "refund_required", "refund_submitted", "refund_outcome_unknown"], []],
    ["complete", ["open", "payment_submitted", "payment_confirmed", "allocation_pending", "allocation_submitted", "complete"], []],
    ["refunded", ["open", "payment_submitted", "payment_confirmed", "allocation_pending", "refund_required", "refund_submitted", "refunded"], []],
    ["manual_reconciliation", ["open", "payment_submitted", "payment_confirmed", "allocation_pending", "manual_reconciliation"], []],
  ];

  for (const [expectedState, path, allowedEvents] of states) {
    for (const type of allEventTypes) {
      if (allowedEvents.includes(type)) {
        continue;
      }

      let state = createOfferingPurchase(quote);
      for (const pathEvent of path) {
        state = transitionOfferingPurchase(state, eventFor(pathEvent));
      }

      assert.equal(state.state, expectedState);
      assert.throws(() => transitionOfferingPurchase(state, eventFor(type)));
    }

    for (const type of allowedEvents) {
      let state = createOfferingPurchase(quote);
      for (const pathEvent of path) {
        state = transitionOfferingPurchase(state, eventFor(pathEvent));
      }

      transitionOfferingPurchase(state, eventFor(type));
      assert.throws(() => transitionOfferingPurchase(state, eventFor(type)));
    }
  }
});

test("keeps every terminal and ambiguous outcome fail-closed", async () => {
  const quote = await validQuote();
  const pathsToTerminalStates = [
    ["open", "expire"],
    ["open", "payment_submitted", "payment_rejected"],
    ["open", "payment_submitted", "payment_outcome_unknown"],
    ["open", "payment_submitted", "payment_confirmed", "allocation_pending", "allocation_submitted", "complete"],
    ["open", "payment_submitted", "payment_confirmed", "allocation_pending", "allocation_submitted", "allocation_outcome_unknown"],
    ["open", "payment_submitted", "payment_confirmed", "allocation_pending", "manual_reconciliation"],
    ["open", "payment_submitted", "payment_confirmed", "allocation_pending", "refund_required", "manual_reconciliation"],
    ["open", "payment_submitted", "payment_confirmed", "allocation_pending", "refund_required", "refund_submitted", "refunded"],
    ["open", "payment_submitted", "payment_confirmed", "allocation_pending", "refund_required", "refund_submitted", "refund_outcome_unknown"],
  ];

  for (const path of pathsToTerminalStates) {
    let state = createOfferingPurchase(quote);

    for (const type of path) {
      state = transitionOfferingPurchase(state, eventFor(type));
    }

    assert.throws(() =>
      transitionOfferingPurchase(state, { type: "manual_reconciliation" }),
    );
  }
});
