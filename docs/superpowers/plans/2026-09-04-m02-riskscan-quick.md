# M02 RiskScan Quick implementation plan

## Goal

Add the smallest deterministic, caller-declaration-only RiskScan assessment to the accepted core lifecycle without inventing an external risk signal or payment outcome.

## Owned files

- `packages/core/src/risk-scan-quick.ts`
- `packages/core/src/index.ts`
- `packages/core/test/risk-scan-quick.test.mjs`

## Steps

1. Add a focused RED test through the public core entry for malformed declarations, stable disclosure-gap reasons, the all-reported case, and the explicit limitation boundary.
2. Add typed pure input/output declarations and a small implementation that reuses the accepted request validator.
3. Run focused and full core tests, typecheck, lint, whitespace, and the local-reference guard.
4. Obtain independent review and integrate only the accepted delivery.
