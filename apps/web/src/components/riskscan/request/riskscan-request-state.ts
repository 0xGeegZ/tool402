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

function isRiskScanQuickResult(value: unknown): value is RiskScanQuickResult {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const result = value as Record<string, unknown>;
  return (
    isNonblankString(result.requestRef) &&
    isNonblankString(result.subjectRef) &&
    isNonblankString(result.context) &&
    (result.disposition === "needs_disclosure" ||
      result.disposition === "disclosures_reported") &&
    Array.isArray(result.reasons) &&
    result.reasons.length > 0 &&
    result.reasons.every(isNonblankString) &&
    Array.isArray(result.limitations) &&
    result.limitations.length > 0 &&
    result.limitations.every(isNonblankString)
  );
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
    return isRiskScanQuickResult(result)
      ? { kind: "quick_response", result }
      : { kind: "unexpected_response" };
  } catch {
    return { kind: "unexpected_response" };
  }
}
