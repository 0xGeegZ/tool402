# UI-S25 Page header and action buttons manifest

## Delivery boundary

UI-S25 gives every routed page the same header anatomy through one
presentational primitive, renders page-level actions as buttons instead of
underlined text, renames the `/provider` navigation entry and page to
`Campaign`, and replaces the bare outcome tokens on `/provider` with full
sentences. It is presentation only. No route path, data read, projection
field, state machine, wallet, relay, or command changes.

## Local targets

The slice may add or amend only:

- one new `apps/web/src/components/ui/page-header.tsx`;
- one new `apps/web/tests/page-header.test.mjs`;
- the header block of `apps/web/src/app/explore/page.tsx`,
  `apps/web/src/app/explore/riskscan/try/page.tsx`,
  `apps/web/src/app/explore/riskscan/tool-loop/page.tsx`,
  `apps/web/src/app/dashboard/page.tsx`,
  `apps/web/src/app/dashboard/riskscan/page.tsx`,
  `apps/web/src/app/dashboard/riskscan/preflight/page.tsx`,
  `apps/web/src/app/dashboard/riskscan/compatibility/page.tsx`,
  `apps/web/src/app/demo/page.tsx`, and `apps/web/src/app/provider/page.tsx`;
- the header block of
  `apps/web/src/components/riskscan/detail/riskscan-detail.tsx` and
  `apps/web/src/components/provider/deploy/provider-deploy-wizard.tsx`;
- the `/provider` label in
  `apps/web/src/components/discovery/local-navigation.tsx`;
- the outcome sentences in
  `apps/web/src/components/provider/status/provider-status.tsx`; and
- the header, navigation-label, and outcome-copy assertions of
  `apps/web/tests/workspace-shell.test.mjs`,
  `apps/web/tests/guided-demo-route.test.mjs`,
  `apps/web/tests/landing-explore.test.mjs`,
  `apps/web/tests/provider-status.test.mjs`,
  `apps/web/tests/riskscan-detail.test.mjs`,
  `apps/web/tests/riskscan-try.test.mjs`,
  `apps/web/tests/dashboard-workspace-reconciliation.test.mjs`,
  `apps/web/tests/guest-riskscan-workbench.test.mjs`,
  `apps/web/tests/riskscan-native-quote-compatibility.test.mjs`,
  `apps/web/tests/riskscan-quick-preflight.test.mjs`,
  `apps/web/tests/riskscan-tool-loop.test.mjs`, and
  `apps/web/tests/provider-visual-reconciliation.test.mjs`, each under a
  root integration reservation limited to the listed assertion.

Every amendment above is to an accepted card's owned path and needs its own
root integration reservation. The landing hero in
`apps/web/src/components/landing/landing-hero.tsx` is a hero, not a page
header, and is outside this accepted S22-T010 follow-up; this slice does not
touch it.
`apps/web/src/app/dashboard/page.tsx` was released by accepted S24-T010; this
slice may amend only its declared header block.

## Primitive contract

`PageHeader` is a server-safe function component with props `title`
(required string), `description` (optional string), `eyebrow` (optional
string, rendered as the accepted UI-S00 outline `Badge`), and `actions`
(optional readonly array of `{ href, label }` with at most three entries). It
renders exactly one `header` element containing, in order: the eyebrow badge
when given, one `h1` with class
`text-4xl font-extrabold tracking-[-0.045em] sm:text-5xl`, one paragraph with
class `text-lg leading-8 text-muted-foreground` when given, and one action
row when given. The action row has class `flex flex-wrap gap-3 pt-2` and is a
wrapping flex row of `next/link` elements
styled with `buttonVariants` from the accepted UI-S00 button primitive: the
first action `primary`, every later action `outline`, size `md`. Actions are
internal hrefs only. Its one `header` has class `max-w-3xl space-y-4`. The
primitive holds no state, effect, client directive, icon, or external link.

## Page contract

Each listed page and component replaces its hand-written header with one
`PageHeader` carrying its current `h1` text and description unchanged, except
`/provider`, whose `h1` becomes `Campaign status`, whose eyebrow becomes
`Tool operator`, and whose description becomes `Read the current local
campaign records without advancing either one.`
`/provider` passes the two accepted local links as actions in this order:
`Open the deploy wizard` to `/provider/deploy` and `Explore RiskScan` to
`/explore/riskscan`. No other page gains an action in this slice; existing
in-body links stay where they are. Pages that already show a kicker keep its
text as the eyebrow (`Marketplace`, `Guest dashboard`, `Guided demo`).

