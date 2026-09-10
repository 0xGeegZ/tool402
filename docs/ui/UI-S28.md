# UI-S28 ToolLoop visual and Dashboard terminology reconciliation manifest

## Purpose

UI-S28 is a truth-first POLISH slice for the existing
`/explore/riskscan/tool-loop` journey. It migrates the complete prepared
ToolLoop/Try visual composition into the current local request boundary
without copying its simulated inputs, prices, networks, history, or outcomes.

The same slice corrects the Guided Demo wording for this existing route from
"workspace" to "dashboard". It changes no route and no form behavior.

## Local targets

The slice may amend only:

- `apps/web/src/app/explore/riskscan/tool-loop/page.tsx`;
- `apps/web/src/components/riskscan/tool-loop/riskscan-tool-loop.tsx`;
- `apps/web/src/components/demo/guided-demo-steps.tsx` only at the existing
  `/dashboard` step's user-facing title and observation; and
- `apps/web/tests/riskscan-tool-loop.test.mjs` and
  `apps/web/tests/guided-demo-route.test.mjs` only at assertions constrained
  by the above presentational changes.

The active S22 and S24 scopes separately own their landing-footer and
dashboard wording amendments. S29 owns the frozen navigation assertion in
`guided-demo-route.test.mjs`; S28 may amend only that file's separate
`/dashboard` expected-row assertion under D-S28-010-002. Internal component
and file names remain unchanged.

## Visual and copy contract

The ToolLoop page keeps one `main` and one `h1`, adds an internal return link
to `/explore/riskscan`, and follows the reference page's full vertical
composition: a local testnet/boundary label, title and supporting copy, a
short truthful notice, a large rounded request surface with clear regions,
and the existing truthful footer. At wide widths the request-reference and
subject-reference fields share a row; the request-context field remains full
width. The disclosure fieldset remains visible as the pre-submit review. The
existing submit button and outcome live region stay in the same form and
retain their behavior.

The visible copy may say that a submitted request reaches the local ToolLoop
boundary and that a returned payment challenge is not a completed payment. It
must not say that a payment, task, result, receipt, or verification completed.
The Guided Demo step becomes `Open the dashboard` with the observation
`See the guest dashboard shell.`; its href remains `/dashboard`.

## Explicit exclusions

Do not add a simulated network selector, contract address, price, tier,
budget, scenario selector, task history, payment-progress display, receipt,
result data, mock agent flow, wallet, provider, configuration read, endpoint
construction, fetch before submit, retry, persistence, analytics, external
link, dependency, asset, global layout/navigation/CSS change, or a new route.
Do not amend the ToolLoop state module, Agent flow, API, Core, Backend, or
payment handling.

## Acceptance evidence

- A focused RED test commits before source work and fails only because the
  required visual hierarchy and Dashboard wording are absent.
- Focused tests prove the return href, labels and input names, disclosure
  names, demo defaults, one submit path, duplicate-submit lock, and closed
  outcome mapping all remain intact.
- Desktop and 390px browser checks prove no horizontal overflow, visible
  keyboard focus, intentional heading wrapping, stacked fields, an unclipped
  request card, and a polite status region.
- Web typecheck, focused tests, whitespace, the local-reference guard, and
  independent task/module review are clear before the slice is proposed for
  integration.
