import {
  isIssuedOfferingRequirementsQuote,
  isOfferingRequirementsQuoteActive,
} from "./requirements-offering-quote.ts";
import type {
  OfferingRequirementsQuote,
  RequirementsDigest,
} from "./requirements-offering-quote.ts";
import type { NoteUnits, Tinybar } from "./value.ts";

export interface OfferingPurchaseSnapshot {
  readonly termsVersion: string;
  readonly requestedUnits: NoteUnits;
  readonly paymentTinybars: Tinybar;
  readonly requirementsDigest: RequirementsDigest;
  readonly expiresAt: string;
}

export type OfferingPurchaseDraft = OfferingPurchaseSnapshot & {
  readonly state: "draft";
};

export type OfferingPurchaseAwaitingPayment = OfferingPurchaseSnapshot & {
  readonly state: "awaiting_payment";
};

export type OfferingPurchaseExpired = OfferingPurchaseSnapshot & {
  readonly state: "expired";
};

export type OfferingPurchasePaymentSubmitted = OfferingPurchaseSnapshot & {
  readonly state: "payment_submitted";
};

export type OfferingPurchasePaymentRejected = OfferingPurchaseSnapshot & {
  readonly state: "payment_rejected";
};

export type OfferingPurchasePaymentOutcomeUnknown = OfferingPurchaseSnapshot & {
  readonly state: "payment_outcome_unknown";
};

export type OfferingPurchasePaymentConfirmed = OfferingPurchaseSnapshot & {
  readonly state: "payment_confirmed";
};

export type OfferingPurchaseAllocationPending = OfferingPurchaseSnapshot & {
  readonly state: "allocation_pending";
};

export type OfferingPurchaseAllocationSubmitted = OfferingPurchaseSnapshot & {
  readonly state: "allocation_submitted";
};

export type OfferingPurchaseAllocationOutcomeUnknown = OfferingPurchaseSnapshot & {
  readonly state: "allocation_outcome_unknown";
};

export type OfferingPurchaseRefundRequired = OfferingPurchaseSnapshot & {
  readonly state: "refund_required";
};

export type OfferingPurchaseRefundSubmitted = OfferingPurchaseSnapshot & {
  readonly state: "refund_submitted";
};

export type OfferingPurchaseRefundOutcomeUnknown = OfferingPurchaseSnapshot & {
  readonly state: "refund_outcome_unknown";
};

export type OfferingPurchaseComplete = OfferingPurchaseSnapshot & {
  readonly state: "complete";
};

export type OfferingPurchaseRefunded = OfferingPurchaseSnapshot & {
  readonly state: "refunded";
};

export type OfferingPurchaseManualReconciliation = OfferingPurchaseSnapshot & {
  readonly state: "manual_reconciliation";
};

export type OfferingPurchaseState =
  | OfferingPurchaseDraft
  | OfferingPurchaseAwaitingPayment
  | OfferingPurchaseExpired
  | OfferingPurchasePaymentSubmitted
  | OfferingPurchasePaymentRejected
  | OfferingPurchasePaymentOutcomeUnknown
  | OfferingPurchasePaymentConfirmed
  | OfferingPurchaseAllocationPending
  | OfferingPurchaseAllocationSubmitted
  | OfferingPurchaseAllocationOutcomeUnknown
  | OfferingPurchaseRefundRequired
  | OfferingPurchaseRefundSubmitted
  | OfferingPurchaseRefundOutcomeUnknown
  | OfferingPurchaseComplete
  | OfferingPurchaseRefunded
  | OfferingPurchaseManualReconciliation;

export type OfferingPurchaseEvent =
  | { readonly type: "open"; readonly observedAt: string }
  | { readonly type: "expire"; readonly observedAt: string }
  | { readonly type: "payment_submitted"; readonly observedAt: string }
  | { readonly type: "payment_rejected" }
  | { readonly type: "payment_outcome_unknown" }
  | { readonly type: "payment_confirmed" }
  | { readonly type: "allocation_pending" }
  | { readonly type: "allocation_submitted" }
  | { readonly type: "allocation_outcome_unknown" }
  | { readonly type: "refund_required" }
  | { readonly type: "refund_submitted" }
  | { readonly type: "refund_outcome_unknown" }
  | { readonly type: "complete" }
  | { readonly type: "refunded" }
  | { readonly type: "manual_reconciliation" };

type OfferingPurchaseStateName = OfferingPurchaseState["state"];

type OfferingPurchaseStateFor<Name extends OfferingPurchaseStateName> = Extract<
  OfferingPurchaseState,
  { readonly state: Name }
>;

const issuedQuotes = new WeakMap<object, OfferingRequirementsQuote>();
const consumedStates = new WeakSet<object>();
const transitioningStates = new WeakSet<object>();

