# M05-T010 RiskScan machine-readable Tool Directory implementation plan

> **Execution note:** The committed local specification and this plan are the
> authority. Run in the existing repository workspace because local policy
> prohibits creating a worktree without explicit human direction. The root owns
> queue changes, integration, and pushes. The implementer owns only the three
> paths below.

## Goal

Expose a minimal, truthful `GET /api/tools` discovery surface for exactly one
local RiskScan Quick descriptor. It lets a future local Consumer Agent discover
the endpoint, bounded request shape, limitations, and whether the local x402
configuration parser sees complete configuration. It remains strictly
discovery-only: it neither calls the tool nor makes a payment/live claim.

## Binding references

- Local contract: `docs/specs/m05-riskscan-tool-directory.md`
- Accepted Quick boundary:
  `docs/work-queue/queue/60-done/M02-T050-riskscan-quick.md`
- Accepted x402 API boundary:
  `docs/work-queue/queue/60-done/M02-T060-riskscan-x402-api.md`
- Existing configuration parser:
  `apps/web/src/lib/riskscan-x402.ts`

## Owned implementation paths

- `apps/web/src/lib/tool-directory.ts`
- `apps/web/src/app/api/tools/route.ts`
- `apps/web/tests/tool-directory-api.test.mjs`

Do not modify existing RiskScan API code/tests, UI, core/backend source,
schema, generated output, package/config/lock files, docs, queue records, or
any other path while implementing the task.

## Task 1 — Tool Directory endpoint and local descriptor

### Step 1: Write and observe the RED contract

Before either source path exists, create
`apps/web/tests/tool-directory-api.test.mjs`. Import the not-yet-existing
directory module and route, then run:

```sh
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test apps/web/tests/tool-directory-api.test.mjs
```

Record the missing-module failure as RED. Do not create the source module until
the test fails for that reason.

The RED contract must cover:

1. source-level contract coverage that the asynchronous `GET /api/tools` route
   imports and awaits `connection()` before passing `process.env` to the
   response helper, declares no legacy `dynamic` configuration, and the pure
   response helper produces the no-store JSON response. Do not invoke `GET`
   directly in the Node-only test because `connection()` requires a real Next
   request context;
2. an exact `version: "v1"` directory containing exactly one
   `riskscan.quick` descriptor with `POST /api/riskscan`, a required
   `requestRef`/`subjectRef`/`context`/`declarations` input object, bounded
   request fields, a required closed four-boolean declaration object, and both
   stated limitations;
3. an empty or malformed explicit environment returning only
   `{ state: "configuration_required" }` in `payment`;
4. a controlled valid explicit environment returning only
   `state`, `protocol`, `network`, and `price` in `payment`, never recipient or
   facilitator information;
5. serialized descriptor/route bodies that do not contain controlled recipient,
   facilitator, credential, payment-header/payload, wallet/account, transaction,
   receipt/evidence, or result values;
6. exactly one parser call per builder invocation and no usable-configuration,
   facilitator, payment wrapper, Quick handler, network, backend, durable-store,
   clock, random, or state-changing call; and
7. a stable pure response helper under absent configuration, without changing
   global process state; the root later verifies the actual route through a
   running Next request.

### Step 2: Implement the smallest pure directory builder and route

Create `apps/web/src/lib/tool-directory.ts` with a pure builder accepting an
explicit `NodeJS.ProcessEnv`, plus a response helper that returns JSON with
`cache-control: no-store`. The builder may import only
`readRiskScanX402Configuration` from the accepted local x402 helper. It must
not invoke its usability/facilitator or protected-handler functions.

Build an immutable exact descriptor for `riskscan.quick` matching the contract.
Use an input object with the four exact required top-level fields; its
`declarations` child is a required closed object with only the four exact
boolean properties. Use only the three bounded request string descriptors, two
limitation strings, and the two allowed `payment` union shapes.
The parser-null path returns exactly `configuration_required`; the valid-parser
path returns exactly `locally_configured`, `x402`, parsed network, and parsed
price. Never include parser `payTo` or `facilitatorUrl` in a returned object.

Create `apps/web/src/app/api/tools/route.ts` with an asynchronous `GET` route
that imports and awaits `connection()` from `next/server` before passing
`process.env` directly to that response helper. Do not export `dynamic`,
`revalidate`, or `fetchCache` under Cache Components. The route must not accept
a request body, call RiskScan, invoke x402, or add a POST/action route.

### Step 3: Turn the contract GREEN

Run focused web validation and then the workspace checks:

```sh
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test apps/web/tests/tool-directory-api.test.mjs
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck --workspace @tool402/web
env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/web
```

Inspect the exact three-file diff. Stage only those files, run the enabled
local-reference guard and cached whitespace check, then commit:

```text
feat: Add RiskScan Tool Directory
```

The implementation report must record the observed RED result, GREEN commands
and outcomes, commit SHA, exact changed paths, self-review, and preserved
constraints. It must state only controlled local behavior, never configured
runtime/directory registration/payment/settlement/verification/finality/evidence/
result/deployment/live behavior.

## Root-owned integration after Task 1

1. Generate a frozen review package from the task base through the task commit.
2. Obtain an independent task review. Resolve every finding with a scoped
   correction and fresh re-review before acceptance.
3. Run root Node 22.21.1 `npm run typecheck`, `npm test`, and `npm run lint`.
   Run `npx --no-install next build --webpack` in `apps/web` after root
   typecheck, then verify `GET /api/tools` through a running Next request in a
   browser or equivalent real HTTP client. Run `npm run queue:check`, the
   enabled local-reference guard, and whitespace checks.
4. Obtain two fresh final Standards/Spec review generations against the exact
   module diff.
5. If every required result is clean, move the card to `60-done`, record
   validation/review evidence without external/live claims, commit root
   integration, push, and verify the remote `main` SHA.
