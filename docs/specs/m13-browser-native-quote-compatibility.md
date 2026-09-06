# M13 browser native quote compatibility contract

## Delivery boundary

This contract adds one narrow guest Dashboard surface for the accepted
ToolLoopAgent native quote evaluator. It lets a user deliberately inspect
whether a locally advertised native summary is compatible with a policy they
provide. It is not a Sign/session surface, a payment client, a request
executor, or a live-service proof.

## Required route behavior

`/dashboard/riskscan/compatibility` is a server-rendered route with one `main`
landmark and one `h1`. It explains that the screen is a guest compatibility
check and renders one client-only island.

The island has one semantic form with exactly three required text controls and
no default values:

- `network`, which must be supplied as `hedera:testnet` for native
  compatibility;
- `asset`, a canonical native asset identifier; and
- `maximumAmount`, a canonical positive atomic amount.

On an explicit submission, the island creates one plain policy record with
only those three submitted values, creates a `URL` from
`window.location.origin`, and calls the public
`evaluateDiscoveredRiskScanNativeQuote` Agent export exactly once with that
base, policy, and `window.fetch.bind(window)` as its required injected
fetcher. It does not build an endpoint, request init, header, body, or POST.
The Agent owns the single credential-free Directory GET and all descriptor
validation. The submit control is disabled during an active evaluation, and a
second submit while it is active does nothing.

The island renders a polite fixed status for `evaluating`,
`directory_unavailable`, `directory_invalid`, and
`native_summary_unavailable`. Each `declined` outcome renders only that the
local policy is not compatible. An `eligible` outcome may show its returned
network, asset, and exact atomic amount, but must state that compatibility is
not consent, availability, a quote guarantee, payment authorization, or a
transaction.

The existing Workspace route map gains one semantic local `Link` to this
route. The global navigation, guest-shell framing, landing, Explore, ToolLoop,
Directory inspection, Agent/Core source, API, and package boundaries remain
unchanged.

## Truthfulness and authority boundary

The page has no fake user, identity, Sign state, session, account, wallet,
signer, provider, balance, recipient, facilitator, configuration, or live
availability. It reads no environment value, storage, timer, analytics,
backend/store, result, receipt, evidence, or external URL. It sends no POST,
payment header, payment body, request, payment, transaction, settlement, or
deployment action.

An eligible result is only a locally evaluated compatibility statement. It
does not select a recipient, allocate funds, inspect a balance, create a
client, authorize a payment, submit a transaction, or prove finality. A real
Sign/session/provider experience remains a separately specified future
behavior. A payment client or live proof remains subject to
HA-X402-HEDERA-001.

## Acceptance evidence

- Focused executable contracts exercise the public Agent subpath with an
  injected native Directory response, prove one exact GET and zero POSTs,
  verify no-default three-field policy construction, duplicate-submit locking,
  truthful outcome messages, and the constrained Workspace link.
- Source-boundary checks prove server/client separation and reject direct
  endpoint/request/header/body construction, direct fetch invocation, POST,
  environment/configuration, storage, timers/retry, Sign/session/account/
  wallet/provider/signer behavior, payment/client behavior, persistence,
  result/receipt/evidence, external links, and live claims.
- Web/root typecheck, test, lint, clean-install dry run, production Webpack
  build, queue/reference/whitespace checks, enabled local guard, desktop and
  narrow browser checks, independent task review, and two fresh clean
  module-review generations pass before acceptance.
