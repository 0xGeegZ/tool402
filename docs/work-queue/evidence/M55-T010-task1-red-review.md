# M55-T010 Task 1 independent RED review

## Verdict

Clear for Task 1 Green only.

At Node `22.21.1`, the focused durable-RED contracts report exactly the absent
Task 1 boundaries: three Core missing-export failures, two Backend
missing-module failures with thirteen source-dependent contracts skipped, and
one Web missing-module-pair failure with six source-dependent contracts
skipped. `git diff --check` is clear.

The review required and confirmed the POST-only internal route, domain-bound
MAC, replay/stale/expired/forged/body-changed rejection, propagated session
expiry, allocation replay/revocation/distinct-ID/concurrency/collision behavior,
owner-scoped list/read, configured session-cookie extraction, and GET cursor or
tool reads. Duplicate/malformed cookies and a 1 KiB streamed-body boundary may
be added during Green; they do not invalidate the accepted RED contract.

## Green scope

The exact twelve Task 1 paths in
`M55-T010-task1-readiness-review.md` may receive minimal implementation:
two Core paths, Core index export, two Backend Convex modules, Backend schema
and HTTP router, two Backend tests, a Web server helper, Web API route, and
the Web API test. All other paths, particularly Tasks 2–6 and
M51/M53/M54/S26/S36/S42/B04 reservations, remain excluded. No environment,
wallet, signature, transaction, deployment, or live action is authorized.
