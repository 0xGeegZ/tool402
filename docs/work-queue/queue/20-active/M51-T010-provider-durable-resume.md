# M51-T010 — Provider durable campaign resume

## State

- Tier: CORE_P0
- Queue state: 20-active
- Dependencies: S17-T010 accepted, S21-T010 accepted, M47-T010 accepted,
  M48-T010 accepted, M49-T010 accepted, M50-T010 accepted.
- Owner: root integrator for queue/control records; a later implementer may
  change only the paths authorized by separate readiness, RED, and GREEN
  reviews.
- Human actions: none. This card never asks for a wallet, signature, relay,
  authority mutation, payment, transaction, candidate attachment, deployment,
  or live action.

## Purpose

The Provider deploy screen stores completed Stage 1 and Stage 2 facts only in
React state. A reload therefore offers a new Stage 1 request even when Convex
already holds the exact accepted `ASSET_PENDING` offering and its linked
`PREPARED` ATS_CREATE attempt. That path correctly reaches idempotency
conflict, but the UI cannot resume the durable campaign.

M51 adds a read-only resume projection. It allows the screen to display the
existing Stage 1/2 facts only when Convex proves the one safe pending offering
and its exact linked prepared ATS_CREATE attempt belong to the connected
issuer. It does not query a blockchain and does not retry or submit anything.

## Local authority

The implementation contract is [M51 provider durable campaign resume](../../../specs/m51-provider-durable-campaign-resume.md).

Candidate paths after readiness are exactly:

- `packages/backend/convex/offerings.ts`;
- `packages/backend/tests/offering-command-admission.test.mjs`;
- `apps/web/src/lib/offering-projection.ts`;
- `apps/web/src/lib/provider-campaign-resume.ts` (new);
- `apps/web/src/components/provider/deploy/deploy-stage-signing.tsx`; and
- `apps/web/tests/provider-campaign-resume.test.mjs` (new).

## Contract

- The public offering projection may include `atsAttemptPublicId` only for a
  fully validated `ASSET_PENDING` offering whose linked attempt is exactly a
  `PREPARED`, `ATS_CREATE`, Hedera-testnet, issuer attempt with matching
  subject, signer, principal, and authority version.
- The browser reads the existing Next offering endpoint only after the wallet
  is connected. It resumes only when the fixed RiskScan subject, canonical
  signer, `ASSET_PENDING` state, and canonical attempt public id all match.
- Resume is presentation of already durable facts: it must neither create a
  new offering nor sign, relay, enable authority, request a provider,
  transact, observe the network, attach a candidate, or persist browser data.
- A malformed, absent, mismatched, unavailable, or changed-wallet projection
  fails closed to the existing initial stage. No automatic retry occurs.
- A resumed Stage 2 does not authorize Stage B. `HA-ATS-STAGE-B-001` remains
  the separate human gate for any `eth_sendTransaction`, receipt/Mirror
  observation, candidate, or attachment.

## Candidate-ready requirements

- This card, specification, catalog, ownership, state, and decision records
  are committed before source/test change.
- All dependencies remain accepted and no active task owns a candidate path.
- The focused baseline and queue/reference/whitespace checks are clear.
- A separate activation may reserve only the two test paths for durable RED.

## Readiness and activation

The root [readiness review](../../evidence/M51-T010-ready-review.md) is clear
at `88108b98fb9ef01b46146afcf2b13573c960c20e`. The root
[activation review](../../evidence/M51-T010-activation-review.md) reserves
only the two declared test paths for durable RED. Every source path remains
prohibited until the RED contract is reviewed.

## RED acceptance and GREEN authorization

The root [RED review](../../evidence/M51-T010-red-review.md) accepts
`3aca764fb845d52912fee359323fdc6a72a4b71e`: its two intended failures prove
the absent durable offering reference and absent pure Web resume helper. The
exact GREEN paths are the six candidate paths declared in this card; every
other source/test path and every live boundary remains prohibited.

## Verification

- RED proves a valid durable pending offering resumes the exact stage facts,
  while malformed/mismatched attempts and wallet mismatch do not.
- Backend tests prove the optional projection field is derived only after a
  linked attempt is revalidated; the web tests prove no direct Convex/client
  mutation, provider request, storage, automatic signature, or transaction.
- Run focused Backend/Web tests, typecheck, lint, queue/reference/whitespace
  checks, and a non-signing browser confirmation against Dev after the
  separately authorized source deployment.

## Boundary

M51 replaces only the historical statement that the original browser session
must remain open to retain already accepted Stage 1/2 state. It leaves all
authority, idempotency, signing, Stage-B, on-chain, candidate, and live gates
unchanged.
