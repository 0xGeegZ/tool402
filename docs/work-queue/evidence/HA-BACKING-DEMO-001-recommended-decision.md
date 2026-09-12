# HA-BACKING-DEMO-001 — recommended Human Ops decision

Authorize one dedicated BACKER authority and at most one explicit HBAR testnet transfer for the named M56 source/deployment, subject, authority version, and backer wallet.

- chain 296 and `HEDERA_FUNDING` only;
- named RiskScan subject/authority version only;
- one server-configured treasury EVM address, never inferred from issuer, Factory, or x402 recipient;
- Human Ops configures treasury outside tracked files, provisions/revokes authority, and executes the wallet transfer;
- no `external.attachCandidate`, allocation, payout, refund, token ownership, retry, deployment, video, or submission authority.

Record source SHA, host, public backer address, authority-row identity, returned transaction hash if any, and revocation result. A wallet hash proves only submission.
