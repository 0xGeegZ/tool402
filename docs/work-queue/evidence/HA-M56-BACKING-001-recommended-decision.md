# HA-M56-BACKING-001 — Production recommended decision

## Status

**DRAFT — no BACKER authority is enabled.** This packet is independent of
HI-011's ISSUER packet. It prepares one later testnet backing rehearsal only;
it does not authorize an agent action, configuration change, signature, or
transfer.

## Preconditions that Human Ops must attest after acceptance

1. Vercel Production contains `TOOL402_FUNDING_EVM_ADDRESS` with the existing
   server-owned funding address. Do not copy its value into an issue, chat,
   commit, screenshot, or this repository.
2. Vercel has redeployed after that configuration change. Record the exact
   resulting source commit, deployment ID, deployment URL, and Production
   alias. The present pre-configuration baseline is deployment `6420584027`,
   source `027ebc9bb0dc281e02b0a556be595e487c0cadc9`, and
   `https://tool402.vercel.app`.
3. The canonical RiskScan offering is exactly OPEN and its subject and signer
   are `riskscan_revenue_note_demo` and
   `0xc89f87052c3e080b4a9b021d4930055031ef378e`.
4. There are zero total `commandAuthorities` records for chain `296` and that
   wallet. An ISSUER record, even disabled, must first be removed at its
   authorized terminal boundary. Do not create a BACKER record while ISSUER
   exists.

## One bounded BACKER record

Only after a separate explicit Human Ops acceptance, provision exactly one
record, activate it for the recorded bounded rehearsal window, and revoke and
remove it at every terminal outcome:

```text
principalPublicId       = tool402_riskscan_backer_testnet_v1
canonicalSignerAddress  = 0xc89f87052c3e080b4a9b021d4930055031ef378e
chainId                 = 296
role                    = BACKER
ownedSubjectPublicIds   = [riskscan_revenue_note_demo]
authorityVersion        = riskscan_backer_testnet_v1
enabled                 = true only during the accepted rehearsal window
```

The authority is dedicated to one UI-generated `HEDERA_FUNDING` rehearsal for
the named OPEN offering. It is not ISSUER authority and does not permit
`offering.create`, `external.prepare`, `external.attachCandidate`, Stage B,
allocation, payout, refund, or a retry. A duplicate, any other authority
record, a wrong wallet/chain, or a missing Production configuration is a stop
condition.

## Required evidence

Record the source/deployment/alias, public backer address, exact record tuple,
bounded activation and removal timestamps, configured-address presence
attestation without value, redacted transaction reference, and bounded
terminal outcome. Never record a key, credential, signature payload, raw
signed header, funding value, or funded secret.

## Human acceptance declaration

> I approve one Production HA-M56-BACKING-001 rehearsal only after all listed
> prerequisites are attested. I authorize only myself to activate the one
> exact BACKER record for the recorded window, make one UI-generated HEDERA
> funding signature and one explicit testnet HBAR submission, then revoke and
> remove the record. I reject ISSUER actions, Stage B, retries, allocation,
> payout, refund, deployment, video, and submission.
