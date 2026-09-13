# HA-ATS-PREPARED-ATTEMPT-001 — Production recommended decision

## Status

**DRAFT — no ISSUER authority is enabled by this document.** This replaces
neither the historical local packet nor the closed Production preflight. It is
the fresh, exact Human Ops decision required before only the two Stage 1
signatures. It authorizes no Stage B transaction.

## Exact Production binding

```text
Public alias              = https://tool402.vercel.app
Production deployment ID  = 6420584027
Deployment URL            = https://tool402-h2xu63adv-indyweb.vercel.app
Deployment source commit  = 027ebc9bb0dc281e02b0a556be595e487c0cadc9
Network                   = hedera:testnet
EVM chain ID              = 296
Wallet chain ID           = 0x128
Issuer EVM address        = 0xc89f87052c3e080b4a9b021d4930055031ef378e
Principal public ID       = tool402_ats_issuer_testnet_v1
Role                      = ISSUER
Authority version         = ats_issuer_testnet_v1
Owned subject             = riskscan_revenue_note_demo
Operation                 = ATS_CREATE
Factory EVM address       = 0xd1f118a40f3b02883d35909ef2517e7edd78379d
M42 canonical digest      = 1880065c5ae64b3fc6279cfdd8c85a6880d43e98ce129ed697c72372204296f9
```

The source comparison and Deployment provenance are recorded in
`HI-011-production-control-review.md`. If either named source or deployment
changes before explicit acceptance, this draft stops and Human Ops must add a
fresh timestamped binding; no equivalence is assumed.

## One bounded ISSUER activation

Only after explicit human acceptance, Human Ops may use its administration
console to activate the existing literal record for **30 minutes**, starting
from a newly recorded activation timestamp:

```text
principalPublicId       = tool402_ats_issuer_testnet_v1
canonicalSignerAddress  = 0xc89f87052c3e080b4a9b021d4930055031ef378e
chainId                 = 296
role                    = ISSUER
ownedSubjectPublicIds   = [riskscan_revenue_note_demo]
authorityVersion        = ats_issuer_testnet_v1
enabled                 = true
```

Before activation, inspect every record for the exact `(296,
0xc89f87052c3e080b4a9b021d4930055031ef378e)` tuple. There must be exactly one
literal-matching ISSUER record and no BACKER or other record. If it is enabled
with an unknown or old activation time, first revoke it, verify disabled, then
perform the fresh timestamped re-enablement. A duplicate, mismatch, unknown
state, or inability to record the new 30-minute window is a stop condition.

The record must be revoked at every terminal stop and no later than the new
30-minute deadline. Retain it only if the separately approved Stage B occurs
in the preserved browser session inside that window. It must be **removed**
before a later M56 BACKER record can exist for this same wallet/chain.

## Allowed Stage 1 sequence only

With the approved wallet connected on `0x128` in one preserved Production
browser session, Human Ops may make at most:

1. one UI-generated `offering.create` signature for
   `riskscan_revenue_note_demo`; then
2. only if that relay is `ACCEPTED`, one UI-generated `external.prepare`
   signature for the exact `ATS_CREATE` tuple above.

No manually composed payload, nonce, signature, relay request, retry, or
alternate host is permitted. Stop and revoke on any rejection, unknown result,
or tuple mismatch. After both relays are `ACCEPTED`, independently corroborate
exactly one candidate-free `PREPARED` attempt with the generated
`attemptPublicId` and its linked `ASSET_PENDING` offering. That evidence is
the only input to a future, separately accepted Stage B packet.

## Exclusions

This draft does not authorize `eth_sendTransaction`, Factory calldata, a
Mirror read, `external.attachCandidate`, asset creation, payment, backing,
allocation, deployment, video, submission, or any BACKER authority action.

## Human acceptance declaration

> I approve this exact Production HA-ATS-PREPARED-ATTEMPT-001 packet. I name
> the source commit and Vercel deployment above after rechecking the public
> alias. I authorize only myself to create a newly timestamped 30-minute
> ISSUER activation window for the one literal record, make at most the two
> ordered UI-generated Stage 1 signatures, preserve the browser session, and
> revoke the record at every stop. I reject Stage B, every transaction, and
> every BACKER action.

Decision owner and acceptance timestamp: supplied by Human Ops.
