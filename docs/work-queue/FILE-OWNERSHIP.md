# Runtime file and resource ownership

CP-S00 reserves docs/work-queue, AI_USAGE.md, generated files, and lockfiles to the root integrator. Local task cards declare owned paths and resource locks before entering 10-ready.

M00-T070 reserves its card, qualification matrix, STATE.md, HUMAN-ACTIONS.md, DECISIONS.md, TASK-CATALOG.md, and AI_USAGE.md to the root integrator. M00-T080 declares its card, STATE.md, FILE-OWNERSHIP.md, TASK-CATALOG.md, DECISIONS.md, and HUMAN-ACTIONS.md as root-only paths when it becomes active.

Two active implementation cards must have disjoint owned paths and resource boundaries. Shared-file work is an explicit root integration reservation. Wallets, credentials, funded accounts, partner configuration, and deployments remain human-controlled resources; no card or agent infers authority over them.
