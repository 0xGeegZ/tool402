# M12 ToolLoopAgent native quote evaluation contract

## Delivery boundary

This contract adds one narrow headless Agent composition boundary. It reuses
the accepted ToolLoopAgent directory discovery boundary and the accepted pure
native quote evaluator. It determines only whether a caller-supplied local
policy is compatible with the safe native summary selected from one directory
read. It is not a payment, request, result, settlement, or live-service
client.

The new module calls the accepted directory boundary exactly once. It does
not parse a raw directory response or duplicate directory validation. It
never directly calls `fetch`, creates a request, sends a POST, builds a body
or header, reads runtime configuration, or accesses a client, wallet,
account, signer, key, backend, store, clock, timer, retry loop, or external
service.

## Public Agent boundary

`apps/agent/src/riskscan-tool-native-quote-evaluation.ts` exports this
surface through the `@tool402/agent/riskscan-tool-native-quote-evaluation`
subpath:

```ts
import type { RiskScanNativeQuoteEligibility } from "@tool402/core";
import type { RiskScanDirectoryFetcher } from "./riskscan-tool-directory.ts";

export type RiskScanNativeQuoteAgentOutcome =
  | { readonly kind: "directory_unavailable" }
  | { readonly kind: "directory_invalid" }
  | { readonly kind: "native_summary_unavailable" }
  | RiskScanNativeQuoteEligibility;

export async function evaluateDiscoveredRiskScanNativeQuote(
  serviceBase: URL,
  policy: unknown,
  directoryFetcher: RiskScanDirectoryFetcher,
): Promise<RiskScanNativeQuoteAgentOutcome>;
```

The Agent workspace declares its existing local `@tool402/core` dependency
explicitly and exports this one new subpath before the module can reach GREEN.
An executable package-level test imports and exercises the public subpath. No
caller or Agent module may rely on a hoisted package dependency.

## Required composition behavior

The function requires a caller-supplied `directoryFetcher`, calls
`discoverRiskScanQuick(serviceBase, directoryFetcher)` exactly once, and uses
only its fresh, safe discovery outcome. It never falls back to the runtime
global `fetch`. A missing or non-function fetcher returns the bounded
`directory_invalid` outcome before any directory call or policy inspection.

- `directory_unavailable` and `directory_invalid` are returned unchanged.
  The caller policy is not reflected on, read, cloned, logged, stored, or
  passed to the core evaluator for either outcome.
- For a selected descriptor, only the accepted local configured native summary
  (`x402` on `hedera:testnet`) may become a quote. A configuration-required or
  EVM summary returns the fresh bounded
  `{ kind: "native_summary_unavailable" }` outcome. That outcome does not
  claim availability, a payment route, a quote, an account, a recipient, a
  facilitator, a balance, or a live configuration.
- For the native summary only, the Agent creates a fresh plain
  `{ network, asset, amount }` quote from the cloned summary and calls
  `evaluateRiskScanNativeQuote(policy, quote)` once. It returns the core
  evaluator's bounded eligible or declined result unchanged.
- The opaque policy is deliberately supplied per invocation. This card chooses
  no default, cap, asset, recipient, payer, fee allocation, configuration
  source, persistence location, or caller-facing policy-selection UI.
- Each invocation delegates independently to the supplied directory fetcher.
  A fetcher mutation of its received URL or request-init object cannot affect a
  later invocation. The composition adds no cache, shared state, retry, or
  timer.

An `eligible` result remains only local compatibility. It is never user
consent, a payment authorization, a quote guarantee, a balance check, a
configured client, a request, a transaction, settlement, finality, evidence,
result, deployment, or live-service claim.

## Explicit exclusions

Only these implementation paths belong to this card:

```text
apps/agent/package.json
apps/agent/src/riskscan-tool-native-quote-evaluation.ts
apps/agent/test/riskscan-tool-native-quote-evaluation.test.mjs
apps/agent/test/riskscan-tool-native-quote-evaluation-boundary.test.mjs
apps/agent/test/riskscan-tool-native-quote-evaluation-package.test.mjs
package-lock.json
```

The accepted Agent directory source/tests and accepted core native quote
source/tests are dependencies, not owned changes. Existing Agent flow and
challenge modules, web, backend, UI, runtime configuration, recipient or
facilitator setup, payment handling, headers, clients, wallets, accounts,
signers, keys, transactions, settlement, persistence, deployment, and live
evidence are excluded.

## Acceptance evidence

- RED/GREEN Agent tests prove one exact injected credential-free directory GET
  and no second call; discovery-failure propagation without policy inspection;
  a missing/non-function fetcher returning `directory_invalid` without global
  fetch or policy inspection;
  configuration-required and EVM summaries becoming
  `native_summary_unavailable`; native equality, cap, and asset boundaries;
  malformed native-policy decline; and independent repeated invocations after
  fetcher mutation.
- A package-level RED/GREEN test imports and exercises only
  `@tool402/agent/riskscan-tool-native-quote-evaluation`, proving the explicit
  local core dependency and public Agent subpath resolve after a clean install.
- A source boundary test permits only the accepted Agent directory and local
  core evaluator imports, and rejects direct fetch, POST, body/header,
  payment-client, wallet/account/signer/key, environment, backend/store,
  timer/retry, response-body/result, and hidden-side-effect behavior.
- Agent/root Node 22.21.1 typecheck, test, lint, clean-install dry run,
  production Webpack build, queue/reference/whitespace checks, and enabled
  local guard pass. A controlled local Agent exercise proves the bounded GET
  composition without an external request.
- Independent task review and two fresh clean module-review generations pass
  before acceptance.

No human action is needed for this local composition. A later payment client
or live proof remains governed by HA-X402-HEDERA-001; its pending state grants
no external authority and does not block this local card.
