# M41-T010 — HTTP command ingress and public projection

## State

- Tier: CORE_P0
- Queue state: 20-active
- Dependencies: M22-T010 accepted; M23-T010 accepted; M24-T010 accepted;
  M25-T010 accepted; M32-T010 accepted; M39-T010 accepted;
  M40-T010 accepted
- Owner: The root owns queue state, catalog, ownership, decisions, reviews,
  commits, and pushes. Proposed implementation paths are exactly:
  `packages/backend/convex/http.ts`,
  `packages/backend/convex/command_dispatch.ts`,
  `packages/backend/convex/wallet_command_replay.ts`,
  `packages/backend/tests/http-command-ingress.test.mjs`,
  `packages/backend/tests/command-dispatch.test.mjs`, this card,
  `docs/specs/m41-http-command-ingress.md`, and one amendment under a root
  integration reservation to `packages/backend/convex/schema.ts` adding only
  the `ingressCommandReplayClaims` table and its `by_replay_identity` index.
  M40-T010 and [M43-T010](../00-inbox/M43-T010-ats-receipt-verification.md) amend the
  same accepted file in this batch, so the root sequences the three
  reservations before any of those cards is ready.
  `packages/backend/convex/command_dispatch.ts` is declared here with the
  `external.attachCandidate` entry disabled; M43-T010 amends that file under a
  root integration reservation to enable exactly that one entry.
- Scoped atomic-handoff amendment: M41 owns the constrained integration
  amendments to `packages/backend/convex/external_prepare_command_admission.ts`,
  `packages/backend/convex/offerings.ts`, and
  `packages/backend/convex/schema.ts`, plus the corresponding focused M32/M40
  test amendments at
  `packages/backend/tests/external-prepare-command-durable-admission.test.mjs`
  and `packages/backend/tests/offering-command-admission.test.mjs`. They add
  only the M32 `ATS_CREATE` atomic admission and the
  M40 lookup index/closed helper recorded in the local specifications; no
  existing non-`ATS_CREATE` M32 behavior, M40 public projection, or external
  capability is eligible.
- Human actions: none for local delivery; `HA-CAMPAIGN-CONVEX-001` gates every
  published deployment, ingress key pair, and live request, and
  `HA-COMMAND-AUTHORITY-002` gates the command vocabulary M39-T010 normalizes.
  Both rows are accepted only as bounded local authority or human evidence;
  they do not authorize configuration access, publication, keys, or a live
  request.

## Scope

Add the HTTP boundary that the accepted ingress chain was built for. One Convex
router exposes `POST /internal/commands` plus two unauthenticated read prefixes,
`/public/offerings/` and `/public/directory/`. The write route rebuilds the
accepted M22 envelope from five `x-tool402-*` headers, runs the accepted M25
claimed-body composition over the exact raw bytes, normalizes one authenticated
wallet command through M39-T010, and forwards it to exactly one durable
admission mutation chosen by command type and `ATS_CREATE` operation kind. The
M32 atomic ATS_CREATE mutation links the offering in its own durable
transaction; the HTTP action cannot select an offering document ID. The read routes serve the sanitized
offering and active-directory projections M40-T010 owns.

The local contract is the
[M41 specification](../../../specs/m41-http-command-ingress.md). It sits under
the approved
[campaign deploy flow design](../../../superpowers/specs/2026-09-08-campaign-deploy-flow-design.md)
and the intake in [HI-002](../60-done/HI-002-campaign-deploy-reinstatement.md).

This card supplies no cryptography, payload grammar, authority rule, replay
rule, or durable record shape. Those stay with the accepted
[M22](../../../specs/m22-ingress-envelope.md),
[M23](../../../specs/m23-protected-ingress-verifier.md),
[M24](../../../specs/m24-protected-replay-claim.md),
[M25](../../../specs/m25-claimed-protected-body.md), and
[M32](../../../specs/m32-durable-external-prepare-admission.md) contracts and
with the two in-batch cards. M41 owns transport, one environment read, one
reserved transport replay table, one closed dispatch table, one closed
write-route response union, and one closed response union per read route.

