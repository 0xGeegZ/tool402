export const backendBoundary = {
  runtime: "local",
} as const;

export { projectRiskScanLifecycle } from "./risk-scan-projection.ts";
export type {
  RiskScanCompletedProjection,
  RiskScanExecutionFailedProjection,
  RiskScanLifecycleProjection,
  RiskScanPaymentFailedProjection,
  RiskScanPaymentPendingProjection,
  RiskScanPaymentRequiredProjection,
  RiskScanUnavailableProjection,
} from "./risk-scan-projection.ts";
