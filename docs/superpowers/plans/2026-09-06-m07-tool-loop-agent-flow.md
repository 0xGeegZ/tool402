# ToolLoopAgent RiskScan Discovery-to-Challenge Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compose the accepted Agent discovery and unsigned challenge phases
into one truthful local RiskScan flow without adding payment capability.

**Architecture:** A new Agent module makes one call to the existing strict
directory discovery function and passes its opaque union directly to the
existing strict challenge observer. Each sub-boundary owns its validation and
I/O. The new module exposes no descriptor or payment data and has no state.

**Tech Stack:** Node 22.21.1, TypeScript 5.9.3 with NodeNext typechecking, and
the built-in Node test runner with controlled `Response` fixtures.

**Spec:** `docs/specs/m07-tool-loop-agent-flow.md`

## Global Constraints

- Work in the current repository workspace; the local policy prohibits a
  worktree without explicit human direction.
- Add no dependency and do not modify accepted Agent discovery/challenge,
  core, web provider, backend, UI, package metadata, lockfile, or runtime
  configuration.
- Delegate first to `discoverRiskScanQuick`, then only to
  `requestRiskScanQuickChallenge`; never inspect `discovery.tool` or payment
  metadata and never duplicate their validation.
- The public result is only the accepted challenge-outcome union. Never
  expose a URL, header, body, credential, recipient, facilitator, payment
  payload, wallet/account material, transaction, receipt, evidence, or result.
- Never construct/decode payment or authorization material, import x402 or a
  Hedera client, access wallet/account/signer/environment/backend state, add a
  retry/timer/CLI, read a response body, execute a payment, or claim live
  behavior.
- The implementer owns only the three Agent paths below. The root alone owns
  documentation, queue records, reviews, integration evidence, commits outside
  those paths, and pushes.

---

### Task 1: ToolLoopAgent discovery-to-challenge composition

**Files:**

- Create: `apps/agent/src/riskscan-tool-flow.ts`
- Create: `apps/agent/test/riskscan-tool-flow.test.mjs`
- Create: `apps/agent/test/riskscan-tool-flow-boundary.test.mjs`

**Interfaces:**

- Consumes: `discoverRiskScanQuick`, `RiskScanDirectoryFetcher`,
  `requestRiskScanQuickChallenge`, `RiskScanChallengeSender`, explicit
  service `URL`, and unknown caller input.
- Produces: `runRiskScanQuickFlow(serviceBase, input, directoryFetcher?,
  challengeSender?)` and the exact `RiskScanToolFlowOutcome` alias specified
  in the local contract.

- [x] **Step 1: Write failing flow and boundary contracts**

  Create both test files before the source module exists. Build a controlled
  native directory `Response` containing only the accepted RiskScan descriptor
  and the safe `hedera:testnet` asset/amount summary. Assert one directory
  sender receives the exact credential-free GET, one challenge sender then
  receives the exact unsigned POST, and a nonblank controlled challenge header
  results only in `{ kind: "payment_required" }`. The test must not print or
  return that header.

  Add zero-challenge-sender-call cases for directory rejection, non-200,
  malformed directory, invalid selected flow input, and invalid base. Add
  selected-path cases for challenge rejection, `503`, blank/missing challenge,
  and non-`402` responses. Assert an injected sender cannot mutate the next
  invocation's URL/init. Add a source boundary test that permits only imports
  of the two accepted Agent modules and rejects x402, payment/authorization
  header handling, wallet/account/signer/environment/backend access, timer,
  retry, CLI, body read, result handling, and hidden side effects.

- [x] **Step 2: Observe RED**

  Run:

  ```sh
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test apps/agent/test/riskscan-tool-flow*.test.mjs
  ```

  Expected: FAIL because `apps/agent/src/riskscan-tool-flow.ts` does not
  exist. Record the exact missing-module failure before creating source.

- [x] **Step 3: Implement the thin, stateless composition**

  Define only the outcome alias and public flow function. Call the discovery
  function once with its assigned sender, then pass its returned union and the
  untouched caller input to the challenge function with its assigned sender.
  Return the challenge outcome without reading its internals. Do not add an
  intermediate cache, validation copy, output conversion, error text, or I/O.

- [x] **Step 4: Turn the contracts GREEN and commit**

  Run:

  ```sh
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test apps/agent/test/riskscan-tool-flow*.test.mjs
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck --workspace @tool402/agent
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/agent
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run lint --workspace @tool402/agent
  ```

  Inspect only the three owned paths. Stage only those paths, run the enabled
  local-reference guard and cached whitespace check, then commit:

  ```text
  feat: add ToolLoopAgent RiskScan flow
  ```

  Report the observed RED, Green commands, exact changed paths, commit SHA,
  self-review, and preserved non-payment/non-result boundary. Do not claim a
  configured runtime, payment capability, result, settlement, verification,
  finality, evidence, deployment, or live behavior.

## Root-owned integration after Task 1

1. Confirm no package or lockfile change is required, then create the
   immutable task review package from the active-card base through the task
   commit.
2. Obtain an independent task review against this card and its local
   specification. Resolve every valid finding with TDD and a scoped re-review.
3. Run Agent/root Node 22.21.1 typecheck/test/lint, production web Webpack
   build, `npm run queue:check`, the enabled local-reference guard, and
   whitespace checks. Exercise the flow with the controlled native directory
   and unsigned `402`; record only the terminal outcome and request count.
4. Obtain two fresh final Standards/Spec review generations against the exact
   module diff. Resolve every valid finding with a scoped TDD correction and a
   fresh review generation.
5. If every result is clean, move the card to `60-done`, record only local
   evidence, commit root acceptance, push, and verify remote `main`.
