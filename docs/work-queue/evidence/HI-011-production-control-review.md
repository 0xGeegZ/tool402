# HI-011 Production control review

## Status

**PREPARED — NOT ACCEPTED, NOT EXECUTABLE.** This secret-free review prepares
the fresh Human Ops decision required by the closed Production preflight. It
does not enable an authority, request a wallet signature, relay a command,
create an offering or attempt, submit Stage B, or record a transaction.

## Production provenance observed on 2026-09-13

| Fact | Observed value |
| --- | --- |
| Public alias | `https://tool402.vercel.app` |
| Production deployment ID | `6420584027` |
| Deployment source commit | `027ebc9bb0dc281e02b0a556be595e487c0cadc9` |
| Deployment status | `success` at `2026-09-13T10:35:16Z` |
| Vercel deployment URL | `https://tool402-h2xu63adv-indyweb.vercel.app` |
| Alias and named deployment | Both returned HTTPS `200` from Vercel during the read-only check. |

The deployment status is the provenance binding for the Production alias. The
HTTPS headers corroborate liveness only; they do not reveal configuration or
prove an authority, signature, relay, or transaction.

## Source comparison

The former approved HI-011 application source was
`d2a2be44a78ee460fe6590d606baf630e72a78cc`. The current Production source is
not byte-identical and therefore needs a fresh human decision rather than an
implicit carry-forward.

The reviewed HI-011 signing/runtime invariants remain fixed in the current
source:

```text
network                    = hedera:testnet
chainId                    = 296 / 0x128
issuer and signer          = 0xc89f87052c3e080b4a9b021d4930055031ef378e
subject                    = riskscan_revenue_note_demo
operation                  = ATS_CREATE
Factory                    = 0xd1f118a40f3b02883d35909ef2517e7edd78379d
M42 canonical digest       = 1880065c5ae64b3fc6279cfdd8c85a6880d43e98ce129ed697c72372204296f9
```

The intervening HI-relevant changes centralize the fixed digest, strengthen
browser account/receipt/input checks and recovery handling, and add selected
provider-tool projection validation. They do not loosen the fixed tuple,
permit automatic signing, or authorize a transaction. The Production delta
from `8e87da11296fc11195537da9290fbeae243d4714` to `027ebc9bb0dc281e02b0a556be595e487c0cadc9`
does not touch the reviewed HI-011 deploy, ATS, wallet-command, or command
dispatch paths.

## Authority isolation result

The deployed command-authority reader is deliberately fail-closed unless it
finds one total record for `(chainId, canonicalSignerAddress)`. It does not
filter that count by `enabled` before the exact-one check. Consequently an
ISSUER and BACKER record for the same public wallet must never coexist, even if
one is disabled. This is an existing runtime safety contract, not a reason to
change application code for this controlled exercise.

The Production HI-011 packet therefore permits only the existing literal
ISSUER record. M56 may use its separate BACKER record only after the ISSUER
record has been removed at an authorized terminal boundary; disabling alone is
insufficient for the later BACKER flow.

## Ruling

The current Production source is safe for the same bounded HI-011 Stage 1
flow, subject to the new exact decision packet. The previously closed
Production preflight remains historical only. Before acceptance, Human Ops
must re-read the alias/deployment pair: if a merge or Vercel redeploy changes
either named source or deployment, stop and create a short fresh addendum
naming the then-current pair. Stage B remains a separate pending decision.
