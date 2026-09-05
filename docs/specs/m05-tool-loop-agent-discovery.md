# M05 ToolLoopAgent RiskScan discovery contract

## Delivery boundary

This contract adds the first local Consumer Agent boundary as a new
`apps/agent` workspace. The headless ToolLoopAgent discovers and strictly
validates the one committed RiskScan Tool Directory response, then returns a
safe cloned selection. It is an agent-facing discovery client, not a payment
client or RiskScan execution client.

The agent may make exactly one caller-directed, credential-free `GET` request
to `/api/tools` when its discovery function is invoked. It must not submit a
RiskScan request, create or replay a payment header, sign, access a wallet,
account, key, environment, x402 client, facilitator, backend, durable store,
clock, timer, retry loop, or external directory registration. It does not
assert that the selected service is available, paid, settled, verified,
finalized, deployed, or live.

## Public agent boundary

The agent exports this interface from
`apps/agent/src/riskscan-tool-directory.ts`:

```ts
export type RiskScanDirectoryFetcher = (
  input: URL,
  init: RequestInit,
) => Promise<Response>;

export type RiskScanConsumerDiscovery =
  | { kind: "directory_unavailable" }
  | { kind: "directory_invalid" }
  | {
      kind: "tool_selected";
      tool: {
        id: "riskscan.quick";
        name: "RiskScan Quick";
        request: {
          method: "POST";
          path: "/api/riskscan";
          contentType: "application/json";
        };
        input: {
          type: "object";
          required: ["requestRef", "subjectRef", "context", "declarations"];
          properties: {
            requestRef: { type: "string"; minLength: 1; maxLength: 96 };
            subjectRef: { type: "string"; minLength: 1; maxLength: 160 };
            context: { type: "string"; minLength: 1; maxLength: 280 };
            declarations: {
              type: "object";
              additionalProperties: false;
              required: ["identity", "pricing", "limitations", "evidence"];
              properties: {
                identity: { type: "boolean" };
                pricing: { type: "boolean" };
                limitations: { type: "boolean" };
                evidence: { type: "boolean" };
              };
            };
          };
        };
        limitations: [
          "quick_assessment_only",
          "caller_declarations_are_not_external_verification",
        ];
        payment:
          | { state: "configuration_required" }
          | {
              state: "locally_configured";
              protocol: "x402";
              network: string;
              price: string;
            };
      };
    };

export async function discoverRiskScanQuick(
  serviceBase: URL,
  fetcher?: RiskScanDirectoryFetcher,
): Promise<RiskScanConsumerDiscovery>;
```

`serviceBase` must be an `http:` or `https:` URL without userinfo. A rejected
base or a directory response that cannot meet this contract returns
`directory_invalid` before it is selected. A rejected fetch or a response with
a status other than `200` returns `directory_unavailable`. Neither outcome
contains a URL, response body, header, error, credential, or provider detail.

For an allowed base, the function calls the injected fetcher once with
`new URL("/api/tools", serviceBase)` and exactly this non-payment request
shape:

```ts
{
  method: "GET",
  headers: { accept: "application/json" },
  credentials: "omit",
  redirect: "error",
}
```

It sends no body, authorization material, payment header, request input, or
additional request. The default fetcher is the runtime `fetch`; tests inject a
controlled fetcher and must not call a network.

## Strict directory validation

Only a `200` response with JSON content is decoded. Its JSON value must match
the exact committed Tool Directory shape: `version: "v1"`, one tool only,
the exact `riskscan.quick` identifier/name/request metadata, the complete
bounded input/declarations descriptor, both limitations in order, and exactly
one of the two approved payment summary shapes above. Objects or arrays with
extra, missing, inherited, accessor-backed, non-enumerable, or malformed
fields are invalid.

The agent creates a new selection object from validated primitive values and
fixed metadata. It never returns a provider-owned object reference and never
copies recipient, facilitator, credential, payment-header/payload, wallet,
account, transaction, receipt, evidence, result, or any unknown directory
field. `locally_configured` describes the advertised local parser state only;
it is not a claim of a usable payment route or external availability.

## Explicit exclusions

This card creates no command-line interface, daemon, request builder, Quick
input validator, `POST /api/riskscan` call, payment challenge parser, payment
or signing path, x402 client, retry behavior, persistence, backend mutation,
UI, package integration outside the new agent workspace and root lockfile,
runtime configuration, external registration, deployment, or live proof. A
later local card may add a separate bounded request/challenge phase only after
this discovery boundary is accepted.

## Acceptance evidence

- RED/GREEN agent tests prove exact discovery request construction, strict
  directory/payment validation, safe cloning, invalid/unavailable mapping, no
  extra calls, and no secret/header/body leakage.
- An agent boundary test rejects `POST`, request-body/payment/wallet/x402/
  backend/environment imports or access, clock/timer/retry behavior, and
  hidden network side effects beyond the injected one-shot fetcher.
- Agent/root Node 22.21.1 typecheck, test, lint, production web build,
  queue/reference checks, independent task review, and two fresh module-review
  generations pass.
- A controlled local Next request through the accepted directory confirms that
  discovery maps its fail-closed configuration state without initiating any
  RiskScan request or payment action.

No human action is needed for the local code and controlled tests. A future
live endpoint, payment, signing, account, wallet, deployment, transaction,
finality, receipt/evidence, or submission step remains human-authorized.
