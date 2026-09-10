import type { PaymentRequired } from "@x402/core/types";

export type RiskScanPayDiagnostic =
  | "CONFIGURATION_INVALID"
  | "DIRECTORY_FAILED"
  | "QUOTE_DECLINED"
  | "INITIAL_REQUEST_OR_CHALLENGE_FAILED"
  | "PAYMENT_PAYLOAD_OR_SIGNING_FAILED"
  | "SIGNED_RETRY_FAILED"
  | "SETTLEMENT_OR_RESULT_FAILED"
  | "PAID"
  | "TERMINAL_UNEXPECTED_FAILURE"
  | "PREFLIGHT_GUARD_REACHED";

type RiskScanPayPhase = {
  readonly phase: "configuration" | "directory" | "quote" | "initial_request" | "payment_payload" | "signed_retry" | "settlement" | "preflight_guard" | "terminal";
} | {
  readonly phase: "result";
  readonly outcome?: { readonly kind?: unknown };
};

type PreflightQuote = {
  readonly network: unknown;
  readonly asset: unknown;
  readonly amount: unknown;
};

export function diagnosticForRiskScanPayPhase(value: RiskScanPayPhase): RiskScanPayDiagnostic {
  switch (value.phase) {
    case "configuration": return "CONFIGURATION_INVALID";
    case "directory": return "DIRECTORY_FAILED";
    case "quote": return "QUOTE_DECLINED";
    case "initial_request": return "INITIAL_REQUEST_OR_CHALLENGE_FAILED";
    case "payment_payload": return "PAYMENT_PAYLOAD_OR_SIGNING_FAILED";
    case "signed_retry": return "SIGNED_RETRY_FAILED";
    case "settlement": return "SETTLEMENT_OR_RESULT_FAILED";
    case "preflight_guard": return "PREFLIGHT_GUARD_REACHED";
    case "result": return value.outcome?.kind === "paid" ? "PAID" : "SETTLEMENT_OR_RESULT_FAILED";
    case "terminal": return "TERMINAL_UNEXPECTED_FAILURE";
  }
}

export function formatRiskScanPayDiagnostic(value: RiskScanPayDiagnostic): string {
  return `RISKSCAN_PAY_DIAGNOSTIC ${value}\n`;
}

export function matchesRiskScanPayPreflightChallenge(
  value: unknown,
  quote: PreflightQuote,
): value is PaymentRequired {
  try {
    if (typeof value !== "object" || value === null) return false;
    const paymentRequired = value as { x402Version?: unknown; accepts?: unknown };
    if (paymentRequired.x402Version !== 2 || !Array.isArray(paymentRequired.accepts) || paymentRequired.accepts.length !== 1) {
      return false;
    }
    const requirement = paymentRequired.accepts[0] as {
      scheme?: unknown;
      network?: unknown;
      asset?: unknown;
      amount?: unknown;
    };
    const amount = typeof quote.amount === "bigint" ? quote.amount.toString() : quote.amount;
    return typeof requirement === "object" && requirement !== null &&
      requirement.scheme === "exact" &&
      requirement.network === quote.network &&
      requirement.asset === quote.asset &&
      requirement.amount === amount;
  } catch {
    return false;
  }
}
