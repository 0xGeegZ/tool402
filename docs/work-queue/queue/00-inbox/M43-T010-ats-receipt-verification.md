# M43-T010 — ATS candidate receipt attachment and Mirror verification

## State

- Tier: CORE_P0
- Queue state: 00-inbox
- Dependencies: M04-T010 accepted, M26-T010 accepted, M32-T010 accepted,
  M33-T010 accepted, M38-T010 (this batch), M39-T010 (this batch),
  M40-T010 (this batch), M41-T010 (this batch), M42-T010 (this batch)
- Owner: The root owns queue state, catalog, ownership, decisions, reviews,
  commits, and pushes. Proposed implementation paths are exactly
  `packages/backend/convex/ats_candidate_receipts.ts`,
  `packages/backend/convex/ats_receipt_verification.ts`,
  `packages/backend/src/ats/mirror-transaction-verifier.ts`,
  `packages/backend/tests/ats-candidate-receipts.test.mjs`,
  `packages/backend/tests/mirror-transaction-verifier.test.mjs`,
  `packages/backend/tests/ats-receipt-verification.test.mjs`,
  `packages/backend/convex/schema.ts` as an amendment under a root
  integration reservation naming that file,
  `packages/backend/tests/external-prepare-command-durable-schema.test.mjs`
  as an amendment under a root integration reservation naming that file, and
  `packages/backend/convex/command_dispatch.ts` as an amendment under a root
  integration reservation naming that file, enabling only the
  `external.attachCandidate` dispatch entry M41-T010 declares disabled.
- Human actions: HA-ATS-STAGE-B-001 gates live verification and names the
  read-only control-list call this card ships unconfigured. It is not
  complete. This card authorizes no ATS SDK call, provider, wallet, account
  action, funding, payment, transaction, submission, resubmission,
  publication, deployment, or live evidence.

## Scope

The accepted M32 attempt record has exactly one state, literal `PREPARED`,
and no place to hold a receipt. After a human has created a revenue note in
MetaMask there is therefore no local way to bind that transaction to the
prepared attempt, and no way to reach a verified state without a wallet
callback the [campaign deploy flow design](../../../superpowers/specs/2026-09-08-campaign-deploy-flow-design.md)
forbids.

M43 adds the receipt half of that path in three parts:

- one internal Convex mutation that attaches a candidate transaction to an
  existing `PREPARED` attempt and moves it to `SUBMITTED`, at most once per
  attempt and idempotent for an identical repeat;
- one pure Backend verifier over an already fetched Mirror Node transaction
  document, with an injected bounded reader that owns the timeout, byte cap,
  and fixed base URL; and
- one Node Convex action that reads the stored expectation, reads Mirror
  Node once, and records exactly one terminal outcome.

The local authority is the [M43 specification](../../../specs/m43-ats-receipt-verification.md).
The intake that requests this card is
[HI-002](../60-done/HI-002-campaign-deploy-reinstatement.md).

The committed control-list configuration has no enabled entry, exactly as
the [M33 gate](../../../specs/m33-ats-prepare-authority-gate.md) ships a
zero-enabled manifest. The `ATS_CREATE` path therefore fails closed at that
resolution, writes nothing, and reaches no `CONFIRMED` state until
HA-ATS-STAGE-B-001 supplies the call, while `HEDERA_FUNDING` verification is
not coupled to it. Nothing retries and nothing resubmits.

## Candidate ready requirements

- The specification, card, catalog, ownership, and state records are
  committed before any RED test or source change.
- M04-T010, M26-T010, M32-T010, and M33-T010 remain accepted, and M38-T010,
  M39-T010, M40-T010, M41-T010, and M42-T010 are accepted before activation.
- `packages/backend/convex/schema.ts` is shared with M40-T010 and M41-T010 in
  this batch. The three amendments are disjoint: M40 adds new tables only, M41
  adds only the `ingressCommandReplayClaims` table and its index, and M43
  amends only the `externalPrepareCommandAttempts` shape. Each needs an
  explicit root integration reservation recorded in the ownership file before
  the change, and the root sequences the three.
- `packages/backend/convex/command_dispatch.ts` is shared with M41-T010, which
  declares the `external.attachCandidate` dispatch entry disabled. This card
  enables exactly that one entry under its own root integration reservation
  and changes no other entry, header rule, projection, or response arm; the
  root sequences the two.
