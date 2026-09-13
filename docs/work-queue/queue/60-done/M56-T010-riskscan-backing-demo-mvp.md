# M56-T010 — RiskScan backing demo MVP

## State

- Tier: CORE_P0
- Queue state: 60-done
- Dependencies: S15-T010 accepted, S18-T010 accepted, M16-T010 accepted,
  M40-T010 accepted
- Owner: This lane owns this card and the M56 specification. The root retains
  queue movement, later source/test reservation, and every shared dependency.
- Human actions: Runtime configuration, BACKER provisioning, wallet use,
  signature, HBAR transfer, deployment, and demo recording remain human-owned.

## Proposed scope

The repository owner authorized one narrow successor to accepted S18. It makes
the backing journey actionable only for the canonical, OPEN RiskScan offering
with an explicit server-configured testnet treasury, adds its detail-page entry
point, and preserves the existing one-signature/one-transfer truth boundary.

The task may not add a funding ledger, persistence, allocation, a receipt
verifier, retry, transfer recovery, capacity handling, another wallet or relay,
an authority record, `external.attachCandidate`, token action, refund, payout,
or another project route. A returned transaction hash is shown only as
`payment_submitted` with allocation pending.

## GREEN scope

The RED contract is accepted. M56 owns only the exact source and test paths
listed in its specification for minimal GREEN. The existing offering reader,
wallet session, SignatureDialog, relay, and command admission remain shared and
must not be modified.

## Shared boundaries

M56 does not modify the existing offering reader, wallet session, Signature
Dialog, command relay, or command admission. If root integration changes any
of those paths, it must preserve this card's closed projection and one-send
contract.

## Acceptance

M56-T010 is accepted by the repository operator's ruling of 2026-09-12 on the
delivered work already merged on `main` at `07beeffe`. The GREEN authorized by
`M56_RISKSCAN_BACKING_DEMO_MVP_RED_ACCEPTANCE` at `27b0d762` was delivered
through pull request #107 at merge commit `00b80850`. All eleven source and
test paths the M56 specification names exist on `main`, including
`apps/web/src/lib/riskscan-backing-projection.ts`,
`apps/web/src/components/backing/backing-flow.tsx`,
`apps/web/src/components/backing/backing-state.ts`,
`apps/web/src/app/explore/riskscan/back/page.tsx`, and
`apps/web/tests/riskscan-backing-projection.test.mjs`. Verification is the merged-`main` state at `07beeffe`: the complete Web suite passes 547 of 548 with no failure and one skip, Web typecheck is clean, and the Web build renders 37 of 37 routes. The condition on the
M56-S26 scoped ownership transfer is satisfied: canonical `main` carries M56's
card, its specification at `docs/specs/m56-riskscan-backing-demo-mvp.md`, and
its catalog row, committed by pull request #107 and confirmed at `ce080a16`, so
the transfer is in effect rather than pending. The acceptance releases every
M56 path reservation and authorizes no funding ledger, persistence, allocation,
receipt verifier, retry, transfer recovery, capacity handling, second wallet or
relay, authority record, token action, refund, payout, runtime configuration,
BACKER provisioning, wallet use, signature, HBAR transfer, deployment, or
recording.
