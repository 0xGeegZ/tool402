# M45-T010 — Active Directory version in the Tool Directory

## State

- Tier: CORE_P0
- Queue state: 60-done
- Dependencies: M05-T010 accepted, M28-T010 accepted, M09-T010 accepted,
  M40-T010 accepted, M41-T010 accepted
- Owner: The root owns queue state, catalog, ownership, decisions, reviews,
  commits, and pushes. Proposed implementation paths are exactly:
  `apps/web/src/lib/active-directory-version.ts`,
  `apps/web/tests/active-directory-version.test.mjs`,
  `apps/web/src/lib/tool-directory.ts` (amendment under a root integration
  reservation), `apps/web/src/app/api/tools/route.ts` (amendment under a root
  integration reservation), and `apps/web/tests/tool-directory-api.test.mjs`
  (amendment under a root integration reservation). No package manifest,
  lockfile, or dependency-test change is proposed.
- Human actions: none for local delivery; the configured read depends on
  HA-CAMPAIGN-CONVEX-001, which this card neither requires nor marks complete.
  With no configured site URL, every response is the accepted static
  directory. This card authorizes no publication, activation, provider,
  wallet, account, payment, transaction, deployment, or live claim.

## Scope

The accepted Tool Directory route serves one static RiskScan Quick descriptor
built from local environment configuration. After M40 admits a signed
`directory.publish` command and M41 publishes the sanitized active projection,
the repository still has no local reader for it: the published record's
endpoint, advertised tiers, and accounts are reachable only from Convex.

Add one local reader that, when `TOOL402_CONVEX_SITE_URL` is configured,
performs one bounded `GET /public/directory/riskscan/active`, parses the
response through the accepted M28 candidate parser, and serves it from
`/api/tools` under an explicit opt-in view. With no configuration, a failed or
timed-out read, or an invalid projection, the view says there is no active
version and the accepted static directory is served unchanged.

The local authority is the
[M45 specification](../../../specs/m45-active-directory-version.md). The
approved shape it implements is the
[campaign deploy flow design](../../../superpowers/specs/2026-09-08-campaign-deploy-flow-design.md),
requested through the
[HI-002 intake card](../60-done/HI-002-campaign-deploy-reinstatement.md).

This card admits, verifies, signs, publishes, and activates nothing. Serving a
published record is not activation, availability, or payment truth; the `402`
challenge on `/api/riskscan` remains the only payment authority.

One boundary decision is the root's, not this card's, and the proposed shape
is a deliberate deviation from the assigned content, which asks the Tool
Directory route to serve the active record's endpoint, tiers, and accounts
whenever a site URL is configured. The verified reason is that the accepted
Agent Directory reader at `apps/agent/src/riskscan-tool-directory.ts` admits
only the exact top-level keys `version` and `tools`, the exact six descriptor
keys, and a closed payment union, so the active record cannot appear in the
default discovery body without amending that reader and its accepted tests,
which this card does not own. The proposed shape is therefore the non-breaking
one: the default body stays static and the record is served only under the
opt-in view, which no accepted consumer and no card in this batch requests
today. Stated plainly, under this option no caller observes the active
version, so the assigned intent is met only under the alternative: a root
reservation over the Agent reader and its accepted tests so the default body
can carry the active record. This card does not assume it, and the choice
stays root-pending, as the ready requirements below record.

## Candidate ready requirements

- The specification, card, catalog, ownership, and state records are committed
  before any RED test or source change.
- M05-T010, M28-T010, and M09-T010 remain accepted, and M40-T010 and M41-T010
  are accepted before this card is activated. This reader admits the
  `{ outcome: "FOUND", record, directoryVersion }` body that the in-batch
  [M41 contract](../../../specs/m41-http-command-ingress.md) pins for
  `GET /public/directory/<serviceSlug>/active`, where `directoryVersion` is
  always present. Any drift fails closed silently: the view would report no
  active version indefinitely rather than error.
- The route, the directory response builder, and the accepted Tool Directory
  test belong to accepted M05-T010, so each amendment needs an explicit root
  integration reservation recorded in the ownership file before the change.
  The two new paths are disjoint from every other card in this batch.
