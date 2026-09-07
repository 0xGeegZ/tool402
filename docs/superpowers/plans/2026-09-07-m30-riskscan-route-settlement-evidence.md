# M30 implementation plan — RiskScan route settlement evidence

Execution plan for [M30-T010](../../work-queue/queue/60-done/M30-T010-riskscan-route-settlement-evidence.md)
against the [M30 route settlement-evidence contract](../../specs/m30-riskscan-route-settlement-evidence.md).

## Observed defect

A configured local route was exercised against a public Hedera testnet
facilitator. Two protected requests settled successfully on the ledger and the
route issued no local capability, because `handleRiskScanPost` calls
`getCachedRiskScanProtectedHandler(configuration)` with no options and
`RiskScanPostOptions` carries no consumer member. The accepted observer is
therefore constructed with `options.onVerifiedSettlement === undefined`, takes
its disabled branch, and registers no after-settle hook.

## Sequence

1. Commit the contract, plan, card, ledger row, catalog row, ownership
   reservation, decision row, and state before any code.
2. Write `apps/web/tests/riskscan-settlement-evidence.test.mjs` and observe it
   fail: the evidence module does not exist and the default recorder is not
   wired. This is the RED step and it is committed before the source change.
3. Add `apps/web/src/lib/riskscan-settlement-evidence.ts` with the three
   contract functions and the bound of 50 entries with oldest-first eviction.
4. Amend `apps/web/src/lib/riskscan-x402.ts`: add `onVerifiedSettlement` to
   `RiskScanPostOptions`, resolve the consumer once in `handleRiskScanPost`,
   pass the resolved consumer on both construction paths, and construct the
   cached handler with the default recorder.
5. Observe GREEN on the focused file, then run the full Web suite to prove the
   accepted M03 behavior is unchanged.
6. Run Web typecheck, test, and build, then root typecheck, test, lint,
   queue-check, and the local-reference guard.
7. Independent task review and a module-review generation, then integration.

## Minimality notes

The consumer is resolved once and passed through; no wrapper, retry, or
error-observation layer is added, because the accepted observer already
isolates a throwing or rejecting consumer from the protected response.

The handler cache keeps its per-configuration key. The default recorder is a
stable module-level function, so every cached handler for one configuration
carries the same consumer and one entry remains correct. No cache-key
machinery is introduced.

The sink stores the accepted core capability objects unchanged rather than a
derived record, so nothing in this card can weaken the M03 guarantee that the
capability is genuine.

## Explicitly out of scope

Durable storage, a public read surface, `projectRiskScanLifecycle` application,
receipt or evidence binding, a payment client, a signer, deployment, and any
live claim. Two of these are blocked by missing local producers rather than by
choice, and the contract records why.
