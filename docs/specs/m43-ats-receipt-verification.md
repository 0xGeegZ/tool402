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
manifest. Every `ATS_*` verification action fails closed as `NOT_CONFIGURED`
before a Mirror read or its durable outcome write until a separately reviewed
post-Stage-B successor names the applicable call; `HEDERA_FUNDING` is not
coupled to that ATS resolution.

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

The complete Backend M40 compatibility assertion in
`packages/backend/tests/offering-durable-schema.test.mjs` also compares this
accepted M32 subset. It is amended under a root reservation only to the same
widened union and the same three optional fields. This preserves M40's table,
index, source, and runtime behavior byte unchanged; it corrects an expected
fixture which otherwise still describes the superseded M32-only schema shape.

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
`{ status: "COMMAND_REPLAYED" }` and writes no candidate field. A singular safe
existing claim from any closed wallet-command type and any closed claim outcome
also proves the wallet-command identity is consumed and returns that same replay
result; `targetId` is optional only for a conflict outcome. A malformed,
unknown, or duplicate claim row fails closed.

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
resolution, projection, or response arm. Its closed attachment results map into
the existing M41 response union exactly as follows:

```text
ATTACHED                              -> ACCEPTED, publicId = payload.attemptPublicId
ALREADY_ATTACHED or COMMAND_REPLAYED  -> REPLAYED, publicId = payload.attemptPublicId
unknown result or thrown boundary     -> REJECTED
```

The durable Convex `attemptId` never reaches the public response. The one
accepted M41 regression assertion that currently requires this disabled entry
to return `UNSUPPORTED_TYPE` is root-reserved for this exact replacement only;
no response arm is added.

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
`CONSENSUS_TIMESTAMP_MISSING`, `CREATED_ADDRESS_MISMATCH`, and
`OPERATION_NOT_ELIGIBLE`. An expectation carrying `candidateEvmAddress` returns
`CREATED_ADDRESS_MISMATCH` before inspecting any raw document. Otherwise, only
an exact `HEDERA_FUNDING` operation is eligible for pure verification; every ATS
operation or unknown operation returns `OPERATION_NOT_ELIGIBLE` before document
inspection. `VERIFIED` requires a success result, a consensus timestamp, the
transaction's network equal to `hedera:testnet` and chain 296, and the contract
it called equal to the expectation's `expectedTarget` under exact lowercase
comparison.

The one permitted ContractResult document exposes a Hedera entity identifier in
`created_contract_ids`; it does not establish a created EVM address. M43 must
never convert that identifier or treat `address`, `to`, `contract_id`, logs, or
another generic field as a created address. Consequently an expectation carrying
`candidateEvmAddress` always returns `REJECTED` with
`CREATED_ADDRESS_MISMATCH` under M43's one-read boundary. No case
normalization, alias resolution, target-form conversion, fallback, or implicit
default is allowed. The verifier has no fetch, clock, environment, database,
ATS SDK, or provider dependency.

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
→ for every ATS_* operation, return NOT_CONFIGURED before any Mirror read or
  the verification action's durable outcome write because M33's compiled
  manifest has zero enabled records
