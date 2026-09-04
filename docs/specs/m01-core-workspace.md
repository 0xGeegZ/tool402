# M01 Core Workspace Foundation Specification

## Outcome

Create `@tool402/core` as an importable, strict TypeScript pure-domain package. It establishes the location for later identifiers, amounts, state transitions, and invariants without implementing any product behavior yet.

## Boundary

The package may contain its manifest, TypeScript configuration, source export, and focused tests. It has no runtime I/O, React, database, protocol, SDK, network, environment, or filesystem import. Its compiler dependency is exact-pinned locally; no production dependency is authorized.

## Acceptance

1. Before creation, the core workspace typecheck fails because the package boundary is absent.
2. The package exports one typed foundation value from `src/index.ts` and can typecheck, test, and lint in isolation.
3. A boundary test rejects prohibited I/O or runtime-adapter imports from core source.
4. No product, payment, account, deployment, or live behavior is introduced.
