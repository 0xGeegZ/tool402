# S43 recording demo journey

## Scope and authority

The owner requests an up-to-date, necessary recording journey and editable
prefilled forms comparable to Provider deploy. This amendment supersedes
UI-S11's nine-screen copy and its historical exclusion of the now-implemented
provider and signed dashboard surfaces. Existing P00 and M01 foundation gates,
S11/S19/S30 delivery, and the merged S40/S42 source are the baseline. It does
not declare S40 or S42 accepted or change their authentication/data contracts.

## Recording route

Use six screens, grouped into discovery, request, and campaign:

1. `/`: explain the product.
2. `/explore`: locate RiskScan in the catalogue.
3. `/explore/riskscan`: explain Quick scope and caller-reported limitations.
4. `/explore/riskscan/tool-loop?demo=tool-loop`: review editable existing
   sample values and manually inspect the request boundary. ToolLoop discovers
   the service first; `/try` directly calls it. These are alternatives.
5. `/provider/deploy`: review the existing prefilled campaign and terms.
   Acknowledgements and signing remain explicit. If a campaign already exists,
   resume it; do not recreate a note to record the video.
6. `/sign-in`: use the existing signed session flow to reach `/dashboard`.
   Show the current signer-associated campaign or its real empty state.

The guide gives a short purpose and presenter action for each screen. A
collapsed optional section explains `/try`, the historical workbench,
compatibility, disclosure preflight, and the detailed `/provider` status view.
The guide distinguishes a browser 402 challenge from paid-result evidence and
does not promise a configured response, payment, or deployment. It records no
successful live action. The video remains human-owned.

## Navigation and current data

- Every main step link and Next link includes `tour=1`; the ToolLoop sample
  selector survives navigation and exiting the tour.
- `/dashboard` and `/sign-in` represent the same final tour step. Sign-in is
  the entry so an unauthenticated dashboard redirect cannot lose progress.
- Only the exact scalar query value `tour=1` can select the fixed destination
  `/dashboard?tour=1`. Missing, unknown, array, or hostile values select the
  existing `/dashboard` destination. Preserve this through both an existing
  session redirect and successful user-initiated sign-in. No generic return URL.
- The final step offers a guide link, never claims authentication or campaign
  completion merely from visiting a route.
- `/provider` reads the existing shared `riskScanOfferingPublicId`, matching
  dashboard and deploy instead of its obsolete hard-coded identifier.

## Owned paths

Sources: the existing demo page, guided steps, tour bar, sign-in page,
MetaMask dashboard sign-in component, provider page, plus the new
`apps/web/src/components/demo/demo-tour-navigation.ts` pure navigation helper.
Tests: guided-demo-route, demo-tour-bar, dashboard-auth, provider-status,
and new `apps/web/tests/demo-tour-navigation.test.mjs`.
Root control: this specification, S43 card, STATE, TASK-CATALOG,
FILE-OWNERSHIP, DECISIONS, and S43 review evidence.

No other source, test, dependency, configuration, auth protocol, dashboard
gate, provider command, transaction, or backend change is authorized.

## Verification

Observe focused RED before source changes. Verify fixed navigation destinations
including hostile/duplicate query values, six main routes, editable sample
defaults, optional-only diagnostics, shared campaign ID, and unchanged auth
checks. Run focused and complete Web tests, Web typecheck, lint, queue and
reference guard, and production build. Exercise the local guide and tour,
sample edits and navigation, signed-out final entry, and narrow/desktop layout
in a browser. Real wallet signatures remain human-owned; report that evidence
separately. Obtain independent task review and two fresh clean module reviews.
