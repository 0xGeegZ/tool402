# UI-S02 RiskScan detail manifest

## Delivery boundary

UI-S02 adds one server-rendered RiskScan detail route at `/explore/riskscan`. It composes the accepted shell and primitives with a small local detail component. The page explains the bounded Quick capability, the request fields it accepts, the two possible local Quick dispositions, and the API boundary's configuration-dependent availability. It may add one local link from the existing Explore discovery card to that committed detail route.

The route is descriptive and implementation-backed: its content is derived only from the accepted local Quick and API contracts. It does not read runtime configuration, invoke the API, or fabricate any request, challenge, payment, result, receipt, evidence, provider, account, or deployment state.

## Local targets

The slice may add `apps/web/src/app/explore/riskscan/page.tsx`, focused detail components under `apps/web/src/components/riskscan/detail/`, and focused static tests. It may update the existing RiskScan discovery card to provide a labeled link to the committed detail route and amend its earlier static expectation accordingly.

The detail layout contains a page heading, a back link to `/explore`, a capability summary, an input-contract list (`requestRef`, `subjectRef`, `context`, and the four disclosure declarations), a result-boundary list for `needs_disclosure` and `disclosures_reported`, and a configuration-boundary notice. It uses only the existing local Card, Badge, and token primitives.

## Truthfulness boundary

UI-S02 must not render a form, submit action, client fetch, price, wallet, payment state, provider, account, metric, receipt, evidence, external link, mock result, or live-availability claim. It must not claim that a request will be accepted: the API may return unavailable until its host supplies valid supported runtime configuration. It must not add a client component, adapter, authentication, analytics, hosted font, credential, or new dependency.

The detail page may describe the API as an available local boundary only in conditional terms. A payment challenge is protocol behavior, not a completed payment or a UI state on this slice. The Try and paid-state journey remains a separate follow-on UI-S03 card.

## Acceptance evidence

- The detail route has one main landmark and one page heading, and its back/detail navigation resolves only to committed local routes.
- Static checks prove the page describes the accepted input/result/configuration boundaries without a form, action, price, payment, wallet, result fixture, or external link.
- Focused web tests, typecheck, production webpack build, local-reference guard, and desktop/narrow browser checks pass.

UI-S03 may add an interactive request and paid-state journey only after its own local contract is committed and its typed state boundary is ready.
