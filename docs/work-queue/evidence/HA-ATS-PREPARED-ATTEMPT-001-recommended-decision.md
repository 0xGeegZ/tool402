# HA-ATS-PREPARED-ATTEMPT-001 — Recommended decision packet

## Status

**DRAFT — no live authority is active.** This is the narrow prerequisite to
HA-ATS-STAGE-B-001. It is the only proposed gate that may provision the
server-side issuer authority and obtain one durable PREPARED attempt. It does
not authorize a provider transaction, public Mirror observation, candidate
attachment, asset creation, verification, lifecycle transition, or deployment.

This draft did not authorize the closed production preflight recorded in
`HA-ATS-PREPARED-ATTEMPT-001-stage-1-production-preflight.md`; it names a
different local host and source. It must not be used for another production
attempt until a new exact host/source decision replaces it.

## Why this is a separate human decision

The later Stage-B transaction requires a current durable PREPARED attempt, but
that attempt itself requires an issuer authority record and a human-signed
external.prepare command. Combining those prerequisites with the transaction
would allow a single approval to create its own execution precondition. This
packet keeps the no-transaction preparation distinct from the separately
approved one-shot transaction.

## Fixed runtime and issuer tuple

The human may use only a local runtime served by this exact build:

~~~text
Required M49 source      = aeb866adbe86e41ab01476a4b54ece95dc234813
Rehearsal host           = http://localhost:3000
Network                  = hedera:testnet
EVM chain ID             = 296
Wallet chain ID          = 0x128
Issuer EVM address       = 0xc89f87052c3e080b4a9b021d4930055031ef378e
Principal public ID      = tool402_ats_issuer_testnet_v1
Role                     = ISSUER
Authority version        = ats_issuer_testnet_v1
Owned subject            = riskscan_revenue_note_demo
ATS configuration version = ats_demo_v1
Registry revision        = ats_sdk_8_0_0_testnet_v2
Operation                = ATS_CREATE
Factory EVM address      = 0xd1f118a40f3b02883d35909ef2517e7edd78379d
Factory Hedera ID        = 0.0.9213391
Resolver Hedera ID       = 0.0.9212226
M42 canonical digest     = 1880065c5ae64b3fc6279cfdd8c85a6880d43e98ce129ed697c72372204296f9
~~~

The human must record the exact runtime build SHA and confirm that it contains
the required M49 source unchanged before any action. A different host, runtime,
build, issuer, chain, subject, target, or digest is a stop condition and
requires a new decision.

## One time-bounded authority-record action

Before browser signing, Human Ops—and no agent—may use its existing
human-operated administration console for the named runtime to provision
exactly one enabled commandAuthorities record:

~~~text
principalPublicId       = tool402_ats_issuer_testnet_v1
canonicalSignerAddress  = 0xc89f87052c3e080b4a9b021d4930055031ef378e
chainId                 = 296
role                    = ISSUER
ownedSubjectPublicIds   = [riskscan_revenue_note_demo]
authorityVersion        = ats_issuer_testnet_v1
enabled                 = true
~~~

The human must first verify the total number of records for the exact
`(chainId, canonicalSignerAddress)` tuple. If no record exists, this packet
may provision exactly one. If exactly one literal-matching disabled record
exists, a new exact decision must expressly authorize re-enabling and revoking
that same record; this draft alone does not. Any second record, a field
mismatch, or an ambiguous record stops the packet. Immediately after
provisioning or re-enabling, the human must verify that there is exactly one
active record overall for that tuple and every field equals the literal above.
No packet may create a duplicate, replacement, repair, or any mutation beyond
an expressly authorized provisioning, re-enable, or terminal revocation of
that exact record.

The current record schema has no command-type allowlist or TTL. Consequently,
the human must treat this as a single temporary exception: do not use it for
any command except the two commands below and the one candidate attachment
only if a later Stage-B decision is accepted. Keep it no longer than 30 minutes
from provisioning. Disable or remove this exact record immediately if this
packet stops, the browser session is lost, the 30-minute limit expires, or the
later Stage-B exercise reaches any terminal outcome.

## Exact no-transaction command sequence

The human may then use the existing deploy-provider wizard on the named host
with the fixed issuer MetaMask account on 0x128. Keep this browser tab open,
connected, and unchanged until a later Stage-B decision is either completed or
declined: the current UI stores stage-2 success only in React session state and
cannot resume it after reload. At most one command of each kind is allowed, in
this order. The browser and relay must generate the approved EIP-712 payloads;
no manually constructed payload, endpoint, nonce, signature, or header is
authorized.

### 1. First signing stage: one offering.create

The signed values must remain exactly:

