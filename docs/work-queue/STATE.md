# Runtime queue state

- PRODUCT_OVERVIEW: accepted as P00-T010
- CURRENT_MODULE: M04 durable delivery (queued)
- CURRENT_TASK: M04-T020 (00-inbox)
- ACTIVE_LANES: none
- ACTIVE_WORKTREES: none
- LOCAL_SPECIFICATIONS: docs/specs/m01-root-workspace.md, docs/specs/m01-queue-check.md, docs/specs/m01-node-runtime-selection.md, docs/specs/m01-core-workspace.md, docs/specs/m01-backend-workspace.md, docs/specs/m01-web-workspace.md, docs/specs/m02-riskscan-contract.md, docs/specs/m02-riskscan-backend-projection.md, docs/specs/m02-riskscan-quick.md, docs/specs/m02-riskscan-x402-api.md, docs/specs/m03-riskscan-receipt-evidence.md, docs/specs/m03-riskscan-payment-state-provenance.md, docs/specs/m03-riskscan-settlement-observer.md, docs/specs/m04-riskscan-durable-schema.md, docs/specs/m04-riskscan-durable-request-admission.md
- LOCAL_UI_RECORDS: docs/ui/UI-S00.md, docs/ui/UI-S01.md, docs/ui/UI-S02.md, docs/ui/UI-S03.md, docs/ui/IMPORT-LEDGER.md
- PENDING_HUMAN_ACTIONS: none
- NEXT_ELIGIBLE_TASKS: M04-T020 is in 00-inbox. It has accepted local dependencies and a committed local specification/plan; readiness still requires a fresh root queue rescan, reserved-path check, and explicit 10-ready transition before RED work begins.
- LAST_QUEUE_VALIDATION: M04-T010 was accepted after root Node 22.21.1 verification, independent task review with a scoped Green re-review, and two fresh clean Standards/Spec module-review generations. M04-T020 is queued only; it must not be represented as persistence, verification, replay protection, evidence, or a live result.

No secrets, account keys, or private evidence belong in this file.
