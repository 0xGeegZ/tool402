# Runtime human actions

Record every human action required before it can unblock a local card: wallet signing, account/key creation or funding, live/testnet submission, partner setup, deployment, repository visibility, final release, narration, or submission. A completed row needs concrete human evidence; no agent marks one complete by assumption.

| ID | State | Human-only action | Evidence to record | Unblocks |
| --- | --- | --- | --- | --- |
| HA-X402-HEDERA-001 | ACCEPTED — bounded evidence | Choose/configure the real testnet recipient and facilitator; create or fund any required account, associate the selected asset when needed, create the client signer, sign and submit one payment, verify the on-ledger transaction/finality, and provide redacted live-evidence facts. Do not place credentials, keys, signing payloads, or funded secrets in the repository. | Explicit human authorization and a redacted packet were reviewed in [the bounded evidence record](evidence/HA-X402-HEDERA-001-review.md). It distinguishes account setup, one signed payment retry, and finality without storing secret material. | A later local payment-client or live-proof card may be evaluated through its own dependency and authority review. This acceptance authorizes no additional external action and does not unblock ATS, funding, allocation, clearing, HCS, payout, deployment, or submission work by itself. |

No agent may mark this row complete by assumption. Future live, funded, account,
deployment, visibility, narration, or submission work must create an explicit
row before it starts.
