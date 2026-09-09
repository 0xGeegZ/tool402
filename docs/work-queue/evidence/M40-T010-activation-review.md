# M40-T010 activation review

## Scope

Fresh independent activation review at clean pushed `a14c26e` of M40 now that
it is `10-ready`, including its accepted dependencies, absent RED/source
targets, root schema reservation, active-lane ownership, local references, and
Node 22.21.1 baseline.

## Review

- M04, M32, M33, M38, and M39 remain accepted.
- All three M40 RED-test files and all implementation paths are absent. S16
  is the only active scheduled lane and owns Web paths only.
- The root reservation stays ordered: M40 `walletCommandReplayClaims`, then
  M41 `ingressCommandReplayClaims`, then M43's narrow state widening.
- Backend passed 168/168; M04/M32 regression tests passed 27 direct subtests;
  Backend typecheck/lint, queue validation, whitespace check, and the enabled
  local-reference guard passed under Node 22.21.1.

## Verdict

CLEAR — no Critical, Important, or Minor finding. M40 may move to
`20-active` only to create these durable test-only RED files:

```text
packages/backend/tests/offering-durable-schema.test.mjs
packages/backend/tests/offering-command-admission.test.mjs
packages/backend/tests/directory-version-writer.test.mjs
```

`schema.ts`, Convex modules, and `offering-command-admission.ts` remain
prohibited until a separate independent RED review clears.
