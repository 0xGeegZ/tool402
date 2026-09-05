# ToolLoopAgent RiskScan Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a headless Consumer Agent that can safely discover and select the
local RiskScan Quick descriptor without submitting a request or making a
payment.

**Architecture:** A new standalone `apps/agent` workspace owns one injected
fetch discovery adapter. It fetches only the machine-readable directory,
validates its exact local contract, and returns a cloned typed selection or a
fail-closed outcome. The provider web app, pure core package, and backend stay
dependency-only and unchanged.

**Tech Stack:** Node 22.21.1, TypeScript 5.9.3 with NodeNext typechecking, and
the built-in Node test runner with controlled `Response` fixtures.

**Spec:** `docs/specs/m05-tool-loop-agent-discovery.md`

## Global Constraints

- Work in the existing repository workspace; local policy prohibits creating a
  worktree without explicit human direction.
- Add no runtime dependency and do not import `@tool402/core`, x402, the web
  provider, backend, environment, wallet, signer, facilitator, or persistence
  code.
- The agent may issue exactly one injected `GET /api/tools` with no body,
  credentials, authorization, or payment header; it must never issue a POST or
  initiate a request/payment/signing path.
- Validate the exact M05 Tool Directory contract and return only cloned safe
  metadata. Do not echo a response body, URL, header, error, or unknown field.
- The task implementer owns only the five agent-workspace paths below. The root
  alone owns `package-lock.json`, queue records, specifications, plans,
  decisions, reviews, integration, commits outside the task scope, and pushes.

---

### Task 1: ToolLoopAgent safe discovery boundary

**Files:**

- Create: `apps/agent/package.json`
- Create: `apps/agent/tsconfig.json`
- Create: `apps/agent/src/riskscan-tool-directory.ts`
- Create: `apps/agent/test/riskscan-tool-directory.test.mjs`
- Create: `apps/agent/test/boundary.test.mjs`

**Interfaces:**

- Consumes: an explicit `URL` and optional
  `RiskScanDirectoryFetcher(input: URL, init: RequestInit): Promise<Response>`.
- Produces: `discoverRiskScanQuick(serviceBase, fetcher)` and the exact
  `RiskScanConsumerDiscovery` union defined in
  `docs/specs/m05-tool-loop-agent-discovery.md`.

- [ ] **Step 1: Write the failing discovery and boundary contracts**

  Create the test file before source exists. Add a canonical directory fixture
  with the exact one `riskscan.quick` descriptor and fixtures for both payment
  states. The first test must call the not-yet-existing export with a controlled
  `Response.json` fetcher and expect the selected descriptor. Add tests that
  assert the fetcher receives only:

  ```js
  new URL("http://service.test/api/tools")
  {
    method: "GET",
    headers: { accept: "application/json" },
    credentials: "omit",
    redirect: "error",
  }
  ```

  Add negative cases for a credential-bearing or non-HTTP base, rejected
  fetch, non-200 response, missing JSON content type, invalid JSON, unknown or
  extra directory fields, incomplete request/declarations metadata, invalid
  payment metadata, and directory mutation after selection. Each negative case
  must assert a safe `directory_invalid` or `directory_unavailable` result and
  no extra fetch call. Add a boundary test that reads the source and rejects
  `POST`, `body:`, payment/authorization headers, x402, wallet, signer,
  account, `process.env`, backend, timer, retry, and dynamic import use.

- [ ] **Step 2: Observe RED**

  Run:

  ```sh
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test apps/agent/test/*.test.mjs
  ```

  Expected: FAIL because `apps/agent/src/riskscan-tool-directory.ts` does not
  yet exist. Record that exact missing-module failure before creating source.

- [ ] **Step 3: Create the minimal standalone workspace**

  Create a private `@tool402/agent` ESM workspace with `typecheck`, `test`,
  and `lint` scripts. Pin only `typescript` `5.9.3` and `@types/node`
  `22.15.0` as development dependencies. Use a strict NodeNext no-emit
  `tsconfig.json` with `target` `ES2022`, `allowImportingTsExtensions`,
  `isolatedModules`, `erasableSyntaxOnly`, and `verbatimModuleSyntax`. Do not
  add a CLI, build script, or runtime package dependency.

- [ ] **Step 4: Implement the typed one-shot discovery adapter**

  In `riskscan-tool-directory.ts`, define only the public fetcher, payment,
  descriptor, selection, and result types needed by the specification. Reject
  an unsupported base before fetch. Call the injected/default fetcher once
  with `new URL("/api/tools", serviceBase)` and the exact GET init above;
  convert a rejection or non-200 status to `directory_unavailable`.

  Require JSON content before decoding. Use descriptor-safe own enumerable data
  checks and exact-key validation for every object/array in the M05 directory.
  Return `directory_invalid` for decode/schema failures without throwing or
  exposing remote data. On success, construct a new selection from fixed
  descriptor literals plus validated `network` and `price`; never retain or
  return the decoded object.

- [ ] **Step 5: Turn the contracts GREEN**

  Run:

  ```sh
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test apps/agent/test/*.test.mjs
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck --workspace @tool402/agent
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/agent
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run lint --workspace @tool402/agent
  ```

  Inspect only the five owned files. Stage only those paths, run the enabled
  local-reference guard and cached whitespace check, then commit:

  ```text
  feat: Add ToolLoopAgent Discovery
  ```

  Report the observed RED, Green commands, exact changed paths, commit SHA,
  self-review, and preserved non-payment boundary. Do not claim a configured
  runtime, directory registration, payment, request execution, settlement,
  verification, finality, evidence, result, deployment, or live behavior.

## Root-owned integration after Task 1

1. Update only the root lockfile for the committed workspace using the pinned
   Node/npm runtime, then validate a clean install without scripts.
2. Generate the immutable module diff from the task base through the task
   commit and obtain an independent task review against this card and the local
   specification.
3. Run agent/root Node 22.21.1 typecheck/test/lint, production web Webpack
   build, `npm run queue:check`, the enabled local-reference guard, and
   whitespace checks. Exercise the agent against the running local directory
   through a real local HTTP request; it must select only the advertised
   fail-closed state and make no RiskScan request.
4. Obtain two fresh final Standards/Spec review generations against the exact
   module diff. Resolve every valid finding with a scoped TDD correction and a
   fresh review generation.
5. If every result is clean, move the card to `60-done`, record only local
   evidence, commit root acceptance, push, and verify remote `main`.
