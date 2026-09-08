# M43 ATS candidate receipt attachment and Mirror verification

## Delivery boundary

M43 adds the receipt half of the prepared-attempt lifecycle described in the
[campaign deploy flow design](../superpowers/specs/2026-09-08-campaign-deploy-flow-design.md).
It attaches a caller-supplied candidate transaction to an attempt the accepted
M32 mutation already admitted, verifies that candidate against one bounded read
of the public Hedera Mirror Node, and records exactly one terminal outcome. It
is an observation boundary: M43 never constructs, signs, submits, retries, or
resubmits a transaction, initializes an ATS SDK, or connects a provider or
wallet. An attached candidate asserts nothing; a recorded outcome asserts only
what the read document showed.

The committed control-list configuration has no enabled entry, exactly as
[M33](m33-ats-prepare-authority-gate.md) ships a zero-enabled ATS authority
manifest. `ATS_CREATE` fails closed at that resolution and writes nothing until
HA-ATS-STAGE-B-001 names the call; `HEDERA_FUNDING` is not coupled to it.

## Durable record amendment

`externalPrepareCommandAttempts` is amended in `packages/backend/convex/schema.ts`
under a root integration reservation. Its `state` validator widens from the
literal `PREPARED` to exactly:

```text
v.union(v.literal("PREPARED"), v.literal("SUBMITTED"), v.literal("CONFIRMED"),
        v.literal("OUTCOME_UNKNOWN"), v.literal("REJECTED"))
```

Three optional fields are added — `candidateTransactionId: v.optional(v.string())`,
`candidateEvmAddress: v.optional(v.string())`, and
`nextReconciliationAt: v.optional(v.int64())`. No index is added, because M43
adds no reconciliation reader. The field names match the attempt vocabulary of
[the M04 record writer](m04-riskscan-pending-verification-settlement-record-writer.md).

The accepted [M32](m32-durable-external-prepare-admission.md) mutation and
recovery query stay byte unchanged: M32 still inserts only literal `PREPARED`,
and recovery still requires it, so it returns nothing for an attempt M43 has
advanced. The accepted M32 assertion of the exact validator shape in
`packages/backend/tests/external-prepare-command-durable-schema.test.mjs` is
amended, under its own reservation, to the widened union and three fields.

## Attempt resolution and stored-row safety

M32 mints no public identifier and M43 may not amend M32. M43 therefore
requires its own `attemptPublicId` argument to be the canonical M26 idempotency
key of the prepared `external.prepare` attempt the candidate belongs to — 21
base64url characters followed by `A`, `Q`, `g`, or `w`, the same grammar as
`idempotencyKey`, and never equal to the attach payload's own `idempotencyKey` —
and the dispatch boundary supplies it. M43 resolves the attempt through the
accepted `by_idempotency_key` index with `take(2)`; zero rows, two rows, or one
unsafe row fails closed before any write, and no column or index is added to
carry a separate identity. Every
stored row is validated as the M04 record writer validates a stored attempt:
own enumerable data properties whose descriptors themselves own `value`
through `Object.hasOwn(descriptor, "value")`, rejecting inherited,
non-enumerable, accessor-backed, and descriptor-prototype values without
invoking a getter.

## Internal attachment source

`packages/backend/convex/ats_candidate_receipts.ts` is internal-only Convex
source, not exported from `@tool402/backend`, adding no public function, HTTP
handler, or generated API output. `attachAtsCandidateReceipt` accepts exactly
these arguments and no caller-supplied clock, capability, network, or target:

```text
attemptPublicId, operationKind, candidateTransactionId,
candidateEvmAddress (optional), canonicalSignerAddress, principalPublicId,
role, authorityVersion, replayIdentity
```

`operationKind` is the closed M26 union and `role` is the two-literal
`ISSUER`/`BACKER` union. Before any database access the handler requires a
lowercase signer of `0x` plus 40 hexadecimal characters, a candidate
transaction identifier matching `0.0.<digits>@<seconds>.<nanos>` or
`0.0.<digits>-<seconds>-<nanos>`, a lowercase `0x` plus 40 hexadecimal
`candidateEvmAddress` present for `ATS_CREATE` and absent otherwise, and
nonempty principal and authority version. It then resolves the attempt and
requires the stored row to match this exact context tuple:

