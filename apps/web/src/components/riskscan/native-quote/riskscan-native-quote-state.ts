import type { RiskScanNativeQuoteAgentOutcome } from "@tool402/agent/riskscan-tool-native-quote-evaluation";

export type NativeQuoteCompatibilityPolicy = {
  readonly network: FormDataEntryValue | null;
  readonly asset: FormDataEntryValue | null;
  readonly maximumAmount: FormDataEntryValue | null;
};

export type NativeQuoteCompatibilityViewState =
  | { readonly kind: "idle" }
  | { readonly kind: "evaluating" }
  | RiskScanNativeQuoteAgentOutcome;

export type MutableBoolean = { current: boolean };

export function readNativeQuotePolicy(data: FormData): NativeQuoteCompatibilityPolicy {
  return {
    network: data.get("network"),
    asset: data.get("asset"),
    maximumAmount: data.get("maximumAmount"),
  };
}

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

export function nativeQuoteCompatibilityOutcomeMessage(
  state: NativeQuoteCompatibilityViewState,
): string | null {
  switch (state.kind) {
    case "idle":
      return null;
    case "evaluating":
      return "Evaluating local native quote compatibility.";
    case "directory_unavailable":
      return "RiskScan directory is unavailable. Local compatibility was not evaluated.";
    case "directory_invalid":
      return "RiskScan directory is invalid. Local compatibility was not evaluated.";
    case "native_summary_unavailable":
      return "A local native summary is unavailable. Local compatibility was not evaluated.";
    case "declined":
      return "The submitted local policy is not compatible with the advertised native summary.";
    case "eligible":
      return "The advertised native summary is locally compatible. This is not consent, availability, a quote guarantee, payment authorization, or a transaction.";
  }
}