function rejectTransition(): never {
  throw new TypeError("invalid offering purchase transition");
}

function rejectQuote(): never {
  throw new TypeError("invalid offering purchase quote");
}

function issueState<Name extends OfferingPurchaseStateName>(
  state: Name,
  quote: OfferingRequirementsQuote,
): OfferingPurchaseStateFor<Name> {
  const issued = Object.freeze({
    state,
    termsVersion: quote.termsVersion,
    requestedUnits: quote.requestedUnits,
    paymentTinybars: quote.paymentTinybars,
    requirementsDigest: quote.requirementsDigest,
    expiresAt: quote.expiresAt,
  }) as OfferingPurchaseStateFor<Name>;

  issuedQuotes.set(issued, quote);
  return issued;
}

function quoteForIssuedState(
  state: OfferingPurchaseState,
): OfferingRequirementsQuote {
  if (
    typeof state !== "object" ||
    state === null ||
    consumedStates.has(state) ||
    transitioningStates.has(state)
  ) {
    return rejectTransition();
  }

  return issuedQuotes.get(state) ?? rejectTransition();
}

function requiresActiveQuote(
  quote: OfferingRequirementsQuote,
  event: OfferingPurchaseEvent,
): boolean {
  return (
    "observedAt" in event &&
    typeof event.observedAt === "string" &&
    isOfferingRequirementsQuoteActive(quote, event.observedAt)
  );
}

function requiresExpiredQuote(
  quote: OfferingRequirementsQuote,
  event: OfferingPurchaseEvent,
): boolean {
  return (
    "observedAt" in event &&
    typeof event.observedAt === "string" &&
    !isOfferingRequirementsQuoteActive(quote, event.observedAt)
  );
}

function nextStateName(
  state: OfferingPurchaseState,
  event: OfferingPurchaseEvent,
  quote: OfferingRequirementsQuote,
): OfferingPurchaseStateName {
  switch (state.state) {
    case "draft":
      return event.type === "open" && requiresActiveQuote(quote, event)
        ? "awaiting_payment"
        : rejectTransition();
    case "awaiting_payment":
      if (event.type === "expire") {
        return requiresExpiredQuote(quote, event) ? "expired" : rejectTransition();
      }

      return event.type === "payment_submitted" && requiresActiveQuote(quote, event)
        ? "payment_submitted"
        : rejectTransition();
    case "payment_submitted":
      switch (event.type) {
        case "payment_rejected":
          return "payment_rejected";
        case "payment_outcome_unknown":
          return "payment_outcome_unknown";
        case "payment_confirmed":
          return "payment_confirmed";
        default:
          return rejectTransition();
      }
    case "payment_confirmed":
      return event.type === "allocation_pending"
        ? "allocation_pending"
        : rejectTransition();
    case "allocation_pending":
      switch (event.type) {
        case "allocation_submitted":
          return "allocation_submitted";
        case "refund_required":
          return "refund_required";
        case "manual_reconciliation":
          return "manual_reconciliation";
        default:
          return rejectTransition();
      }
    case "allocation_submitted":
      switch (event.type) {
        case "complete":
          return "complete";
        case "allocation_outcome_unknown":
          return "allocation_outcome_unknown";
        default:
          return rejectTransition();
      }
    case "refund_required":
      switch (event.type) {
        case "refund_submitted":
          return "refund_submitted";
        case "manual_reconciliation":
          return "manual_reconciliation";
        default:
          return rejectTransition();
      }
    case "refund_submitted":
      switch (event.type) {
        case "refunded":
          return "refunded";
        case "refund_outcome_unknown":
          return "refund_outcome_unknown";
        default:
          return rejectTransition();
      }
    case "expired":
    case "payment_rejected":
    case "payment_outcome_unknown":
    case "allocation_outcome_unknown":
    case "refund_outcome_unknown":
    case "complete":
    case "refunded":
    case "manual_reconciliation":
      return rejectTransition();
  }
}

export function createOfferingPurchase(
  quote: OfferingRequirementsQuote,
): OfferingPurchaseDraft {
  if (!isIssuedOfferingRequirementsQuote(quote)) {
    return rejectQuote();
  }

  return issueState("draft", quote);
}

export function transitionOfferingPurchase(
  state: OfferingPurchaseState,
  event: OfferingPurchaseEvent,
): OfferingPurchaseState {
  const quote = quoteForIssuedState(state);
  transitioningStates.add(state);

  try {
    const successor = issueState(nextStateName(state, event, quote), quote);

    consumedStates.add(state);
    return successor;
  } finally {
    transitioningStates.delete(state);
  }
}
