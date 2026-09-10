# UI-S27 Deploy wizard step progress manifest

## Delivery boundary

UI-S27 reconciles the provider deploy wizard's five-step progress indicator
to the selected PREP-UI-001 wizard direction: five equal segments, each a
thin progress bar with its full label beneath, the accepted
`Step N of 5 · <label>` caption under the row, and no truncated label. It
shortens one step label. It is presentation only. No step count, order,
editable or fixed field, state machine, stage, signature, relay, or command
changes.

## Local targets

The slice may add or amend only:

- one new `apps/web/tests/deploy-wizard-stepper.test.mjs`;
- the `StepProgress` function, the step caption placement, and the
  step-count badge in
  `apps/web/src/components/provider/deploy/provider-deploy-wizard.tsx`;
- the step-3 label in
  `apps/web/src/components/provider/deploy/provider-deploy-state.ts`; and
- the step-label and caption assertions of
  `apps/web/tests/provider-deploy-state.test.mjs` and the `StepProgress`
  assertions of `apps/web/tests/provider-deploy-route.test.mjs`, each limited
  to that assertion.

Every amendment above is to S16-T010's accepted paths and needs its own root
integration reservation. S25-T010 amends the same wizard file's header block;
the root sequences this slice after S25-T010 is integrated.

## Progress contract

`StepProgress` keeps its `nav` landmark `Provider deploy progress` and an
ordered list of five items. Each item is one `button` with `type="button"`,
the existing `aria-label` `Return to step N: <label>`, `aria-current="step"`
on the current step, disabled for the current and later steps, and the
existing `onClick`. The button's current `title` attribute is removed because
the label is fully visible. Its content, in order: one full-width bar element,
`h-1.5` and rounded, filled with the primary colour for completed and current
steps and the muted colour otherwise; then one label paragraph, `text-sm`,
`font-medium` on the current step and `text-muted-foreground` otherwise,
wrapping freely with no `truncate` class. The accepted caption from
`stepCaption(currentStep)`, for example `Step 1 of 5 · Tool details`, moves
from its current place above the row in the card header to directly beneath
the list, rendered exactly once. The `N / 5` outline badge in the stage header
is removed because the caption carries the count.
The grid keeps five equal columns at every width; at 390px labels wrap onto a
second line rather than clip.

## Label contract

Step 3's label becomes `Pricing and customers`; its editable fields
`quickPrice`, `standardPrice`, and `targetAgentCustomers` are unchanged.
Steps 1, 2, 4, and 5 keep `Tool details`, `Interface and capability`,
`Funding and revenue-note terms`, and `Review and sign`. The
`Continue to <label>` control and the caption follow from the label. This
supersedes only the step-3 label cell of the UI-S16 step table; the rest of
UI-S16 stands.

## Explicit exclusions

Do not change the number, order, or fields of the steps, the first-step back
rule, the step-4 acknowledgement gating, any stage copy, the stage state
machine, the review rows, the signing island, or any relay or command. Do not
add an icon, animation, percentage, time estimate, or a clickable future step.

## Acceptance evidence

- A durable test-only RED commit precedes source changes and fails because
  the progress buttons still render a numbered circle and a truncated label,
  the count badge still exists, and the step-3 label is still
  `Pricing and target agent customers`.
- `deploy-wizard-stepper.test.mjs` proves the bar-then-label anatomy, the
  absence of `truncate` and `title`, current-step emphasis, the caption
  rendered once beneath the row, the badge removed, and the five labels.
- The amended accepted tests pass with only their label, caption, and
  `StepProgress` assertions changed.
- Web typecheck, test, lint, build, root typecheck, test, lint,
  `queue:check`, and the local-reference guard pass.
- Browser checks at desktop and 390px on `/provider/deploy`: all five labels
  fully visible, the current label emphasised, the caption beneath the row,
  and no horizontal overflow.
