# Tool402 submission pack (draft; docs-only)

This is judge-facing working copy, not an event submission. It must be updated
from independently checkable rehearsal evidence, then submitted by the human
operator only.

## Centralized final replacements

Replace these tokens once, in this table, after the associated evidence exists.
Do not create duplicate facts elsewhere before they are verified.

| Token | Replace only with |
| --- | --- |
| [https://tool402.vercel.app](https://tool402.vercel.app) | Deployed from `5de50e0ae045b60e6091877b7092d38b55178975`; nonpayable public smoke only. |
| `<FINAL_X402_TRANSACTION>` | The one redacted, independently checkable Hedera-testnet transaction reference from the Consumer Agent exercise. |
| `<FINAL_ATS_TRANSACTION>` | The verified Hedera-testnet `deployBond` transaction reference after Stage B; leave unchanged if Stage B is not completed. |
| `<FINAL_VIDEO_URL>` | The published human-narrated video URL after its 2–4 minute duration is measured. |
| `<FINAL_SUBMISSION_COMMIT>` | The exact public commit reviewed for credentials and used in the final event form. |

## Project description

Tool402 is a Hedera-testnet marketplace for tools that software agents pay to
use. A Consumer Agent discovers a bounded tool, receives an x402 `402 Payment
Required` challenge instead of a fabricated answer, applies a spend policy, and
gets a result only after the settlement path verifies it. RiskScan is the first
listed tool; EntityCheck is a second protected endpoint for a source-bounded
French-entity assessment. Providers can also prepare a campaign whose
commands are separate from a tested local revenue-note encode/decode seam
against the official Hedera Asset Tokenization Studio Factory artifact with
viem. The seam is not wired to execution. Human-only authority gates keep
wallets, funding, configuration, deployment, and submission outside the agent.

## Short description — exactly 200 characters

> Tool402 lets agents discover paid tools, satisfy x402 challenges on Hedera testnet, and receive bounded results with evidence. Providers can prepare revenue notes through an ABI Factory-artifact seam.

## Hedera Agentic Payments prize justification

Tool402 is built around an agent making a constrained payment decision rather
than a human buying access first. The Consumer Agent reads a machine-readable
descriptor, rejects malformed metadata and challenges, applies a maximum-spend
policy to an exact Hedera quote, and performs only one signed retry after the
initial `402`. The service releases the bounded response only on the verified
settlement path. The final demo should use the centralized public-host and
payment-reference rows to prove that chain of evidence; until then, this is an
implementation and testnet-rehearsal claim, not a live-service claim.

## Hedera Tokenization prize justification

Tool402 includes a safe, local preparation seam for a Hedera ATS revenue-note
request. The selected seam imports the official
`@hashgraph/asset-tokenization-contracts@8.0.0` Factory ABI and uses
`viem@2.56.1` to validate the exact configuration, encode `deployBond`, and
decode `BondDeployed`—without a handwritten ABI, SDK compatibility layer, or
application-held signing key. The current UI control is disabled and the seam
is not wired to a campaign transaction. Stage B remains human-authorized, so
there is no claim that a revenue note exists before its centralized transaction
reference is verified. The project makes no investment, return, or
holder-distribution claim.

## Architecture explanation

```text
Consumer Agent
  -> GET /api/tools (bounded capability + payment summary)
  -> POST /api/riskscan (unsigned request)
  <- 402 x402 exact challenge
  -> payment proof to the tool service
  -> tool service + configured facilitator validation
  -> protected result after verified settlement

Provider campaign
  -> review in Next.js -> MetaMask EIP-712 command
  -> /api/commands -> HMAC-authenticated Convex ingress
  -> canonical payload, authority, expiry, replay, and idempotency checks
  -> admitted local attempt; never an on-chain assertion

Revenue note preparation
  -> accepted Stage-B configuration -> local official Factory artifact + viem
     encode/decode seam
  -> disabled UI control; not wired to campaign execution
  -> human Stage B gate -> future wallet/RPC/transaction/receipt work
```

RiskScan's result is deliberately deterministic and bounded by caller
declarations. EntityCheck is a separate protected endpoint that reads one
configured French registry base and one configured OFAC SDN source through
bounded adapters; it reports source limitations and does not make a compliance
finding. The backend is the durable admission and observation boundary, while
Hedera/Mirror evidence—not a browser callback—must decide any external fact.

## Demo flow — target 3 minutes 30 seconds

Only record this sequence after its required human gates are complete. Never
replace a missing payment or ATS transaction with a mocked success state.

| Time | What to show | Evidence rule |
| --- | --- | --- |
| 0:00–0:20 | Thesis: “Back the tools agents pay to use.” | State testnet-only scope. |
| 0:20–0:50 | Tool Directory and RiskScan's bounded capability. | Show limitations before price. |
| 0:50–1:20 | One unpaid request and its `402` x402 challenge. | No result before payment. |
| 1:20–2:05 | Consumer Agent policy, one authorized testnet payment, and protected result. | Use the centralized payment reference only after finality evidence exists. |
| 2:05–2:45 | Provider campaign command boundary and disabled Factory-artifact control. | Explain that admission/signing does not equal issuance or executable Factory use. |
| 2:45–3:10 | Stage B outcome, if and only if completed. | Otherwise show the truthful pending gate; if completed use the centralized ATS reference. |
| 3:10–3:30 | Security model and final evidence links. | Show no secret, key, fake metric, or return claim. |

## Evidence checklist

- [ ] Exact submitted commit: the centralized submission-commit reference.
- [ ] Fresh Node 22 `typecheck`, `lint`, `test`, and `queue:check` output for
  that commit, with any unrelated baseline failure explicitly classified.
- [ ] Public HTTPS route from the centralized table, including a clean `GET
  /api/tools` and an unpaid `POST /api/riskscan` that returns `402`.
- [ ] One Consumer Agent run with an approved bounded policy and the
  centralized Hedera-testnet settlement reference.
- [ ] If Stage B is used in the demo: its human authorization, stop-condition
  record, transaction, Mirror Node/finality evidence, candidate address, and
  verified receipt outcome recorded in the centralized ATS reference.
- [ ] If EntityCheck is shown: configured-source evidence and its limitations;
  do not call a clear result a compliance decision.
- [ ] Tracked-file secret scan and human confirmation that no credential, key,
  funded account value, or signed payload entered the submitted commit.
- [ ] Centralized video URL and measured duration.

## Final submission checklist

- [ ] Confirm the repository and centralized submitted commit are public and
  that the README covers setup, architecture, and payment flow.
- [ ] Replace only the centralized tokens above with independently checkable
  final evidence.
- [ ] Confirm the public host, testnet payment, and Consumer Agent evidence
  all point to the same demonstrated commit.
- [ ] Keep Stage B absent from prize copy and video if it remains pending; do
  not imply a live revenue note.
- [ ] Confirm that no funding, payout, clearing, HCS, mainnet, revenue, user,
  or investment-return claim has been added without proof.
- [ ] Publish a 2–4 minute human-narrated video at the centralized video URL.
- [ ] Have the human operator submit the two selected tracks before the event
  deadline; this document does not submit anything.

## After Stage B: required documentation updates

If—and only if—Stage B reaches its recorded terminal evidence, update this
table and the cited demo row before recording the video:

| Item | Required update |
| --- | --- |
| Transaction evidence | Replace the centralized ATS token with the exact testnet transaction and a checkable Mirror link/reference. |
| Receipt outcome | State the verified outcome and candidate/bond address only when the accepted receipt path confirms them. |
| Demo narration | Replace “pending Stage B gate” with the proven sequence, exact stop conditions, and no-retry outcome. |
| Evidence checklist | Check only the Stage B evidence items actually recorded. |
| README claims | Add no “deployed” or “successful” wording unless the checked final evidence supports it. |

Public deployment, Consumer Agent payment evidence, video publication, the
final commit, and human submission are independent updates even if Stage B
finishes.
