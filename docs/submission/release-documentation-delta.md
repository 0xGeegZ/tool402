# Conditional release documentation delta

Apply these replacements only at the final integrated head. They are copy-ready
draft text, not claims about the current deployment.

## README additions

### After M55 integration

> Providers can create and resume distinct tool records. An ATS candidate may
> advance only after server-side corroboration binds the selected tool's exact
> sender, chain, Factory calldata, receipt, and asset; uncorroborated or
> cross-tool evidence remains pending and cannot publish.

### After #107 integration

> RiskScan exposes its backing presentation only from a server-owned OPEN
> offering projection. A submitted backing hash remains allocation-pending
> until a separate verification path corroborates it.

### After World integration

> World evidence is shown only for the current proof-bound wallet and valid
> verified state. A QR modal, expired proof, or different wallet is not a
> successful verification claim.

### After B03 evidence

> The Consumer Agent discovered RiskScan, applied an exact Hedera-testnet spend
> policy, completed one x402 paid retry through the recorded facilitator, and
> received the bounded result. Settlement: `<B03_SETTLEMENT_LINK>`; recorded
> commit and host: `<B03_COMMIT_AND_HOST>`.

### After ATS lifecycle evidence

> The recorded ATS asset `<ATS_ASSET_ADDRESS>` was created and configured on
> Hedera testnet, then completed the recorded lifecycle operation
> `<ATS_LIFECYCLE_OPERATION>` in transaction `<ATS_LIFECYCLE_LINK>`. This is
> testnet evidence only and makes no investment, return, or allocation claim.

## Submission-pack replacements

In `docs/submission/README.md`, replace only centralized final tokens with
public, checked references. Add this exact evidence table after its centralized
replacements table:

| Evidence | Insert only after verification |
| --- | --- |
| Consumer Agent payment | `<B03_COMMIT>`, `<B03_HOST>`, `<BLOCKY402_ATTESTATION>`, `<B03_SETTLEMENT_LINK>` |
| ATS issuance/configuration | `<ATS_FACTORY_TX_LINK>`, `<ATS_ASSET_ADDRESS>`, `<ATS_CONFIGURATION_HASH>` |
| ATS lifecycle | `<ATS_LIFECYCLE_OPERATION>`, `<ATS_LIFECYCLE_TX_LINK>`, pre/post state reads |
| M55 verification | `<M55_INTEGRATED_SHA>`, named backend tests, no cross-tool READY result |
| Backing | `<M56_INTEGRATED_SHA>` and only confirmed/pending wording supported by evidence |
| World | `<WORLD_INTEGRATED_SHA>` and valid-wallet verification proof, if shown |
| Video | `<FINAL_VIDEO_URL>`, measured duration `<= 5:00`, recorded commit |

Do not add a final sentence for an unset row. Do not claim Blocky402 from a
generic x402 challenge, ATS verification from a candidate, token ownership from
an event alone, confirmed backing from a hash, or World verification from a QR
screen.