→ one bounded Mirror read → pure verification
→ exactly one recordAtsCandidateOutcome write
```

It returns exactly one of `{ outcome: "CONFIRMED" }`, `{ outcome: "REJECTED" }`,
`{ outcome: "OUTCOME_UNKNOWN" }`, `{ outcome: "NOT_CONFIGURED" }`, or
`{ outcome: "NOT_ELIGIBLE" }`. `VERIFIED` maps to `CONFIRMED` and a `REJECTED`
verification to `REJECTED`; an `UNKNOWN` verification, a not-found document, an
unavailable reader, a timeout, or a byte-cap stop maps to `OUTCOME_UNKNOWN`.
Those terminal outcomes are currently reachable only for `HEDERA_FUNDING`. A
second invocation on a terminal attempt returns `NOT_ELIGIBLE` without a read,
and nothing retries or resubmits. M43 never invokes M40's `markAssetReady`
seam: every ATS_* offering remains in its pre-existing state. A separately
reviewed successor after a future Stage B authority must name any enabled
mapping, additional fixed observation, documented created-address field, and
M40 transition before it may add positive ATS_CREATE verification.

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
Do not create a positive ATS_CREATE receipt result, mark an ATS asset ready, or
add a second Mirror Node read under this card.

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
  `external.attachCandidate` entry, maps its closed attachment statuses into
  the pre-existing M41 response union without leaking an internal attempt ID,
  and leaves every other M41 entry, header rule, projection, and response arm
  unchanged.
- Focused tests prove verifier purity, descriptor safety without a getter read,
  every arm of the closed outcome and reason unions, and the reader's timeout,
  byte cap, method, and fixed base URL with no caller-supplied URL.
- Focused tests prove the `NOT_CONFIGURED` stop for every ATS_* operation
  before any Mirror read and before the verification action's durable outcome
  write, one Mirror read at most for `HEDERA_FUNDING`, one terminal write only
  for that non-ATS path, a stamp only for `OUTCOME_UNKNOWN`, and no retry or
  resubmission.
- Focused static checks prove no public export, environment read, HTTP route,
  configuration, publication, or external-action behavior, and that the
  [M33](m33-ats-prepare-authority-gate.md) gate stays zero-enabled.
- Backend and root typecheck, test, lint, clean-install dry run, queue,
  reference, and whitespace checks, the enabled local guard, independent task
  review, and two fresh module-review generations pass.

## Root correction rationale

This section records the evidence behind the current zero-enabled ATS_* receipt
boundary and its constrained M41 dispatch mapping.

M33's compiled production manifest is an immutable empty list. Therefore the
M43 verification action must return `NOT_CONFIGURED` for every ATS_*
verification context before a Mirror read or its own durable outcome write. It
must not invent a
control-list selector, enabled mapping, configuration digest, or a test seam
that behaves as one. M43's bounded observation and terminal-outcome work is
limited to non-ATS operations.

The one permitted Mirror ContractResult document exposes a Hedera
created-entity identifier, not a documented created EVM address. M43 must
never convert that identifier or treat `address`, `to`, `contract_id`, logs, or
another generic field as proof of a created address. A pure ATS_CREATE
expectation carrying `candidateEvmAddress` therefore fails closed as
`REJECTED` with `CREATED_ADDRESS_MISMATCH`; it cannot produce `VERIFIED`.
M43 never invokes M40's `markAssetReady` seam. A separately reviewed successor
after a future Stage B authority must name any additional fixed observation,
the documented exact created-address field, and the M40 transition before it
may add positive ATS_CREATE verification.

The already-declared `external.attachCandidate` dispatch enablement maps only
into M41's existing public response union:

```text
ATTACHED                              -> ACCEPTED, publicId = payload.attemptPublicId
ALREADY_ATTACHED or COMMAND_REPLAYED  -> REPLAYED, publicId = payload.attemptPublicId
unknown result or thrown boundary     -> REJECTED
```

The durable `attemptId` never reaches a public response and no response arm is
added. The root reserves only the accepted M41 disabled-entry assertion at
`packages/backend/tests/command-dispatch.test.mjs` lines 851–866 for this
M43 RED replacement; its matching source change remains GREEN-only after a
fresh RED acceptance. Its terms are independently reviewed in
[the correction record](../work-queue/evidence/M43-T010-red-contract-correction-review.md).

## Acceptance

M43 is accepted as a local candidate-receipt and bounded Mirror verification
boundary. The final focused M43 integration suite passes 56/56 and the complete
Backend suite passes 275/275 under Node 22.21.1. Root typecheck and lint,
queue validation, local-reference validation, whitespace validation, and the
enabled Git guard are clear. The aggregate root test remains nonzero only for the separately blocked
M44 source-absent RED files; M43 neither changes nor waives that independent
blocker.

Independent task review and two fresh module-review generations found no
Critical, Important, or Minor finding. Every `ATS_*` path remains
`NOT_CONFIGURED` before Mirror I/O or outcome writes; only the bounded
`HEDERA_FUNDING` fixture path can reach a terminal outcome. No SDK, wallet,
provider, configuration, transaction, deployment, or live authority is added.
