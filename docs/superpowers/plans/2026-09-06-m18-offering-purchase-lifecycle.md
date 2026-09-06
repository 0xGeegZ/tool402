# M18 requirements-bound purchase lifecycle plan

> **For the root:** execute this plan only after the M18 card has passed an
> independent readiness review and is moved through the local queue. The plan
> is strict TDD and makes no external action.

## Goal

Add one pure, requirements-bound offering purchase lifecycle to Core so later
funding and ATS work has explicit legal transitions without a wallet, signer,
network, persistence, or live claim.

## Boundaries

- Modify only `packages/core/src/offering-purchase-lifecycle.ts`,
  `packages/core/src/index.ts`,
  `packages/core/test/offering-purchase-lifecycle.test.mjs`, and
  `packages/core/test/offering-purchase-lifecycle.types.ts`, plus the narrow
  internal quote-issuance verifier in
  `packages/core/src/requirements-offering-quote.ts` when M18 rejects forged
  or mutable JavaScript quote lookalikes. That verifier remains outside the
  public barrel surface.
- Reuse the accepted M16 terms/allocation and M17 requirements-quote exports.
- Keep quote expiry entirely caller-supplied and deterministic; do not read a
  clock or add a time dependency.
- Do not parse external protocol/account/asset inputs or create an attempt,
  payment, ATS, allocation, transaction, receipt, or live-proof path.

## Task 1: Add the executable RED contract

**Files:**

- Create `packages/core/test/offering-purchase-lifecycle.test.mjs`
- Create `packages/core/test/offering-purchase-lifecycle.types.ts`

1. Add a representative M16/M17 quote fixture through public Core exports.
2. Assert that the missing M18 module/export causes the intended initial RED.
3. Express the full transition table, explicit expiry edge cases, terminal
   unknown behavior, exact-source consumption after a successful transition,
   non-consumption after a rejected transition, structural-copy rejection,
   snapshot behavior, and frozen outputs.
4. Add a compile-time consumer fixture for the public types.
5. Run `node --test packages/core/test/offering-purchase-lifecycle.test.mjs`
   and record the expected RED before any implementation exists.

## Task 2: Implement the minimal pure state machine

**Files:**

- Create `packages/core/src/offering-purchase-lifecycle.ts`
- Amend `packages/core/src/index.ts`

1. Require an unforgeable accepted quote identity before reading quote fields,
   then create one frozen issued `draft` state that snapshots only the
   permitted quote facts and retains internal provenance for its descendants.
2. Implement the exact closed table from the local contract. Consume each
   issued predecessor only after a successful transition; reject every omitted
   edge and every non-issued structural copy without consuming the failed input.
3. Use the accepted requirements-quote expiry rule with explicit timestamps;
   no clock, I/O, or external adapter may be introduced.
4. Re-run the focused test until it is GREEN, then run Core typecheck, test,
   and lint.

## Task 3: Verify and review

1. Run the focused test, Core and root typecheck/test/lint, clean-install dry
   run, `npm run queue:check`, the enabled reference guard, and
   `git diff --check`.
2. Obtain an independent task review against the local card, contract, plan,
   transition matrix, and negative cases. Repair valid findings through a new
   RED/GREEN loop.
3. Run two fresh clean Standards/Specification module-review generations after
   the final production change.
4. Only the root may move the card to `60-done`, update state/ledgers, commit,
   and push after all acceptance evidence is present.