## Why this card exists now

The accepted M32 contract states that a future adapter must independently run
the authentication boundary, submit the result, and recover by idempotency
context without automatic re-submission. Nothing in the repository does that
today, so every accepted ingress and admission boundary is unreachable from
outside one JavaScript process. This card is that adapter and nothing more.

## Candidate ready requirements

- M22-T010, M23-T010, M24-T010, M25-T010, and M32-T010 remain accepted, and
  M39-T010 and M40-T010 are accepted ahead of this card in the batch order
  recorded by HI-002.
- The M41 specification, this card, and the catalog, ownership, and state
  records are committed before any RED test or source change.
- The declared paths are disjoint from every active card apart from the shared
  `packages/backend/convex/schema.ts` reservation the root sequences and the
  later M43-T010 amendment to `packages/backend/convex/command_dispatch.ts`
  under its own reservation. No other accepted file, package manifest,
  lockfile, Web path, or Agent path is eligible.
- The transport replay claim lives in the M41-owned
  `ingressCommandReplayClaims` table, distinct from the
  `walletCommandReplayClaims` table M40-T010 reserves for the three wallet
  command types. The HI-002 intake records both as additive schema
  reservations; the root confirms both, in this card's and M40's reservation
  respectively, before either card is ready.
- The in-batch interfaces this card consumes are confirmed to exist as named:
  the M40 `admitOfferingCreate`, `admitDirectoryPublish`,
  `getPublicProjection`, and `getActive` functions, the M32
  `admitAtsCreateAndMarkAssetPending` atomic transition, which resolves and
  links its offering server-side after an `ATS_CREATE` `NEW` admission, and one M39
  normalizer over the four command types admitted by
  `HA-COMMAND-AUTHORITY-002`, whose `external.prepare` behavior is identical to
  the accepted M30 boundary.
- The specification fixes the route table, the five-header mapping, the fixed
  body cap, the single clock reading, the two environment variable names, the
  transport replay identity and its distinctness from the wallet-command
  identity, the closed dispatch table, and all three closed response unions
  before any code exists.
- The test-only RED must precede every M41 production source change and must
  fail only because the declared M41 modules and replay table do not exist.

## Verification

- Durable RED files at `packages/backend/tests/http-command-ingress.test.mjs`
  and `packages/backend/tests/command-dispatch.test.mjs` precede every source
  change and introduce no source, manifest, lockfile, configuration, or
  external behavior.
- The scoped atomic-handoff RED also permits only the two named M32/M40 focused
  test amendments in State. It proves full rollback on missing, duplicate,
  malformed, linked, or cross-context offering candidates; generic M32
  ATS_CREATE rejection; exact replay only with an already-linked matching
  `ASSET_PENDING` offering; and no M41 dispatch-side offering transition.
- Focused Node commands from the repository root under Node 22.21.1:

  ```bash
  node --test packages/backend/tests/http-command-ingress.test.mjs
  node --test packages/backend/tests/command-dispatch.test.mjs
  ```

- Focused tests use a controlled fake context in the style of the accepted M32
  durable-admission tests, a real `Request`, and the established valid M23
  envelope and key vector. They prove the exact three-entry route table, the
  five-header mapping, the byte cap applied before hashing, one clock reading
  shared by the skew and command windows, exactly one transport replay claim
  per request, the reason-free `REJECTED` arm for every upstream failure, the
  exact M32 status mapping, `UNSUPPORTED_TYPE` only for a disabled dispatch
  entry, selection of the atomic M32 entry only for `ATS_CREATE`, no
  dispatch-side `markAssetPending` call, echo-only `publicId`, and both
  read-route grammars with their three outcomes.
- One focused test imports
  `packages/backend/convex/external_prepare_command_admission.ts`,
  `packages/backend/convex/offerings.ts`, and
  `packages/backend/convex/directory_versions.ts` and asserts that the exact
  exported name each frozen dispatch-table literal names is present, so a
  module or export rename breaks the table at test time rather than at a live
  request.
