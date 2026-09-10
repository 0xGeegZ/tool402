# UI-S32 static shell truth-contract correction

## Delivery boundary

UI-S32 corrects one stale static-shell assertion. The accepted shared shell
intentionally presents a local `Prepare a tool` link to `/provider/deploy` and
uses the words `provider` and `deploy` only as readable route vocabulary. The
former lexical deny-list treated those two visible words as forbidden runtime
capability, so the complete Web suite now rejects accepted static source.

This slice amends only that assertion. It preserves the static Shell/Home
contract and verifies the exact local provider-deploy href explicitly. No
rendered source, route, action, client code, dependency, or capability changes.

## Local target

The slice may amend only:

- `apps/web/tests/static-shell.test.mjs`.

It may not amend `apps/web/src/app/layout.tsx`, `apps/web/src/app/page.tsx`,
or any other source or test file.

## Test contract

The corrected static-shell test must continue to require the existing stylesheet
import, `data-ui-shell="s00"`, logo, language/body markup, one landing main,
and `LandingHero` composition. It must assert the exact internal
`href="/provider/deploy"` CTA. Its static no-runtime deny-list must continue to
reject `wallet`, `payment`, `credential`, `auth`, `onboarding`, `analytics`,
`evidence`, and `metric`, while allowing the explicit local route vocabulary
`provider` and `deploy`.

No new test helper, fixture, mock, network call, runtime assertion, or source
production change is permitted.

## Acceptance evidence

- The existing full Web test reproduces the one stale lexical failure before
  this correction.
- An independent readiness review confirms the exact one-file reservation,
  accepted S31 source, no active ownership collision, and the persisted full
  baseline failure.
- The corrected test is the only source-tree change. The full Web test reports
  298/298 passing under Node 22.21.1, with queue/whitespace checks clear.
- An independent exact-diff review confirms the semantic static boundary is
  retained and no UI behaviour or route changed.

## Explicit exclusions

No app/layout/page/component/style/navigation change; no wallet, payment,
provider runtime, auth, data, API, Agent, Core, Backend, transaction,
deployment, live claim, dependency, asset, external link, or full-tree import.
