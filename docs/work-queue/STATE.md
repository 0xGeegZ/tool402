# Runtime queue state

- PRODUCT_OVERVIEW: accepted as P00-T010
- CURRENT_MODULE: M04 durable delivery (active)
- CURRENT_TASK: M04-T010 (20-active)
- ACTIVE_LANES: M04-T010 backend schema
- ACTIVE_WORKTREES: none
- LOCAL_SPECIFICATIONS: docs/specs/m01-root-workspace.md, docs/specs/m01-queue-check.md, docs/specs/m01-node-runtime-selection.md, docs/specs/m01-core-workspace.md, docs/specs/m01-backend-workspace.md, docs/specs/m01-web-workspace.md, docs/specs/m02-riskscan-contract.md, docs/specs/m02-riskscan-backend-projection.md, docs/specs/m02-riskscan-quick.md, docs/specs/m02-riskscan-x402-api.md, docs/specs/m03-riskscan-receipt-evidence.md, docs/specs/m03-riskscan-payment-state-provenance.md, docs/specs/m03-riskscan-settlement-observer.md, docs/specs/m04-riskscan-durable-schema.md
- LOCAL_UI_RECORDS: docs/ui/UI-S00.md, docs/ui/UI-S01.md, docs/ui/UI-S02.md, docs/ui/UI-S03.md, docs/ui/IMPORT-LEDGER.md
- PENDING_HUMAN_ACTIONS: none
- NEXT_ELIGIBLE_TASKS: none while M04-T010 owns the two backend schema paths. A later local durable writer/reconciliation card must be recorded separately after this schema card is accepted.
- LAST_QUEUE_VALIDATION: M04-T010 entered 20-active after a fresh root rescan and its pushed ready state. It begins with a schema-export RED contract and remains schema-only; no durable runtime state, replay protection, evidence, or live result is claimed.

No secrets, account keys, or private evidence belong in this file.