~~~text
offeringPublicId / subjectPublicId = riskscan_revenue_note_demo
durable offering version           = 1
terms version                       = v1
fundingTargetTinybars               = 100000000000
noteUnitPriceTinybars               = 100000000
maximumNoteUnits                    = 1000
minimumPurchaseUnits                = 10
reserveShareBps                     = 2000
issuerShareBps                      = 8000
platformFeeBps                      = 0
payoutCapTinybars                   = 150000000000
maturityAt                          = 2026-12-31T00:00:00.000Z
qualifyingResource                  = riskscan-local-assessment
title                               = RiskScan
customerProblem                     = Tool operators need a bounded way to assess request risk before they continue a workflow.
customerUseCases                    = [Security-oriented agent operators]
useOfFunds                          = [Maintain the local assessment workflow and provider documentation.]
risks                               = [Testnet terms do not promise yield, principal, or return.]
advertisedQuickPriceTinybars        = 10000000
advertisedStandardPriceTinybars     = 10000000
~~~

The expiry and generated idempotency key are produced by the accepted browser
code under the existing command-authority rules. If this one relay result is
not ACCEPTED, stop and revoke the temporary authority record. An accepted
result records only the reviewed DRAFT offering; it does not create an asset,
transaction, candidate, directory entry, or lifecycle state.

### 2. Second signing stage: one external.prepare

Only after the previous relay returns ACCEPTED, the human may sign exactly one
external.prepare command generated by the named host for this frozen tuple:

~~~text
operationKind           = ATS_CREATE
subjectPublicId          = riskscan_revenue_note_demo
network                  = hedera:testnet
chainId                  = 296
expectedTarget           = 0xd1f118a40f3b02883d35909ef2517e7edd78379d
canonicalParametersHash  = 1880065c5ae64b3fc6279cfdd8c85a6880d43e98ce129ed697c72372204296f9
~~~

The command may be admitted only through the existing immutable M48 mapping
and M47 runtime binding. It must use M47's six-field projection and this
digest, never the synthetic S16 display projection. Record the exact
code-generated second-stage idempotencyKey as the proposed attemptPublicId.
The relay response itself exposes only its ACCEPTED outcome; Human Ops must
independently corroborate in the durable administrative/status surface that
exactly one fresh PREPARED attempt has that public identifier, the same tuple,
one linked ASSET_PENDING offering, and no candidate.

If the signature is rejected, the relay result is not ACCEPTED, the result is
unknown, the independently corroborated durable attempt differs, has any
candidate, is not PREPARED, the linked offering is not ASSET_PENDING, or any
tuple member differs, stop,
revoke the temporary record, and do not retry. PREPARED is the durable attempt
state; ACCEPTED is the relay outcome. They are intentionally distinct.

## Explicit exclusions

This packet does not authorize:

- eth_sendTransaction, a wallet transaction, Factory calldata, SDK call, RPC
  request, public Mirror read, or testnet asset creation;
- external.attachCandidate, directory.publish, M43 verification, CONFIRMED,
  ASSET_READY, a lifecycle transition, or a finality claim;
- ATS_CONTROL_LIST, ATS_ISSUE, ATS_TRANSFER, ATS_COUPON, funding, allocation,
  clearing, HCS, payout, provider/account setup, a key or environment read,
  deployment, visibility change, demo/video, or submission;
- manual payloads, custom targets, alternate hosts, nonce reuse, automatic
  signing, automatic retry, automatic resubmission, or a second attempt.

## Evidence to return before Stage B can be requested

Record only secret-free facts: canonical commit, named host, timestamp window,
the zero/one authority-record checks, its 30-minute expiry and revocation
condition, the two relay outcomes, the stage-2 generated idempotencyKey and
its durable attemptPublicId corroboration, durable PREPARED status, linked
ASSET_PENDING offering fact, immutable tuple fingerprint,
preserved-browser-session fact, and an attestation that no transaction, Mirror
read, candidate, lifecycle action, key, raw signature, header, environment
value, or funded secret entered tracked files.

This evidence is the sole input used to fill the downstream Stage-B packet. It
is not transaction, candidate, receipt, Mirror, finality, or asset evidence.

## Copy/paste human declaration

> I approve HA-ATS-PREPARED-ATTEMPT-001 exactly as recorded in
> docs/work-queue/evidence/HA-ATS-PREPARED-ATTEMPT-001-recommended-decision.md.
> I confirm the named local host serves the required M49 source unchanged and
> will record its exact runtime build SHA. I authorize only myself to
> provision the one exact active issuer commandAuthorities record described
> here after verifying zero prior active records, then to make at most one
> code-generated offering.create signature with the fixed values and at most
> one code-generated external.prepare signature for the fixed ATS_CREATE tuple.
> I will stop unless both relay results are ACCEPTED and the stage-2 generated
> idempotencyKey is independently corroborated as exactly one durable PREPARED
> attempt with a linked ASSET_PENDING offering and no candidate. I will preserve
> the browser session only for a separately
> accepted Stage-B decision, and will revoke the exact record no later than
> 30 minutes after provisioning or at every terminal stop. I reject every
> transaction, Mirror read, candidate attachment, verification, asset or
> lifecycle action, retry, alternate host, custom payload, deployment, and all
> other external action. I will return only the redacted evidence named above.

Decision owner: 0xGeegZ

Decision timestamp: supplied by the human at acceptance.
