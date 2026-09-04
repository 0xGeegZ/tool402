# M01 Root Workspace Foundation Specification

## Status and authority

This is the minimum local foundation specification for M01-T010. It is authoritative only for the constrained root workspace described here. It does not authorize product behavior, external integration, account setup, funding, wallet use, payment, testnet activity, deployment, or submission.

The accepted Product Overview precedes this specification. M01-T010 is the first technical task; M01-T090 remains a later required validation gate before broader foundation lanes may begin.

## Outcome

The repository gains one npm root workspace boundary that can safely host later independent application and package cards. The boundary is declarative only: it contains no application or package implementation or generated product output. The only permitted foundation dependency is the controlled M01-T090 Markdown-parser exception below.

## Toolchain and workspace contract

- The root requires Node 22 and npm 10. Its engine ranges are >=22 <23 and >=10 <11; its package-manager declaration is npm 10.9.4.
- The workspace list is exactly apps/* followed by packages/*.
- The root is private and has no runtime, optional, or peer dependencies. It has no development dependencies except the M01-T090-controlled exact `marked` version specified below.
- npm exact-version saving and engine enforcement are enabled at the root.
- The root exposes typecheck, lint, test, and build scripts. Each no-ops only while both workspace roots are absent; once either root exists, it forwards only to declared workspaces. This tolerates npm's nonzero empty-workspace behavior without hiding a later workspace failure.
- The root exposes queue:check as a future validator contract. It must fail visibly until M01-T090 creates the validator; M01-T010 does not add a placeholder or validator file.

### M01-T090 controlled parser exception

After this specification and the M01-T090 specification are amended, M01-T090 may add exactly `marked@18.0.11` as the sole root development dependency and update the root lockfile. The parser is used only to read committed local Markdown records for `queue:check`; it is not product/runtime behavior and makes no network request at command execution. No other direct dependency, runtime dependency, workspace dependency, or package directory is authorized by this exception.

## Allowed and forbidden change boundary

M01-T010 may create the root manifest, root lockfile, root npm configuration, and a root README update. It may update this task's local queue/control records. The root integrator alone may apply the controlled M01-T090 parser exception to the manifest and lockfile after its committed local specification amendment.

It must not create application or package directories, preload web/UI/backend/agent/payment dependencies, add a build orchestrator, generate build output, or implement product behavior. Apart from the controlled parser exception, installing dependencies or asserting a clean-install proof is deferred to the later reproducibility gate.

## Smoke and validation contract

Before the root boundary exists, capture the RED condition: the workspace manifest and quality scripts are unavailable. After the constrained scaffold:

1. The Node 22/npm 10 runtime check passes.
2. The workspace query reports exactly the two declared workspace globs.
3. The root typecheck command exits successfully with no application/package directories present. Once a workspace root exists, that command fans out only to declared workspaces.
4. An unknown-workspace invocation exits nonzero.
5. The manifest contains no ranged dependency declaration. During M01-T090 parser migration, its only dependency is exact `marked@18.0.11` in devDependencies; all other dependency sections remain absent.
6. The queue-validation command exits nonzero because its validator is intentionally not present yet.
7. Whitespace and the local reference guard pass before commit.

M01-T010 is accepted only after an independent task review verifies this boundary and its evidence. It does not make M01-T020, M01-T030, or M01-T040 eligible; M01-T090 must be accepted first.

## Evidence and failure semantics

The root boundary may represent only three truthful states: absent before scaffold, declared after the root records exist, and validator-deferred until M01-T090. A missing validator is a visible failure, never a passing mock. The controlled parser exception is the sole later M01 foundation amendment to the original dependency-free state. Any failure of the exact workspace list, required toolchain, parser boundary, or root quality scripts blocks acceptance and requires this specification to be amended before a broader change.
