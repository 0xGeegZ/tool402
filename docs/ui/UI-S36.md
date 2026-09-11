# UI-S36 Provider signature handoff manifest

## Purpose

UI-S36 makes the already implemented next signature action discoverable on the
Provider deployment page. It reuses the existing stage controller; it does not
create a second signing path.

## Local targets

The slice may amend only:

- `apps/web/src/components/provider/deploy/provider-deploy-stages.tsx`; and
- `apps/web/tests/provider-deploy-signature-handoff.test.mjs` (new).

## Contract

When the current stage is actionable and has an existing activation callback,
render one `data-ui="provider-signature-handoff"` region after the stage list
and before the declined-signature explanation. It names the current stage and
uses one button that invokes the existing activation callback with that stage
index. Its copy states that it opens the existing signature request and that
nothing is recorded unless the existing relay reports acceptance.

When no stage is actionable, no callback exists, or a request is already in
progress, render no handoff. The existing stage cards remain the source of
state, button labels, and disabled semantics.

## Explicit exclusions

Do not change stage state, stage ordering, command construction, typed-data
contents, wallet/provider discovery, dialog behavior, relay behavior,
configuration, durable records, authority lookup, payment, transaction, ATS
execution, deployment, or live action. Do not add a dependency, route,
storage, timer, fetch, or external link.

## Acceptance evidence

- A durable test-only RED precedes source changes and fails because the
  handoff region is absent.
- The focused test proves it invokes exactly the existing stage callback for
  an actionable current stage and is absent for non-actionable states.
- Focused Web tests, typecheck, lint, queue/reference/whitespace checks, and
  a browser render of `/provider/deploy` are clear before review.
