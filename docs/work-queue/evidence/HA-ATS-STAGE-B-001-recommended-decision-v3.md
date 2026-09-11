# HA-ATS-STAGE-B-001 — Recommended decision packet (v3)

## Status

**DRAFT — downstream gate; no live authority is active.** This packet is not
acceptance-ready until HA-ATS-PREPARED-ATTEMPT-001 is accepted and completed
in the same named runtime, its exact durable attempt identifier is inserted
below, and the original browser session remains open. The preparation gate is
the only authority that may provision the one time-bounded issuer record and
obtain the attempt required here.

This draft supersedes the earlier recommended-decision.md only as the future
Stage-B recommendation: that draft included unsupported M43 verification and
lifecycle operations. recommended-decision-v2.md remains the accepted M33
Phase-A local-mapping decision; it is not a live GO.

## Fixed execution boundary

~~~text
M49 source commit        = aeb866adbe86e41ab01476a4b54ece95dc234813
Rehearsal host           = http://localhost:3000
Network                  = hedera:testnet
EVM chain ID             = 296
Wallet chain ID          = 0x128
Issuer EVM address       = 0xc89f87052c3e080b4a9b021d4930055031ef378e
Issuer Hedera account    = 0.0.10430887
Principal public ID      = tool402_ats_issuer_testnet_v1
Role                     = ISSUER
Authority version        = ats_issuer_testnet_v1
Owned subject            = riskscan_revenue_note_demo
ATS configuration version = ats_demo_v1
Registry revision        = ats_sdk_8_0_0_testnet_v2
Operation                = ATS_CREATE
Factory EVM address      = 0xd1f118a40f3b02883d35909ef2517e7edd78379d
Factory Hedera ID        = 0.0.9213391
Resolver EVM address     = 0xba2d5fc2083a0b8f164c50e65d782087fba18e0a
Resolver Hedera ID       = 0.0.9212226
M42 canonical digest     = 1880065c5ae64b3fc6279cfdd8c85a6880d43e98ce129ed697c72372204296f9
Mirror base              = https://testnet.mirrornode.hedera.com/api/v1/
Recommended total HBAR cap = 12 HBAR, including network fees
Contract value           = 0 HBAR (value: "0x0")
~~~

The human must record the exact runtime build SHA and confirm that it contains
the required M49 source unchanged. A different host, build, chain, account,
digest, target, or fee cap is not equivalent and stops this packet; it requires
a new decision.

## Required completed prerequisite

Before accepting this packet, the human must insert the stage-2 generated
idempotencyKey that the completed preparation exercise independently
corroborated as the durable attempt public identifier:

~~~text
attemptPublicId = MUST_BE_FILLED_FROM_HA-ATS-PREPARED-ATTEMPT-001_EVIDENCE
~~~

The human must independently verify in the same runtime that:

1. The one temporary commandAuthorities record remains active, exact, and
   within the preparation packet's time limit for the listed signer/chain.
2. The named attemptPublicId is a durable ATS_CREATE PREPARED attempt for the
   exact issuer, subject, operation, Factory target, and M42 digest. It has no
   candidate and has not been submitted or otherwise advanced.
3. The same browser tab still holds the stage-2 external.prepare result as
   done. It has not reloaded, navigated away, disconnected the wallet, or
   changed provider/account. The current implementation intentionally holds
   this result only in browser-session state; a fresh session cannot resume it.
4. The static M33 mapping is the already-accepted local M48 mapping. No new
   mapping, configuration, environment value, or runtime override is created.

If any prerequisite is absent, stale, disabled, conflicting, or in another
runtime, this packet is unusable. It authorizes neither repair nor a new
preparation command; stop, revoke the temporary authority record, and obtain a
fresh dedicated decision.

## The only actions authorized after human acceptance

The human may personally perform, once and in this order:

1. From the preserved browser session, explicitly click the existing M49 control
   to submit one MetaMask eth_sendTransaction constructed only by the accepted
   M44 Factory-artifact + viem seam:

   ~~~text
   from  = fixed issuer EVM address
   to    = fixed Factory EVM address
   data  = calldata computed from the rehashed complete M42 projection
   value = 0x0
   ~~~

   No manually supplied calldata, target, value, chain, signer, RPC endpoint,
   provider override, authority record, or payload is authorized.

