# S43 recording journey verification

## Immutable scope

- Module base: `5e863970935b074060b88d62a519102f2edfb9af`.
- Specification: `ea1ee2f8`; activation: `574e6fc6`.
- RED: `92f75d6c`; independent RED acceptance: `5ff4a876`.
- Module source head: `0a2554aa233c5a403375c65ba111ad3b39d23a66`.
- Contract: [S43 specification](../../specs/s43-recording-demo-journey.md).

## Verification on 2026-09-12

All commands used repository-pinned Node 22.21.1 and the locked dependencies.

- Focused baseline: 36 passed, zero failures, one historical absent-source skip.
- Durable RED: 32 passed, seven expected failures, one historical skip. The
  failures covered old routes/copy, missing navigation helper, both sign-in
  destinations, final tour step and old Provider ID. No source changed first.
- Focused GREEN including existing ToolLoop prefill: 41 passed, zero failures,
  one historical skip.
- Complete Web suite: 436 passed, zero failures, one historical skip.
- Web typecheck, root lint, queue check and whitespace check passed.
- Next.js 16.3.4 Turbopack production build passed with Cache Components.
- Next development diagnostics: compilation `issues: []`; runtime
  `configErrors: []`, `sessionErrors: []`.
- The Git local-reference guard remained enabled for every commit.

## Browser observations

The isolated local server used port 3043 and this checkout. No production
configuration was copied into it. The original public site still served the
old nine-step guide during inspection; these changes were not deployed there.

- The revised guide displays six main screens and collapses optional detail
  screens by default. Expanding them explains direct Quick, workbench, quote
  compatibility, disclosure preflight and Campaign records.
- The Start/Next route was exercised through landing, Explore, RiskScan,
  ToolLoop, Deploy and the signed-out sign-in entry. The bar reports the
  matching step, including step six on sign-in without claiming completion.
- The ToolLoop step link loads its existing editable sample. Editing the
  request reference and exiting the tour preserves that edit and the demo
  selector. No submit occurs from merely visiting or editing the sample.
- Deploy displays the existing RiskScan sample with acknowledgement pending.
  No acknowledgement, wallet prompt, signature or command was performed.
- Desktop width 1280 and narrow width 390 showed no horizontal overflow.
  The 390px expanded optional section also fits. One visible page h1 was
  observed; cached hidden route trees are not counted as visible landmarks.
- A manual unsigned ToolLoop sample on the original public host returned the
  payment-required message. This is challenge-only evidence for that host,
  not a paid result or evidence for the new source head.

Successful real-wallet sign-in and the authenticated dashboard were not
exercised in the browser. Fixed destinations for existing sessions and after
successful sign-in are covered by focused contracts; all existing auth tests
remain green. Provider's corrected query uses the existing canonical ID; a
configured live projection was not exercised by this local server.

## Independent reviews

The readiness and RED reviewer found no blocking issue at their respective
immutable heads. Two separate fresh reviewers then inspected the module diff
at `0a2554aa233c5a403375c65ba111ad3b39d23a66`:

1. Independent task/module generation one: no actionable Standards or
   Specification finding; independent focused run 40 passed, one skip.
2. Independent module generation two: zero Standards and Specification
   findings; independent focused run 40 passed, one skip.

The root accepts S43 as local source delivery only. Reviews, unit tests,
browser observations, deployment, real-wallet actions and recording remain
distinct evidence boundaries.