- The wallet replay identity for `external.attachCandidate` is claimed in the
  M40-owned `walletCommandReplayClaims` table, whose `commandType` union
  already carries that literal for this boundary; M43 modifies no M40 file.
- Widening the attempt state union invalidates the accepted M32 assertion of
  the exact `PREPARED` literal validator. That assertion lives in
  `packages/backend/tests/external-prepare-command-durable-schema.test.mjs`
  and is amended under its own reservation. The accepted
  [M32 source](../../../specs/m32-durable-external-prepare-admission.md) —
  its mutation and its recovery query — stays byte unchanged, and recovery
  keeps matching only the literal `PREPARED` state.
- The offering transition from `ASSET_PENDING` to `READY` is the M40-owned
  `markAssetReady(attemptId, atsAssetEvmAddress)` internal mutation. This
  card's verification action invokes it only after it has persisted `CONFIRMED`
  for an `ATS_CREATE` verifier result, passing the stored candidate address after the verifier has
  matched it to the created address. It passes no offering ID, browser value,
  raw Mirror field, or action argument; M40 resolves the sole offering through
  its additive `by_ats_attempt_id` index. M43 modifies no M40 file.
- The attempt is resolved through the accepted `by_idempotency_key` index,
  because M32 mints no public identifier and this card may not amend M32. The
  specification fixes that resolution rule before code.
- The exact Mirror Node response field mapping is pinned by the durable RED
  fixture rather than asserted from memory, and the naming follows the
  accepted [M04 record writer](../../../specs/m04-riskscan-pending-verification-settlement-record-writer.md)
  vocabulary for candidate references and reconciliation timestamps.

## Verification

- Durable RED test files at the three declared test paths, and the amended
  M32 durable-schema assertion, precede every source and schema change. The
  three new files fail only because the declared modules do not yet exist.
- Focused tests prove the additive schema shape, the widened state union, and
  that no other accepted table or index changes.
- Focused tests prove attachment rejects a missing, duplicate, unsafe,
  ineligible, or context-mismatched attempt before any write; accepts one
  candidate for a `PREPARED` attempt; returns the already-attached result for
  a byte-identical repeat; and refuses a second differing candidate.
- Focused tests prove the attempt is resolved through `by_idempotency_key`
  from an `attemptPublicId` carrying the canonical M26 idempotency-key
  grammar, that `candidateEvmAddress` is required for `ATS_CREATE` and refused
  for every other kind, and that the wallet replay identity is claimed with
  `commandType` `external.attachCandidate` before any patch so a reused
  identity returns `COMMAND_REPLAYED` with no write.
- Focused tests prove the dispatch amendment enables exactly the
  `external.attachCandidate` entry and leaves every other dispatch entry,
  header rule, projection, and response arm unchanged.
- Focused tests prove the verifier is pure over a supplied document, reads no
  accessor, has no default fetch, clock, environment, or database access, and
  returns every arm of its closed outcome union.
- Focused tests prove the bounded reader enforces the timeout, byte cap, GET
  method, and the fixed base URL taken from the accepted configuration
  projection, and that no caller-supplied URL, host, or scheme is reachable.
- Focused tests prove the action fails closed and writes nothing for
  `ATS_CREATE` while the control-list configuration has no enabled entry and
  performs no Mirror read on that path; performs at most one Mirror read
  otherwise; writes exactly one terminal outcome; sets a reconciliation
  timestamp only for `OUTCOME_UNKNOWN`; invokes the M40 ready seam only on a
  confirmed `ATS_CREATE` branch with the already verified stored candidate
  address; and never resubmits, retries, or calls a wallet, provider, or SDK.
- `npm run typecheck`, `npm run test`, `npm run lint`, `npm run queue:check`,
  and the enabled local-reference guard pass.
- Independent task review and two fresh module-review generations report no
  Critical, Important, or Minor finding.

## Boundary

This card adds internal durable state transitions and one bounded read-only
external observation. It creates no public query, mutation, action, HTTP
route, generated API output, browser client, or runtime configuration. It
holds no key, seed, environment value, or signed payload, reads no
environment variable, and creates or funds no account.

An attached candidate is caller-supplied data and asserts nothing. A verified
outcome asserts only what the read document showed. No state here claims a
deployment, a payment, a settlement, finality, an issued unit, a published
directory version, or any live behavior.
