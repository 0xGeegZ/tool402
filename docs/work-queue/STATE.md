# Runtime queue state

- PRODUCT_OVERVIEW: accepted as P00-T010
- CURRENT_MODULE: M05 agent-facing discovery (active)
- CURRENT_TASK: M05-T020 (20-active)
- ACTIVE_LANES: M05-T020 ToolLoopAgent RiskScan discovery
- ACTIVE_WORKTREES: none
- LOCAL_SPECIFICATIONS: docs/specs/m01-root-workspace.md, docs/specs/m01-queue-check.md, docs/specs/m01-node-runtime-selection.md, docs/specs/m01-core-workspace.md, docs/specs/m01-backend-workspace.md, docs/specs/m01-web-workspace.md, docs/specs/m02-riskscan-contract.md, docs/specs/m02-riskscan-backend-projection.md, docs/specs/m02-riskscan-quick.md, docs/specs/m02-riskscan-x402-api.md, docs/specs/m03-riskscan-receipt-evidence.md, docs/specs/m03-riskscan-payment-state-provenance.md, docs/specs/m03-riskscan-settlement-observer.md, docs/specs/m04-riskscan-durable-schema.md, docs/specs/m04-riskscan-durable-request-admission.md, docs/specs/m04-riskscan-internal-request-writer.md, docs/specs/m04-riskscan-candidate-settlement-attempt-writer.md, docs/specs/m04-riskscan-pending-verification-settlement-record-writer.md, docs/specs/m04-riskscan-pending-settlement-reader.md, docs/specs/m04-riskscan-pending-reconciliation-selector.md, docs/specs/m05-riskscan-tool-directory.md, docs/specs/m05-tool-loop-agent-discovery.md
- LOCAL_UI_RECORDS: docs/ui/UI-S00.md, docs/ui/UI-S01.md, docs/ui/UI-S02.md, docs/ui/UI-S03.md, docs/ui/IMPORT-LEDGER.md
- PENDING_HUMAN_ACTIONS: none
- NEXT_ELIGIBLE_TASKS: no additional implementation card may start while M05-T020 owns the agent boundary and root lockfile integration reservation; do not automatically create another M04 persistence or reconciliation card.
- LAST_QUEUE_VALIDATION: M05-T020 was activated after a fresh rescan confirmed its pushed ready state, no active lane, accepted M05-T010/M02-T050/M02-T060 dependencies and integration evidence, and disjoint agent/lockfile ownership. It starts only with the local RED contract; no live endpoint assertion, request submission, payment/signing/wallet/account action, deployment, transaction verification, finality, evidence, result, or external action is authorized.

No secrets, account keys, or private evidence belong in this file.
