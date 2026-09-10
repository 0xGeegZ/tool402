# M47-T010 — ATS Stage-B runtime binding

## State

- Tier: CORE_P0
- Queue state: 20-active
- Dependencies: B01-T010 accepted, M32-T010 accepted, M33-T010 accepted, M41-T010 accepted,
  M42-T010 accepted, M43-T010 accepted, M44-T020 accepted, S21-T010 accepted,
  and HA-ATS-RUNTIME-BINDING-001 accepted
- Owner: The root owns queue state, catalog, ownership, decisions, reviews,
  commits, and pushes. Proposed implementation paths are exactly
  `packages/backend/convex/stage_b_ats_create_runtime_binding.ts`, the
  narrowly amended
  `packages/backend/convex/external_prepare_command_admission.ts`,
  `packages/backend/tests/stage-b-ats-create-runtime-binding.test.mjs`, the
  narrowly amended
  `packages/backend/tests/external-prepare-command-durable-admission.test.mjs`,
  `apps/web/src/lib/ats/stage-b-ats-create-command-projection.ts`, the
  narrowly amended `apps/web/src/lib/wallet/command-bridge.ts`, the narrowly
  amended
  `apps/web/src/components/provider/deploy/deploy-stage-signing.tsx`,
  `apps/web/tests/stage-b-ats-create-command-projection.test.mjs`, and the
  narrowly amended `apps/web/tests/command-bridge.test.mjs` and
  `apps/web/tests/deploy-stage-signing.test.mjs`. No package, lockfile,
  environment, generated output, public Backend export, M33 manifest,
  M44 Factory helper, route, or submission-document path is amendable.
- Human actions: none for local delivery. HA-ATS-STAGE-B-001 remains pending
  and is the sole authority for provider interaction, signing, transaction,
  candidate attachment, verification, or testnet execution.

## Scope

M42's real-issuer Stage-B projection and its canonical parameters digest are
already accepted. M44-T020 consumes that same complete real configuration as a
pure Factory + viem seam. The current S16 display literal deliberately carries
the synthetic digest for presentation, while S21 currently builds its
`external.prepare` payload from that display-only value. This card fixes that
consumer drift without changing either accepted canonical preimage.

The local authority is the
[M47 ATS Stage-B runtime binding contract](../../../specs/m47-ats-stage-b-runtime-binding.md)
and the
[M47 configuration reconciliation](../../evidence/M47-T010-configuration-reconciliation.md).

M47 introduces exactly two fail-closed projections:

1. A private Convex-side binding obtains the immutable complete M42 real
   configuration, requires the already normalized M32 signer/principal/role/
   authority-version context to equal that configuration's planned issuer, and
   requires the detached `ATS_CREATE` payload's exact fixed tuple and digest to
   equal it before M33, replay, idempotency, or durable state.
2. A browser-only public command projection transcribes only the M26 fields
   required to sign the already approved real `ATS_CREATE` payload. The S21
   bridge uses that projection only for stage 2; the S16 display literal stays
   display-only and is never accepted as a stage-2 input. The bridge retains
   one module-private neutral campaign subject literal exclusively for stages
   1 and 4; it is not an ATS configuration/projection and never forms the
   stage-2 `external.prepare` payload.

The production M33 manifest remains zero-enabled. This card does not make an
ATS command admissible, create an attempt, prompt a wallet, send calldata,
attach a candidate, or inspect a chain/Mirror response.

## Candidate ready requirements

- The card, specification, plan, reconciliation evidence, ledger, catalog,
  ownership, decision, and Stage-B draft correction are committed before any
  RED test or source change.
- Every declared dependency remains locally accepted; M46-T040's active
  EntityCheck test lane owns none of these paths.
- The new Convex binding, new browser projection, and their focused tests are
  absent. The named accepted M32, S21, and S16 amendments are confined to the
  exact runtime-binding behavior described here.
- The accepted real M42 canonical preimage and digest remain byte-identical.
  Any proposed change to a preimage field, target, signer/owner, descriptor,
  parameters, or digest stops this card for a new explicit human decision.

## Readiness review

The independent current-head review at
[M47-T010 readiness review](../../evidence/M47-T010-ready-review.md) is clear.
This card is `10-ready`; a separate fresh activation may authorize only its
durable test-only RED contract at the five focused test paths recorded in that
review. Every production source and live boundary remains prohibited pending
that activation and a fresh independent RED review.

## Activation review

The independent current-head review at
[M47-T010 activation review](../../evidence/M47-T010-activation-review.md) is
clear. This card is `20-active` only to create the durable RED contract at its
five named test paths. Every production source and live boundary remains
prohibited pending fresh independent RED acceptance.

## RED acceptance and GREEN authorization

The independent review at
[M47-T010 RED review](../../evidence/M47-T010-red-review.md) is clear. The
rebased durable RED commit `8aedc8e` changes exactly the five authorized test
paths; its focused run has 37 passes, six intended source-absence/boundary
failures, and eight skips. M47 remains `20-active` and now authorizes only
these source paths, with the same five tests reserved for matching updates:

- `packages/backend/convex/stage_b_ats_create_runtime_binding.ts`
- `packages/backend/convex/external_prepare_command_admission.ts`
- `apps/web/src/lib/ats/stage-b-ats-create-command-projection.ts`
- `apps/web/src/lib/wallet/command-bridge.ts`
- `apps/web/src/components/provider/deploy/deploy-stage-signing.tsx`

The private binding must follow M32 revalidation and precede M33, replay,
idempotency, and durable state. The public browser projection stays limited to
the six fixed M26 fields. The accepted real M42 preimage/digest stays
byte-identical and M33 remains zero-enabled. Every other source path and every
provider, wallet, SDK, network, transaction, candidate, verification, or live
action remains prohibited.

## Verification

- A durable test-only RED commit precedes every M47 production source change.
- Focused Backend tests prove the binding uses only the private immutable
  real-issuer M42 projection; rejects the synthetic digest, a signer/owner
  mismatch, role/principal/authority-version drift, and every payload tuple
  drift before M33 or a durable lookup; and leaves M33 zero-enabled.
- Focused Web tests prove stage 2 uses the exact real M26 projection, exposes
  no owner or private configuration value, takes no caller-provided projection,
  and cannot import the S16 display literal into the command bridge. They also
  preserve the bridge-local neutral subject only for stages 1 and 4.
- Backend/Web/root typecheck, focused tests, full relevant workspace tests,
  lint, queue/reference/whitespace checks, the enabled local-reference guard,
  and independent task plus module reviews pass before acceptance.

## Boundary

This is a source-only fail-closed correction. It authorizes no M33 manifest
entry, `commandAuthorities` provision, Convex publication, configuration or
environment read, SDK, wallet, provider, RPC, simulation, asset, payment,
funding, transaction, candidate, Mirror read, deployment, finality claim, or
submission evidence.
