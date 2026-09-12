# S43-T010 — Recording demo journey

- Tier: POLISH
- Queue state: 60-done
- Dependencies: M01-T040 accepted, S11-T010 accepted, S19-T010 accepted, S30-T010 accepted
- Owner: root; current provided checkout, based on canonical main `5e863970935b074060b88d62a519102f2edfb9af`.
- Human actions: real wallet signatures, funded actions, deployment and video recording remain human-owned.

The owner's direct request authorizes this bounded update. The
[local specification](../../../specs/s43-recording-demo-journey.md) defines
the exact paths, six-screen route, closed tour navigation, and Provider ID fix.
S40 and S42 remain independently active; only S43's explicit presentation
handoff changes are reserved in their existing sign-in sources. Their auth
protocol, session gate, dashboard page and data readers remain unchanged.

Foundation P00/M01 and S11/S19/S30 are accepted in the catalog. The checkout
contains no unrelated uncommitted work; the previous local main commit is
preserved. No new worktree, wallet action, payment, configuration or deployment
is created. Readiness and RED precede implementation; independent task and
two fresh clean module reviews precede acceptance.

## Activation

Independent readiness at `ea1ee2f8` is clear. Root passes through 10-ready
and activates only the specified RED tests. Focused baseline: 36 passed,
one historical absent-source check skipped, no failures under Node 22.21.1.

## GREEN authorization

Independent RED review at `92f75d6c` is clear: 32 passed, seven intended
failures, one historical skip. Only the exact specified sources and tests
are now authorized for minimal GREEN; the auth protocol and all external
authority remain unchanged.

## Local acceptance

Source `0a2554aa233c5a403375c65ba111ad3b39d23a66` is accepted after focused
and complete Web checks, build, local browser verification, independent task
review and two fresh clean module generations. Evidence is recorded in
[S43 final review](../../evidence/S43-T010-final-review.md). Source reservations
are released. No real-wallet sign-in, transaction or public deployment is
claimed; S40/S42 acceptance remains independent.

## Navigation follow-up

The owner requests the draft PR and removal of Docs/Campaign from the main
menu. The specification amendment reserves only the shared navigation list
and its two existing test files. Reopen for this bounded RED/GREEN amendment;
prior source acceptance is historical. Footer links and auth behavior remain
unchanged. Draft publication is explicitly authorized, without merge authority.

The full Web run at `2153f86f` passed 435 tests, skipped one historical check,
and failed only public-documentation's obsolete Docs-in-header assertion.
The specification admits its replacement with the preserved footer link.

## Final acceptance after main integration

Accept final source `de30e1898df6dc4f942d1caa5c93a8f0a44ccef1` on main
`5f21fc90e1a927317665a1c1bf245eb0f9457cd5`. The owner-directed menu amendment,
resolved conflicts, signing-test fixture correction and three cookie-store
ordering repairs match the committed specification amendments. Complete Web
tests pass 450 with one historical skip; the configuration-free production
build, TypeScript, lint, queue/reference guard and whitespace checks pass.
Two fresh independent module generations find no actionable issue at this
exact source. Release all S43 reservations, including dashboard-campaign.tsx.
Historical browser observations and final-source checks are distinguished in
the final-review evidence. Draft PR publication is authorized; merge, wallet,
funded actions, production deployment and recording remain human-owned.

## Footer positioning follow-up

The owner requests moving the existing decorative footer mascot beside the
Tool402 logo and introduction in the first column. This reopens S43 only for
`apps/web/src/components/landing/landing-footer.tsx`, as specified in the
owner-directed amendment. Existing asset, decorative alt text, visibility
breakpoint, footer links, copy and routes remain unchanged. Existing landing
tests, desktop browser verification and independent review are required before
final acceptance. No merge or live-action authority is added.

## Footer positioning acceptance

Accept final source `f248368f73035e1ffc2b96b76bbd253591caaf32`. The mascot
now shares the logo row in the first footer column without overlapping the
introduction. The asset, empty alternative text, `aria-hidden`, `sm`
breakpoint, copy, footer links and routes are unchanged. Landing checks pass
11/11; desktop browser and Next.js checks are clear. The initial independent
review identified the obsolete shadow, the final source removes it, and a fresh
final independent review is clean. Release the footer reservation. Merge and
all live actions remain human-owned.
