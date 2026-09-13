# Tool402 documentation map

Start with the [product overview](product/OVERVIEW.md) and the
[runtime queue](work-queue/README.md). The queue's
[current state](work-queue/STATE.md), [task catalog](work-queue/TASK-CATALOG.md),
and [human actions](work-queue/HUMAN-ACTIONS.md) are the current local control
records.

Implementation-local contracts are under `specs/`; UI manifests and
their [ledger](ui/IMPORT-LEDGER.md) are under `ui/`. Submission-oriented
runbooks and evidence boundaries are under [submission](submission/README.md).

Historical plans and evidence remain auditable but do not override the current
queue records.