2. Allow only the M49 bridge's fixed observation: at most five receipt reads
   over five seconds and at most three bounded, read-only public Mirror cycles
   over five seconds. These reads may establish only a session-local candidate;
   they do not invoke M43 positive verification or create an ASSET_READY claim.

3. Only if M49 returns its fully corroborated session-local candidate, make
   one separate, explicit external.attachCandidate signature through the
   existing control. No automatic attach is permitted. The named attempt may
   transition only from PREPARED to SUBMITTED; the offering remains at its
   existing ASSET_PENDING boundary. It does not invoke M43 verification, mark
   an asset ready, or perform an asset lifecycle transition.

4. After the terminal outcome, or immediately on any stop, disable or remove
   the one temporary authority record created by
   HA-ATS-PREPARED-ATTEMPT-001. This is only revocation of that exact record;
   it does not authorize another authority record, command, or transaction.

## Mandatory stop and no-retry rules

Stop immediately, record only safe redacted facts, and do not retry under this
authority when any precondition fails, the wallet rejects, the chain/account/
digest/factory/value differs, the fee cap is not met, a receipt is absent or
malformed, the Factory event is invalid, a Mirror response is malformed or
ambiguous, the deadline expires, the candidate is absent, or any post-hash
outcome is uncertain.

After any returned transaction hash, the only permitted terminal local outcome
on failure is submission_unknown: no second send, no second attach, no new
attempt, and no automatic or manual resubmission. A failed or rejected
pre-hash click also ends this one-rehearsal authority; it does not permit a
second click.

## Explicit exclusions

This packet does not authorize:

- authority-record provisioning, offering.create, external.prepare,
  directory.publish, or any command signature beyond the one separately
  clicked candidate attachment;
- M43 positive verification, CONFIRMED, ASSET_READY, or a finality claim;
- ATS_CONTROL_LIST, ATS_ISSUE, ATS_TRANSFER, ATS_COUPON, funding, allocation,
  clearing, HCS, payout, or any lifecycle operation;
- Bond.create, Network.init, Network.connect, an SDK call, a key or
  environment read, a server signer, a custom RPC or Mirror host, or any
  custom calldata;
- a Convex publication, configuration change, public/production deployment,
  visibility change, demo/video, submission, or another transaction; or
- automatic signing, attaching, retry, resubmission, or a second attempt.

## Evidence to record after the human-operated rehearsal

Record only secret-free evidence: canonical commit and host, the prerequisite
attemptPublicId, timestamp, wallet-returned transaction hash, returned
Mirror-form transaction id and public links, candidate EVM address if one
exists, terminal local outcome, authority-record revocation fact, and an
attestation that no key, signature payload, environment value, or funded secret
entered tracked files.

Mirror corroboration is evidence for the bounded M49 candidate only. It is not
a positive M43 receipt-verification result, a finality claim, or an asset-ready
claim.

## Copy/paste human declaration

> I approve HA-ATS-STAGE-B-001 exactly as recorded in
> docs/work-queue/evidence/HA-ATS-STAGE-B-001-recommended-decision-v3.md.
> I confirm the named local host serves the required M49 source unchanged and
> will record its exact runtime build SHA; the completed
> HA-ATS-PREPARED-ATTEMPT-001 evidence names attemptPublicId =
> MUST_BE_FILLED_FROM_HA-ATS-PREPARED-ATTEMPT-001_EVIDENCE; that attempt is
> still PREPARED, unsubmitted, and candidate-free for the fixed M42 tuple in
> the same runtime; the original browser session remains intact; and exactly one
> time-bounded enabled commandAuthorities record exists for the listed
> signer/chain and matches the listed issuer tuple. I authorize only myself to
> make one human-clicked Hedera Testnet Factory deployBond transaction with
> total cost capped at 12 HBAR, the bounded M49 receipt/Mirror observation, and
>—only if it returns a fully corroborated candidate—one separately clicked
> external.attachCandidate signature. I will revoke the exact temporary
> authority record on every terminal outcome. I reject authority provisioning,
> precondition commands, retries, M43 verification, asset-ready/finality
> claims, lifecycle actions, funding, deployment, and every other external
> action. I will stop on every listed stop condition and record only secret-free
> evidence.

Decision owner: 0xGeegZ

Decision timestamp: supplied by the human at acceptance.
