# HI-009 — M33 Phase A acceptance and Stage B successor sequencing

## Purpose

Human intake card. The human operator accepts the root's Phase A packet
`HA-ATS-M33-ENABLEMENT-001`, recorded at
`docs/work-queue/evidence/HA-ATS-STAGE-B-001-recommended-decision-v2.md`,
exactly as written, so the root can create M48-T010. It also asks the root
to catalogue the packet's deferred transaction-execution successor in
parallel and to rule on a trimmed live Stage B before the submission
deadline. Beyond the packet's own Phase A text it authorizes no wallet, SDK,
provider, authority row, transaction, deployment, or live action.

## State

- Tier: intake
- Queue state: 00-inbox
- Dependencies: none
- Raised by: human operator, 2026-09-10
- Owner: root integrator on intake. The acceptance is human-owned and
  root-recorded; the root owns every decision, card, and queue record it
  creates from this card.
- Human actions: the acceptance below is complete. `HA-ATS-STAGE-B-001`
  stays PENDING and untouched, as the packet requires.

## Observation

- The earlier draft packet at
  `docs/work-queue/evidence/HA-ATS-STAGE-B-001-recommended-decision.md`
  assumed capabilities the accepted source does not provide:
  `packages/backend/convex/ats_prepare_authority.ts` holds
  `currentManifest = Object.freeze([])`; the wizard's `AtsCreateAction`
  renders a disabled "Create revenue note — unavailable" button, nothing in
  `apps/web/src` sends the Factory calldata, and nothing sets the session
  `candidate` that stage 3 (`external.attachCandidate`) requires;
  `verifyAtsCandidateReceipt` returns `NOT_CONFIGURED` for every operation
  kind other than `HEDERA_FUNDING` and is never scheduled; and
  `ATS_CONTROL_LIST` / `ATS_ISSUE` exist only as payload vocabulary.
- The root's v2 packet records the same facts, declares the earlier draft
  unusable as a GO, scopes Phase A to one enabled `ATS_CREATE` manifest
  record under a new M48-T010, and names three successors before a live
  Stage B decision may be requested.
- B03-T020's GREEN candidate is merged as `b81b039`, so HI-008 step 3 is
  complete and step 4 (the three delivered lanes) is next in the root's
  order.

## Human acceptance

At `2026-09-10T19:15:51Z`, through the operator's delegated session and with
the packet presented in full, the human operator declared:

> I approve HA-ATS-M33-ENABLEMENT-001 exactly as recorded in
> `docs/work-queue/evidence/HA-ATS-STAGE-B-001-recommended-decision-v2.md`.
> I approve only the Phase-A local source-only M33 ATS_CREATE enablement work
> described here. I reject every live, provider, wallet, authority-row,
> deployment, host, transaction, candidate, receipt, finality, funding, and
> lifecycle action. HA-ATS-STAGE-B-001 remains PENDING and untouched. I reject
> all implicit defaults and all operations not expressly listed.

Decision owner: `0xGeegZ`. Decision timestamp: as above. Nothing is inferred
beyond the packet's own text.

## Requested sequence

1. Record the acceptance as the `HA-ATS-M33-ENABLEMENT-001` decision row and
   create M48-T010 exactly as the packet describes: one schema-versioned,
   enabled, fixed `ATS_CREATE` record whose `operationDescriptor` and
   `parameters` are byte-identical to the frozen M42 real-issuer projection,
   with focused tests proving it is the only admissible ATS mapping.
2. Catalogue, in parallel with M48-T010, the packet's deferred successor for
   the browser/provider transaction-execution boundary: wire the existing
   `AtsCreateAction` to one MetaMask `eth_sendTransaction` carrying
   `encodeFactoryDeployBond` calldata on chain 296, await the receipt, decode
   the `BondDeployed` address through the accepted M44-T030 helper, and set
   the stage-3 candidate as `{ transactionId (mirror form), evmAddress }`.
   Tests inject the browser proof and send nothing. Its ready state waits for
   M48-T010 acceptance.
3. Rule whether a trimmed live Stage B may be requested once M48-T010 and
   that successor are accepted: exactly one Factory `deployBond`, terminal
   state a `SUBMITTED` attempt with the candidate attached and the offering at
   `ASSET_PENDING`, no verification action invoked, no lifecycle operation,
   the packet's other two successors reduced to a named local host and the
   operator's redacted Mirror Node evidence. If the root declines, the demo
   keeps the truthful pending gate and makes no Stage B claim.
4. Position in the working order is the root's call. The human's preference
   is after HI-008 step 3, now complete, and before its step 4, because the
   delivered lanes are polish and Stage B is the tokenization-track evidence.

## Requested root records

1. One decision row recording the Phase A acceptance with the packet's own
   exclusions.
2. The M48-T010 card and the transaction-execution successor card, each
   with its gate.
3. One decision row answering item 3 of the requested sequence.
4. No change to any human-action row beyond what the accepted packet itself
   states.

## Explicit non-authorizations

This card authorizes no configuration bridge, durable attempt, Convex
publication, `commandAuthorities` row, wallet or provider interaction,
transaction, deployment, or live behavior, and it does not move any card
between queue states by itself.

## Human ruling

The human operator ruled GO on the acceptance and the requested sequence at
the time this card was merged, through the operator's delegated session. The
root records the decision rows from this card.
