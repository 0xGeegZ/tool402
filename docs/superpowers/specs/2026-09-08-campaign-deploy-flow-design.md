# Campaign deploy flow design

## Decision

The human operator has approved a provider-facing "deploy a campaign" flow for
RiskScan and directed that it re-enter this event's scope, including the
tokenization track. The selected shape is the hybrid the preparation
specifications already describe: every wallet-signed intent is admitted by
Convex first, Hedera receipts stay authoritative for anything on-chain, and
each offering state is reached only by a verified record, never by a wallet
callback.

This document is the approved design. It authorizes nothing by itself. The
scope reversal, the human-owned gates, and every implementation card are
requested through the [HI-002 intake card](../../work-queue/queue/00-inbox/HI-002-campaign-deploy-reinstatement.md)
and recorded by the root under its own rules.

The interactive design canvas that this document describes is published at
<https://claude.ai/code/artifact/5eb15b5b-5084-492a-84c5-41590498b791>. It is
a design reference only; the committed text below governs.

## Why hybrid, not Solidity, not Convex-only

- A custom Solidity campaign contract is rejected by the preparation
  authorities the clean repository inherited: ADR-0004 selects the official
  Asset Tokenization Studio contracts through a human wallet and names a custom
  bond contract as failing the intended integration, and the product design
  states that no custom smart contract is needed. It would also earn no
  tokenization credit.
- A Convex-only record can never produce a revenue note, so it cannot satisfy
  the tokenization criterion or the product thesis.
- The hybrid reuses what the clean repository already accepted: the fixed
  EIP-712 command domain, the closed external-prepare payload, the
  authenticated normalizer, durable admission, the fail-closed ATS authority
  gate, the frozen ATS_CREATE configuration projection, and the Stage A issuer
  projection. It fails truthfully at every stop: an offering with no asset
  shows `ASSET_PENDING`, never a fabricated `READY`.

## Verified facts that shape the design

These were checked against primary sources on 2026-09-08 and change what the
cards must say.

1. The accepted configuration in
   [M35](../../specs/m35-local-unsigned-ats-create-configuration.md) and
   [M37](../../specs/m37-stage-a-real-issuer-ats-create-authority.md) pins
   factory `0.0.7708432` and resolver `0.0.7707874`, the contracts v4.0.0
   testnet deployment of 2026-01-22. SDK 8.0.0 encodes `deployBond` with
   selector `0x29002951`, which that factory implementation does not
   dispatch. The SDK 8.0.0 testnet deployment of 2026-06-12 is factory proxy
   `0.0.9213391` (`0xd1f118a40f3b02883d35909ef2517e7edd78379d`) and
   business-logic resolver `0.0.9212226`
   (`0xba2d5fc2083a0b8f164c50e65d782087fba18e0a`). Stage B cannot execute on
   the current record; the configuration must be re-supplied and re-hashed.
2. The approved issuer `0xc89f87052c3e080b4a9b021d4930055031ef378e` has no
   Hedera testnet account yet (Mirror Node returns 404). One faucet action
   creates and funds it. Bond creation is paid in HBAR by that signer.
3. The SDK's MetaMask path reads the global injected provider and never
   requests a chain switch. The browser wallet rule recorded in
   [HA-COMMAND-AUTHORITY-001](../../work-queue/evidence/HA-COMMAND-AUTHORITY-001-decision.md)
   requires exactly one EIP-6963 `io.metamask` candidate and chain `0x128`
   before signing. The web wallet island must therefore own provider
   selection and the chain gate, and hand the SDK an already-correct
   provider.
4. The accepted command vocabulary contains only `external.prepare`. The
   flow needs `offering.create`, `directory.publish`, and
   `external.attachCandidate` under the same domain and primary type. That
   is a human amendment to the command authority, not an agent decision.
5. The only Convex deployment on record is development-only with five
   RiskScan functions. No HTTP router, no HMAC key, no authority row, and no
   offering table exists. A reachable named deployment with its ingress
   secret is a human action.
6. x402 payment on Hedera needs a Hiero private-key signer; MetaMask cannot
   pay that rail. The backer path is therefore a plain HBAR transfer to the
   funding treasury on chain 296, verified through Mirror Node.

## The flow

Actors: the human tool provider signing in MetaMask on Hedera Testnet
(chain 296), the Next.js command relay, Convex, and Hedera testnet (ATS
factory and Mirror Node).

Offering states: `DRAFT → ASSET_PENDING → READY → OPEN` with `CLOSED` as the
terminal administrative state. Directory versions: `DRAFT →
PUBLISH_PREPARED → ACTIVE → SUPERSEDED`. External attempts: `PREPARED →
SUBMITTED → CONFIRMED | OUTCOME_UNKNOWN | REJECTED`.

### Now half (agent-buildable after the scope reversal)

1. The provider opens the `PREPARED / DEMO DATA` fixture as an editable
   draft. Narrative fields are editable; the economics are fixed for terms
   v1: funding target 1,000 HBAR, unit price 1 HBAR, 1,000 units, minimum 10
   units, 8,000/2,000/0 basis points, payout cap 1,500 HBAR, maturity
   2026-12-31. The ATS parameter set is the frozen T402RN set.
