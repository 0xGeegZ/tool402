# M07 ToolLoopAgent RiskScan discovery-to-challenge flow contract

## Delivery boundary

This contract adds one narrow headless Consumer Agent composition boundary. It
calls the accepted RiskScan directory discovery boundary first, then gives its
opaque returned discovery union to the accepted unsigned challenge observer.
It returns only that observer's bounded terminal outcome. It is not a payment
client, result client, settlement client, or live service client.

The flow may make one caller-directed credential-free directory `GET` and,
only after a valid selected directory result, one caller-directed unsigned
RiskScan `POST`. It does not inspect a selected descriptor or its payment
summary. The accepted sub-boundaries retain ownership of input validation,
safe target construction, request construction, and status/header presence
observation.

## Public Agent boundary

The Agent adds `apps/agent/src/riskscan-tool-flow.ts` with this interface:

```ts
import type { RiskScanChallengeSender, RiskScanConsumerChallengeOutcome } from "./riskscan-tool-challenge.ts";
import type { RiskScanDirectoryFetcher } from "./riskscan-tool-directory.ts";

export type RiskScanToolFlowOutcome = RiskScanConsumerChallengeOutcome;

export async function runRiskScanQuickFlow(
  serviceBase: URL,
  input: unknown,
  directoryFetcher?: RiskScanDirectoryFetcher,
  challengeSender?: RiskScanChallengeSender,
): Promise<RiskScanToolFlowOutcome>;
```

`directoryFetcher` belongs only to `discoverRiskScanQuick`; `challengeSender`
belongs only to `requestRiskScanQuickChallenge`. They default independently to
the runtime `fetch` through their accepted boundaries. Tests inject controlled
senders and must not call a network.

The flow calls `discoverRiskScanQuick(serviceBase, directoryFetcher)` exactly
once. It then calls
`requestRiskScanQuickChallenge(serviceBase, discovery, input, challengeSender)`
exactly once and returns its newly created outcome. The flow does not read,
clone, compare, log, return, or otherwise inspect `discovery.tool` or any
payment summary. It creates no response output that includes URL, body,
header, credential, recipient, facilitator, payment payload, wallet, account,
transaction, receipt, evidence, or result data.

## Required composition behavior

The flow must preserve the accepted sub-boundary semantics exactly:

- `directory_unavailable` and `directory_invalid` make no challenge-sender
  call. The input and target validation inside the challenge observer are not
  reached for either outcome.
- A valid selected directory result lets the challenge observer apply its
  existing strict caller-input and base/target checks. Invalid input makes no
  challenge-sender call and returns `input_invalid`.
- The only successful local I/O sequence is the accepted GET to `/api/tools`
  followed by the accepted unsigned POST to `/api/riskscan`. The flow does not
  derive either route, method, headers, or protocol from the directory.
- A rejected directory sender produces `directory_unavailable`; a rejected
  challenge sender produces `transport_failure`; `503` produces `unavailable`;
  and a controlled unsigned `402` with a nonblank challenge header produces
  only `payment_required`. The header value is never decoded, returned, stored,
  replayed, or logged.
- The Agent must accept the existing safe native directory payment summary in
  its normal discovery path. The flow's public outcome still contains no
  network, asset, amount, recipient, facilitator, fee payer, header, or
  payload field.
- Each invocation delegates to its supplied senders independently. A sender's
  mutation of a received `URL` or request init cannot alter a later invocation,
  and the flow adds no retry, cache, clock, timer, or shared state.

## Explicit exclusions

Only these implementation paths belong to the task:

```text
apps/agent/src/riskscan-tool-flow.ts
apps/agent/test/riskscan-tool-flow.test.mjs
apps/agent/test/riskscan-tool-flow-boundary.test.mjs
```

The task does not modify the accepted directory/challenge source, web
provider, core package, backend, UI, package metadata, lockfile, runtime
configuration, or external systems. It does not import x402, a Hedera client,
wallet, signer, account, backend, or environment state; parse or construct a
payment/authorization header; read a challenge/body/result; or execute a
payment, settlement, verification, finality, receipt/evidence action,
deployment, or live test.

## Acceptance evidence

- RED/GREEN tests prove the exact controlled GET-then-POST sequence, strict
  discovery failure propagation with no POST, accepted input/status mappings,
  native-directory to unsigned-`402` behavior, sender isolation, and no
  leakage or extra call.
- A source boundary test rejects payment/header/x402/wallet/account/signer/
  environment/backend/timer/retry/CLI/body/result capability. It permits only
  the two accepted Agent module imports and their injected requests.
- Agent/root Node 22.21.1 typecheck, test, lint, production Webpack build,
  queue/reference checks, controlled local exercise, independent task review,
  and two fresh clean module-review generations pass.

No human action is needed for this local composition. Real recipient or
facilitator setup, account creation/funding, client signer creation, payment
signing/submission, on-ledger verification/finality, deployment, and live
evidence remain human-authorized under HA-X402-HEDERA-001. Its PENDING record
does not authorize an external action or unblock a payment-client/live-proof
card; only root acceptance of explicit human-provided authorization/evidence
can do so.
