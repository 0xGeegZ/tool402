import {
  assessRiskScanQuick,
  type RiskScanQuickInput,
  type RiskScanQuickResult,
} from "@tool402/core";

export type RiskScanQuickPreflightViewState =
  | { readonly kind: "idle" }
  | { readonly kind: "assessment"; readonly assessment: RiskScanQuickResult }
  | { readonly kind: "invalid_input" };

const localPreparationBoundary =
  "This is caller-reported local preparation only. No request was sent, and it does not confirm a payment, service, evidence, or live availability.";

function readText(data: FormData, name: "requestRef" | "subjectRef" | "context"): string {
  const value = data.get(name);
  return typeof value === "string" ? value : "";
}

export function readRiskScanQuickPreflightInput(data: FormData): RiskScanQuickInput {
  return {
    requestRef: readText(data, "requestRef"),
    subjectRef: readText(data, "subjectRef"),
    context: readText(data, "context"),
    declarations: {
      identity: data.get("identity") === "on",
      pricing: data.get("pricing") === "on",
      limitations: data.get("limitations") === "on",
      evidence: data.get("evidence") === "on",
    },
  };
}

export function evaluateRiskScanQuickPreflight(
  input: RiskScanQuickInput,
): RiskScanQuickPreflightViewState {
  try {
    return { kind: "assessment", assessment: assessRiskScanQuick(input) };
  } catch (error) {
    if (error instanceof TypeError || error instanceof RangeError) {
      return { kind: "invalid_input" };
    }

    throw error;
  }
}

export function riskScanQuickPreflightOutcomeMessage(
  state: RiskScanQuickPreflightViewState,
): string | null {
  switch (state.kind) {
    case "idle":
      return null;
    case "invalid_input":
      return `The local preflight input is invalid. ${localPreparationBoundary}`;
    case "assessment":
      return state.assessment.disposition === "needs_disclosure"
        ? `One or more caller-reported disclosures are absent. ${localPreparationBoundary}`
        : `All four disclosures are caller reported. ${localPreparationBoundary}`;
  }
}
