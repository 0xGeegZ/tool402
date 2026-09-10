# B03-T020 independent GREEN review

## Scope

Independent specification and standards review evaluated the delegated GREEN
candidate `56470c1e9d226c9a071a7106c4e4a4d094107d78` against canonical
`a311cc5350cba0924968ff3a88c7d6cda08cdff4`, the active B03-T020 card, the
safe-phase diagnostics specification, and FILE-OWNERSHIP.

The aggregate candidate diff changes exactly the four authorized paths:

- `apps/agent/src/riskscan-pay-observability.ts`
- `apps/agent/src/riskscan-pay-cli.ts`
- `apps/agent/test/riskscan-pay-observability.test.mjs`
- `apps/agent/test/riskscan-tool-payment-boundary.test.mjs`

No payment library, manifest, lockfile, public export, configuration, key,
signer, wallet/provider, transaction, deployment, or live path changes.

## Verification

Under Node 22.21.1, the focused B03 suite passes 31/31. Agent typecheck and
lint pass. The preflight path retains its bounded Directory GET, unsigned
initial request, exact challenge check, and stop before payer, signer, payment,
retry, settlement, and result boundaries.

## Finding

**P1 — preserve the normal failure interface.** The candidate replaces the
existing `RISKSCAN_PAY_CONFIGURATION_INVALID` and `RISKSCAN_PAY_FAILED` stderr
markers with `RISKSCAN_PAY_DIAGNOSTIC` stdout output. That is a behavior change,
not the additive closed diagnostic required by the specification.

The delegated lane may correct only its already-authorized four paths:

1. preserve each existing normal-mode stderr marker and exit behavior;
2. add exactly one closed `RISKSCAN_PAY_DIAGNOSTIC <CODE>` line for the same
   failure; and
3. update only the two reserved tests to prove both the legacy marker and the
   added redacted diagnostic.

No renewed activation is required. The source scope remains exactly the
existing B03-T020 GREEN authorization. A fresh independent GREEN review is
required before integration.

## Verdict

**BLOCKED.** Do not integrate `56470c1e9d226c9a071a7106c4e4a4d094107d78`.
The delegated Strike Team retains the existing narrow GREEN scope to correct
this finding. No preflight, payable attempt, provider, wallet, signer, or other
live action is authorized.
