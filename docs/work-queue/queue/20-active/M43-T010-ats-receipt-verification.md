# M43-T010 — ATS candidate receipt attachment and Mirror verification

## State

- Tier: CORE_P0
- Queue state: 20-active
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
  `external.attachCandidate` dispatch entry M41-T010 declares disabled, plus
  one constrained amendment of `packages/backend/tests/command-dispatch.test.mjs`
  limited to its M41 disabled-entry assertion at lines 851–866 as they stood at
  M43 activation. That exact assertion is replaced as a test-only RED contract;
  only its matching source dispatch change waits for RED acceptance.
- Human actions: HA-ATS-STAGE-B-001 plus a separately reviewed successor gate
  any enabled ATS receipt path. It is not complete, and M43 ships no
  control-list selector or call. This card authorizes no ATS SDK call,
  provider, wallet, account action, funding, payment, transaction,
  submission, resubmission, publication, deployment, or live evidence.

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
zero-enabled manifest. Every `ATS_*` verification action therefore returns
`NOT_CONFIGURED` before Mirror I/O or its durable outcome write, while
`HEDERA_FUNDING` verification is not coupled to it. A later post-Stage-B
successor must separately define any enabled ATS receipt path. Nothing retries
and nothing resubmits.

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
- M43 never invokes M40's `markAssetReady` mutation. The one permitted Mirror
  ContractResult response exposes only a Hedera created-entity identifier, not
  a documented created EVM address; M43 neither converts that identifier nor
  treats another raw field as proof. Any positive ATS_CREATE receipt and M40
  transition require a separately reviewed post-Stage-B successor with its own
  fixed observation budget and documented field mapping.
- The attempt is resolved through the accepted `by_idempotency_key` index,
  because M32 mints no public identifier and this card may not amend M32. The
  specification fixes that resolution rule before code.
- The exact Mirror Node response field mapping is pinned by the durable RED
  fixture rather than asserted from memory. M43 proves only the current
  `HEDERA_FUNDING` ContractResult boundary; an ATS_CREATE expectation fails
  closed without inferred created-address conversion. The naming follows the
  accepted [M04 record writer](../../../specs/m04-riskscan-pending-verification-settlement-record-writer.md)
  vocabulary for candidate references and reconciliation timestamps.

## Verification

- Durable RED test files at the three declared test paths, the amended M32
  durable-schema assertion, and the one constrained M41 dispatch-test
  replacement precede every source and schema change. The three new files fail
  only because the declared modules do not yet exist; the M41 replacement fails
  against its currently disabled entry.
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
  `external.attachCandidate` entry, maps `ATTACHED` to `ACCEPTED` and
  `ALREADY_ATTACHED`/`COMMAND_REPLAYED` to `REPLAYED` through M41's existing
  response union, leaks no durable ID, and leaves every other dispatch entry,
  header rule, projection, and response arm unchanged.
- Focused tests prove the verifier is pure over a supplied document, reads no
  accessor, has no default fetch, clock, environment, or database access, and
  returns every arm of its closed outcome union.
- Focused tests prove the bounded reader enforces the timeout, byte cap, GET
  method, and the fixed base URL taken from the accepted configuration
  projection, and that no caller-supplied URL, host, or scheme is reachable.
- Focused tests prove the verification action fails closed and makes no outcome
  write for every `ATS_*` operation while M33 has zero enabled records,
  performs no Mirror read on those paths, performs at most one Mirror read for
  `HEDERA_FUNDING`, writes exactly one terminal outcome only for that non-ATS
  path, sets a reconciliation timestamp only for `OUTCOME_UNKNOWN`, never
  invokes M40's ready seam, and never resubmits, retries, or calls a wallet,
  provider, or SDK.
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

## Ready review

At clean pushed `89a496e`, an independent readiness review found all nine
declared dependencies accepted in `60-done`, including the M41 disabled
attach-candidate seam and M42 fixed Mirror configuration projection. The six
new M43 implementation/test paths are absent, and the root reservations are
disjoint: only the declared attempt-state/field widening, its matching schema
assertion, and the disabled dispatch entry may later be amended. Focused
predecessor/seam checks passed 33/33 under Node 22.21.1; Backend typecheck and
queue/reference validation are clear. M44 is Web-only and blocked, with no
ownership collision.

`HA-ATS-STAGE-B-001` blocks live verification only. It does not block the
fixture-only local RED cycle. M43 moves to `10-ready`; a separate independent
activation may authorize only its three durable test-only RED files and the
declared durable-schema assertion amendment. No source, schema, dispatch,
configuration, SDK, wallet, provider, transaction, deployment, or live action
is authorized by this readiness review.

## Activation review

At clean pushed `84c80f2`, an independent activation review reconfirmed the
accepted dependency chain, absent/disjoint M43 paths, and a clear local Backend
baseline. M43 initially entered `20-active` only for its three durable
test-only RED contracts and exact durable-schema assertion amendment. The root
correction below additionally permits only the constrained M41 dispatch-test
replacement. Its source, schema, and dispatch amendments remain prohibited
until a fresh independent RED review accepts the corrected failure contract.

## Root correction

The first RED review identified that M33 remains zero-enabled, the permitted
single Mirror ContractResult document does not prove a created EVM address, and
one accepted M41 assertion still describes the attach-candidate seam as
disabled. M43 is therefore narrowed: every ATS_* operation returns
`NOT_CONFIGURED` before Mirror I/O or the verification action's durable outcome
write; only
`HEDERA_FUNDING` may use the one-read terminal-outcome path; M43 never invokes
M40 readiness; and a later post-Stage-B successor must carry any positive
ATS_CREATE address-verification authority.

The root authorizes only the M41 test block at
`packages/backend/tests/command-dispatch.test.mjs` lines 851–866 for the
test-only RED contract for the already-declared single dispatch-entry
enablement. It maps `ATTACHED` to the existing `ACCEPTED` response,
`ALREADY_ATTACHED` and `COMMAND_REPLAYED` to the existing `REPLAYED` response,
and every unknown or thrown result to `REJECTED`, using the payload public ID
only. This correction adds no source, schema, dispatch, wallet, provider, SDK,
transaction, deployment, or live authority; the test-only RED replacement is
permitted before its matching source change.
See [the local correction review](../../evidence/M43-T010-red-contract-correction-review.md).
