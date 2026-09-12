# Tool402 recording rehearsal runbook

## Single source of presenter instructions

Open /demo and select **Start recording demo**. The route is the practical
guide: it contains the same ordered steps, routes, wallet labels, narration,
and evidence rules as this document. The guide is a rehearsal until every
required item has independently checkable evidence.

Target edited duration is **3:30**. The hard ceiling is **5:00**. No retake
authorizes a new payment, ATS transaction, signing action, or backing transfer.

## Current evidence gate

| Evidence | Current guide status | Recording rule |
| --- | --- | --- |
| Public deployed build and discovery | ACTION REQUIRED | Confirm exact deployed SHA and public directory. |
| Unsigned x402 boundary | ACTION REQUIRED | Show the real ToolLoop response. |
| B03 Consumer Agent settlement | NOT AVAILABLE | Show the safe preflight only; do not imply payment or show an explorer link. |
| ATS asset and lifecycle transfer | ACTION REQUIRED | Omit verified narration unless both receipts are independently accepted. |
| Provider campaign/publication | ACTION REQUIRED | Use the current admitted Provider projection only. |
| Backing | ACTION REQUIRED | Submitted means allocation pending. |
| World | OPTIONAL | Omit unless current wallet/session has valid integrated proof. |

## Ordered recording walkthrough

| Step | Route | Wallet | Presenter action | Evidence to show |
| --- | --- | --- | --- | --- |
| 01 Introduce Tool402 | / | none | Explain the testnet product. | Product scope. |
| 02 Discover RiskScan | /explore | none | Open RiskScan. | Listed capability, price, limitations. |
| 03 x402 request boundary | /explore/riskscan/tool-loop?demo=tool-loop | none | Review existing sample, click Inspect request boundary. | Real 402 or truthful unavailable outcome. |
| 04 Consumer Agent evidence | /demo | Human Ops payer | Run preflight; reuse a verified paid result if one exists. | Safe terminal lines; settlement link only after verification. |
| 05 Provider sign-in | /sign-in | PROVIDER | Use the existing shared wallet control on Hedera Testnet. | Current wallet/session result. |
| 06 Provider campaign | /provider/deploy | PROVIDER | Continue the existing RiskScan campaign. | Campaign summary. |
| 07 Campaign terms | /provider/deploy | PROVIDER | Review prefilled content and terms. | Editable values; acknowledgement remains unchecked. |
| 08 ATS deployment | /provider/deploy | PROVIDER | Continue only after real stage results. | Pending state or independently verified asset evidence. |
| 09 ATS lifecycle | /demo | ATS issuer | Use the separately approved one-unit transfer only after preconditions. | Verified pre-state, receipt, post-state. |
| 10 World | /demo | PROVIDER | Show only valid current-wallet proof. | Verified state or honest omission. |
| 11 Publication | /provider | PROVIDER | Open admitted Provider status. | OPEN/Directory state when available. |
| 12 Back RiskScan | /explore/riskscan/back | BACKER | Use existing amount; read acknowledgement before choosing. | Units, HBAR, unchecked acknowledgement. |
| 13 Backing evidence | /explore/riskscan/back | BACKER | Never resend after a hash. | Submitted — allocation pending. |
| 14 Repeatability | /sign-in, then /dashboard | PROVIDER | Open the signed dashboard through the existing sign-in route. | Current campaign or empty state. |
| 15 Evidence recap | /demo | none | Return to final recap. | Only independently supported evidence. |

## B03 terminal scene

The control room provides Copy preflight command and Copy paid-command template.
It contains no payer key, signed header, or payment payload. Expected preflight
output is RISKSCAN_PAY_DIAGNOSTIC PREFLIGHT_GUARD_REACHED. A paid command is
not repeated for a recording retake. A HashScan action appears only when a real
verified settlement identifier is available.

Expected successful paid output, shown only after one authorized successful
request, is:

```text
RISKSCAN_PAY_OUTCOME paid
RISKSCAN_PAY_SETTLEMENT <non-empty-safe-settlement-reference>
RISKSCAN_PAY_DIAGNOSTIC PAID
```

## Retake rules

- Narration/UI mistake: restart the guide only. It changes no product state.
- B03 payment or ATS deployment already completed: reuse independently verified
  evidence; do not send again.
- Backing hash returned: show pending/explorer evidence if it exists; do not
  blindly fund again.
- Fresh Provider tool: use M55 only when it is integrated and selected by its
  owner; existing tools remain intact.
- World failure, expiry, QR-only result, or wrong wallet: omit the scene.

## Final pre-recording checklist

- [ ] Complete a no-transaction desktop rehearsal by following all 15 steps.
- [ ] Confirm each planned scene has the exact evidence named above.
- [ ] Measure the rehearsal and keep the edited recording below five minutes.
- [ ] Run 390px sanity check; no guide button may be hidden or overflow.
- [ ] Keep all private keys, signed payloads, headers, and funding secrets off
  screen and outside the repository.
