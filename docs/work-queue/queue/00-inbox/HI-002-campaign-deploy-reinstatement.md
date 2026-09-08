# HI-002 — Campaign deploy reinstatement intake

## Purpose

Human intake card. The human operator has reviewed and approved the
[campaign deploy flow design](../../../superpowers/specs/2026-09-08-campaign-deploy-flow-design.md)
and directs that the provider campaign path re-enter this event's scope,
including the tokenization track. This card asks the root to record that
ruling, to create the human-action rows the path needs, and to evaluate the
twelve implementation cards committed beside it. It accepts no product
behavior and authorizes no external action.

## State

- Tier: intake
- Queue state: 00-inbox
- Dependencies: none
- Raised by: human operator, 2026-09-08
- Owner: root integrator on intake. The scope ruling, every human-action row,
  and every decision row are human-owned and root-recorded.
- Human actions: this card requests the rows listed below; none is complete.

## Scope

### 1. Scope ruling requested

`D-HI-001-001` cut the funding half of the demo narrative and `D-HI-001-003`
parked every ATS card and stated that the Stage B live authority would not be
supplied before submission. The human operator now rules otherwise for one
bounded path: the provider campaign deploy flow, its ATS revenue note, its
directory activation, and one lifecycle operation. The root is asked to
record this as `D-HI-002-001` with the following content.

- Ruling: the campaign deploy path is back in scope. The tokenization track
  is selected in addition to the agentic-payments track.
- Basis: the approved design reuses the accepted M20 through M37 boundaries;
  the only net-new surfaces are the wallet island, one relay route, the
  offering and directory tables, the HTTP ingress, the receipt verifier, and
  three routes. Every stopping point renders a truthful state.
- Cost if wrong: agent time spent on the now half is sunk; nothing false is
  claimed because no state advances without a verified record. If Stage B
  does not land, the tokenization track is forfeited exactly as before.
- Precedence: `HA-B03-AGENT-PAYMENT-001`, `HA-PUBLIC-DEPLOY-001`, the README
  rewrite, `HA-DEMO-VIDEO-001`, and `HA-SUBMISSION-001` keep precedence for
  human time. The campaign cards compete only for agent lanes.

### 2. Externally verified facts the local records do not hold

Each fact was checked against a primary source on 2026-09-08.

- The accepted ATS_CREATE target `0.0.7708432` is the contracts v4.0.0
  deployment. Its implementation dispatches `deployBond` selector
  `0x5133f0e0` only. SDK 8.0.0 encodes selector `0x29002951`, which only the
  2026-06-12 deployment dispatches: factory proxy `0.0.9213391` and resolver
  `0.0.9212226`. Both contracts are live on testnet. Stage B cannot execute on
  the accepted record.
- The approved issuer `0xc89f87052c3e080b4a9b021d4930055031ef378e` has no
  Hedera testnet account. Mirror Node returns 404 for it.
- The SDK's MetaMask service selects the global injected provider and does
  not request a chain switch. The accepted browser rule requires EIP-6963
  selection and chain `0x128` before signing.
- The x402 Hedera client signs only with a Hiero private key. A MetaMask
  holder cannot pay that rail. The backer funding path is a plain HBAR
  transfer verified on Mirror Node.
- The only Convex deployment on record is development-only with five
  RiskScan functions and no HTTP router.

### 3. Human-action rows requested

The root is asked to add these rows to the human actions record. None is
complete; each names its own evidence.

