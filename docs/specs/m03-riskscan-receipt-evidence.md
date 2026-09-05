# M03 RiskScan verified receipt/evidence binding contract

## Delivery boundary

This contract extends the accepted pure RiskScan lifecycle in the core package. It binds opaque receipt and evidence references to one exact verified-settlement capability before a request may become `completed`.

It does not call an adapter, parse a payment protocol response, make an HTTP request, persist data, create a wallet or account, sign or settle a payment, verify an external record, expose a UI, or make a live-evidence or deployment claim. A receipt or evidence reference is a locally typed correlation value, not proof that a resource exists outside this process.

## Trusted inputs and artifact binding

`RiskScanVerifiedSettlement` remains the only trusted settlement input. It is created only from the accepted `payment_pending` transition and is already an opaque frozen capability.

The core exports these additional public types and function:

```ts
export interface RiskScanReceiptEvidenceInput {
  receiptRef: string;
  evidenceRef: string;
}

export interface RiskScanBoundReceiptEvidence {
  readonly requestRef: string;
  readonly settlementRef: string;
  readonly receiptRef: string;
  readonly evidenceRef: string;
}

export function bindRiskScanReceiptEvidence(
  settlement: RiskScanVerifiedSettlement,
  input: RiskScanReceiptEvidenceInput,
): RiskScanBoundReceiptEvidence;
```

`receiptRef` and `evidenceRef` are required nonblank trimmed opaque strings. The binder copies `requestRef` and `settlementRef` from the verified settlement; callers cannot supply or override either correlation. It freezes the returned artifact and records both that exact artifact identity and the exact verified-settlement object that created it.

The contract does not require the two opaque artifact references to differ, and it does not interpret their contents.

## Completion

Completion accepts the verified settlement, its exact bound artifact, and assessment content as separate inputs:

```ts
export interface RiskScanAssessmentCompletionInput {
  resultRef: string;
  salientReasons: readonly string[];
  limitations: readonly string[];
}

export function completeRiskScanRequest(
  settlement: RiskScanVerifiedSettlement,
  artifacts: RiskScanBoundReceiptEvidence,
  completion: RiskScanAssessmentCompletionInput,
): RiskScanCompleted;
```

`RiskScanAssessmentCompletionInput` deliberately has no `requestRef`, `settlementRef`, `receiptRef`, or `evidenceRef`. `completeRiskScanRequest` must reject an unregistered, copied, forged, or differently-bound artifact, including an artifact whose visible strings match a distinct verified-settlement object. It returns the established `completed` shape only after the verified settlement and artifact have the required identity relationship.

The existing validation for `resultRef`, `salientReasons`, and `limitations` remains unchanged. A completed state retains its established request, subject, context, settlement, result, receipt, and evidence fields.

## Failure boundary

Blank or non-string artifact references, an untrusted settlement, a copied or forged artifact, or an artifact bound to another settlement are local contract errors. They produce no `RiskScanCompleted` state.

A later server-side adapter may map a verified external settlement and a post-settlement local execution failure to the accepted `execution_failed` lifecycle state. That adapter, its response contract, receipt/evidence capture, and any paid journey are separate local work; this core contract must not fabricate them.

## Public and ownership boundary

Only the pure core package changes:

- `packages/core/src/risk-scan.ts` owns the opaque artifact registry, public types, binder, and completed-state transition.
- `packages/core/src/index.ts` re-exports the public binding API and removes the superseded completion-input type.
- `packages/core/test/risk-scan.test.mjs` proves the public API and adversarial identity boundary.

The backend projection, API route, server protection helper, browser request flow, configuration, and dependencies are unchanged by this card.

## Acceptance evidence

- RED/GREEN public-core tests prove a valid artifact is trimmed, frozen, and completes only with its exact verified settlement.
- Tests reject blank artifact fields, a reflective copy, a forged artifact, and a valid artifact passed with a distinct settlement object even when visible correlations match.
- Tests prove completion no longer receives caller-supplied request, settlement, receipt, or evidence correlations.
- Core typecheck, tests, pure-boundary lint, backend compatibility checks, queue validation, the local-reference guard, and independent review pass.
