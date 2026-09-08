# M41-T010 — HTTP command ingress and public projection

## State

- Tier: CORE_P0
- Queue state: 00-inbox
- Dependencies: M22-T010 accepted; M23-T010 accepted; M24-T010 accepted;
  M25-T010 accepted; M32-T010 accepted; M39-T010 (this batch);
  M40-T010 (this batch)
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
  M40-T010 and [M43-T010](M43-T010-ats-receipt-verification.md) amend the
  same accepted file in this batch, so the root sequences the three
  reservations before any of those cards is ready.
  `packages/backend/convex/command_dispatch.ts` is declared here with the
  `external.attachCandidate` entry disabled; M43-T010 amends that file under a
  root integration reservation to enable exactly that one entry.
- Human actions: none for local delivery; `HA-CAMPAIGN-CONVEX-001` gates every
  published deployment, ingress key pair, and live request, and
  `HA-COMMAND-AUTHORITY-002` gates the command vocabulary M39-T010 normalizes.
  Both rows are requested by
  [HI-002](HI-002-campaign-deploy-reinstatement.md) and neither is complete.

## Scope

Add the HTTP boundary that the accepted ingress chain was built for. One Convex
router exposes `POST /internal/commands` plus two unauthenticated read prefixes,
`/public/offerings/` and `/public/directory/`. The write route rebuilds the
accepted M22 envelope from five `x-tool402-*` headers, runs the accepted M25
claimed-body composition over the exact raw bytes, normalizes one authenticated
wallet command through M39-T010, and forwards it to exactly one durable
admission mutation chosen by command type. The read routes serve the sanitized
offering and active-directory projections M40-T010 owns.

The local contract is the
[M41 specification](../../../specs/m41-http-command-ingress.md). It sits under
the approved
[campaign deploy flow design](../../../superpowers/specs/2026-09-08-campaign-deploy-flow-design.md)
and the intake in [HI-002](HI-002-campaign-deploy-reinstatement.md).

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
  `getPublicProjection`, and `getActive` functions, the M40-owned
  `markAssetPending(offeringId, attemptId)` transition this card's dispatch
  boundary invokes after an `ATS_CREATE` `NEW` admission, and one M39
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
  entry, exactly one `markAssetPending` call on an `ATS_CREATE` `NEW` result
  and none on any other status or command kind, echo-only `publicId`, and both
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

Beyond the one reserved `ingressCommandReplayClaims` table it adds no schema
change, Convex component, generated API output, cron, scheduler, retry, cache,
CORS policy, session, or second environment reader, and no wallet, provider,
ATS SDK, Mirror Node, funding, payment, transaction, settlement, clearing, HCS,
payout, or live behavior. The
`external.attachCandidate` dispatch entry is declared and disabled, so that
command type is answered `UNSUPPORTED_TYPE` until M43-T010 enables the entry
through its own reservation on
`packages/backend/convex/command_dispatch.ts`. A rejection by the accepted
zero-enabled M33 authority gate is not distinguishable at this boundary,
because M32 throws rather than returning a status, so it surfaces as
`REJECTED`; a distinguishable arm would require an M32 or M33 amendment outside
this card. Publication and any live request remain human-owned actions recorded
as redacted evidence.
