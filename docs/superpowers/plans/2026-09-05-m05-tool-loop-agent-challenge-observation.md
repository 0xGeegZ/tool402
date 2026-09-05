# ToolLoopAgent RiskScan Challenge Observation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a headless Consumer Agent phase that sends one safe unsigned
RiskScan Quick request and observes only bounded availability or challenge
states.

**Architecture:** A new standalone agent module consumes the accepted local
discovery union but derives neither route nor protocol data from it. It clones
and validates caller input before sending one fixed POST through an injected
sender, then maps status-only response facts into a detail-free local union.
It never handles payment material or a successful result.

**Tech Stack:** Node 22.21.1, TypeScript 5.9.3 with NodeNext typechecking, and
the built-in Node test runner with controlled `Response` fixtures.

**Spec:** `docs/specs/m05-tool-loop-agent-challenge-observation.md`

## Global Constraints

- Work in the existing repository workspace; the local policy prohibits a
  worktree without explicit human direction.
- Add no dependency and do not modify the accepted discovery source, core,
  web provider, backend, UI, package metadata, lockfile, or runtime
  configuration.
- Use the supplied discovery union only to propagate its two failures or allow
  a selected path. Snapshot its exact outer own-data shape before all other
  work: a failure is exactly `{ kind }`; a selected outcome is exactly
  `{ kind, tool }`, with `tool` opaque and never read. Never derive target,
  method, headers, payment, or provider data from its descriptor.
- Issue at most one injected POST to the fixed `/api/riskscan` target, with
  only the exact JSON request body and `accept`/`content-type` headers.
- Never construct or decode payment/authorization headers or payloads, import
  x402, access wallet/account/signer/environment/backend, read a response
  body, release a result, or retry.
- The task implementer owns only the three files below. The root alone owns
  documentation, queue records, reviews, integration evidence, commits outside
  that scope, and pushes.

---

### Task 1: ToolLoopAgent unsigned challenge observation

**Files:**

- Create: `apps/agent/src/riskscan-tool-challenge.ts`
- Create: `apps/agent/test/riskscan-tool-challenge.test.mjs`
- Create: `apps/agent/test/riskscan-tool-challenge-boundary.test.mjs`

**Interfaces:**

- Consumes: `RiskScanConsumerDiscovery` from the accepted local discovery
  module, an explicit base `URL`, unknown caller input, and an optional
  `RiskScanChallengeSender(input: URL, init: RequestInit): Promise<Response>`.
- Produces: `requestRiskScanQuickChallenge(serviceBase, selection, input,
  sender)` and the exact `RiskScanConsumerChallengeOutcome` union in the local
  specification.

- [ ] **Step 1: Write failing challenge and boundary contracts**

  Create both test files before the source module exists. Add a selected
  discovery fixture and fixtures for its two failure outcomes. Add an exact
  valid Quick input fixture. Assert the selected case makes only:

  ```js
  new URL("http://service.test/api/riskscan")
  {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      requestRef: "request-agent-42",
      subjectRef: "service:tool402",
      context: "caller disclosure review",
      declarations: {
        identity: true,
        pricing: true,
        limitations: true,
        evidence: true,
      },
    }),
    credentials: "omit",
    redirect: "error",
  }
  ```

  Add zero-call cases for each discovery failure, non-plain/missing/extra/
  accessor/non-enumerable/unsafe input, invalid or hostile base, throwing URL
  conversion, and a derived non-HTTP or userinfo target. Add zero-call cases
  for throwing `kind`/Proxy selection facades and selection objects with extra,
  missing, inherited, accessor-backed, non-enumerable, or symbol fields. The
  exact selected outer shell contains only own data `kind` and opaque `tool`;
  its descriptor contents must never be read. Add a mutation test proving a
  sender cannot poison the next init. Assert a rejected sender maps
  to `transport_failure`; `503` maps to `unavailable`; a `402` with a nonblank
  challenge header maps to `payment_required`; blank/missing challenge header,
  `200`, `400`, other status, and hostile response metadata map to
  `unexpected_response`. Use response fixtures whose body reader throws, and
  assert it is never called. Add a source boundary test that permits the one
  JSON POST but rejects authorization/payment outbound header construction or
  decoding, x402, wallet/account/signer/environment/backend/timer/retry/
  dynamic-import/CLI/result/body-read behavior.

- [ ] **Step 2: Observe RED**

  Run:

  ```sh
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test apps/agent/test/*.test.mjs
  ```

  Expected: FAIL because `apps/agent/src/riskscan-tool-challenge.ts` does not
  exist. Record the exact missing-module failure before creating source.

- [ ] **Step 3: Implement exact local snapshot, target, and observation helpers**

  Define only the sender, outcome union, local input snapshot, safe target,
  fresh init, and public request function. Snapshot the exact outer discovery
  shape, then snapshot exact own enumerable input fields into a new local input
  object before JSON serialization. Validate both base and derived target
  before the sender. Propagate only the two discovery failures before input or
  target work; otherwise issue the one exact POST. Read only `status` and, for
  `402`, a nonblank challenge-header presence; do
  not return or decode that value. Never call `json`, `text`, `arrayBuffer`,
  `blob`, or `formData` on the response.

- [ ] **Step 4: Turn the contracts GREEN**

  Run:

  ```sh
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH node --test apps/agent/test/*.test.mjs
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run typecheck --workspace @tool402/agent
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run test --workspace @tool402/agent
  env PATH=/Users/guillaumedieudonne/.nvm/versions/node/v22.21.1/bin:$PATH npm run lint --workspace @tool402/agent
  ```

  Inspect only the three owned paths. Stage only those paths, run the enabled
  local-reference guard and cached whitespace check, then commit:

  ```text
  feat: Add ToolLoopAgent Challenge Observation
  ```

  Report the observed RED, Green commands, exact changed paths, commit SHA,
  self-review, and preserved non-payment/non-result boundary. Do not claim a
  configured runtime, payment capability, result, settlement, verification,
  finality, evidence, deployment, or live behavior.

## Root-owned integration after Task 1

1. Confirm no package or lockfile change is required, then create the immutable
   task review package from the active-card base through the task commit.
2. Obtain an independent task review against this card and its local
   specification. Resolve every valid finding with TDD and a scoped re-review.
3. Run Agent/root Node 22.21.1 typecheck/test/lint, production web Webpack
   build, `npm run queue:check`, the enabled local-reference guard, and
   whitespace checks. Exercise discovery followed by the challenge function
   against the local Next route; absent configuration must produce only
   `unavailable` and no payment action.
4. Obtain two fresh final Standards/Spec review generations against the exact
   module diff. Resolve every valid finding with a scoped TDD correction and a
   fresh review generation.
5. If every result is clean, move the card to `60-done`, record only local
   evidence, commit root acceptance, push, and verify remote `main`.
