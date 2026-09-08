# UI-S19 ToolLoop demo prefill manifest

## Delivery boundary

UI-S19 makes the existing Guided Demo link to the ToolLoop route useful during
a live walkthrough. The link carries exactly one local URL state:
demo=tool-loop. The ToolLoop form reads that one state through nuqs 2.10.1 and
fills a fixed, editable RiskScan Quick example.

The URL never carries form values. It only selects the one local demo fixture.
An absent, malformed, or unsupported demo value leaves every field blank and
every disclosure unchecked. The fixture is not submitted automatically, does
not trigger a directory request, and does not change the existing submit or
outcome behavior.

## Local targets

This slice may amend only:

- apps/web/src/app/layout.tsx to mount the official App Router NuqsAdapter;
- apps/web/src/components/demo/guided-demo-steps.tsx and its constrained
  apps/web/tests/guided-demo-route.test.mjs assertion so the existing ToolLoop
  step uses /explore/riskscan/tool-loop?demo=tool-loop;
- apps/web/src/components/riskscan/tool-loop/riskscan-tool-loop.tsx;
- apps/web/src/components/riskscan/tool-loop/riskscan-tool-loop-state.ts;
- apps/web/tests/riskscan-tool-loop.test.mjs;
- one new focused test, apps/web/tests/tool-loop-demo-prefill.test.mjs; and
- apps/web/package.json, root package-lock.json, and the exact dependency
  assertion in apps/web/tests/static-shell.test.mjs for the pinned direct
  dependency.

The root records this as an integration reservation because the layout,
package files, static-shell test, guided-demo link, and ToolLoop component
belong to accepted cards. The later S13 outcome-treatment card retains only
its outcome-rendering lines; this slice owns form defaults and the demo notice,
not terminal outcome presentation.

## URL and form contract

The only recognized query-state pair is demo=tool-loop. The client uses
useQueryState with a closed string-literal parser from nuqs. No server
search-param read, dynamic route option, cache change, history write, or
arbitrary query value is allowed.

When the recognized value is present, the form receives these local defaults:

- requestRef: demo-riskscan-quick-001
- subjectRef: riskscan-demo-subject
- context: Review the demo RiskScan Quick request before continuing the
  ToolLoop demo.
- identity, pricing, limitations, and evidence: true

The values satisfy the existing form lengths. The inputs and checkboxes remain
fully editable. A visible, polite notice says: Demo values loaded. Review
before checking. It does not claim a result, payment, completion, or live
status.

## Explicit exclusions

Do not add any other URL parameter, storage, timer, automatic submit, fetch
before submit, network configuration, payment, wallet, account, signer,
provider, price, receipt, evidence, result, transaction, deployment, or
external link.

Do not alter the accepted ToolLoop request construction, current-origin
selection, duplicate-submit guard, terminal state union, or outcome wording.
Do not alter a route other than the one exact Guided Demo href.

## Acceptance evidence

- A durable RED test precedes source and dependency changes.
- Focused tests prove that only demo=tool-loop selects frozen, detached
  defaults; unknown or absent values remain blank; the four disclosures are
  selected only for the recognized fixture; and the source uses the closed
  nuqs query-state boundary.
- Focused tests prove the Guided Demo step has the exact query href and no
  other narrated route changes.
- Web/root typecheck, Web/root tests, lint, queue/reference/whitespace checks,
  clean install, and the enabled local guard pass.
- Browser verification proves the Guided Demo click opens the ToolLoop route
  with the three fields and four declarations prefilled, the notice visible,
  and no request sent before the user presses the existing submit button.