2. The provider connects MetaMask. The island selects exactly one EIP-6963
   `io.metamask` provider, fails closed on zero or several, requires
   `eth_chainId === 0x128` (offering a switch request first), resolves the
   Hedera account through Mirror Node, and refuses any signer other than the
   approved issuer for the subject.
3. The provider signs `offering.create`. The relay forwards the signed
   command over the HMAC ingress to Convex, which verifies the signature,
   authority, nonce, and expiry, and stores the offering in `DRAFT` v1.
4. The provider signs `external.prepare` with kind `ATS_CREATE`. The
   accepted M30, M32, and M33 path admits it. Before Stage B the authority
   gate rejects it and the UI shows "not yet authorized"; after Stage B it
   returns a `PREPARED` attempt and the offering moves to `ASSET_PENDING`.

### Stage B (human GO, human-executed in MetaMask)

5. The provider creates the revenue note with `Bond.create` through the
   official SDK 8.0.0 in MetaMask against the v8 factory.
6. The provider signs `external.attachCandidate` with the transaction id and
   note address. The attempt moves to `SUBMITTED`.
7. A Convex Node action verifies the transaction on Mirror Node: `SUCCESS`,
   the factory target, the network, and the whitelist control-list type.
   Only then does the attempt move to `CONFIRMED` and the offering to
   `READY`. Ambiguity becomes `OUTCOME_UNKNOWN`; nothing retries.
8. The provider signs `directory.publish`. Directory version v1 becomes
   `ACTIVE` (World is cut) and the offering becomes `OPEN`. The Tool
   Directory route serves the active version.
9. Lifecycle operation for the tokenization evidence: the provider prepares
   and signs `ATS_CONTROL_LIST` for one backer account, then `ATS_ISSUE` for
   its units. Each is prepared before signing and verified after.

### Backer view (optional for this event)

A backer connects MetaMask, chooses units, signs `external.prepare` with kind
`HEDERA_FUNDING`, sends the exact HBAR to the funding treasury, and the UI
stays `PAYMENT_SUBMITTED` until Mirror Node verification. Units appear only
after the issuer's verified `ATS_ISSUE`.

## Wallet connector

Hand-rolled, MetaMask only, no wagmi and no RainbowKit. The prep
specifications pin wagmi 3.7.7 and RainbowKit peers wagmi 2.x, so the two
cannot be combined; the human-fixed browser rule forbids the multi-wallet
modal anyway. The island uses `viem` 2.56.1, which the backend already pins
and which exports the Hedera testnet chain (id 296, Hashio RPC, Hashscan).
It adds one exact dependency to the web workspace and amends the strict web
dependency test accordingly.

Signing uses `eth_signTypedData_v4` with the fixed domain
`{ name: "Tool402", version: "1", chainId: 296 }` and primary type
`Tool402Command` with fields `version:uint8`, `type:string`,
`signer:address`, `nonce:string`, `issuedAt:string`, `expiresAt:string`,
`payloadHash:bytes32`, exactly as the accepted authority records them. The
payload hash is the Keccak-256 of the RFC 8785 canonical JSON of the typed
payload.

## Presentation

The web surfaces use the accepted UI-S00 tokens and primitives, the UI-S13
feedback tones where accepted, and the accepted shell. Routes: `/provider`
(status and next action) and `/provider/deploy` (wizard), with one
constrained local-navigation amendment. The wizard has five steps: tool
details, interface and capability, pricing and customers, funding and
revenue-note terms, review and sign. The review step lists the four
deployment stages with their status chips and per-stage signature buttons.
Copy never claims success for anything unverified; sample values are
labelled.

## Human-owned gates

None of the cards may start until the root records the scope decision
requested in HI-002. Stage B additionally needs, in order: the re-supplied
ATS configuration for the v8 deployment, the funded issuer account, a
reachable Convex deployment with its HMAC ingress key, the provisioned
issuer authority row with one enabled ATS_CREATE mapping, and the explicit
Stage B GO naming the permitted SDK calls and stop conditions. The
submission row must add the tokenization track.

## Sequencing

Two lanes can run in parallel with disjoint ownership:

- Backend lane: M38 command payloads → M39 multi-type normalizer → M40
  durable admission → M41 HTTP ingress → M43 receipt verification → M45
  directory activation; M42 configuration retarget runs beside them once its
  human decision lands.
- Web lane: S15 wallet island → S16 deploy wizard → S17 status route; M44 SDK
  seam after S16 and M42; S18 backer route last and optional.

The recorded critical path (B03 live exercise, README, video, submission)
keeps precedence for human time. The now half competes only for agent time.

## Non-goals

No custom contract, no server-held issuer key, no WalletConnect or Coinbase
fallback, no session or account, no World route, no HCS audit event, no
payout, no mainnet, and no claim that any step is live until its receipt or
signature exists.
