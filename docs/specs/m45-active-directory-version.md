# M45 active Directory version in the Tool Directory

## Delivery boundary

This contract adds one local reader that, when a Convex site URL is
configured, performs one bounded `GET` for the active RiskScan Directory
version admitted by M40 and published by M41, parses it through the accepted
M28 candidate parser, and serves it from the existing `/api/tools` route under
an explicit opt-in view.

The accepted M05 discovery response is unchanged. `GET /api/tools` with no
query string returns exactly the accepted one-tool body from
`buildToolDirectory(environment)`, byte for byte, whether or not a site URL is
configured and whether or not an active version exists. The accepted Agent
Directory reader requires exact top-level and descriptor key sets, so no key
is added to that body and no served value inside it changes.

That is a boundary conflict this contract cannot resolve inside its owned
paths, and the root owns the choice. Carrying the active record in the default
body would require amending `apps/agent/src/riskscan-tool-directory.ts` and
its accepted tests, which this card does not own; the accepted M09 island and
the B03 payment client read only that default body, so under this contract
they keep seeing the static descriptor and no caller yet requests the opt-in
view. The alternative is a root reservation over the Agent reader and its
tests, which this contract does not assume.

A served record is advertised metadata from a signed, admitted publication. It
is not proof of reachability, availability, issuance, allocation, settlement,
or funding, and its accounts are not a payment instruction: the `402`
challenge on `/api/riskscan` remains the only payment authority, as the
accepted [M05 contract](m05-riskscan-tool-directory.md) and
[M28 schema](m28-agent-directory-record-candidate-schema.md) already require.
`@tool402/core` is already a web dependency, so no manifest, lockfile, or
dependency test changes.

## Internal API

`apps/web/src/lib/active-directory-version.ts` exports exactly:

```ts
export type ActiveDirectoryView =
  | { readonly state: "no_active_version" }
  | {
      readonly state: "active_version";
      readonly directoryVersion: number;
      readonly record: AgentDirectoryRecordCandidate;
    };

export type ActiveDirectoryFetcher = (
  input: URL,
  init: RequestInit,
) => Promise<Response>;

export function activeDirectoryViewRequested(request: Request): boolean;
export function activeDirectorySource(env: NodeJS.ProcessEnv): URL | null;
export function parseActiveDirectoryProjection(
  input: unknown,
): ActiveDirectoryView;
export function readActiveDirectoryVersion(
  environment: NodeJS.ProcessEnv,
  fetcher: ActiveDirectoryFetcher,
): Promise<ActiveDirectoryView>;
```

The candidate type and its parser are the accepted M28 exports of
`@tool402/core`. The module reads no other environment value, builds no
payment material, and never throws.

## View selection and source admission

`activeDirectoryViewRequested` parses the request URL and returns `true` only
when the search string is exactly one `view` parameter whose value is exactly
`active-directory-version`. Any other search string, repeated parameter,
unknown parameter, or value returns `false`, and no read follows.

`activeDirectorySource` returns a target only when `TOOL402_CONVEX_SITE_URL`
is an own environment key whose value is a primitive string that, after
trimming, parses as a URL with `protocol` exactly `https:`, a nonblank
hostname, blank username and password, `pathname` exactly `/`, and blank
search and hash. Anything else returns `null` and no request is made. The
target is `new URL("/public/directory/riskscan/active", base)`; no path,
query, or header comes from a caller.

## Bounded read

`readActiveDirectoryVersion` performs at most one request through the injected
fetcher:

```ts
{
  method: "GET", headers: { accept: "application/json" },
  credentials: "omit", redirect: "error", cache: "no-store",
  signal: deadline,
}
```

`deadline` is one `AbortSignal.timeout(2000)` captured before the request. It
fails closed to `{ state: "no_active_version" }` when the fetcher rejects, the
timeout fires, the status is not exactly `200`, the `content-type` does not
match `/^application\/json(?:;|$)/iu` (the accepted case-insensitive prefix
rule of `apps/agent/src/riskscan-tool-directory.ts`, which admits a `charset`
parameter), the body exceeds 16,384 bytes, the body is not JSON, or the parsed
value is not an admitted projection. The read loop races that same signal: the
body is read from the response stream with a running byte count, and the reader
is aborted and the stream cancelled when the cap is exceeded or the signal
fires, so an unbounded or stalled stream from an injected fetcher is never
buffered and fails closed. There is no retry, second request, timer, storage, or
logging of a response body or request target.

## Closed projection shape

`parseActiveDirectoryProjection` accepts only an ordinary object whose
prototype is exactly `Object.prototype` with exactly these three own,
enumerable data fields, each captured from its own property descriptor under
`try`/`catch` so an accessor is rejected uninvoked:

| Field              | Required rule                                                            |
| ------------------ | ------------------------------------------------------------------------ |
| `outcome`          | Exact primitive string `"FOUND"`.                                        |
| `record`           | Delegated to `parseAgentDirectoryRecordCandidate`; a throw fails closed. |
| `directoryVersion` | Primitive safe integer from `1` through `Number.MAX_SAFE_INTEGER`.       |

