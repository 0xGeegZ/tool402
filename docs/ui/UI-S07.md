# UI-S07 application workspace shell manifest

## Delivery boundary

UI-S07 adds one static `/dashboard` route for a guest, unconfigured workspace
preview and one local-navigation link to it. It uses existing local tokens and
primitives to make current product routes discoverable without inventing a
signed-in state.

## Local targets

The slice may add `apps/web/src/app/dashboard/page.tsx`, components under
`apps/web/src/components/workspace/`, a focused workspace test, and the one
constrained amendment to `apps/web/src/components/discovery/local-navigation.tsx`.

## Truthfulness and authority boundary

The shell has no fake user, session, account, wallet, provider, balance,
position, notification, activity, payment, result, receipt, evidence,
transaction, configuration, external link, or live status. It is static and
server-rendered; it does not fetch, read environment values, store data, or
offer a sign-out/connect control. A real Sign flow remains a separately
specified future behavior.

## Acceptance evidence

- Focused source contracts cover route semantics, exact local links,
  guest/unconfigured language, primitive use, and exclusion boundaries.
- Desktop and narrow browser checks cover rendering, links, focus, overflow,
  and framework/browser diagnostics.
- Web/root quality, build, queue, guard, independent review, and two clean
  module-review generations pass before acceptance.
