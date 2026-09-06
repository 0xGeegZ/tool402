# M15 guest RiskScan Quick preflight contract

## Delivery boundary

This contract adds one guest Dashboard preparation surface for the accepted
pure RiskScan Quick disclosure assessment. It lets a caller inspect
caller-reported disclosure gaps before any unsigned ToolLoop request boundary.
It is not a Sign/session surface, a network request adapter, a payment client,
or a live-service proof.

## Required route behavior

`/dashboard/riskscan/preflight` is a server-rendered route with one `main`
landmark and one `h1`. It explains that the screen is a guest local preflight
and renders one client-only island.

The island has one semantic form with exactly three required blank text
controls:

- `requestRef`, up to 96 characters;
- `subjectRef`, up to 160 characters; and
- `context`, up to 280 characters.

It also has exactly four caller-reported checkbox controls: `identity`,
`pricing`, `limitations`, and `evidence`. On an explicit valid submission, it
constructs one local RiskScan Quick input from those form values and calls the
public `assessRiskScanQuick` core export exactly once. It does not call an
Agent, API, sender, fetcher, URL constructor, or browser/global request
surface.

The island renders polite fixed feedback for the local preflight state. A
successful assessment shows only its `needs_disclosure` or
`disclosures_reported` disposition, the exact reasons, and its limitation. It
must say that the content is caller-reported local preparation only: no request
was sent, and it does not confirm a payment, service, evidence, or live
availability. A core-validation rejection renders a fixed local invalid-input
message with the same no-request/no-payment/no-live boundary.

The existing Workspace route map gains one semantic local `Link` to this
route. The global navigation, guest-shell framing, landing, Explore, ToolLoop,
Directory, compatibility, Agent/Core/API sources other than the public core
import, and package boundaries remain unchanged.

## Truthfulness and authority boundary

The page has no fake user, identity, Sign state, session, account, wallet,
signer, provider, balance, recipient, facilitator, configuration, or live
availability. It reads no environment value, storage, timer, analytics,
backend/store, receipt, evidence, or external URL. It sends no GET, POST,
payment header, payment body, request, payment, transaction, settlement, or
deployment action.

Caller disclosures are not verified facts. The preflight does not select a
recipient, allocate funds, inspect a balance, create a client, authorize a
payment, submit a transaction, or prove finality. A real Sign/session/provider
experience remains a separately specified future behavior. A payment client or
live proof remains subject to HA-X402-HEDERA-001.

## Acceptance evidence

- Focused executable contracts exercise the public core function with local
  form-shaped inputs, prove exact blank/no-default construction, all bounded
  outcome messages, local-only invocation, and the constrained Workspace link.
- Source-boundary checks prove server/client separation and reject Agent/API/
  fetch/request behavior, POST, environment/configuration, storage, timers/
  retry, Sign/session/account/wallet/provider/signer behavior, payment/client
  behavior, persistence, receipt/evidence, external links, and live claims.
- Web/root typecheck, test, lint, clean-install dry run, production Webpack
  build, queue/reference/whitespace checks, enabled local guard, desktop and
  narrow browser checks, independent task review, and two fresh clean
  module-review generations pass before acceptance.