```text
(canonicalSignerAddress, principalPublicId, role, authorityVersion,
 operationKind, chainId 296, network "hedera:testnet")
```

`replayIdentity` is exactly
`tool402:wallet-command:v1:296:<canonicalSignerAddress>:<nonce>`, the same
wallet-command identity M32 and M40 claim. The handler claims it in the
M40-owned `walletCommandReplayClaims` table through `by_replay_identity`, with
`commandType` exactly `external.attachCandidate` — the third literal M40
reserves for this boundary and never writes itself — before any patch, and the
claim row carries no signature, raw body, or key. A reused identity returns
`{ status: "COMMAND_REPLAYED" }` and writes no candidate field.

For a `PREPARED` attempt it patches `state` to `SUBMITTED`, stores the two
candidate fields, and returns `{ status: "ATTACHED", attemptId, state:
"SUBMITTED" }`. For a `SUBMITTED` attempt with byte-identical stored candidate
fields it returns `{ status: "ALREADY_ATTACHED", attemptId, state: "SUBMITTED" }`
and writes nothing. Every other case — a differing candidate, a terminal
attempt, a context mismatch, an unsafe or duplicate row — throws
`new RangeError("ATS candidate receipt is not eligible for this attempt")`
before any write; an attempt holds at most one candidate.

`readAtsCandidateVerificationContext` is an internal query accepting only
`attemptId`. It returns `null` for a missing row, fails closed for an unsafe row,
and otherwise returns exactly `{ attemptId, state, operationKind, network,
chainId, expectedTarget, candidateTransactionId, candidateEvmAddress }` — no
signer, principal, authority version, payload hash, idempotency key, raw body, or
signature.

`recordAtsCandidateOutcome` is an internal mutation accepting exactly `attemptId`
and `outcome`, the closed union `CONFIRMED`, `OUTCOME_UNKNOWN`, `REJECTED`. It
requires the stored state to be exactly `SUBMITTED`, patches that one terminal
state, and for `OUTCOME_UNKNOWN` only sets `nextReconciliationAt` from its own
durable server clock plus a fixed bounded interval. It accepts no caller clock
and never returns an attempt to `PREPARED` or `SUBMITTED`.

The `external.attachCandidate` dispatch entry that
[M41](m41-http-command-ingress.md) declares disabled is enabled here through an
amendment of `packages/backend/convex/command_dispatch.ts` under a root
integration reservation naming that file. The amendment enables exactly that one
entry, routing a normalized `external.attachCandidate` command to
`attachAtsCandidateReceipt`, and changes no other entry, header rule, key
resolution, projection, or response arm.

## Pure Mirror verifier

`packages/backend/src/ats/mirror-transaction-verifier.ts` is private Backend
source, not exported from `@tool402/backend`:

```text
verifyMirrorTransactionReceipt(expectation, document): MirrorTransactionVerification
createBoundedMirrorTransactionReader(dependencies): BoundedMirrorTransactionReader
```

The verifier reads only the supplied document through descriptors under the
safety rule above and returns `{ outcome: "VERIFIED" }`, `{ outcome: "REJECTED",
reason }`, or `{ outcome: "UNKNOWN", reason }`, where `reason` is exactly one of
`DOCUMENT_UNSAFE`, `RESULT_NOT_SUCCESS`, `TARGET_MISMATCH`, `NETWORK_MISMATCH`,
`CONSENSUS_TIMESTAMP_MISSING`, and `CREATED_ADDRESS_MISMATCH`. `VERIFIED`
requires all of: a success result, a consensus timestamp, the transaction's
network equal to `hedera:testnet` and chain 296, the contract it called equal to
the expectation's `expectedTarget` under exact lowercase comparison, and — when
the expectation carries a `candidateEvmAddress` — the created contract address
equal to it. No case normalization, alias resolution, target-form conversion,
fallback, or implicit default is allowed. The exact Mirror Node response field
names are pinned by the durable RED fixture, not asserted here; the verifier has
no fetch, clock, environment, database, ATS SDK, or provider dependency.

The bounded reader receives an injected `fetch` implementation and the
`mirrorNodeBaseUrl` value of the accepted configuration projection. It builds one
path from an already validated candidate transaction identifier, issues one `GET`
with no credentials and no redirect following, aborts after a fixed timeout,
reads at most a fixed byte cap, requires a JSON content type, and returns
`{ status: "DOCUMENT", document }`, `{ status: "NOT_FOUND" }`, or
`{ status: "UNAVAILABLE" }`. No caller-supplied URL, host, scheme, query, or
header is reachable.

