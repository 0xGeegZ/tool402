# B03 implementation plan — RiskScan Agent payment client

Execution plan for [B03-T010](../../work-queue/queue/10-ready/B03-T010-riskscan-agent-payment-client.md)
against the [B03 Agent payment client contract](../../specs/b03-riskscan-agent-payment-client.md).

## Goal

Deliver the repository's first Agent-owned paid RiskScan request cycle without
changing the accepted M05 observe-only flow. The library receives every
capability explicitly, evaluates its caller policy before it constructs a
payment client or accesses a signer, and retries only one valid matching x402
challenge.

## Sequence

1. Keep this contract, plan, card, catalog, ownership, decision, and state
   amendment committed and independently re-reviewed before it returns to
   `10-ready`.
2. Add the two exact Agent RED files:
   `apps/agent/test/riskscan-tool-payment.test.mjs` and
   `apps/agent/test/riskscan-tool-payment-boundary.test.mjs`. They import the
   declared missing module/CLI and fail only because those paths do not exist.
   Commit that durable RED before every source, manifest, lockfile, or export
   change.
3. Amend `apps/agent/package.json` and the root `package-lock.json` together:
   add direct `@x402/core@2.25.0` and `@x402/hedera@2.25.0` dependencies, the
   `./riskscan-tool-payment` export, and the `riskscan:pay` script using Node
   22.21.1 TypeScript stripping. No dependency is added for a test runner or
   runtime transpiler.
4. Add `apps/agent/src/riskscan-tool-payment.ts`. Its sole public construction
   API is `createRiskScanQuickPaymentAgent({ signer, directoryFetcher,
   requestSender, paymentClientFactory })`; construction rejects malformed
   injected capabilities before I/O. Its `pay(serviceBase, input, policy)`
   method calls `discoverRiskScanQuick` once, creates a strict/frozen B03
   `{ network, asset, maximumAmount }` policy snapshot, calls the pure Core
   `evaluateRiskScanNativeQuote` on that selection, then performs exactly one
   unsigned POST, valid x402 challenge decode, one payload creation, and one
   signed retry. It must not call the M12 discovery/evaluation wrapper, M05
   challenge helper, or ToolLoop flow. It owns a strict input snapshot and
   leaves M05 source and tests unchanged.
5. Make the injected production factory build the exact Hedera client through
   `new x402Client().register("hedera:*", new ExactHederaScheme(signer))`, then
   set a false default-money cap and one explicit
   `{ network: "hedera:testnet", asset, maxAmountPerPayment }` allowance from
   the already accepted quote, then wrap it in `new x402HTTPClient(...)`.
   Before payload creation, reject any decoded requirement whose version,
   scheme, network, asset, or atomic amount differs from that quote.
6. Add `apps/agent/src/riskscan-pay-cli.ts`. It is the sole `process.env` and
   payer-key parsing boundary; it constructs and injects the signer and client
   factory, prints only fixed safe phase/outcome output, and never prints an
   environment value, key, header, payload, signature, signed transaction, or
   caught exception text.
7. Prove GREEN with focused Agent tests, then Agent typecheck/test/lint and
   root typecheck/test/lint, queue/reference/whitespace checks, enabled guard,
   and clean-install dry run. Obtain independent task and module reviews before
   acceptance.

## Required executable cases

- Invalid construction/input causes no Directory request, unsigned request,
  client factory, signer, payload, or retry call.
- A declined quote issues exactly one Directory GET and no client construction,
  payload creation, signer-method invocation, or retry. The strict policy
  snapshot is the Core evaluator input and the factory's cap source; the
  eligible quote amount never substitutes for that cap.
- A malformed or changed challenge cannot sign; the factory, payload, signer,
  retry, transport, settlement-failure, and successful-settlement paths map to
  their fixed closed outcome without a settlement reference except on success.
- A signer/SDK `SECRET_SENTINEL` thrown error cannot enter an outcome, stdout,
  stderr, or a source file.
- Only a `200`, successful nonblank settlement reference, and validated
  RiskScan assessment yield `paid`.

## Explicit exclusions

Browser wallet/provider code, a default/global fetch, ambient credentials,
key persistence, durable payment/evidence storage, receipt binding, deployment,
and the human-authorized live exercise. The CLI only makes the human-owned
exercise technically possible; it does not authorize or run one during this
card's local RED/GREEN cycle.
