# S43 recording journey verification

## Initial delivery before the main rebase

The following scope, checks and browser observations describe the initial
delivery. The final integration section below records the rebased source and
the owner-directed menu amendment separately.

### Immutable scope

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

## Final main integration and menu verification

- Main and merge base: `5f21fc90e1a927317665a1c1bf245eb0f9457cd5`.
- Final source: `de30e1898df6dc4f942d1caa5c93a8f0a44ccef1`.
- The owner authorized the draft PR, shared-menu cleanup, and resolving main
  conflicts. Only intended S43 commits remain above the refreshed main.

The rebase preserves both M55 and S43 ownership, main's environment-selected
cookie names and local challenge envelope, and the shared Provider campaign
ID. Docs and Campaign are removed from the single desktop/mobile menu list;
footer links, conditional signed Dashboard and Prepare a tool remain intact.

Main integration exposed an existing Deploy test fixture assigning the attempt
ID to the newly inserted directory-record state. Correcting the fixture to
the fourth state slot preserves all outcome assertions and production code.
The Provider assertion now follows the shared constant. The configuration-free
build reproduced prerender failures in three session readers that could skip
their dynamic cookie read before reading the time. Each existing cookie store
is now awaited before the conditional lookup; selected names, null sessions,
signer matching, redirects, projections and campaign actions remain unchanged.
The specification amendments preceded these repairs.

At the final source, using pinned Node 22.21.1:

- Complete Web suite: 450 passed, zero failures, one historical skip.
- Production Turbopack build without auth configuration passed, including its
  TypeScript check. Standalone Web typecheck and root lint also passed during
  rebase verification.
- Queue/reference and whitespace checks passed; the local Git guard remained
  enabled. The final documentation-only acceptance is checked separately.

Before rebasing, additional browser checks verified both menus at desktop and
390px widths, the mobile menu's Escape behavior, and preserved footer links.
These extend the initial six-step journey evidence above; they are not a new
authenticated or configured campaign run at the final source. No real wallet
signature, payment, transaction or production deployment was performed.

Two fresh independent module generations reviewed the entire final source
diff against the main SHA above after all integration repairs:

1. Generation one: zero actionable correctness, security or specification
   findings; all three session-reader repairs and preserved main behavior
   explicitly checked.
2. Generation two: zero actionable Standards or Specification findings;
   independently inspected the test/build logs and verified whitespace.

The root accepts the final source and releases all amended S43 reservations.
Source review, local browser observations, hosted checks and live actions
remain separate evidence boundaries.

## Footer mascot positioning follow-up

- Specification amendment: `46535182d40ed229137bf24c4ec8e5288507043d`.
- Final source: `f248368f73035e1ffc2b96b76bbd253591caaf32`.

The owner asked to group the existing decorative mascot with the Tool402 logo
and first-column introduction. The footer now uses a shared flex row for logo
and mascot instead of detached absolute placement. The local asset, empty alt
text, `aria-hidden`, `sm` visibility breakpoint, footer copy, links and routes
are unchanged. The mascot remains decorative and does not overlap the text.

Desktop browser verification measured the logo at x=32 and mascot at x=121;
the previous detached position was x=271. The browser shows the mascot beside
the logo within the first column. Existing landing checks pass 11/11, and the
Next.js development server reports no compilation, configuration or runtime
errors. Whitespace validation passes.

The first independent review identified the no-longer-needed resting shadow;
the source removes it. A fresh final independent review at the final SHA found
no actionable correctness, accessibility, responsive, style or specification
issue, including compliance with the Flat Ledger Rule. The root accepts this
layout-only follow-up and releases its single footer reservation. No wallet,
campaign, transaction, deployment, recording or merge action was performed.
