# UI-S21 campaign command bridge manifest

## Delivery boundary

The accepted UI-S15 island signs one command type and the accepted UI-S16
wizard lists four deployment stages it cannot act on. UI-S21 is the bridge
between them: request builders for the four campaign commands, one signing
island composed from the accepted wallet island and signature dialog, and one
frozen directory record literal. It reimplements no provider selection, chain
gate, nonce, typed data, signing, dialog phase, or relay behavior, and it
owns no payload schema or canonicalizer.

## Local targets

The slice may add `apps/web/src/lib/wallet/command-bridge.ts` (pure request
builders and the closed campaign command type set),
`apps/web/src/components/provider/deploy/deploy-stage-signing.tsx` (the client
island mounted on the wizard review step), and
`apps/web/src/components/provider/deploy/directory-record-literal.ts` (the
frozen M28 record for stage 4), plus `apps/web/tests/command-bridge.test.mjs`
and `apps/web/tests/deploy-stage-signing.test.mjs`. It amends, under root
reservations, the accepted S15 type check and its focused assertions, one
sentence of UI-S15, and the S16 stage control, stage states, stages component,
wizard mount, and two focused tests. It adds no dependency, token, stylesheet
change, or icon package and reuses the accepted `button`, `card`, and `badge`
primitives.

## Required bridge behavior

The campaign command type set is closed and exactly `external.prepare`,
`offering.create`, `directory.publish`, and `external.attachCandidate`, the
set admitted by the accepted HA-COMMAND-AUTHORITY-002 decision. The S15
builder and `signAndRelayCommand` accept a member of that set and refuse any
other string before provider, nonce, signature, or relay work. Domain,
primary type, field order, nonce and timestamp grammars, the 300-second
lifetime, the signature grammar, the two-key body, and the relay route are
unchanged.

Each builder returns one `SignatureDialogRequest` for one stage:

- Stage 1 builds an `offering.create` payload from the wizard's reviewed
  values through the accepted `parseOfferingCreatePayload` and
  `canonicalOfferingCreatePayloadBytes`, with `offeringPublicId` and
  `subjectPublicId` fixed to the frozen S16 subject, `offeringVersion` `1`,
  the accepted terms v1 definition, and the two display prices converted by
  the accepted S16 conversion.
- Stage 2 builds an `external.prepare` payload with `operationKind`
  `ATS_CREATE` from the frozen S16 ATS_CREATE literal through the accepted
  `parseExternalPreparePayload`, and hashes the bytes the accepted M26
  canonicalization emits.
- Stage 3, second sub-step, builds an `external.attachCandidate` payload from
  the stage 2 idempotency key as `attemptPublicId` and the M44 candidate's
  `transactionId` and `evmAddress` through the accepted
  `parseAttachCandidatePayload` and `canonicalAttachCandidatePayloadBytes`.
- Stage 4 builds a `directory.publish` payload from the frozen directory
  record literal with `directoryVersion` `1` through the accepted
  `parseDirectoryPublishPayload` and `canonicalDirectoryPublishPayloadBytes`.

Every request takes one clock reading, sets payload and command `expiresAt`
to the same string, and draws a fresh `idempotencyKey` from the accepted S15
nonce generator; no key or nonce is reused across requests, and a declined or
failed signature discards the request. A builder refuses to produce a request
for a stage whose predecessor is not `done` in this session, and refuses stage
3 without a candidate and stage 4 without a complete record literal.

## Required stage behavior

The island mounts on the wizard review step below the stage list. It renders
the accepted wallet island once; with no connected session every stage control
stays exactly as UI-S16 renders it today. With a connected session on chain
`0x128`, the control of the first stage whose state is `actionable` becomes
enabled and its activation opens the accepted signature dialog with that
stage's request. While the dialog is open the stage is `in_progress`. The
dialog result maps onto the closed ten-kind S16 union through the accepted
`stageKindForRelayOutcome`: `complete` with `ACCEPTED` is `done`, `rejected`
returns the stage to `actionable` with "Nothing was recorded.", `failed`
carries the relay outcome it names, and `unknown` is `unknown`. Only a `done`
predecessor makes the next stage `actionable`. Stage 2 becomes `actionable`
after stage 1 only when the frozen ATS_CREATE literal is present. Stage 3
stays `unavailable` until the M44 action returns a candidate in this session;
its second sub-step is then the stage's control. Stage 4 stays `unavailable`
while the record literal is incomplete.

Every stage detail line renders only a value the relay actually returned:
the echoed `publicId` where present, and nothing else. The offering-state
chip stays `NOT STARTED`; the provider status route remains the only surface
that reports an offering state.

## Truthfulness and authority boundary

A connected wallet is not an authority, a signature is not an accepted
command, and a relayed `ACCEPTED` is a backend admission, never an on-chain
fact. Stage state is derived only from results this browser session received,
is not persisted, and returns to its resting kind on reload; the island says
so. Nothing retries. The island reads no environment value, holds no key, and
creates no session, storage, cookie, analytics, polling, or external link. It
sends no transaction; the first sub-step of stage 3 belongs to M44 and every
live ATS execution to the separate Stage B human gate.

## Acceptance evidence

- Focused contracts cover the closed type set on both the builder and the
  relay flow, each request's payload field set through the accepted parsers,
  the shared `expiresAt`, the fresh idempotency key per request, the
  predecessor rule, the candidate and record preconditions, and the
  result-to-stage mapping including the declined return and the single path
  to `done`.
- The amended S15 and S16 suites pass unchanged except for the named
  assertions.
- Web typecheck, test, and lint, root quality, the equivalent Webpack
  production build, desktop and mobile browser evidence with the relay in its
  not-configured state, queue, reference, and whitespace checks, the enabled
  guard, an independent task review, and two fresh clean module-review
  generations pass before acceptance.
