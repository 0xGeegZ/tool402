# M55-T010 Task 1 HTTP route-test supplement

## Observed control failure

The declared Task 1 source adds the separately domain-bound, POST-only
`/internal/provider-tools` route. At Node `22.21.1`, the existing M41 test
`packages/backend/tests/http-command-ingress.test.mjs` fails only because its
closed route inventory still lists the former three routes. The failure proves
that the route is visible to the global HTTP boundary; it is not an M41 command
behavior regression.

## Requested narrow scope

The requested amendment is test-only and limited to
`packages/backend/tests/http-command-ingress.test.mjs`: add the fixed
`["/internal/provider-tools", "POST"]` inventory entry. It must also preserve
the existing assertions that there is no wildcard or `OPTIONS` route and that
the existing `/internal/commands` and public routes are unchanged.

M41 is not active at this head, and no active M51/M53/M54/S26/S36/S42/B04 card
reserves this test. This record requests an independent readiness review, then
a separate root-owned test-only activation. Until both exist, this path is not
authorized for modification. The amendment does not change command ingress,
schema, wallet/session authority, signature, environment, transaction,
deployment, or live behavior.

## Independent readiness verdict

Clear, subject to the separate root activation below. An independent reviewer
reproduced exactly one Node `22.21.1` failure in the closed inventory: the
actual route list adds only `["/internal/provider-tools", "POST"]`; the seven
other M41 assertions pass. M41 is `60-done`, not active, and no active card
reserves this test. The reviewer confirms this is a constrained M41
test-contract amendment, not a transfer of command behavior.

## Root test-only activation

The repository owner requested execution of the committed M55 plan in a new
PR. Root authorizes only the one inventory expectation in
`packages/backend/tests/http-command-ingress.test.mjs` to add
`["/internal/provider-tools", "POST"]`. The existing no-wildcard,
no-`OPTIONS`, command-route, and public-route assertions must remain. This
adds no source path or behavior outside the twelve already Green-authorized
Task 1 paths, and grants no environment, wallet, signature, transaction,
deployment, or live authority.
