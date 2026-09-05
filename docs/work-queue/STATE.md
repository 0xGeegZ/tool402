# Runtime queue state

- PRODUCT_OVERVIEW: accepted as P00-T010
- CURRENT_MODULE: M06 Hedera testnet x402 service path
- CURRENT_TASK: M06-T010 (20-active)
- ACTIVE_LANES: M06-T010 Task 1 — native configuration and server registration
- ACTIVE_WORKTREES: none
- LOCAL_SPECIFICATIONS: docs/specs/m01-root-workspace.md, docs/specs/m01-queue-check.md, docs/specs/m01-node-runtime-selection.md, docs/specs/m01-core-workspace.md, docs/specs/m01-backend-workspace.md, docs/specs/m01-web-workspace.md, docs/specs/m02-riskscan-contract.md, docs/specs/m02-riskscan-backend-projection.md, docs/specs/m02-riskscan-quick.md, docs/specs/m02-riskscan-x402-api.md, docs/specs/m03-riskscan-receipt-evidence.md, docs/specs/m03-riskscan-payment-state-provenance.md, docs/specs/m03-riskscan-settlement-observer.md, docs/specs/m04-riskscan-durable-schema.md, docs/specs/m04-riskscan-durable-request-admission.md, docs/specs/m04-riskscan-internal-request-writer.md, docs/specs/m04-riskscan-candidate-settlement-attempt-writer.md, docs/specs/m04-riskscan-pending-verification-settlement-record-writer.md, docs/specs/m04-riskscan-pending-settlement-reader.md, docs/specs/m04-riskscan-pending-reconciliation-selector.md, docs/specs/m05-riskscan-tool-directory.md, docs/specs/m05-tool-loop-agent-discovery.md, docs/specs/m05-tool-loop-agent-challenge-observation.md, docs/specs/m06-riskscan-hedera-x402.md
- LOCAL_UI_RECORDS: docs/ui/UI-S00.md, docs/ui/UI-S01.md, docs/ui/UI-S02.md, docs/ui/UI-S03.md, docs/ui/IMPORT-LEDGER.md
- PENDING_HUMAN_ACTIONS: none
- NEXT_ELIGIBLE_TASKS: M06-T010 Task 1 is active. It owns only native configuration/server registration with controlled RED/GREEN tests and root-only lockfile integration. Do not dispatch M06 Task 2 until Task 1 has passed independent task review; do not create another M04 persistence or reconciliation task while this CORE_P0 payment compatibility path is runnable.
- LAST_QUEUE_VALIDATION: M06-T010 activated after a fresh rescan confirmed pushed ready state `4c85e89`, M02-T060/M03-T030/M05-T010/M05-T020/M05-T030 and decision evidence accepted, no other active lane, root-only lockfile integration, disjoint web/Agent ownership, no pending human action, and queue validation. The active boundary remains local unsigned seller compatibility only: no real recipient/facilitator configuration, wallet/account/key action, payment, transaction, deployment, or live claim is authorized.

No secrets, account keys, or private evidence belong in this file.