Every other input, including any other `outcome` value, a missing, unknown, or
inherited field, or a symbol key, returns `{ state: "no_active_version" }`. The
returned view is a frozen object holding the frozen M28 candidate; mutating the
parsed input cannot change it.

The admitted body is the one the in-batch
[M41 contract](m41-http-command-ingress.md) pins for
`GET /public/directory/<serviceSlug>/active`:
`{ outcome: "FOUND", record, directoryVersion }` at `200`,
`{ outcome: "NOT_FOUND" }` at `404`, and `{ outcome: "UNAVAILABLE" }` at `503`.
Neither `serviceSlug` nor `state` is serialized: the slug is fixed by the
request path and being active is what that route selects. M41 pins
`directoryVersion` as always present on this route, hoisted beside `record` and
never merged into it, and this reader requires it. Any drift fails closed: the
view reports no active version indefinitely rather than erroring.

## Served view

`toolDirectoryResponse(environment, activeDirectory = null)` keeps its
accepted JSON and `cache-control: no-store` headers, and its accepted body
when `activeDirectory` is `null`. `buildToolDirectory` is unchanged: pure,
synchronous, one parser pass, and the only source of the default body. With a
view, the body is exactly:

```ts
{ view: "active-directory-version", directory: activeDirectory }
```

The response carries no `version` or `tools` key, so the accepted Agent reader
cannot mistake it for the discovery response. `directory` is either
`{ state: "no_active_version" }` or the parsed view, whose `record` holds
exactly the M28 fields, including `x402Endpoint`, `advertisedTiers`,
`issuerRevenueAccount`, and `clearingAccount`. No environment-derived
recipient, facilitator URL, credential, key, account, fee payer, payment
material, transaction, or receipt is added. The amended route is:

```ts
export async function GET(request: Request) {
  await connection();
  const read = () =>
    readActiveDirectoryVersion(process.env, (i, init) => fetch(i, init));
  const directory = activeDirectoryViewRequested(request) ? await read() : null;
  return toolDirectoryResponse(process.env, directory);
}
```

`connection()` is still awaited before any `process.env` or request read, and
the route still exports no legacy `dynamic`, `revalidate`, or `fetchCache`
configuration.

The accepted source-contract assertions in `tool-directory-api.test.mjs` move
to the amended sources: the route has three `import` occurrences, one `export`,
and two `process.env` occurrences, and its accepted whole-body assertion is
replaced by exactly

```ts
/export\s+async\s+function\s+GET\(request:\s*Request\)\s*\{\s*await\s+connection\(\);\s*const\s+read\s*=\s*\(\)\s*=>\s*readActiveDirectoryVersion\(process\.env,\s*\(i,\s*init\)\s*=>\s*fetch\(i,\s*init\)\);\s*const\s+directory\s*=\s*activeDirectoryViewRequested\(request\)\s*\?\s*await\s+read\(\)\s*:\s*null;\s*return\s+toolDirectoryResponse\(process\.env,\s*directory\);\s*\}/u
```

That assertion is order-sensitive and no linter fixes import order here, so
this contract fixes it: the builder's import `deepEqual` becomes exactly
`import type { ActiveDirectoryView } from "./active-directory-version.ts";`
then the accepted `./riskscan-x402.ts` import, gaining exactly that one
type-only entry in that source order. The accepted assertions that `buildToolDirectory` performs no
network, clock, random, or module access and that the route exports no legacy
configuration are kept unchanged.

## Explicit exclusions

Do not modify the Agent Directory reader or its tests, the RiskScan route,
x402 helpers, the payment client, Core, backend, Convex functions or schema,
the UI shell, navigation, components, manifests, the lockfile, or generated
output. Do not add a second route, a cache, a retry, a timer, a poll, a
fallback source, or a caller-supplied URL. Do not sign, verify, resolve an
authority, publish, activate, supersede, claim replay or idempotency, call a
provider or ATS SDK, touch a wallet, account, or key, submit a transaction,
deploy, or assert a live fact. M40 and M41 own admission and publication.

## Acceptance evidence

- A durable test-only RED commit precedes every source and route change.
- Focused tests prove the default `GET /api/tools` body is deep-equal to
  `buildToolDirectory(environment)` for an unconfigured environment, a
  configured site URL, and a fetcher that throws if called, and prove view
  selection, source admission, the fixed target and init, and exactly one
  request per view read.
- Focused tests prove `no_active_version` for a rejection, a timeout, a
  stalling injected stream, a non-`200` status, a content type outside the
  accepted prefix rule, an over-cap body, malformed JSON, and every projection
  whose `outcome` is not `"FOUND"` or whose fields are invalid, with no second
  request, and prove an `application/json; charset=utf-8` body is admitted.
- Focused tests prove the closed projection rules, uninvoked accessor
  rejection, the frozen detached view, a valid projection served with the
  exact M28 record fields, and that no serialized response contains a
  controlled credential, key, facilitator URL, fee payer, payment material,
  transaction, or receipt placed in the environment.
