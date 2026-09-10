# UI-S17 provider campaign status manifest

## Delivery boundary

The provider half of the approved
[campaign deploy flow](../superpowers/specs/2026-09-08-campaign-deploy-flow-design.md)
can sign commands and prepare an asset, but nothing reads the result back. UI-S17
adds one `/provider` route that renders the durable offering and directory
records exactly as the backend projections return them, one server-only reader,
one browser-facing route exposing the same outcomes, and one navigation entry.

It computes no state and advances no offering, attempt, directory version, or
payment: it reads two read-only projections and renders them, or says truthfully
that it has nothing to render. The field list it may render is fixed by the
[M40 durable admission contract](../specs/m40-offering-directory-durable-admission.md),
whose `offerings:getPublicProjection` and `directoryVersions:getActive` snapshots
are its only sources. It extends the accepted [UI-S07](UI-S07.md) shell recorded
in the [local UI slice ledger](IMPORT-LEDGER.md) and the
[M11 shell contract](../specs/m11-application-shell.md). Its source material
remains outside the repository; this manifest records the local boundary only.

## Local targets

The slice may add `apps/web/src/app/provider/page.tsx`,
`apps/web/src/lib/offering-projection.ts`,
`apps/web/src/app/api/offerings/route.ts`, two files under
`apps/web/src/components/provider/status/` named `provider-status.tsx` and
`provider-status-state.ts`, `apps/web/tests/provider-status.test.mjs`, and
`apps/web/tests/offerings-api.test.mjs`. It adds one entry,
`{ href: "/provider", label: "Provider" }`, to
`apps/web/src/components/discovery/local-navigation.tsx`. That file and the
three accepted tests that freeze the exact navigation list,
`apps/web/tests/workspace-shell.test.mjs` and
`apps/web/tests/landing-explore.test.mjs`, plus the accepted S11
`apps/web/tests/guided-demo-route.test.mjs`, belong to accepted M11-T020 or
S11-T010 records, so all four amendments need an explicit root integration
reservation. The guided-demo amendment changes only its frozen navigation-list
expectation and preserves its nine narrated demo steps, links, and all other
assertions. This slice's entry is applied after S11-T010 and is added to the
list as S11 leaves it.
`apps/web/tests/shell-accessibility.test.mjs` asserts only the navigation label,
which an additional entry does not change, and is not amended. The slice reuses the
accepted tokens and the `button`, `card`, and `badge` primitives, changes no
stylesheet, adds no dependency, and does not depend on the carded UI-S13 tones.

## Responsive correction amendment

After the fifth local navigation entry landed, a 390px browser check measured
408px document and header widths. The overflow comes from the shared navigation
list, not the Provider route: its list remains a non-wrapping flex row even
though the outer shell already wraps. This amendment permits exactly one
test-first structural correction:

- `apps/web/tests/workspace-shell.test.mjs` may add one assertion that the
  existing local navigation list has exactly
  `flex flex-wrap items-center gap-1 text-sm font-medium`, while retaining the
  exact five-link order and labels; and
- `apps/web/src/components/discovery/local-navigation.tsx` may add only the
  bare `flex-wrap` token to the exact existing
  `flex items-center gap-1 text-sm font-medium` list class literal.

The correction must not change `layout.tsx`, global CSS, focus treatment,
landmarks, links, link order, labels, padding, typography, client behavior, or
any external boundary. It must not mask overflow with an overflow rule or add a
minimum-width escape. No other class token or attribute may be added, removed,
reordered, or made conditional. A fresh responsive RED review is required
before the class change; browser evidence must then show the unconfigured
`/provider` route with a 390px document width equal to its viewport width.

## Required read behavior

`offering-projection.ts` is the single server-only reader. It resolves the Convex
site origin from `TOOL402_CONVEX_SITE_URL` and performs two independent bounded
reads, `GET /public/offerings/{offeringPublicId}` and
`GET /public/directory/riskscan/active`, each with its own timeout and maximum
response size, `no-store`, and no cross-origin redirect. `offeringPublicId` is
validated against `[A-Za-z0-9_-]{1,96}` before it enters a URL; the subject read
here is the fixed `riskscan_offering_demo`. The two outcomes are independent
closed unions, so a failed directory read never changes the offering result:

```text
not_configured | absent | loaded | unavailable | unexpected_response
```

`not_configured`, the outcome with `TOOL402_CONVEX_SITE_URL` absent, is the
outcome this route has today: no reachable deployment exists until the
`HA-CAMPAIGN-CONVEX-001` row requested by the
[HI-002 intake card](../work-queue/queue/60-done/HI-002-campaign-deploy-reinstatement.md)
is complete. `absent` is a projection with no record; an unparsable shape is
`unexpected_response`, never a partly rendered record.

`/api/offerings` reads `offeringPublicId` from the query string, applies the same
validation, and returns both outcomes as `{ offering, directory }` with
`no-store`, no reason detail, no upstream error text or status, and no body,
header, or URL logged. No component in this batch consumes it: `page.tsx` calls
the reader directly, because a server component cannot fetch a relative URL, no
accepted configuration supplies an absolute same-origin origin, and deriving one
from the request host would make the route dynamic on the request rather than on
the read. It is declared now for a later card whose browser read consumes it.