## Node verification action

`packages/backend/convex/ats_receipt_verification.ts` declares `"use node"` and
exposes exactly one internal action, `verifyAtsCandidateReceipt`, accepting only
`attemptId`. It runs this order:

```text
read verification context → require state SUBMITTED, else NOT_ELIGIBLE
→ for ATS_CREATE only, resolve the control-list check; with no enabled entry,
  return NOT_CONFIGURED before any Mirror read and write nothing
→ one bounded Mirror read → pure verification
→ exactly one recordAtsCandidateOutcome write
→ for a CONFIRMED ATS_CREATE, the M40-owned markAssetReady seam
```

It returns exactly one of `{ outcome: "CONFIRMED" }`, `{ outcome: "REJECTED" }`,
`{ outcome: "OUTCOME_UNKNOWN" }`, `{ outcome: "NOT_CONFIGURED" }`, or
`{ outcome: "NOT_ELIGIBLE" }`. `VERIFIED` maps to `CONFIRMED` and a `REJECTED`
verification to `REJECTED`; an `UNKNOWN` verification, a not-found document, an
unavailable reader, a timeout, or a byte-cap stop maps to `OUTCOME_UNKNOWN`. A
second invocation on a terminal attempt returns `NOT_ELIGIBLE` without a read,
and nothing retries or resubmits. The offering transition from `ASSET_PENDING`
to `READY` is the M40-owned `markAssetReady(offeringId, attemptId)` internal
mutation, invoked only by this action after `CONFIRMED` and bound to the
confirmed attempt; M43 modifies no M40 file, and `OUTCOME_UNKNOWN` and
`REJECTED` leave the offering where M40 left it.

## Explicit exclusions

Do not add a public query, mutation, action, HTTP route, generated API output,
package, lockfile, Core, Web, or Agent change. Do not read an environment
variable, add configuration or a deployment, modify M04 RiskScan
behavior or M24 through M42 source beyond the single `external.attachCandidate`
dispatch entry named above, enable an M33 target, initialize an ATS SDK,
connect a provider or wallet, create or fund an account, sign, submit, resubmit,
or claim a payment, settlement, clearing, HCS event, payout, or live evidence.
Do not invent a control-list selector, function name, or configuration digest;
HA-ATS-STAGE-B-001 and the retargeted configuration decision record those.

## Acceptance evidence

- A test-only RED commit precedes every schema and source change.
- Focused tests prove the amended schema shape, the widened state union, the
  three optional fields, an index list that stays byte unchanged, and that no
  other accepted table, field, optionality, or document ID target changes.
- Focused tests prove attachment resolves through `by_idempotency_key`, rejects
  zero, duplicate, unsafe, ineligible, and context-mismatched rows before any
  write, accepts one candidate, replays an identical repeat with no write, and
  refuses a differing second candidate.
- Focused tests prove the wallet replay identity is claimed in
  `walletCommandReplayClaims` with `commandType` `external.attachCandidate`
  before any patch, that a reused identity returns `COMMAND_REPLAYED` with no
  write, and that `candidateEvmAddress` is required for `ATS_CREATE` and
  refused for every other kind.
- Focused tests prove the dispatch amendment enables exactly the
  `external.attachCandidate` entry and leaves every other M41 entry, header
  rule, projection, and response arm unchanged.
- Focused tests prove verifier purity, descriptor safety without a getter read,
  every arm of the closed outcome and reason unions, and the reader's timeout,
  byte cap, method, and fixed base URL with no caller-supplied URL.
- Focused tests prove the `NOT_CONFIGURED` stop for `ATS_CREATE` before any
  Mirror read and before any write, one Mirror read at most, one terminal
  write, a stamp only for `OUTCOME_UNKNOWN`, and no retry or resubmission.
- Focused static checks prove no public export, environment read, HTTP route,
  configuration, publication, or external-action behavior, and that the
  [M33](m33-ats-prepare-authority-gate.md) gate stays zero-enabled.
- Backend and root typecheck, test, lint, clean-install dry run, queue,
  reference, and whitespace checks, the enabled local guard, independent task
  review, and two fresh module-review generations pass.
