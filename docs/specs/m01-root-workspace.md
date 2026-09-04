# M01 Root Workspace Foundation Specification

## Status and authority

This is the minimum local foundation specification for M01-T010. It is authoritative only for the constrained root workspace described here. It does not authorize product behavior, external integration, account setup, funding, wallet use, payment, testnet activity, deployment, or submission.

The accepted Product Overview precedes this specification. M01-T010 is the first technical task; M01-T090 remains a later required validation gate before broader foundation lanes may begin.

## Outcome

The repository gains one npm root workspace boundary that can safely host later independent application and package cards. The boundary is declarative only: it contains no application or package implementation, no dependencies, and no generated product output.

## Toolchain and workspace contract

- The root requires Node 22 and npm 10. Its engine ranges are >=22 <23 and >=10 <11; its package-manager declaration is npm 10.9.4.
- The workspace list is exactly apps/* followed by packages/*.
- The root is private and has no runtime, development, optional, or peer dependencies.
- npm exact-version saving and engine enforcement are enabled at the root.
- The root exposes typecheck, lint, test, and build scripts. Each forwards only to declared workspaces and tolerates the intentionally empty workspace set.
- The root exposes queue:check as a future validator contract. It must fail visibly until M01-T090 creates the validator; M01-T010 does not add a placeholder or validator file.

## Allowed and forbidden change boundary

M01-T010 may create the root manifest, root lockfile, root npm configuration, and a root README update. It may update this task's local queue/control records.

It must not create application or package directories, preload web/UI/backend/agent/payment dependencies, add a build orchestrator, add a queue validator, generate build output, or implement product behavior. A lockfile-only metadata command is allowed; installing dependencies or asserting a clean-install proof is deferred to the later reproducibility gate.

## Smoke and validation contract

Before the root boundary exists, capture the RED condition: the workspace manifest and quality scripts are unavailable. After the constrained scaffold:

1. The Node 22/npm 10 runtime check passes.
2. The workspace query reports exactly the two declared workspace globs.
3. The workspace typecheck fan-out exits successfully with no application/package directories present.
4. An unknown-workspace invocation exits nonzero.
5. The manifest contains no ranged dependency declaration; this is vacuously true until later cards add dependencies and remains a boundary rule afterward.
6. The queue-validation command exits nonzero because its validator is intentionally not present yet.
7. Whitespace and the local reference guard pass before commit.

M01-T010 is accepted only after an independent task review verifies this boundary and its evidence. It does not make M01-T020, M01-T030, or M01-T040 eligible; M01-T090 must be accepted first.

## Evidence and failure semantics

The root boundary may represent only three truthful states: absent before scaffold, declared after the root records exist, and validator-deferred until M01-T090. A missing validator is a visible failure, never a passing mock. Any failure of the exact workspace list, required toolchain, or root quality scripts blocks acceptance and requires this specification to be amended before a broader change.
