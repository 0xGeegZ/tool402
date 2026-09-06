# UI-S04 Browser ToolLoop RiskScan journey manifest

## Delivery boundary

UI-S04 adds `/explore/riskscan/tool-loop`: a small, accessible browser surface
for the accepted local ToolLoopAgent flow. It reuses the existing application
shell, Card, Button, RiskScan Quick input shape, and visual tokens. The static
page renders a client form which performs one current-origin Agent invocation
after submission.

The surface makes local discovery failures visible before an unsigned request
can occur. It then maps only the accepted opaque terminal outcome; a
`payment_required` display is a challenge boundary, never a paid or completed
state. The accepted detail page receives one committed local link to this
route.

## Local targets

The slice may add a server page at
`apps/web/src/app/explore/riskscan/tool-loop/page.tsx`, client-only components
under `apps/web/src/components/riskscan/tool-loop/`, and focused Web tests. It
may amend the local detail component and its focused test only to add the
committed ToolLoop link. The root may make the narrowly required local package
exposure, Web dependency, transpilation, and lockfile changes.

## Truthfulness and authority boundary

The client uses only `window.location.origin` at submission time and delegates
to the accepted Agent flow. It does not directly construct endpoints, headers,
or payment material. It does not show protocol header values, result data,
receipt/evidence, payment completion, price, network, recipient, facilitator,
wallet, account, provider, signer, configuration, or external link.

The browser exercise uses the configuration-absent local server and therefore
may demonstrate only the explicit unavailable terminal state. A controlled
`402` remains local test evidence. No configuration, account, funding,
signing, payment, settlement, finality, deployment, or live assertion is
authorized.

## Acceptance evidence

- Source and behavior checks cover static page/client separation, all seven
  bounded outcomes, no directory-failure POST, form accessibility, and local
  navigation.
- Desktop and narrow browser checks exercise the actual current-origin local
  journey through an unavailable terminal state; framework and browser errors
  are clear.
- Web/root quality, build, queue, guard, independent review, and two clean
  module-review generations pass.
