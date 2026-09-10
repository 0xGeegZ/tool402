# S21-T010 corrective review

## Review basis

- Historical integration: `48421352607a00c1a73f593dcc48160fac771e6a`.
- Historical bridge source introduction: `d87785e`.
- Current control baseline: `da1098908fd70a85457f592ba6b1df9c9bc025a5`.
- Review scope: the existing S21 bridge, S15/S16 amendments, and their six
  focused test files only.

The historical source is present on `main`, but its presence is not acceptance
evidence. The card remains unaccepted until this corrective cycle and its
required independent reviews complete.

## Confirmed findings

1. `deploy-stage-signing.tsx` allows a request-construction parser error to
   escape when a reviewed `qualifyingResource` is blank or noncanonical. The
   wizard did not expose that field error, so selecting the first signature
   action could fail without actionable feedback.
2. The stage-four unavailable detail added an unrecorded public-endpoint reason
   to the exact clearing-account reason now fixed by `D-S21-010-001`.

Neither finding changes the Core parser, command vocabulary, relay semantics,
wallet boundary, provider access, SDK access, durable state, transaction, or
live authority.

## Baseline verification

At the control baseline, the focused S15/S16/S21 command was green: 64 tests
passed and none were skipped:

```text
node --test apps/web/tests/command-bridge.test.mjs \
  apps/web/tests/deploy-stage-signing.test.mjs \
  apps/web/tests/tool402-command.test.mjs \
  apps/web/tests/commands-api.test.mjs \
  apps/web/tests/provider-deploy-state.test.mjs \
  apps/web/tests/provider-deploy-route.test.mjs
```

Those tests did not cover the request-construction error path, so they do not
establish S21 acceptance.

## Corrective boundary

The next review may authorize only test regressions for the two findings. No
production source changes are authorized until that RED contract is
independently accepted. The later minimal GREEN scope is limited to the three
paths named by `D-S21-010-002`; every other S21, S15, S16, M44, and live path
remains unchanged.
