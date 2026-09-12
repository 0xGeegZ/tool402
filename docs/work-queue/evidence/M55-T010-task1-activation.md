# M55-T010 Task 1 durable-RED activation

## Authority

The repository owner requested implementation of the committed M55 delegation
packet in a new PR. The independent Task 1 readiness review is clear at
control base `5f21fc90e1a927317665a1c1bf245eb0f9457cd5`.

## Exact active scope

M55-T010 moves to `20-active` for durable RED in these new tests only:

- `packages/core/test/provider-tool-identity.test.mjs`
- `packages/backend/tests/provider-tools.test.mjs`
- `packages/backend/tests/provider-session-ingress.test.mjs`
- `apps/web/tests/provider-tools-api.test.mjs`

The intended failures establish the absent identity allocator, protected
provider-session ingress, and dashboard-session API boundary. Every Task 1
source path remains prohibited until an independent RED review accepts the
observed failures. Tasks 2–6 and every M51/M53/M54/S26/S36/S42/B04 reservation
remain blocked or retained exactly as the Task 1 readiness review records.

This activation grants no environment mutation, wallet action, signature,
authority provisioning, transaction, deployment, or live action.
