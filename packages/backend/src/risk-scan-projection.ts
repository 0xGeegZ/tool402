import type { RiskScanLifecycleState } from "@tool402/core";

interface RiskScanBaseProjection {
  state: RiskScanLifecycleState["state"];
  requestRef: string;
  subjectRef: string;
  context: string;
}

export interface RiskScanUnavailableProjection
  extends RiskScanBaseProjection {
  state: "unavailable";
  reason: string;
}

export interface RiskScanPaymentRequiredProjection
  extends RiskScanBaseProjection {
  state: "payment_required";
}

export interface RiskScanPaymentPendingProjection
  extends RiskScanBaseProjection {
  state: "payment_pending";
}

export interface RiskScanPaymentFailedProjection
  extends RiskScanBaseProjection {
  state: "payment_failed";
  reason: string;
}

export interface RiskScanExecutionFailedProjection
  extends RiskScanBaseProjection {
  state: "execution_failed";
  settlementRef: string;
  reason: string;
}

export interface RiskScanCompletedProjection extends RiskScanBaseProjection {
  state: "completed";
  settlementRef: string;
  result: {
    resultRef: string;
    salientReasons: string[];
    limitations: string[];
  };
  receiptRef: string;
  evidenceRef: string;
}

export type RiskScanLifecycleProjection =
  | RiskScanUnavailableProjection
  | RiskScanPaymentRequiredProjection
  | RiskScanPaymentPendingProjection
  | RiskScanPaymentFailedProjection
  | RiskScanExecutionFailedProjection
  | RiskScanCompletedProjection;

function projectBaseState(
  state: RiskScanLifecycleState,
): RiskScanBaseProjection {
  return {
    state: state.state,
    requestRef: state.requestRef,
    subjectRef: state.subjectRef,
    context: state.context,
  };
}

export function projectRiskScanLifecycle(
  state: RiskScanLifecycleState,
): RiskScanLifecycleProjection {
  switch (state.state) {
    case "unavailable":
      return { ...projectBaseState(state), state: "unavailable", reason: state.reason };
    case "payment_required":
      return { ...projectBaseState(state), state: "payment_required" };
    case "payment_pending":
      return { ...projectBaseState(state), state: "payment_pending" };
    case "payment_failed":
      return { ...projectBaseState(state), state: "payment_failed", reason: state.reason };
    case "execution_failed":
      return {
        ...projectBaseState(state),
        state: "execution_failed",
        settlementRef: state.settlementRef,
        reason: state.reason,
      };
    case "completed":
      return {
        ...projectBaseState(state),
        state: "completed",
        settlementRef: state.settlementRef,
        result: {
          resultRef: state.result.resultRef,
          salientReasons: [...state.result.salientReasons],
          limitations: [...state.result.limitations],
        },
        receiptRef: state.receiptRef,
        evidenceRef: state.evidenceRef,
      };
  }
}
