# M55-T010 Task 1 readiness review

## Scope reviewed

This review applies only to Task 1 of the committed M55 implementation plan:
allocate and read provider-owned tool identities. It does not release or
activate Tasks 2–6.

- Review base and checked-out head: `5f21fc90e1a927317665a1c1bf245eb0f9457cd5`
  (`origin/main`, which includes issue #93 documentation PR #97).
- Workspace: isolated `feat/issue-93-provider-multi-tool-deployment` worktree.
- Baseline: Node `22.21.1`, `npm ci`, root `npm test`, and
  `npm run queue:check` all passed before M55 edits.
- No root-checkout change or generated `apps/web/next-env.d.ts` drift is in
  this review or candidate scope.

## Task 1 candidate reservation

The following paths are absent or have no active reservation at the reviewed
head. They are the complete Task 1 candidate set:

- `packages/core/src/provider-tool-identity.ts`
- `packages/core/test/provider-tool-identity.test.mjs`
- `packages/core/src/index.ts`
- `packages/backend/convex/provider_tools.ts`
- `packages/backend/convex/provider_session_ingress.ts`
- `packages/backend/convex/schema.ts`
- `packages/backend/convex/http.ts`
- `packages/backend/tests/provider-tools.test.mjs`
- `packages/backend/tests/provider-session-ingress.test.mjs`
- `apps/web/src/lib/provider-tools-server.ts`
- `apps/web/src/app/api/provider/tools/route.ts`
- `apps/web/tests/provider-tools-api.test.mjs`

Task 1 may add an identity record and protected owner read only. It must not
create an offering, campaign, ATS candidate, receipt, Directory version, or
issuer authority. It must retain the existing `/internal/commands` envelope
and command ingress unchanged: the new `/internal/provider-tools` handler is a
separately domain-bound server-session assertion endpoint.

## Collision map and retained owners

| Plan task | Active overlap at this head | Decision for this PR stage |
| --- | --- | --- |
| Task 1 — allocation/read | none in its exact candidate paths | Eligible for readiness and later test-only RED. |
| Task 2 — selected signed stages | M51 signing/admission/offerings, M54 signing/state/action, S26 session, S36 stages, B04 ATS boundaries | Blocked. No path transfer is recorded. |
| Task 3 — per-tool ATS config/hash/calldata | M51 offerings/command dispatch, M53 bridge, M54 recovery/action/state/signing, B04 ATS canonicality | Blocked. No path transfer is recorded. |
| Task 4 — receipts/exclusivity | M51 durable offering and command paths, M53 receipt bridge, M54 recovery/attachment, B04 protected input | Blocked. No path transfer is recorded. |
| Task 5 — Directory isolation | M51 offerings/Directory projection and `convex/command_dispatch.ts` | Blocked. No path transfer is recorded. |
| Task 6 — dashboard/UI | S42 dashboard, M51 resume/signing, M54 action/state/signing, S26 session, S36 stages, B04 ATS UI seams | Blocked. No path transfer is recorded. |

M51, M53, M54, S26, S36, S42, and B04 retain every current reservation. Their
code being present at this head is not acceptance or a transfer. A later M55
slice requires its own exact scoped release/transfer, co-review, readiness,
test-only RED, and RED acceptance before any Green source change.

## Readiness ruling

The accepted foundation, validator, workspace, and integration prerequisites
are present. Task 1 is suitable for an independent readiness review and, only
after that review is clear, a root-owned durable-RED activation on its four
new focused tests (one Core, two Backend, one Web). No M55 production source
or test path is active yet, and no
wallet, signature, authority provisioning, environment mutation, deployment,
or live action is authorized.
