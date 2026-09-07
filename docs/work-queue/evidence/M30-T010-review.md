# M30-T010 — integration evidence

## Scope

This record holds the local verification evidence for M30-T010, the card that
makes the accepted M03 settlement observer reachable from the protected route.
It is a local verification record. It claims no deployment, no durable storage,
and no submission.

## Observed defect

A configured local route was exercised against the public designated
facilitator. Two protected requests settled successfully on Hedera testnet and
the route issued no local capability, because `handleRiskScanPost` constructed
its handler with no options and `RiskScanPostOptions` carried no consumer
member. The accepted observer therefore took its disabled branch and registered
no after-settle hook.

## Sequence

The authority records were committed at `5b88269` before any code. The durable
test-only RED landed at `1533157` and failed for the stated reason: the
evidence module did not exist and no default consumer was supplied. The minimal
implementation landed at `c0cad7e`. A defect found in independent review
preparation was corrected at `b5a4dc3`: handler selection had branched on the
facilitator client alone, so a consumer supplied without a facilitator client
was silently replaced by the default recorder through a cache hit. Selection
now takes the cached handler only when neither option is present, and the
contract states the rule explicitly.

## Local verification

- Focused M30 suite 4/4; Web suite 96/96, which includes the unchanged M03
  suite and proves the accepted protected-response behavior is preserved.
- `npm run typecheck --workspace @tool402/web`, `npm run test --workspace @tool402/web`,
  and `npm run build --workspace @tool402/web` pass; the production build
  compiles and both API routes remain server-rendered on demand.
- Root `npm run typecheck`, `npm run test`, `npm run lint`, and
  `npm run queue:check` pass under Node 22.21.1, with `QUEUE_CHECK_OK` and no
  local-reference finding.
- A secret scan over tracked files at this branch found no key material,
  environment value, or account identifier. The nine matches for the phrase
  "private key" are exclusion prose in accepted contracts.
- `apps/web/next-env.d.ts` is a generated root-owned file outside this card's
  declared paths. Its dev/build path churn was swept into the authority commit
  and was restored at `b5a4dc3`.

## Live exercise

Two human-authorized testnet exercises were run against the real designated
facilitator using a human-supplied payer outside the repository. Both are
recorded here as observations; no key, environment value, or signing payload
entered the repository.

- Default path, no consumer supplied: the protected request returned `200`, the
  settlement succeeded on the ledger, and the module sink recorded exactly one
  entry. The recorded value was accepted by `bindRiskScanReceiptEvidence`,
  proving it is a genuine core capability rather than a structurally similar
  object.
- Consumer supplied without a facilitator client: the supplied consumer
  received exactly one settlement and the default sink stayed empty. This is
  the combination that the `b5a4dc3` correction fixed; before it, the caller's
  consumer was discarded.

Both settlements are independently visible on the public mirror node with a
successful final status and a matching debit and credit. The HTTP exchange and
its causal link to the recorded capability remain local observations; the
public ledger cannot prove that binding.

## Review

An independent task review of the committed contract, card, and diff reported
no Critical, Important, or Minor finding. A fresh module-review generation was
run separately.

## Narrow acceptance

M30-T010 is accepted as a local wiring amendment only. It records a
process-local, non-durable, bounded observation of settlements the accepted
observer already issues. It establishes no durable record, receipt, evidence,
finality, public read surface, deployed behavior, or live result, and it
authorizes no account, wallet, signer, payment, transaction, ATS, funding,
clearing, HCS, payout, deployment, or submission action.

## Named follow-up

Two boundaries are blocked upstream rather than deferred by choice. A verified
settlement is not a `RiskScanLifecycleState`, so `projectRiskScanLifecycle`
cannot be applied to observer output until a local producer exists for the
receipt and evidence references that `completeRiskScanRequest` requires.
Exposing recorded evidence through a route would publish caller-supplied
`requestRef`, `subjectRef`, and `context` values and requires its own privacy
contract first. Each needs its own card.
