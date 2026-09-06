import type { RiskScanToolFlowOutcome } from "@tool402/agent/riskscan-tool-flow";

export type ToolLoopViewState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | RiskScanToolFlowOutcome;

export type MutableBoolean = { current: boolean };

export async function runExclusive<T>(
  inFlight: MutableBoolean,
  runner: () => Promise<T>,
): Promise<T | undefined> {
  if (inFlight.current) return undefined;
  inFlight.current = true;
  try {
    return await runner();
  } finally {
    inFlight.current = false;
  }
}

export function toolLoopOutcomeMessage(state: ToolLoopViewState): string | null {
  switch (state.kind) {
    case "idle":
      return null;
    case "submitting":
      return "Sending the ToolLoop request boundary.";
    case "directory_unavailable":
      return "RiskScan directory is unavailable. No RiskScan request was sent.";
    case "directory_invalid":
      return "RiskScan directory is invalid. No RiskScan request was sent.";
    case "input_invalid":
      return "The input was rejected. No RiskScan request was sent.";
    case "transport_failure":
      return "The request could not reach the service. No payment or result is confirmed or shown.";
    case "unavailable":
      return "RiskScan is unavailable. No payment or result is confirmed or shown.";
    case "payment_required":
      return "A payment challenge was returned. No payment was made in this browser.";
    case "unexpected_response":
      return "The service returned an unexpected response. No payment or result is confirmed or shown.";
  }
}
