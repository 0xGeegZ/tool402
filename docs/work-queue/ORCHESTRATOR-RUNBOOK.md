# Root orchestrator runbook

This clean repository is the sole implementation and runtime-queue authority. The root alone mutates queue state, STATE.md, decisions, human-action/import/evidence ledgers, and shared generated files/lockfiles.

Run at most three implementation lanes and one read-only review/investigation lane. Rescan the local inbox, queue states, STATE.md, human actions, and resource ownership at startup; before dispatch; after every task, review, or integration; when a lane frees; after resume; and before idle. Schedule runnable work in this order: required control/human blockers, critical-path CORE_P0, other highest-unlock CORE_P0, deadline-bound PRIZE_OPTIONAL, then POLISH. Do not run POST_HACKATHON while core work remains.

Before meaningful product behavior begins, create one small runtime-local Product Overview v0.1 item in 00-inbox, assign a normal gapped local ID, record its tier decision, and complete it.

Record only a local card and its minimum local specification/UI slice, validate completed dependencies, ownership, tier, and human actions, then move it to 10-ready. Root creates an eligible clean module worktree, dispatches, requests task review, integrates accepted changes, and records evidence.

For behavioral work, commit the minimum implementation-local specification before RED tests or implementation. Use: local specification, RED executable contract where applicable, minimal implementation, verification, independent review, and integration. Detailed specifications and UI manifests are imported or written only when their task is eligible.

After the accepted Product Overview, proceed only through dependency-satisfied foundation work. Before any product task enters 10-ready, record its accepted foundation/validation gates, target workspace boundary, and applicable reproducibility/integration proof.

Pause only for a recorded human action, destructive operation, unresolved core decision, mandatory sponsor-gate failure, provenance/security risk, or no eligible work. Resume from this repository Git state and STATE.md, not a chat transcript.
