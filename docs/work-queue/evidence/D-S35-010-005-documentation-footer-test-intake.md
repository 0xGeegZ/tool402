# D-S35-010-005 — Public documentation footer test intake

The first complete Web validation after the authorized S35 footer source
change reports two failures in `apps/web/tests/product-landing.test.mjs`. Its
two exhaustive footer-link expectations omit the newly authorized Docs links;
its broad `/api/` lexical denial also matches the real `/docs/api` route.

## Candidate correction

After a fresh independent scope review, S35 may amend only the two expected
link arrays and the lexical API-endpoint denial in
`apps/web/tests/product-landing.test.mjs`. The correction must list only
Documentation (`/docs`), API reference (`/docs/api`), and FAQ (`/docs/faq`)
in their actual footer order, while retaining the exact local link map and
rejecting direct `/api/` endpoint links. No source, route behavior, or product
authority expands.