The navigation entry `{ href: "/provider", label: "For providers" }` becomes
`{ href: "/provider", label: "Campaign" }`. Order, hrefs, and the other four
labels are unchanged.

`/provider` renders these sentences in place of the current bare outcome
tokens, one per outcome and identical in every region:

| Outcome               | Sentence                                                 |
| --------------------- | -------------------------------------------------------- |
| `not_configured`      | No campaign backend is configured for this host.         |
| `absent`              | No admitted record exists yet.                           |
| `unavailable`         | The campaign backend did not answer.                     |
| `unexpected_response` | The campaign backend returned a record this page cannot read. |

The accepted UI-S17 outcome grammar, region order, evidence table, next-action
table, and exclusions are otherwise unchanged.

## Scope reconciliation amendment

This amendment supersedes only the earlier generic test-path and active-slice
wording. S22-T010, S24-T010, S31-T010, and S32-T010 are accepted and release
their source/test reservations. S25 owns no path while it is in `00-inbox`.
When independently activated, its RED and later GREEN scope is exactly the
local targets above. Provider deploy behaviour/state tests and all tests not
named above are verification-only.

| Target | Eyebrow | Title | Description/actions | Preserved sibling content |
| --- | --- | --- | --- | --- |
| `/explore` | Marketplace | Explore tools | Current sentence; no action | Explore catalog |
| `/explore/riskscan/try` | none | Try RiskScan | Current sentence; no action | Request flow |
| `/explore/riskscan/tool-loop` | none | Run RiskScan through ToolLoop | Current sentence; no action | Back link, safety pill, request aside, ToolLoop, footer |
| `/dashboard` | Guest dashboard | Dashboard | Current sentence; no action | Workspace shell and footer |
| `/dashboard/riskscan` | none | RiskScan workbench | Current sentence; no action | Workbench |
| `/dashboard/riskscan/preflight` | none | RiskScan Quick preflight | Current sentence; no action | Preflight |
| `/dashboard/riskscan/compatibility` | none | Native quote compatibility | Current sentence; no action | Compatibility island |
| `/demo` | Guided demo | Take the guided tour | Current sentence; no action | Demo steps |
| `/provider` | Tool operator | Campaign status | `Read the current local campaign records without advancing either one.`; deploy then Explore actions | Suspense, server reader, regions, footer |
| RiskScan detail | Read-only detail | RiskScan | Current sentence; `Try RiskScan` → `/explore/riskscan/try`, then `Explore RiskScan ToolLoop` → `/explore/riskscan/tool-loop` | Back link, shield, route copy, body |
| Provider deploy wizard | RiskScan | Prepare a local offering | Current sentence; no action | Back link, badges, warning, immutable form state |

The migrated component renders only this header anatomy. Existing complex
route elements named in the final column remain sibling content and are never
nested in a second `header`. No source change may proceed until a fresh
independent readiness review accepts this reconciled matrix.

## Focused-test scope correction

The complete Web run after the authorised detail-header GREEN found that
`riskscan-try.test.mjs` statically reads the RiskScan-detail Try href. Its
single assertion is therefore part of this migration, not verification-only:
it must assert the same fixed `Try RiskScan` action object as the detail
contract. No request-flow, form, response, or client-boundary assertion may
change. Independent scope review at `c98edcc` accepts this assertion-only
amendment; the expanded thirteen-test set is now fixed for matching GREEN.

## Explicit exclusions

Do not add a campaign list, issuer-scoped read, wallet read, second offering
id, route rename, redirect, external link, icon set, client component, state,
metric, figure, or any CTA implying an unavailable action. Do not restyle the
landing hero, navigation, cards, or body content. Do not adopt the design
canvas tiles UI-S17 declined.

## Acceptance evidence

- A durable test-only RED commit precedes source changes and fails because
  the primitive does not exist, every page still hand-writes its header, the
  navigation label is `For providers`, and `/provider` still renders bare
  tokens.
- `page-header.test.mjs` proves the primitive's fixed anatomy, the
  primary-then-outline action styling, the three-action cap, and that every
  listed page and component mounts `PageHeader` and contains no raw `h1`
  and no `underline` link class.
- The amended accepted tests pass with only their header, label, and copy
  assertions changed.
- Web typecheck, test, lint, build, root typecheck, test, lint,
  `queue:check`, and the local-reference guard pass.
- Desktop and 390px browser checks on `/provider` and `/explore` show one
  `h1`, the eyebrow, the action buttons wrapping without overflow, visible
  keyboard focus on each action, and no horizontal scroll.
