# Runtime queue state

- PRODUCT_OVERVIEW: accepted as P00-T010
- CURRENT_MODULE: M04 durable delivery (active)
- CURRENT_TASK: M04-T040 (20-active)
- ACTIVE_LANES: M04-T040 candidate settlement-attempt writer
- ACTIVE_WORKTREES: none
- LOCAL_SPECIFICATIONS: docs/specs/m01-root-workspace.md, docs/specs/m01-queue-check.md, docs/specs/m01-node-runtime-selection.md, docs/specs/m01-core-workspace.md, docs/specs/m01-backend-workspace.md, docs/specs/m01-web-workspace.md, docs/specs/m02-riskscan-contract.md, docs/specs/m02-riskscan-backend-projection.md, docs/specs/m02-riskscan-quick.md, docs/specs/m02-riskscan-x402-api.md, docs/specs/m03-riskscan-receipt-evidence.md, docs/specs/m03-riskscan-payment-state-provenance.md, docs/specs/m03-riskscan-settlement-observer.md, docs/specs/m04-riskscan-durable-schema.md, docs/specs/m04-riskscan-durable-request-admission.md, docs/specs/m04-riskscan-internal-request-writer.md, docs/specs/m04-riskscan-candidate-settlement-attempt-writer.md
- LOCAL_UI_RECORDS: docs/ui/UI-S00.md, docs/ui/UI-S01.md, docs/ui/UI-S02.md, docs/ui/UI-S03.md, docs/ui/IMPORT-LEDGER.md
- PENDING_HUMAN_ACTIONS: none
- NEXT_ELIGIBLE_TASKS: none while M04-T040 owns its disjoint backend paths. The active task begins from the recorded admission RED contract and remains candidate-admission and internal writer code only.
- LAST_QUEUE_VALIDATION: M04-T040 passed the ready-state dependency, ownership, local specification/plan, human-boundary, and queue checks, then a fresh activation rescan. It must not be represented as a configured or live durable store, payment/settlement, finality, verification, evidence, or result.

No secrets, account keys, or private evidence belong in this file.
