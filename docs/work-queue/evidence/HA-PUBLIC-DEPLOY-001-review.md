# HA-PUBLIC-DEPLOY-001 — bounded public deployment review

## Scope

This record reviews one explicitly human-authorized public deployment of the
RiskScan service from clean source commit
`5de50e0ae045b60e6091877b7092d38b55178975`. It records only deployment,
external runtime-configuration confinement, and nonpayable public smoke facts.
It is not an ATS rehearsal, payment, settlement, or broader live-vertical
completion claim.

## Authorization and configuration confinement

The human expressly authorized Convex Production and Vercel Production for the
named source commit, with runtime values supplied outside tracked files. This
record contains no environment value, credential, ingress secret, private key,
signed payload, or funded-account secret.

## Reviewed deployment facts

- Convex Production functions were published to the configured Production
  deployment.
- Vercel Production serves [https://tool402.vercel.app](https://tool402.vercel.app)
  from the named source commit.
- The required production runtime configuration was provided only through the
  managed runtime configuration surfaces; no value was committed.
- Read-only/nonpayable public checks returned: `/`, `/explore`, `/demo`, and
  `/api/tools` each `200`; `GET /api/riskscan` returned `405`, confirming its
  public POST-only boundary without sending a body or payment header; and the
  read-only Convex-backed offering/directory projection returned its expected
  absent state. The public active-directory read returned `NOT_FOUND`, as no
  active entry is published.

## Narrow acceptance

HA-PUBLIC-DEPLOY-001 is accepted only as bounded public RiskScan deployment
evidence. This acceptance supersedes earlier Stage-B-as-public-deployment
prerequisite wording only for this named public service and these nonpayable
smoke checks.

It does not authorize or evidence a `commandAuthorities` record, wallet,
signature, payment, x402 settlement, ATS transaction, asset creation, mint,
association, funding, allocation, clearing, HCS, payout, retry, video, or
submission. HA-ATS-STAGE-B-001 remains pending and is still required for every
ATS execution or Stage-B claim.