- Boundary tests prove that no response, thrown value, or durable row carries a
  key, secret, signature, signing input, body digest, raw body, or document
  identifier; that an absent or malformed ingress configuration rejects every
  request; that `http.ts` holds routing only; and that the test-only entry
  point is absent from production call paths.
- `npm run typecheck`, `npm run test`, `npm run lint`, `npm run queue:check`,
  and the enabled local-reference guard pass, followed by an independent task
  review and two fresh clean module-review generations with no Critical,
  Important, or Minor finding.

## Boundary

This card adds a local HTTP boundary in front of already accepted local
boundaries. It publishes nothing, creates no deployment, holds no key, provides
no authority row, and claims no receipt, finality, evidence record, or
submission. Until `HA-CAMPAIGN-CONVEX-001` supplies a reachable deployment and
its ingress key pair, the router has no configured key and rejects every
request; until an issuer authority row exists, every normalized command fails
closed before a durable write.

Beyond the reserved `ingressCommandReplayClaims` table and the scoped
`by_ats_create_draft_binding` M40 index, it adds no schema change, Convex
component, generated API output, cron, scheduler, retry, cache, CORS policy,
session, or second environment reader, and no wallet, provider, ATS SDK, Mirror
Node, funding, payment, transaction, settlement, clearing, HCS, payout, or live
behavior. The
`external.attachCandidate` dispatch entry is declared and disabled, so that
command type is answered `UNSUPPORTED_TYPE` until M43-T010 enables the entry
through its own reservation on
`packages/backend/convex/command_dispatch.ts`. A rejection by the accepted
zero-enabled M33 authority gate is not distinguishable at this boundary,
because M32 throws rather than returning a status, so it surfaces as
`REJECTED`; a distinguishable arm would require an M32 or M33 amendment outside
this card. Publication and any live request remain human-owned actions recorded
as redacted evidence.

## Ready review

At clean pushed `cf6f617578b7656d36109f80b4b9ad2d1db5df51`, all accepted M22
through M25, M32, M39, and M40 predecessors resolved locally; all five declared
M41 implementation/test paths remained absent and disjoint; and the M40 schema
reservation precedes this M41 amendment. S21 is Web-only and has no ownership
or dependency collision. The local-only boundary has no human-action blocker.
A fresh activation may authorize only the two durable test-only RED contracts.

## Activation review

At clean pushed `1558823fe6fafa2a81808428fae0d76fe7f1c84f`, a fresh independent
activation review found M41-T010 to be the sole ready card, all accepted
dependencies unchanged, all five declared M41 paths absent, and no ownership
collision with the Web-only M44-T010 or S21-T010 inbox cards. The Backend
baseline passed 202/202 under Node 22.21.1, alongside Backend typecheck/lint,
queue validation, whitespace, and the enabled local-reference guard. This
activation authorizes only the two durable test-only RED files named in
Verification. Schema and production modules remain absent until a separate
independent RED review accepts the exact failure contract.

## Atomic handoff amendment

Independent review found that the prior two-mutation ATS_CREATE handoff could
leave a `PREPARED` attempt unlinked when its later offering transition failed.
This card therefore amends the local M32/M40/M41 specifications and reserves
only the closed atomic M32 path, its M40 helper/index, and focused M32/M40 test
amendments. The generic M32 mutation rejects ATS_CREATE; M41 dispatches that
operation only to `admitAtsCreateAndMarkAssetPending`. The correction is local
durable integrity work only: it adds no signed field, authority, target,
configuration access, wallet, provider, SDK, transaction, deployment, or live
behavior. A fresh independent amendment review must clear before the expanded
test-only RED contract is written. That review is clear at this control commit:
the four named test files are authorized, while every production source,
schema, configuration, wallet, provider, SDK, transaction, deployment, and
live path remains prohibited until a separate RED review accepts their exact
failure contract.
