# HI-009 — Stage B rehearsal readiness intake

## Purpose

Human intake card. The Stage B decision packet drafted on 2026-09-09 assumes
capabilities the accepted source does not provide, so a GO on it today could
not be executed through the reviewed path. This card asks the root to
catalogue the two cards the rehearsal cannot proceed without and records the
packet amendment that trims the rehearsal to what the accepted source can
truthfully record. It authorizes no wallet, SDK, provider, transaction,
deployment, or live action and changes no existing card's scope.

## State

- Tier: intake
- Queue state: 00-inbox
- Dependencies: none
- Raised by: human operator, 2026-09-10
- Owner: root integrator on intake. The decision row is root-recorded.
- Human actions: none by this card. `HA-ATS-STAGE-B-001` stays PENDING until
  the amended packet is separately accepted.

## Observation

- Every source precondition the packet names is now accepted: M41-T010,
  M43-T010, M44-T020 with M44-T030, M47-T010, and S21-T010.
  `HA-PUBLIC-DEPLOY-001` is not recorded; the packet already permits a named
  local host for the rehearsal.
- Packet step 2 expects one enabled `ATS_CREATE` record "supplied as a
  reviewed source revision of the private manifest under a root-owned card".
  No such card is catalogued. `packages/backend/convex/ats_prepare_authority.ts`
  still holds `currentManifest = Object.freeze([])`, so every `ATS_CREATE`
  command that passes M47's binding stops at M33.
- Packet step 3 expects the provider to execute one Factory `deployBond` from
  the deploy wizard. The wizard's `AtsCreateAction` renders a disabled
  "Create revenue note — unavailable" button, nothing in `apps/web/src` sends
  a transaction carrying the M44 calldata, and nothing sets the session
  `candidate` that stage 3 (`external.attachCandidate`) requires. The README
  records the same: the Factory + viem seam "is not wired to a provider
  transaction flow".
- Packet step 4 expects the offering to become `READY` from a `CONFIRMED`
  verification. `verifyAtsCandidateReceipt` returns `NOT_CONFIGURED` for every
  operation kind other than `HEDERA_FUNDING`, nothing schedules it, and the
  M43 specification defers positive `ATS_CREATE` verification to a separately
  reviewed successor that is not catalogued.
- Packet step 5 expects one `ATS_CONTROL_LIST` and one `ATS_ISSUE`. Those kinds
  exist only as payload vocabulary; no M33 mapping, calldata encoder, or wizard
  stage exists for them.
- No source path writes `commandAuthorities`; the ISSUER row is a human insert
  on the named Convex deployment, as the packet already states.

## Requested sequence

1. Catalogue one root-owned card that enables exactly one `ATS_CREATE` record
   in `ats_prepare_authority.ts`, bound to the `HA-ATS-RETARGET-001` values
   (registry revision `ats_sdk_8_0_0_testnet_v2`, target
   `0xd1f118a40f3b02883d35909ef2517e7edd78379d`, factory `0.0.9213391`,
   resolver `0.0.9212226`, subject `riskscan_revenue_note_demo`, offering
   version `ats_demo_v1`) and the accepted real-issuer digest
   `1880065c5ae64b3fc6279cfdd8c85a6880d43e98ce129ed697c72372204296f9`. RED then
   GREEN; no other operation kind is enabled. Its ready state is gated on the
   recorded acceptance of the amended Stage B packet.
2. Catalogue one root-owned card that wires the existing `AtsCreateAction` to
   one MetaMask `eth_sendTransaction` carrying `encodeFactoryDeployBond`
   calldata on chain 296, waits for the receipt, decodes the `BondDeployed`
   address through the accepted M44-T030 helper, and sets the session
   candidate as `{ transactionId (mirror form), evmAddress }` for stage 3.
   Tests send no transaction; the browser proof is injected. Same gate as
   card 1.
3. Treat this card as the citation that turns the amended packet from draft
   into a request. Once the human accepts it, record the decision row and the
   `HA-ATS-STAGE-B-001` row update.
4. Defer positive `ATS_CREATE` verification (the M43 successor) and the
   lifecycle operations to post-rehearsal cards. Neither is required for the
   rehearsal's truthful end state.

Where these sit relative to HI-008 is the root's call. The human's preference
is after HI-008 step 3 and before its step 4, because the delivered lanes are
polish and the rehearsal is the tokenization-track evidence.

## Packet amendment recorded with this card

The packet's "What Stage B authorizes" section is amended in the same commit:
the transaction cap becomes exactly one Factory `deployBond`; step 4 ends at a
`SUBMITTED` attempt with the candidate attached and the offering at
`ASSET_PENDING`; step 5 is removed; the evidence list drops the lifecycle
transaction ids; the 50 HBAR spend cap and every stop condition stay.

## Requested root records

1. One decision row recording the two catalogued successor cards, their gate,
   and the amended rehearsal scope.
2. No change to any other card's tier, dependencies, paths, or boundary.
3. No change to any human-action row until the amended packet is accepted.

## Explicit non-authorizations

This card authorizes no configuration bridge, durable attempt, manifest
change, wallet or provider interaction, transaction, deployment, or live
behavior, and it does not move any card between queue states by itself.

## Human ruling

The human operator ruled GO on the requested sequence at the time this card
was merged, through the operator's delegated session. The root records the
decision row from this card.