| ID                          | Human-only action                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Unblocks                                                  |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| HA-COMMAND-AUTHORITY-002    | Amend the accepted command authority to admit `offering.create`, `directory.publish`, and `external.attachCandidate` under the same EIP-712 domain and primary type, each with its own closed payload and a Keccak-256 of RFC 8785 JCS payload hash. `offering.create` requires an `ISSUER` authority owning the payload subject; `directory.publish` and `external.attachCandidate` carry no subject identifier, so they require the `ISSUER` role plus a deferred subject-ownership reference that the durable boundary resolves against the referenced offering or attempt before any write. | M39-T010                                                  |
| HA-ATS-RETARGET-001         | Re-supply the immutable ATS_CREATE configuration for the SDK 8.0.0 testnet deployment: factory `0.0.9213391` / `0xd1f118a40f3b02883d35909ef2517e7edd78379d`, resolver `0.0.9212226` / `0xba2d5fc2083a0b8f164c50e65d782087fba18e0a`, registry revision `ats_sdk_8_0_0_testnet_v2`, and the recomputed synthetic and real-issuer digests.                                                                                                                                                                                                                                                         | M42-T010                                                  |
| HA-ISSUER-ACCOUNT-001       | Create and fund the Hedera testnet account for `0xc89f87052c3e080b4a9b021d4930055031ef378e` through the public faucet and confirm the account id on Mirror Node. No key material enters the repository.                                                                                                                                                                                                                                                                                                                                                                                         | M44-T010, HA-ATS-STAGE-B-001                              |
| HA-CAMPAIGN-CONVEX-001      | Publish one named Convex deployment reachable from the public host, provision the HMAC ingress key pair as environment values outside the repository, and record the redacted deployment reference.                                                                                                                                                                                                                                                                                                                                                                                             | M41-T010 live publication, S17-T010 live read             |
| HA-ATS-STAGE-B-001          | Stage B GO: provision the `commandAuthorities` ISSUER row for the approved issuer, accept one enabled M33 ATS_CREATE mapping bound to the retargeted configuration, execute `Bond.create` in MetaMask, attach and verify the receipt, then one `ATS_CONTROL_LIST` and one `ATS_ISSUE`. Names the permitted SDK calls, transaction cap, stop conditions, and no-retry handling.                                                                                                                                                                                                                  | M43-T010 live verification, M44-T010, S18-T010 allocation |
| HA-SUBMISSION-001 amendment | Select the tokenization track in addition to agentic payments when submitting.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | HA-SUBMISSION-001                                         |

### 4. Implementation cards committed with this intake

All twelve are in `00-inbox`. Their catalog rows list only accepted
dependencies; the in-batch ordering below is a card-text dependency the root
validates at ready time.

| Card                                                    | Lane    | In-batch predecessors                                                | Human gate                          |
| ------------------------------------------------------- | ------- | -------------------------------------------------------------------- | ----------------------------------- |
| M38-T010 command payloads                               | Core    | none                                                                 | none                                |
| M39-T010 multi-type normalizer                          | Backend | M38                                                                  | HA-COMMAND-AUTHORITY-002            |
| M40-T010 offering and directory admission               | Backend | M38, M39                                                             | none                                |
| M41-T010 HTTP command ingress and public projection     | Backend | M39, M40                                                             | HA-CAMPAIGN-CONVEX-001 for live use |
| M42-T010 ATS_CREATE configuration retarget              | Backend | none                                                                 | HA-ATS-RETARGET-001                 |
| M43-T010 receipt attachment and Mirror verification     | Backend | M38, M39, M40, M42                                                   | HA-ATS-STAGE-B-001 for live use     |
| M45-T010 active directory version in the Tool Directory | Web     | M40, M41                                                             | none                                |
| S15-T010 wallet island and command relay                | Web     | none                                                                 | none                                |
| S16-T010 provider deploy wizard                         | Web     | M38, S15                                                             | none                                |
| S17-T010 provider status route                          | Web     | M41, S16; navigation amendment after the active S11-T010 is accepted | HA-CAMPAIGN-CONVEX-001 for live use |
| M44-T010 ATS SDK issuer client seam                     | Web     | M42, S15, S16                                                        | HA-ATS-STAGE-B-001                  |
| S18-T010 backer funding route                           | Web     | S15, M40, M43                                                        | HA-ATS-STAGE-B-001 for allocation   |

### 5. Cross-card items the root records at ready time

- Replay tables are two distinct records: M40-T010 reserves
  `walletCommandReplayClaims` for wallet-command replay identities and
  M41-T010 reserves `ingressCommandReplayClaims` for transport replay
  identities. Both are additive amendments to
  `packages/backend/convex/schema.ts` under root reservation.
- Offering transitions are M40-owned internal mutations with named callers:
  `markAssetPending` (`DRAFT` to `ASSET_PENDING`) is invoked by the M41-T010
  dispatch boundary immediately after a successful M32 admission returns
  `NEW` for an `ATS_CREATE` attempt on the offering's subject;
  `markAssetReady` (`ASSET_PENDING` to `READY`) is invoked only by the
  M43-T010 verification action after `CONFIRMED`. M43 owns the attempt-state
  widening on `externalPrepareCommandAttempts` and enables the
  `external.attachCandidate` dispatch entry through an amendment of
  `packages/backend/convex/command_dispatch.ts` under its own reservation;
  M43 also claims that command's wallet replay identity in
  `walletCommandReplayClaims` before any write.
