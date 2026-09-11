# D-S35-010-006 — Public documentation footer test correction authorized

Fresh independent scope review at exact head
`ad0cffd49b0c9e5fce66fc7c83fa419d9dc98fc2` against canonical
`9281374d4d7c3420ea5fe0e00c5456ed1895d36e` confirms D-S35-010-005 and the
two exact stale exhaustive footer-link arrays. The focused Node 22.21.1
landing test reports five passes and two expected stale-array failures; no
other test failure occurs and no ownership collision exists.

## Ruling

Reserve only `apps/web/tests/product-landing.test.mjs` to add Documentation
(`/docs`), API reference (`/docs/api`), and FAQ (`/docs/faq`) immediately
after Provider documentation in its two expected footer-link arrays. Refine
only the footer lexical denial to retain the external-link prohibition and
reject direct `href="/api/..."` endpoint links while permitting `/docs/api`.
All other assertions remain fixed. No source, other test, route/runtime/API,
MCP, wallet/provider/payment, command, transaction, deployment, or live
authority is authorized.
