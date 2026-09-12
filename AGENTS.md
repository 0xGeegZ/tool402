# Tool402 ETHOnline implementation agent rules

This clean repository is the implementation, runtime-queue, evidence, and submission authority. Committed local specifications and later in-event amendments are the local authority for behavior.

- Begin with the local CP-S00 queue authorities and resume from committed docs/work-queue/STATE.md, never chat history.
- The root alone mutates queue state; humans add new runtime tasks to docs/work-queue/queue/00-inbox.
- Record only local tasks, specifications, and UI slices that exist in this repository at the time of their commit.
- Use TDD, isolated worktrees for eligible module work, independent review, and targeted verification for each local task.
- Preserve human authority over wallets, accounts, funded/live actions, deployments, demo narration, and submission.
- No agent may treat uncommitted material, mock UI state, or copied artifact as runtime/evidence truth.

## Spec-driven delivery

Before meaningful product behavior lands, create and commit a runtime-local product overview through 00-inbox and the local task catalog. It is a current product brief, not a detailed system design.

Before implementing behavioral work, commit the minimum implementation-local specification. Use the sequence: eligible task, minimum local specification commit, RED executable contract where applicable, minimal implementation, targeted verification, independent review, and integration. Amend intended behavior in the specification before implementing it.

Only dependency-satisfied cards with disjoint ownership may run in parallel. Do not begin product work until the local queue records the accepted foundation, validation, workspace, and reproducibility/integration gates required by that card.

## Local runtime configuration

- Never tell a user that a local dev server is ready until its target route answers and its required runtime configuration has been verified.
- Before launching or reusing the web dev server, inspect the ignored local environment files without printing secrets. For the provider flow, verify the presence and consistency of `CONVEX_DEPLOYMENT`, `CONVEX_URL`, `CONVEX_SITE_URL`, and `TOOL402_CONVEX_SITE_URL`. For dashboard authentication, verify `TOOL402_DASHBOARD_AUTH_ORIGIN` and a valid `TOOL402_DASHBOARD_AUTH_SECRET`.
- Dashboard sign-in is deliberately fail-closed: Preview and production require an exact canonical HTTPS origin and a 64-character lower-case hexadecimal secret. The only HTTP exception is the documented development-only loopback contract; it must match the server's exact `http://localhost:<port>` origin and use its own non-`__Host` cookie names.
- When local dashboard sign-in is in scope, run the server with the exact configured scheme and origin, restart it after any environment change, and make a non-wallet request to the auth challenge route to distinguish a configured service from `503 not_configured`. Do not make wallet, signing, transaction, deployment, or other live actions while checking configuration.

## Local-reference boundary

Every tracked document reference must resolve to a file committed in this repository at the same commit. Before each non-empty commit, keep the local Git-metadata guard enabled. Do not disable or bypass it.