- The `external.attachCandidate` command is signed by the S16-T010 wizard at
  its third stage with the candidate the M44-T010 action returns; M44 signs
  nothing.
- The ATS_CREATE configuration reaches the web workspace as a frozen literal
  owned by S16-T010 at
  `apps/web/src/components/provider/deploy/ats-create-configuration.ts`,
  transcribed from the M42-T010 Stage B real-issuer projection (including its
  transcribed `canonicalParametersHash`, the digest whose preimage names the
  approved issuer as `diamondOwnerAccount`) and asserted field-for-field by
  S16's focused test; M42 adds no import to any other workspace. The root
  records the `walletCommandReplayClaims` outcome literal M43 writes for an
  attach claim when it confirms M43's reservation.
- M40 stores each offering's `payloadHash` but excludes it from its public
  projection; M41 serves no hash, nonce, signature, or identifier on its
  public routes, so S17-T010 renders none.
- No requested human-action row provisions an enabled `BACKER`
  `commandAuthorities` row, which the S18-T010 `HEDERA_FUNDING` signature
  needs to pass the authority predicate. The root decides at S18 ready time
  whether HA-ATS-STAGE-B-001 is amended to provision one or S18 stays parked.
- Three cards amend `packages/backend/convex/schema.ts` under their own
  reservations (M40, M41, M43), two cards amend `apps/web/package.json`, the
  root `package-lock.json`, and `apps/web/tests/static-shell.test.mjs` (S15,
  M44), and the blocked B03-T010 card already reserves the root
  `package-lock.json`; the root sequences each set before any member is ready.
- No accepted or batch record carries the funding treasury account the
  S18-T010 backer route needs as `expectedTarget`. The root decides at S18
  ready time whether M40 adds a `fundingTreasuryAccount` field under its own
  reservation or S18 stays parked; S18 is `PRIZE_OPTIONAL` and creates no
  transfer path without it.
- S17-T010's single navigation entry is applied only after the active
  S11-T010 is accepted, because S11 holds the reserved integration pair over
  `apps/web/src/components/discovery/local-navigation.tsx` and
  `apps/web/tests/landing-explore.test.mjs`.

## Acceptance criteria

1. The root records `D-HI-002-001` with the ruling, basis, cost if wrong,
   and precedence above, superseding `D-HI-001-001` and `D-HI-001-003` only
   for the campaign deploy path.
2. The five external observations are adopted as `D-HI-002-002` and reflected
   wherever a local record still asserts the v4 factory as executable.
3. The human actions record gains the six rows above, each distinguishable as
   pending by its recorded evidence alone.
4. Each of the twelve cards is evaluated for `10-ready` in in-batch order,
   with disjoint owned paths confirmed and every accepted dependency verified.

## Validation

- `npm run queue:check` reports `QUEUE_CHECK_OK` with the twelve catalog rows.
- Every local reference in this card and its cards resolves at the same
  commit.
- No credential, key, account secret, or funded material enters the
  repository.

## Boundary

This card records a ruling request, five observations, six human-action
requests, and twelve card intakes. It selects no scope by itself, marks no
human action complete, and authorizes no account creation, funding, signing,
provisioning, deployment, publication, or submission.

## Human ruling

The human operator ruled GO at `2026-09-08T19:14:19Z`, recorded through the
operator's delegated session because the orchestrator session was not
reachable: the operator selected the reversal and the tokenization track and
merged this intake. The root records the ruling, its basis, and its cost if
wrong from section 1 as `D-HI-002-001`, adopts the five observations as
`D-HI-002-002`, and adds the six requested human-action rows. Two of them,
`HA-COMMAND-AUTHORITY-002` and `HA-ATS-RETARGET-001`, carry recommended
decision packets at
[HA-COMMAND-AUTHORITY-002](../../evidence/HA-COMMAND-AUTHORITY-002-recommended-decision.md)
and [HA-ATS-RETARGET-001](../../evidence/HA-ATS-RETARGET-001-recommended-decision.md)
and remain pending until the operator accepts them explicitly; the retarget
packet's digests were computed after reproducing the accepted M35 and M37
digests exactly.

The root closes this card by confirming the recorded rows, moving it to
`60-done`, and evaluating the twelve cards in the recorded in-batch order.
M38-T010 and S15-T010 have no in-batch predecessor and no human gate and may
be readied first.
