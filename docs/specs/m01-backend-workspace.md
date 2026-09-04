# M01 Backend Workspace Foundation Specification

## Outcome

Create `@tool402/backend` as the local backend package boundary with a minimal Convex source directory and importable local entry point. It establishes ownership for future projections and protected backend operations without enabling a live backend.

## Boundary

The package may contain its manifest, strict TypeScript configuration, local source export, Convex source configuration, and focused tests. It must not create credentials, perform a deployment, commit generated API output, or export a public state-changing command. Domain rules and payment behavior remain outside this scaffold.

## Acceptance

1. Before creation, the backend workspace typecheck fails because the package boundary is absent.
2. The package typechecks, tests, lints, and exposes a local backend entry point without deployment side effects.
3. A boundary test rejects public state-changing command exports from the scaffold.
4. No account, payment, wallet, deployment, or live behavior is introduced.
