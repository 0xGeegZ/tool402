# Runtime human actions

Record every human action required before it can unblock a local card: wallet signing, account/key creation or funding, live/testnet submission, partner setup, deployment, repository visibility, final release, narration, or submission. A completed row needs concrete human evidence; no agent marks one complete by assumption.

| ID | State | Human-only action | Evidence to record | Unblocks |
| --- | --- | --- | --- | --- |
| HA-X402-HEDERA-001 | PENDING | Choose/configure the real testnet recipient and facilitator; create or fund any required account, associate the selected asset when needed, create the client signer, sign and submit one payment, verify the on-ledger transaction/finality, and provide redacted live-evidence facts. Do not place credentials, keys, signing payloads, or funded secrets in the repository. | Human-provided explicit authorization and redacted proof sufficient to distinguish account setup, submitted payment, and verified finality; no secret material. | Nothing while pending: this record authorizes no external action and unblocks no payment-client or live-proof card. Only root acceptance of human-provided authorization/evidence may unblock those later actions. It does not block M07 local unsigned composition. |

No agent may mark this row complete by assumption. Future live, funded, account,
deployment, visibility, narration, or submission work must create an explicit
row before it starts.
