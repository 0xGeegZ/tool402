# M40-T010 — Offering and directory-version durable admission

## State

- Tier: CORE_P0
- Queue state: 20-active
- Dependencies: M04-T010 accepted, M32-T010 accepted, M33-T010 accepted,
  M38-T010 (this batch), M39-T010 (this batch)
- Owner: The root owns queue state, catalog, ownership, decisions, reviews,
  commits, and pushes. Proposed implementation paths are exactly
  `packages/backend/convex/schema.ts` as an amendment under a root
  integration reservation,
  `packages/backend/convex/offerings.ts`,
  `packages/backend/convex/directory_versions.ts`,
  `packages/backend/src/offering-command-admission.ts`,
  `packages/backend/tests/offering-durable-schema.test.mjs`,
  `packages/backend/tests/offering-command-admission.test.mjs`, and
  `packages/backend/tests/directory-version-writer.test.mjs`.
- Human actions: none for local delivery; this card adds internal Convex
  records and two read-only projections and reaches nothing outside the
  repository. The command vocabulary it admits is gated upstream by
  HA-COMMAND-AUTHORITY-002 on M39-T010, and any Convex publication or live
  read is gated by HA-CAMPAIGN-CONVEX-001 on M41-T010. This card neither
  completes nor anticipates either row.

## Scope

The accepted durable data plane stores one record shape only: an
`external.prepare` attempt. The approved
[campaign deploy flow](../../../superpowers/specs/2026-09-08-campaign-deploy-flow-design.md)
needs two more durable subjects before any surface can render a truthful
state: the offering itself, whose lifecycle is
`DRAFT → ASSET_PENDING → READY → OPEN` with `CLOSED` terminal, and the
directory version, whose lifecycle is
`DRAFT → PUBLISH_PREPARED → ACTIVE → SUPERSEDED`.

M40 adds those two tables, one generic wallet-command replay-claim table, and
the two internal mutations that admit an already normalized `offering.create`
and `directory.publish` command. It repeats the accepted M32 rebinding
discipline on its own untrusted serialized input rather than trusting a
caller, and it adds two read-only public projections so a later route can
show a stored state without exposing admission internals.

The local authority is the
[M40 specification](../../../specs/m40-offering-directory-durable-admission.md).
The scope ruling, the human-action rows, and the batch order are requested by
the [HI-002 intake card](../60-done/HI-002-campaign-deploy-reinstatement.md).

This card is a durable data plane, not execution authority. It creates no
HTTP route, no environment access, no ATS SDK call, no wallet or account
action, no provider call, no funding, payment, transaction, settlement,
clearing, HCS, payout, deployment, or live evidence. A stored `READY`
offering is a record of a verified admission, never a claim that an asset
exists on chain.

## Candidate ready requirements

- The specification, card, catalog, ownership, and state records are
  committed before any RED test or source change, and M04-T010, M32-T010,
  and M33-T010 remain accepted.
- M38-T010 and M39-T010 are accepted first in this batch. M40 stores the
  closed payloads M38 defines and consumes the discriminated normalizer DTO
  M39 returns; it defines neither itself.
- The `packages/backend/convex/schema.ts` amendment needs an explicit root
  integration reservation because M04-T010 and M32-T010 already own that
  file, and because M41-T010 and M43-T010 amend the same file in this batch:
  M41 adds `ingressCommandReplayClaims` and M43 widens the accepted
  `externalPrepareCommandAttempts` state union. The root sequences the three
  amendments. M40's amendment is purely additive: no accepted RiskScan or
  external-prepare table, field, optionality, document-ID target, or index
  changes.
- The two accepted schema tests keep passing without amendment because each
  already filters the exported schema to its own named subset: the M04 test
  enumerates `riskScan*` tables and the M32 test enumerates
  `commandAuthorit*` and `externalPrepareCommand*` tables. M40's three table
  names fall outside both filters and M40 owns its own exact assertion. If a
  reviewer finds either filter matches a new name, the card stops and the
  root records a reservation rather than editing an accepted test silently.
- The two new Convex module filenames are `offerings.ts` and
  `directory_versions.ts`, which satisfy the accepted Convex-safe module
  naming contract. Neither is added to the backend public barrel, and
  `packages/backend/src/offering-command-admission.ts` stays internal.
- `packages/backend/convex/external_prepare_command_admission.ts`,
  `packages/backend/convex/external_prepare_command_recovery.ts`,
  `packages/backend/convex/ats_prepare_authority.ts`, and their tests stay
  byte unchanged. The M40-owned seams are closed: `markAssetPending(offeringId,
  attemptId)` checks the exact safe `DRAFT` offering and matching safe
  `PREPARED` `ATS_CREATE` attempt before its one pending patch;
  `markAssetReady(attemptId, atsAssetEvmAddress)` accepts no offering ID,
  resolves exactly one pending offering through the additive
  `by_ats_attempt_id` index, and accepts only a canonical address. M41-T010
  invokes the pending seam after a successful M32 `NEW` `ATS_CREATE` admission.
  M43-T010 invokes the ready seam only after it has persisted `CONFIRMED` and
  its pure receipt verifier has bound the stored candidate address to the
  created address. Neither caller can select a different offering or browser-supplied
  asset address.
- The closed record shapes, the mutation ordering, the single-`ACTIVE`
  directory rule, and the sanitized projection fields are fixed in the
  specification before code, so the data plane cannot grow an unreviewed
  field or state.

## Verification