## Required route behavior

`/provider` is server-rendered with one `main` landmark and one `h1`, and holds no
client component, client state, or timer. The heading and its two local links
render synchronously; the projection-dependent regions sit inside one Suspense
boundary, because Cache Components requires an uncached read to render under a
boundary. Those regions are, in this fixed order: state ribbon, next action,
deployment evidence table, active terms card, active directory card, signer card.
With either outcome not `loaded`, that outcome's regions render their explicit
outcome statement in place of values. The ribbon renders the offering `state`
verbatim, the terms version, and the directory version and its `status` when
the directory outcome is `loaded`. Next action is derived from `state` alone:

| `state`         | Next action                                      | Control                |
| --------------- | ------------------------------------------------ | ---------------------- |
| `DRAFT`         | Prepare the revenue note asset                   | Open the deploy wizard |
| `ASSET_PENDING` | Create the note in MetaMask                      | Open the deploy wizard |
| `READY`         | Publish the directory version                    | Open the deploy wizard |
| `OPEN`          | Whitelist the first backer and issue their units | Open the deploy wizard |
| `CLOSED`        | None. The offering is closed.                    | None                   |

The evidence table has exactly four record rows with the columns record,
reference, verification, and time. Every cell is drawn from a projection field;
a cell with no field renders `not recorded`:

| Row                                  | Reference                                    | Verification                                                                                                          | Time                                 |
| ------------------------------------ | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `offering.create`                    | `offeringPublicId`, version                  | signed command admitted                                                                                               | `acceptedAt`                         |
| `external.prepare` kind `ATS_CREATE` | none; the projection excludes the attempt id | prepared attempt recorded, from `state` at `ASSET_PENDING` or later                                                   | `not recorded`                       |
| revenue note                         | `atsAssetEvmAddress` when set                | address recorded, when set and `state` is `READY` or later; this route performs no Mirror read and asserts no receipt | `not recorded`                       |
| `directory.publish`                  | `riskscan`, `directoryVersion`               | a published directory version exists at this `directoryVersion`, or `not recorded`                                    | the directory record's `publishedAt` |

The terms card renders only `definition`: funding target, unit price and maximum
units, minimum units, the three basis-point shares, payout cap, maturity, and
qualifying resource, plus the offering's two advertised prices. It states that a
material change requires a new offering version with its own signature and
directory version. The directory card renders the record's service slug, version,
`status`, `x402Endpoint`, and `clearingAccount`; the signer card renders
`canonicalSignerAddress` in its stored lower-case form and chain 296. The
directory record's `advertisedTiers` is not rendered, so one figure never has two
sources.

Local links are `/provider/deploy` and `/explore/riskscan`. The one permitted
external origin is `https://hashscan.io/testnet`, rendered as
`https://hashscan.io/testnet/contract/<atsAssetEvmAddress>` only when that
address is present and `state` is `READY`, `OPEN`, or `CLOSED`; otherwise the
cell is plain text. It carries `rel="noreferrer"` and a leaving-the-site label.

## Truthfulness and authority boundary

The page's claim is that every figure it shows traces to a signed command or to a
record the backend verified, and that claim is admissible only because the figures
with no such source are not rendered. The canvas tiles for funding raised, units
issued, verified paid tasks, and signer balance are therefore not adopted: no
accepted projection this card reads carries any of them, and a later card owning a
read that does may add it. The canvas's `Live testnet`, `Design sample`,
`Connected`, and `New offering version` elements are not adopted either: this
route knows nothing about liveness or a wallet connection, and the admission
boundary stores version 1 only.

`canonicalSignerAddress` is labelled as the signer of the admitted command, not as
the issuer, and does not assert that the signer holds an authority today; the
durable authority record, which this route does not read, governs that. A rendered
state is an admitted record, never an on-chain fact, payment, settlement, receipt,
allocation, or deployment. `ASSET_PENDING` is never softened into `READY`, and a
read failure is never rendered as an empty or zero-valued record.

The slice writes nothing, signs nothing, sends no transaction, holds no key or
secret, creates no session, account, cookie, or storage, adds no analytics or
dependency, and reads no environment value outside the reader and its handler.

## Acceptance evidence

- Focused contracts cover the two closed outcome unions and their independence,
  `not_configured` with the environment name absent, the public-id validation,
  the bounded reads, and the refusal to render a partly parsed record.
- A focused route contract covers the `{ offering, directory }` body, `no-store`,
  the rejected invalid `offeringPublicId`, and the absence of reason detail,
  upstream status, and body or URL logging.
- Focused contracts cover the fixed region order, the next-action mapping
  including the `CLOSED` row with no control, the four evidence rows and their
  `not recorded` cells, the gated Hashscan link, the absence of every non-adopted
  canvas figure, and the amended list in all three accepted navigation tests.
- Browser checks run with the environment name absent and observe only the
  not-configured route: visible keyboard focus, no horizontal overflow at narrow
  widths, and no loaded-record claim. Web typecheck/test, production build with
  Cache Components, root quality, queue/reference checks, the local guard, and
  independent review pass before acceptance.
- The responsive amendment's focused structural assertion preserves the exact
  five-link list and forbids an overflow mask; fresh browser evidence at 390px
  proves the shared shell does not scroll horizontally.
