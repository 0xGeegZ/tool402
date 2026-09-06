# M14 guest RiskScan workbench contract

## Delivery boundary

This contract adds one guest Dashboard workbench that arranges already
accepted RiskScan interaction surfaces in an intentional, inspect-before-act
sequence. It is a static composition layer, not a Sign/session surface,
payment client, execution adapter, or live-service proof.

## Required route behavior

`/dashboard/riskscan` is a server-rendered route with exactly one `main`
landmark and one `h1`. It explains that the route is an unconfigured guest
workbench and renders one server workbench component.

The workbench renders three labelled sections in this exact order:

1. `Inspect the local directory`, containing the accepted
   `RiskScanDirectoryDiscovery` island;
2. `Check native compatibility`, containing the accepted
   `RiskScanNativeQuoteCompatibility` island; and
3. `Follow the ToolLoop boundary`, containing the accepted `RiskScanToolLoop`
   island.

The workbench may add descriptive static copy that explains the sequence. It
does not alter a contained island, import an Agent/Core/API implementation, or
create another client boundary. The existing Workspace route map gains one
semantic local `Link` to `/dashboard/riskscan`.

## Truthfulness and authority boundary

The route and workbench have no fake user, identity, Sign state, session,
account, wallet, signer, provider, balance, recipient, facilitator,
configuration, or live availability. They read no environment value, storage,
timer, analytics, backend/store, result, receipt, evidence, or external URL.
They construct no endpoint, request, header, body, POST, payment, transaction,
settlement, or deployment action.

The embedded islands keep their already accepted behavior and authority
boundaries. A Directory inspection remains a bounded read, native
compatibility remains a local non-authorizing check, and ToolLoop may expose
only its existing unsigned challenge outcome. The workbench neither upgrades
those outcomes nor claims that a payment, result, receipt, evidence, or live
service is available. A real Sign/session/provider experience remains a
separately specified future behavior. A payment client or live proof remains
subject to HA-X402-HEDERA-001.

## Acceptance evidence

- Focused executable contracts prove static route semantics, the exact section
  order and accepted-island composition, the constrained Workspace link, and
  the absence of new client/network/authority behavior.
- Desktop and narrow browser checks cover rendering, sequential access to each
  embedded local interaction, local navigation, keyboard focus, no horizontal
  overflow, and framework/browser diagnostics.
- Web/root typecheck, test, lint, clean-install dry run, production Webpack
  build, queue/reference/whitespace checks, enabled local guard, independent
  review, and two fresh clean module-review generations pass before acceptance.
