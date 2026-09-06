# M11 application workspace shell contract

## Delivery boundary

This contract adds a static `/dashboard` route and a small application-shell
component subtree. It provides an honest entry point for the product space
that will later sit behind a real Sign flow, while clearly remaining a guest,
unconfigured workspace today.

## Required route behavior

`/dashboard` is a server-rendered route with one `main` landmark and one
`h1`. It renders a clear `Workspace preview` heading, explains that no session
is connected, and offers route-map links to the already committed local
`/explore`, `/explore/riskscan`, and `/explore/riskscan/tool-loop` surfaces.
The global local navigation adds one `Workspace` link to `/dashboard`.

The shell uses existing local Card, Badge, and token primitives, then styles
semantic local `Link` elements directly. It contains no client component,
fetch, environment read, storage, timer, analytics, external link, or new
dependency.

## Truthfulness and authority boundary

The route must not create, imitate, or imply a user identity, account,
wallet, signer, provider, session, balance, position, notification, activity,
payment, result, receipt, evidence, transaction, live availability, or
deployment. It must not render a sign-out control or a connect-wallet
control. A genuine Sign flow requires its own local contract for session,
recovery, privacy, and provider boundaries before implementation.

UI-S07 narrowly extends the accepted shell and local navigation. It does not
change the landing route or the accepted RiskScan detail, Try, ToolLoop, and
Directory-inspection boundaries.

## Acceptance evidence

- Focused contracts prove route/main/heading shape, exact local navigation
  targets, guest/unconfigured copy, existing primitive use, and exclusion of
  fabricated identity, financial, and network states.
- Web typecheck/test, production build with Cache Components, root quality,
  queue/reference/whitespace checks, and enabled local guard pass.
- Desktop and narrow browser checks prove the route renders, links navigate
  locally, keyboard focus is visible, no horizontal overflow occurs, and no
  framework or browser errors are reported.