- Durable RED files at
  `packages/backend/tests/offering-durable-schema.test.mjs`,
  `packages/backend/tests/offering-command-admission.test.mjs`, and
  `packages/backend/tests/directory-version-writer.test.mjs` precede every
  schema and source change. They fail only because the declared tables and
  modules do not yet exist.
- Focused tests prove the exact additive three-table contract with its literal
  unions, optional fields, document-ID targets, int64 timestamps and declared
  indexes including `by_ats_attempt_id`; that the accepted RiskScan and
  external-prepare subsets are unchanged; parser-first serialized rebinding
  for raw malformed M38 payloads paired with independently recomputed hashes;
  exact expiry equality plus inclusive expiry, maximum-lifetime, future-skew,
  and replay-identity boundary vectors before any database access; safe bounded
  rejection of malformed or duplicate stored rows; exact internal Convex
  arguments/returns; and executable pending/ready seam guards, attempt
  binding, canonical address provenance, and zero-write rejection paths. The
  current-authority recheck, with the
  ISSUER-owns-subject predicate read from the payload for `offering.create`
  and re-applied to the referenced offering's stored subject for
  `directory.publish`; replay before idempotency; exact context
  matching with conflict on drift; one atomic `NEW` insert; a
  `directory.publish` refusal unless the offering is `READY` for `NEW`, an
  exact fresh-nonce `IDEMPOTENCY_REPLAYED` result only for its persisted
  `ACTIVE` directory and linked `OPEN` offering, exactly one `ACTIVE` row per
  service slug with the prior row superseded and the offering moved to `OPEN`
  in the same transaction; and sanitized
  projections that expose no admission internals and no `payloadHash`.
- Focused Node commands from the repository root under Node 22.21.1:

  ```bash
  node --test packages/backend/tests/offering-durable-schema.test.mjs
  node --test packages/backend/tests/offering-command-admission.test.mjs
  node --test packages/backend/tests/directory-version-writer.test.mjs
  ```

- The accepted M04 and M32 schema suites and the accepted M32 durable
  admission and recovery suites pass unchanged.
- `npm run typecheck`, `npm run test`, `npm run lint`, `npm run queue:check`,
  and the enabled local-reference guard pass.
- Independent task review and two fresh clean module-review generations
  report no Critical, Important, or Minor finding.

## Boundary

This card adds internal durable records and two read-only projections. It
publishes nothing, reads no environment value, opens no network connection,
and holds no key, seed, signature, or raw request body. It does not enable an
ATS target, call the ATS SDK, create or fund an account, sign, submit, or
verify a transaction, activate a real directory listing, or claim that any
offering is deployed, funded, paid, or verified.

## Ready review

At clean pushed `39e07ec`, an independent review confirmed all dependencies,
local references, absent/disjoint non-schema paths, and the root schema
reservation before M41/M43. M04 passed 1/1, M32 schema/admission/recovery
passed 26/26, and Backend typecheck/lint plus queue/reference/whitespace/Git
guard checks passed under Node 22.21.1. M40 is `10-ready` only: a fresh
activation may authorize the three test-only RED files; schema and source stay
prohibited until a separate RED review clears.

## Activation

At clean pushed `a14c26e`, an independent activation review confirmed accepted
dependencies, absent/disjoint RED/source paths, the ordered schema
reservation, a Web-only S16 lane, and green Node 22.21.1 Backend/M04/M32
baseline checks. M40 is `20-active` only to create its three declared
test-only RED files. `schema.ts`, Convex modules, and
`offering-command-admission.ts` remain prohibited until an independent RED
review clears.

## RED contract correction

The first independent RED review at `ca5e8d3` blocked source authorization:
the original test contract did not execute either asset transition and left
both the offering-to-attempt lookup and ready-address provenance ambiguous.
The scoped amendment recorded in
[M40 RED contract amendment review](../../evidence/M40-T010-red-contract-amendment.md)
adds only the additive offering index, exact local seam contract, and missing
RED vectors. It remains test/spec-only: `schema.ts`, Convex source, and the
admission helper are still prohibited until a fresh independent RED review is
clear.

The follow-up review also fixes the exact publish replay after a successful
`NEW` result has moved its offering to `OPEN`, and requires closed validator
assertions for the Directory admission and projection. These remain RED-test
requirements only.

## RED acceptance

At clean committed control head `e646e2e`, a fresh independent review found
the three RED files clear: 33 focused tests had exactly the three expected
absence failures (two M40 modules and the additive schema tables), 30 skips,
and no incidental failure under Node 22.21.1. The review also confirmed the
parser-first malformed-payload boundary, closed six-function Convex
interfaces, and the `READY`-only `NEW` versus linked `OPEN` replay rule.

Only the root-reserved additive schema amendment,
`packages/backend/convex/offerings.ts`,
`packages/backend/convex/directory_versions.ts`, and
`packages/backend/src/offering-command-admission.ts` are now authorized for
minimal local GREEN. The full evidence is the
[M40 RED review](../../evidence/M40-T010-red-review.md). No external or live
authority is added.

The valid Directory `NEW` test fixture has one GREEN-stage harness correction:
its indexed read and patch backing both expose the same prior `ACTIVE` row.
The correction keeps the required superseding patch executable and changes no
production contract, query, write, or capability.

For a canonical `OPEN` offering without an active-directory pointer, the
Directory mutation now makes its bounded target-version lookup before choosing
between ordinary `PRECONDITION_UNMET` (no version) and an unsafe persisted
idempotency conflict (a matching version). This resolves two otherwise
indistinguishable stored inputs without weakening either failure path.
