# M05 ToolLoopAgent RiskScan challenge observation contract

## Delivery boundary

This contract adds the second local Consumer Agent boundary. Given an outcome
from the accepted ToolLoopAgent discovery step, a caller-supplied RiskScan
Quick input, and a caller-directed service base, it can send exactly one
unsigned request to the fixed local RiskScan route and observe only a bounded
availability or challenge outcome. It is not a payment client, result client,
or settlement client.

The agent may issue one credential-free `POST` to `/api/riskscan` only when
the supplied discovery outcome is `tool_selected`. It must never derive a
route, method, header, recipient, facilitator, network, price, or payment
material from the descriptor. It must not create, replay, or decode a payment
header or payload; sign; access a wallet, account, key, environment, x402
client, facilitator, backend, durable store, clock, timer, retry loop, CLI,
or external registration. It does not read a successful response body or
assert that an assessment, payment, settlement, verification, finality,
receipt, evidence, result, deployment, or live service exists.

## Public agent boundary

The new module is `apps/agent/src/riskscan-tool-challenge.ts` and exports:

```ts
import type { RiskScanConsumerDiscovery } from "./riskscan-tool-directory.ts";

export type RiskScanChallengeSender = (
  input: URL,
  init: RequestInit,
) => Promise<Response>;

export type RiskScanConsumerChallengeOutcome =
  | { kind: "directory_unavailable" }
  | { kind: "directory_invalid" }
  | { kind: "input_invalid" }
  | { kind: "transport_failure" }
  | { kind: "unavailable" }
  | { kind: "payment_required" }
  | { kind: "unexpected_response" };

export async function requestRiskScanQuickChallenge(
  serviceBase: URL,
  selection: RiskScanConsumerDiscovery,
  input: unknown,
  sender?: RiskScanChallengeSender,
): Promise<RiskScanConsumerChallengeOutcome>;
```

The function snapshots the discovery union's outer shape before doing any
input, URL, or sender work. A failure outcome must be exactly one plain object
with the single own enumerable data property `kind`. A selected outcome must
be exactly one plain object with the own enumerable data properties `kind` and
`tool`; `tool` is opaque and its contents are never read or used. The snapshot
must reject extra, missing, inherited, accessor-backed, non-enumerable, symbol,
malformed, hostile, or throwing selection facades as `directory_invalid`
without I/O. It propagates `directory_unavailable` and `directory_invalid`,
and sends a request only for `tool_selected`. It does not use any descriptor
field to derive behavior.

## Input and request construction

Before I/O, the agent validates and creates a local snapshot of exactly this
input:

```ts
{
  requestRef: string; // trimmed, nonblank, at most 96 characters
  subjectRef: string; // trimmed, nonblank, at most 160 characters
  context: string; // trimmed, nonblank, at most 280 characters
  declarations: {
    identity: boolean;
    pricing: boolean;
    limitations: boolean;
    evidence: boolean;
  };
}
```

The outer and declarations objects must be plain records with exactly the
listed own, enumerable data properties. Extra, missing, inherited,
accessor-backed, non-enumerable, symbol, malformed, or throwing input is
`input_invalid` with no request. The serialized body is produced only from
the local snapshot.

`serviceBase` and the derived target must each be `http:` or `https:` URLs
without userinfo. Errors, hostile facades, invalid bases, or invalid derived
targets return `directory_invalid` without I/O. For a valid selected outcome,
valid input, and valid target, the sender receives exactly one fresh request:

```ts
{
  method: "POST",
  headers: {
    accept: "application/json",
    "content-type": "application/json",
  },
  body: JSON.stringify(localInputSnapshot),
  credentials: "omit",
  redirect: "error",
}
```

The agent sends no authorization, payment, wallet, account, or protocol
header. A sender mutation cannot affect a later call, and the agent never
retries.

## Observed outcomes

- A rejected sender call returns `transport_failure`.
- A `503` returns `unavailable`.
- A `402` becomes `payment_required` only when a nonblank
  `payment-required` response header is present. The agent checks only that
  presence; it neither returns, decodes, stores, nor replays the header.
- A `200`, `400`, any other status, malformed/hostile response metadata, or
  missing/blank challenge header returns `unexpected_response`. The agent
  never reads a response body, even for `200`.

Every outcome is a new local literal with no URL, header value, request body,
error, credential, recipient, facilitator, payment payload, wallet, account,
transaction, receipt, evidence, or result field.

## Scope and ownership

The implementation lane owns only:

```text
apps/agent/src/riskscan-tool-challenge.ts
apps/agent/test/riskscan-tool-challenge.test.mjs
apps/agent/test/riskscan-tool-challenge-boundary.test.mjs
```

This card does not modify the accepted discovery source, core package, web
provider, backend, UI, package metadata, lockfile, runtime configuration, or
any external system. The root owns this specification, plan, card, queue
state, catalog, file ownership, decisions, reviews, integration evidence, and
pushes.

## Acceptance evidence

- RED/GREEN tests prove exact selection propagation, strict input snapshotting,
  safe base/derived-target rejection, one exact unsigned POST, fresh init
  isolation, transport/status mappings, nonblank challenge presence checking,
  no response-body read, no extra calls, and no output leakage.
- A boundary test rejects payment or authorization header construction,
  payment-header decoding or output, x402 imports/access, wallet, signer,
  account, environment, backend, clock, timer, retry, dynamic import, CLI,
  response-body read, result handling, and hidden side effects. It permits
  only the fixed JSON request body and the nonblank challenge-presence check.
- Agent/root Node 22.21.1 typecheck, test, lint, production Webpack build,
  queue/reference checks, independent task review, and two fresh module-review
  generations pass.
- A real local Next request with absent configuration returns only
  `unavailable`; it sends no payment header or payment action.

No human action is needed for local code and controlled tests. A configured
route, payment header handling beyond presence observation, payment, signing,
wallet/account action, deployment, transaction, finality, receipt/evidence,
result release, and submission remain human-authorized.
