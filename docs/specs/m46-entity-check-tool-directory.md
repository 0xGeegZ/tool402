# M46 EntityCheck canonical Tool Directory v2 contract

## Delivery boundary

This contract atomically migrates the one canonical machine-readable Tool
Directory at `GET /api/tools` to `v2` and adds EntityCheck France as its second
static descriptor. It reuses the accepted `cache-control: no-store` rule,
request-time environment read, and fail-closed configuration-summary
discipline. It registers nothing externally, reads no source, initiates no
payment, and proves no live availability.

There is no `/api/tools/v2` route, content negotiation, fallback endpoint, or
second public catalog. The current RiskScan decoder and every local consumer
fixture migrate in the same delivery. The decoder retains a strictly closed
legacy-v1 input branch only to read a valid one-tool response from an older
remote service; Tool402's own route emits v2 only. Any malformed v1 or v2
response fails closed and does not trigger a retry against another endpoint.

The M45 active-directory projection remains its distinct
`GET /api/tools?view=active-directory-version` response. It is not a v2 tool
entry and the v2 default body carries no active-directory metadata.

## Authority amendment

This contract supersedes only the M05/M45 default-body requirement that the
no-query response be the one-tool `v1` body. It preserves the same canonical
route, `connection()`-before-environment-read boundary, JSON/no-store headers,
and M45's exact opt-in active-directory query and response semantics. No
active-directory metadata is merged into the default v2 body.

## Descriptor

A new server-only module `apps/web/src/lib/entity-check-tool-descriptor.ts`
exports `buildEntityCheckToolDescriptor(environment: NodeJS.ProcessEnv)` and
builds one descriptor from that explicit environment:

```ts
{
  id: "entitycheck.fr",
  name: "EntityCheck France",
  request: { method: "POST", path: "/api/entitycheck", contentType: "application/json" },
  input: {
    type: "object",
    required: ["requestRef", "jurisdiction", "query"],
    properties: {
      requestRef: { type: "string", minLength: 1, maxLength: 96 },
      jurisdiction: { type: "string", enum: ["FR"] },
      query: { type: "string", minLength: 1, maxLength: 160 },
      registrationNumber: { type: "string", pattern: "^[0-9]{9}$" },
    },
    additionalProperties: false,
  },
  result: {
    dispositions: ["found", "ambiguous", "not_found"],
    sanctionsScreen: ["clear", "hit", "not_screened"],
  },
  sources: ["FR_RECHERCHE_ENTREPRISES", "OFAC_SDN"],
  limitations: [
    "EntityCheck reflects two public sources at the time they were read and does not verify ownership, solvency, or compliance; a clear screen is not a compliance opinion.",
  ],
  configuration: /* the LocalX402Summary shape below */,
}
```

The configuration summary is derived only from
`readX402Configuration(environment, "ENTITYCHECK_X402")`, exactly as the
RiskScan descriptor derives its payment summary from
`readRiskScanX402Configuration(environment)`. It is exactly
`{ state: "configuration_required" }` for an absent or malformed parser
result; otherwise it contains only the locally configured protocol, network,
and EVM price or native Hedera asset/amount. It never serialises a recipient,
facilitator URL, credential, key, payment material, account, wallet,
transaction, receipt, evidence, result, or any other private environment
value.

`LocalX402Summary` is exactly one of:

```ts
{ state: "configuration_required" }
{ state: "locally_configured", protocol: "x402", network: `eip155:${number}`, price: `$${string}` }
{ state: "locally_configured", protocol: "x402", network: "hedera:testnet", asset: `${number}.${number}.${number}`, amount: `${bigint}` }
```

`result` and `sources` are fixed capability labels only. They are neither a
source-read result nor a claim that a source, facilitator, payment path, or
runtime is available.

## Canonical directory amendment

`buildToolDirectory` returns exactly:

```ts
{
  version: "v2",
  tools: [
    /* exact RiskScan descriptor, preserved without mutation */,
    /* exact EntityCheck descriptor */,
  ],
}
```

The builder derives one fresh RiskScan descriptor under its existing local
parser rules, appends one fresh EntityCheck descriptor, and returns the fixed
ordered pair. It neither reshapes RiskScan nor adds `result`, `sources`, or
`configuration` to that descriptor. Its existing route continues to await
`connection()` before passing `process.env` to `toolDirectoryResponse`, returns
JSON with `cache-control: no-store`, and exports no legacy cache configuration.
The M45 active-directory reader/route branch remains unchanged.

The constrained M45 source assertion in
`apps/web/tests/tool-directory-api.test.mjs` is amended only to replace its
one-tool/default assertions and its exact two-import builder vector with this
exact three-import vector:

```ts
import type { ActiveDirectoryView } from "./active-directory-version.ts";
import { buildEntityCheckToolDescriptor } from "./entity-check-tool-descriptor.ts";
import { readRiskScanX402Configuration } from "./riskscan-x402.ts";
```

Its route assertion, `connection()` ordering, active-directory view assertions,
and no-I/O assertion remain unchanged. This makes the descriptor dependency
auditable without weakening M45's runtime boundary.

## Consumer migration

`discoverRiskScanQuick` accepts exactly two wire forms:

- legacy v1: `{ version: "v1", tools: [RiskScanDescriptor] }`;
- canonical v2: `{ version: "v2", tools: [RiskScanDescriptor, EntityCheckDescriptor] }`.

For v2, it strictly validates both descriptors before selecting or cloning only
the RiskScan descriptor. A missing, extra, duplicate, reordered, malformed, or
prototype-backed entry fails closed as `directory_invalid`; EntityCheck is not
selected, executed, or otherwise given capability by this card. The decoder
does not make a second request, infer an alternate route, or accept a partial
v2 directory. ToolLoop, quote, payment, and browser consumers continue to use
that unchanged RiskScan selection DTO and their fixtures use canonical v2.

## Acceptance evidence

- Tests prove the exact EntityCheck descriptor, its fail-closed configuration
  summary for missing or malformed `ENTITYCHECK_X402` values, and that no
  private value is serialised.
- Focused tests prove the exact canonical v2 tuple, unchanged RiskScan
  descriptor, exact EntityCheck descriptor, strict v2 parsing, the closed
  legacy-v1 decoder branch, and all local consumer fixtures on v2.
- Tests prove that the canonical builder/response makes no network, tool,
  payment, source-handler, active-directory, clock, or random call; M45's
  explicit view continues to work independently.
- Web typecheck, test, lint, production build, local-reference guard, and
  independent review pass.
