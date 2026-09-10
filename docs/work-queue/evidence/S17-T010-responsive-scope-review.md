# S17-T010 responsive scope review

## Scope

Independent review of the same-card responsive correction records for S17-T010:
the UI manifest, active card, implementation plan, ownership record, task
catalog, state, and decision record. No production source or test changed in
this review.

## Review

- The required unconfigured `/provider` check at 390px measured a 408px
  document/header width after the fifth root-reserved navigation link landed.
- The direct cause is the non-wrapping shared navigation list. `layout.tsx`
  belongs to accepted M02 and remains outside S17's correction scope.
- The amendment is limited to one existing assertion and one exact source
  literal: the test must require
  `flex flex-wrap items-center gap-1 text-sm font-medium`, and source may only
  insert the bare `flex-wrap` token after `flex` in the current list literal.
- The existing five links, their order and labels, semantic navigation,
  landmarks, focus treatment, global CSS, and every runtime/live boundary are
  preserved. Every other class token or attribute change, overflow mask, and
  width/minimum-width workaround is prohibited.
- M44 remains disjoint and untouched.

## Verification

`git diff --check` and `npm run queue:check` are clear on the controls-only
worktree. A fresh responsive RED review remains required before the test or
source literal may change; final acceptance additionally requires a real 390px
browser measurement with no horizontal overflow.

## Verdict

CLEAR — the amendment is the smallest dependency-correct correction. It grants
no source change yet and no configuration, wallet/provider, payment,
transaction, deployment, or live authority.
