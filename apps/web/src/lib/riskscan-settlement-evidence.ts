import type { RiskScanVerifiedSettlement } from "@tool402/core";

// Process-local and non-durable: a restart, a second instance, or a redeploy
// loses these entries, so nothing here is a durable record. No route reads the
// sink yet, and one must not be added casually: requestRef, subjectRef, and
// context are caller-supplied free text, so any reader needs its own privacy
// contract first.

const maximumRecordedSettlements = 50;

const recordedSettlements: RiskScanVerifiedSettlement[] = [];

export function recordRiskScanVerifiedSettlement(
  settlement: RiskScanVerifiedSettlement,
): void {
  recordedSettlements.push(settlement);

  if (recordedSettlements.length > maximumRecordedSettlements) {
    recordedSettlements.splice(
      0,
      recordedSettlements.length - maximumRecordedSettlements,
    );
  }
}

export function readRiskScanSettlementEvidence(): RiskScanVerifiedSettlement[] {
  return [...recordedSettlements];
}

export function clearRiskScanSettlementEvidence(): void {
  recordedSettlements.length = 0;
}
