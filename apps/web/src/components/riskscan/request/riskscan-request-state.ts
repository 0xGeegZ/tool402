import type { RiskScanQuickInput, RiskScanQuickResult } from "@tool402/core";

export type RiskScanRequestOutcome =
  | { kind: "unavailable" }
  | { kind: "payment_required" }
  | { kind: "invalid_request" }
  | { kind: "transport_failure" }
  | { kind: "unexpected_response" }
  | { kind: "quick_response"; result: RiskScanQuickResult };

export type RiskScanRequestSender = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

function isNonblankString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isNonemptyNonblankStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(isNonblankString)
  );
}

function readRiskScanQuickResult(
  value: unknown,
): RiskScanQuickResult | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }

  const result = value as Record<string, unknown>;
  const requestRef = result.requestRef;
  const subjectRef = result.subjectRef;
  const context = result.context;
  const disposition = result.disposition;
  const reasons = result.reasons;
  const limitations = result.limitations;

  if (
    !isNonblankString(requestRef) ||
    !isNonblankString(subjectRef) ||
    !isNonblankString(context) ||
    (disposition !== "needs_disclosure" &&
      disposition !== "disclosures_reported") ||
    !isNonemptyNonblankStringArray(reasons) ||
    !isNonemptyNonblankStringArray(limitations)
  ) {
    return undefined;
  }

  return {
    requestRef,
    subjectRef,
    context,
    disposition,
    reasons: [...reasons],
    limitations: [...limitations],
  };
}

export async function submitRiskScanRequest(
  input: RiskScanQuickInput,
  sender: RiskScanRequestSender = fetch,
): Promise<RiskScanRequestOutcome> {
  let response: Response;
  try {
    response = await sender("/api/riskscan", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    return { kind: "transport_failure" };
  }

  if (response.status === 503) return { kind: "unavailable" };
  if (response.status === 400) return { kind: "invalid_request" };
  if (response.status === 402) {
    return response.headers.get("payment-required")?.trim()
      ? { kind: "payment_required" }
      : { kind: "unexpected_response" };
  }
  if (response.status !== 200) return { kind: "unexpected_response" };

  try {
    const result: unknown = await response.json();
    const quickResult = readRiskScanQuickResult(result);
    return quickResult
      ? { kind: "quick_response", result: quickResult }
      : { kind: "unexpected_response" };
  } catch {
    return { kind: "unexpected_response" };
  }
}
