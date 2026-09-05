# UI-S03 RiskScan request and protocol-state manifest

## Delivery boundary

UI-S03 adds one local Try RiskScan route at `/explore/riskscan/try`. It composes the accepted shell, primitives, RiskScan Quick input contract, and x402 API boundary into a small browser request flow. A user may submit the exact bounded Quick fields to the local API route and see only the response boundary actually returned by that route.

The flow recognizes an unavailable response (`503`), a valid unsigned payment challenge (`402` with a nonempty `PAYMENT-REQUIRED` header), an invalid request (`400`), a transport failure, an unexpected response, or a validated Quick response returned by the endpoint. Its typed UI state must preserve those distinctions. A `402` means `payment_required`; it is never a paid, settled, completed, receipt, or evidence state. A returned Quick response is an endpoint response, not payment or lifecycle evidence.

## Local targets

The slice may add `apps/web/src/app/explore/riskscan/try/page.tsx`, client-only request-flow components under `apps/web/src/components/riskscan/request/`, and focused state/route tests. It may add one labeled local link from the accepted RiskScan detail surface to the committed Try route and amend its focused static test accordingly.

The browser submits only `requestRef`, `subjectRef`, `context`, and the four boolean declarations to `POST /api/riskscan`. The client-safe response adapter receives a `Response`, maps only the documented statuses, and validates a returned Quick result before presentation. It must render fixed truthful copy for failure boundaries and never display a raw payment header or server error payload.

## Truthfulness and authority boundary

UI-S03 must not import server-only configuration or x402 helpers, read runtime configuration, add a recipient, facilitator, price, network, wallet, signer, payment-header authoring, settlement action, account, provider, deployment, persistence, analytics, credential, external link, or dependency.

It must not fabricate a result, payment, receipt, evidence, transaction, availability, or completed lifecycle state. It may not call a facilitator directly. Browser verification runs with configuration absent, so the only exercised route outcome is the local explicit unavailable response. A configured payment route, a compatible consumer that satisfies a challenge, settlement, evidence capture, and deployment remain separate human-authorized work.

## Acceptance evidence

- A RED/GREEN state-adapter contract covers `503`, `402` with and without the required header, `400`, network failure, unexpected status, malformed success payload, and a validated actual Quick payload.
- Focused UI checks prove the route, accessible form, exact request fields, local navigation, truthful rendered states, and exclusion of wallet/payment-header/configuration/provider/receipt/evidence surfaces.
- Root Node 22.21.1 typecheck and test suite, the web production webpack build, queue check, and local-reference guard pass.
- Browser checks at desktop and narrow widths submit the empty-configuration local route and observe only the unavailable state; a narrow accessibility audit passes.

The implementation plan is [UI-S03 RiskScan request-flow plan](../superpowers/plans/2026-09-05-m02-ui-s03-riskscan-request-flow.md).
