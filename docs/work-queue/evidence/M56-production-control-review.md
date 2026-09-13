# M56 Production control review

## Status

**PREPARED — NOT ACCEPTED, NOT EXECUTABLE.** This review records the missing
Production prerequisites for one later backing rehearsal. It performs no
Vercel configuration change, authority mutation, signature, transfer, or
deployment.

## Production binding

At the read-only check on 2026-09-13, the Production alias and successful
deployment were:

```text
Public alias              = https://tool402.vercel.app
Production deployment ID  = 6420584027
Deployment source commit  = 027ebc9bb0dc281e02b0a556be595e487c0cadc9
Deployment URL            = https://tool402-h2xu63adv-indyweb.vercel.app
```

The current backing projection is correct for this use: it is server-only,
requires a canonical OPEN `riskscan_revenue_note_demo` offering, and fails
closed unless `TOOL402_FUNDING_EVM_ADDRESS` is a lower-case nonzero EVM
address. Focused backing and backend authority contracts are green locally;
this is not proof that Production has the configuration.

## Missing Production prerequisite

The Vercel Production environment inventory was searched read-only and had no
`TOOL402_FUNDING_EVM_ADDRESS` entry. The value itself was never read or
recorded. Human Ops must set that variable only in Vercel Production to the
already-approved server-owned funding address, then redeploy and attest its
presence without copying its value into this repository.

After that redeploy, Human Ops must name the resulting source commit and
deployment in the M56 acceptance evidence. A new deployment or source is a
fresh binding, not an implicit continuation of the identifiers above.

## Dedicated BACKER isolation

The later BACKER record is separate from ISSUER by role, principal, version,
and bounded purpose, but it uses the same public wallet:

```text
principalPublicId       = tool402_riskscan_backer_testnet_v1
canonicalSignerAddress  = 0xc89f87052c3e080b4a9b021d4930055031ef378e
chainId                 = 296
role                    = BACKER
ownedSubjectPublicIds   = [riskscan_revenue_note_demo]
authorityVersion        = riskscan_backer_testnet_v1
enabled                 = false until a separate human acceptance
```

The runtime requires exactly one total record for this wallet/chain. Therefore
the BACKER record may be created only after the ISSUER record is removed at an
authorized HI-011 terminal boundary; a merely disabled ISSUER record blocks
this flow. BACKER must likewise be revoked and removed before an ISSUER record
is later used again. There is no concurrent or inherited authority.
