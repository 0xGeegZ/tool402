# Tool402 release rehearsal runbook

## Status and recording limit

This is a conditional rehearsal plan, not proof that any live action happened.
Target **3:30**; hard ceiling **5:00** under the current Hedera prize wording.
The target also remains within the repository's older 2–4 minute action record.
Do not extend the video to fill missing evidence.

Before recording, fill this evidence ledger from independently checkable facts:

| Field | Value |
| --- | --- |
| Recorded commit / deployed web SHA | \`<FINAL_COMMIT_AND_DEPLOYED_SHA>\` |
| Public host / backend deployment | \`<PUBLIC_HOST_AND_CONVEX_TARGET>\` |
| Blocky402 payment settlement / finality link | \`<B03_SETTLEMENT_AND_LEDGER_LINK>\` |
| ATS Factory transaction / verified asset / lifecycle transfer | \`<ATS_TX_ASSET_AND_TRANSFER_LINKS>\` |
| World evidence | \`<WORLD_PROOF_OR_NOT_SHOWN>\` |

## Timed sequence

| Time | Scene, route, and operator | Repeatable? | Evidence gate / recovery |
| --- | --- | --- | --- |
| 0:00–0:20 | Product thesis on \`/\`; state Hedera testnet and bounded evidence. No wallet. | Yes | If deploy SHA is absent, stop recording. |
| 0:20–0:40 | Discovery on \`/explore\` then \`/explore/riskscan\`; show capability, price, and limitations. No wallet. | Yes | Use current public directory only. |
| 0:40–1:00 | Browser unsigned request on \`/explore/riskscan/try\`; show the \`402\` challenge, not a fabricated result. No wallet. | Yes | If host no longer returns matching 402, omit this scene and diagnose off-camera. |
| 1:00–1:45 | Consumer Agent terminal evidence from repository root with the B03 fixed preflight and previous paid-result output. Human Ops payer only; never film a key. | Preflight yes; paid no | Without paid/finality evidence, skip the paid-result claim and do not issue another payment while recording. |
| 1:45–2:30 | ATS configuration and verified issuance/lifecycle evidence at \`/provider?tool=<TOOL_PUBLIC_ID>\` or its selected resume route. ATS issuer only. | Reads yes; transaction no | Show only with Factory receipt, verified asset, and transfer evidence. Otherwise briefly state pending or omit. |
| 2:30–3:00 | Selected backing presentation at \`/explore/riskscan/back\`; dedicated BACKER only with its own evidence. | View yes; funding no | A backing hash is not confirmation. Skip transaction claims without confirmed evidence. |
| 3:00–3:20 | World result only on Yannick's integrated route with current proof-bound wallet evidence. | Depends on proof lifetime | Skip QR-only, expired, wrong-wallet, or unverified state. |
| 3:20–3:30 | Evidence recap: public repository, commit, testnet links, limitations. No wallet. | Yes | Do not substitute placeholders for links. |

## Exact B03 CLI scene

Use the preflight command in
[\`HA-B03-AGENT-PAYMENT-001-run-packet.md\`](../work-queue/evidence/HA-B03-AGENT-PAYMENT-001-run-packet.md)
off-camera first. In the recording show only safe terminal lines and the
already corroborated settlement reference. Never repeat the paid command for a
retake; resume with existing terminal evidence and public finality.

## Wallet/account matrix

| Scene | Required identity | Never show |
| --- | --- | --- |
| Discovery and 402 | None | Wallet extension state |
| B03 paid request | Dedicated disposable Hedera testnet payer | Key, seed, signed header, raw payment payload |
| ATS issue/transfer | Verified ATS issuer on chain 296; named recipient is public only | Key, manual calldata, unverified candidate |
| Backing | Dedicated BACKER authority/wallet | Funding secret or unconfirmed hash as success |
| World | Current proof-bound World wallet | QR-only or expired proof as verification |

## No-transaction recovery rules

- Browser/route failure: refresh only read-only discovery or 402.
- B03 interruption after any payment hash: do not rerun paid command; inspect
  settlement/finality and use existing evidence.
- ATS interruption after a transaction hash: do not send or attach again;
  inspect receipt/Mirror and wait for the owning verification path.
- Backing interruption after a hash: do not fund again; show pending or omit.
- World interruption: reopen only a currently valid proof state; otherwise omit.