- The default discovery response is fixed as byte-unchanged before code under
  the boundary decision above, and the root has recorded which of the two
  options it takes before this card is activated.
- The bounds are fixed in the specification before code: one request, one
  fixed target derived from the configured origin, a 2,000 ms timeout, a
  16,384-byte body cap, status exactly `200`, the accepted
  `application/json` content-type prefix rule, no retry, and no cache.

## Verification

- A durable test-only RED precedes every source, route, and response change.
  It fails only because `apps/web/src/lib/active-directory-version.ts` does not
  yet exist.
- Focused tests prove `GET /api/tools` with no query string is deep-equal to
  `buildToolDirectory(environment)` for an unconfigured environment, for a
  configured site URL, and for a fetcher that throws if it is called, so the
  accepted discovery path performs no read.
- Focused tests prove view selection admits only the exact single `view`
  parameter; that a missing, blank, non-`https`, credentialed, pathed,
  queried, or fragmented site URL yields no request; and that the constructed
  target is the fixed active-directory path.
- Focused tests prove the bounded read makes exactly one request with the
  fixed init and falls closed to no active version on rejection, timeout, a
  stalling response stream, non-`200` status, a content type outside the
  accepted `application/json` prefix rule, an over-cap body, malformed JSON,
  and every projection whose `outcome` is not `"FOUND"` or whose fields are
  invalid, with no second request.
- Focused tests prove the closed projection rules, accessor rejection without
  invocation, the frozen detached view, and that a valid projection is served
  with the exact M28 record fields under the opt-in body.
- Tests prove no serialized response contains a controlled credential, key,
  facilitator URL, fee payer, payment header or payload, transaction, or
  receipt value placed in the environment. The amended source-contract
  assertions are the specification's exact counts, its replacement route-body
  assertion, and its ordered builder import list, and the accepted assertions
  about `buildToolDirectory` purity and the absent legacy segment
  configuration are kept unchanged.
- `npm run typecheck --workspace @tool402/web`,
  `npm run test --workspace @tool402/web`,
  `npm run build --workspace @tool402/web`, root `npm run typecheck`,
  `npm run test`, `npm run lint`, `npm run queue:check`, and the enabled
  local-reference guard pass under Node 22.21.1.
- Independent task review and fresh Standards and Specification module-review
  generations report no Critical, Important, or Minor finding.

## Boundary

This card adds one local read of a projection another card publishes. It
creates no Convex function, schema, table, mutation, authority row, or
environment value; it signs nothing, verifies no signature or receipt, and
resolves no authority. It calls no provider or ATS SDK, touches no wallet,
account, or key, submits no transaction, and creates no payment, settlement,
allocation, evidence, or deployment. Its exclusions and truthfulness rules are
the specification's, which governs; this card does not restate them.

## Ready record

Ready at 2026-09-09T22:33:30Z after an independent current-head review found
all five accepted predecessors, the recorded opt-in decision, exact root
reservations for the three accepted M05 paths, absent/disjoint new paths, and
no human action blocking controlled local delivery. A future activation may
authorize only the durable test-only RED scope in the ready-review evidence.

## Activation record

Activated at 2026-09-09T22:33:30Z after an independent current-head review
found a clean pushed head, no conflicting lane, accepted dependencies, and the
exact RED targets absent. This activation authorizes only
`apps/web/tests/active-directory-version.test.mjs` and the constrained
`apps/web/tests/tool-directory-api.test.mjs` amendment; all source and external
boundaries remain prohibited pending a fresh RED review.

## Acceptance record

Accepted at 2026-09-10T04:46:54Z at source commit
`f2275ab15fcde4eb0893c187167ded7e4779c90c` after independent task review
and two fresh clean module reviews. The focused M45/Tool Directory contract
passed 18/18, including a never-settling pre-response fetch and valid JSON at
the exact 16,384-byte cap. Web/root typecheck and lint, queue/reference and
whitespace checks passed under Node 22.21.1. The full Web suite has only the
two separately blocked M44 source-absence RED failures; no M45 test failed.
The equivalent Webpack production build passed before the final test-only
amendment, whose source and route blobs are unchanged. This acceptance adds no
publication, activation, payment, provider, wallet, SDK, transaction,
deployment, or live authority.
