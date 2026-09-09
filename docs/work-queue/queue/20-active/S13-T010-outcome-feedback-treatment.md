# S13-T010 — Outcome feedback tokens and status treatment

## State

- Tier: POLISH
- Queue state: 20-active
- Dependencies: M02-T020 accepted, M02-T080 accepted, M08-T010 accepted, M09-T010 accepted, M13-T010 accepted, M15-T010 accepted, M29-T010 accepted
- Owner: The root owns queue state, catalog, ownership, the UI slice ledger,
  decisions, reviews, commits, and pushes. Proposed implementation paths are
  `apps/web/src/app/globals.css`, `apps/web/src/components/ui/status.tsx`,
  `apps/web/src/components/ui/state-panel.tsx`, the outcome-rendering lines of
  `apps/web/src/components/riskscan/request/riskscan-request-flow.tsx`,
  `apps/web/src/components/riskscan/tool-loop/riskscan-tool-loop.tsx`,
  `apps/web/src/components/riskscan/native-quote/riskscan-native-quote-compatibility.tsx`,
  `apps/web/src/components/riskscan/preflight/riskscan-quick-preflight.tsx`,
  `apps/web/src/components/discovery/riskscan-directory-discovery.tsx`,
  `apps/web/tests/status.test.mjs`, and
  `apps/web/tests/state-panel.test.mjs`. Existing focused suites are
  verification-only and are not S13 amendment targets.
- Human actions: none. This presentation amendment grants no authority over
  configuration, identity, providers, payments, transactions, deployment, or
  submission.

## Scope

The accepted interactive surfaces already distinguish their outcomes in words,
but none distinguishes them visually: the local stylesheet holds no token that
separates a refusal from a completion, so every outcome is the same unstyled or
muted paragraph.

Add the six missing feedback tokens, one shared status treatment, and one
shared empty/error panel shape, then route the existing outcome messages
through them.

The local contract is the [UI-S13 outcome feedback manifest](../../../ui/UI-S13.md).
The accepted slice history it amends is recorded in the
[local UI slice ledger](../../../ui/IMPORT-LEDGER.md).

## Candidate ready requirements

- The slice manifest, card, catalog, ownership, and state records are committed
  before any source change.
- The stylesheet and all five amended components belong to accepted cards, so
  each needs an explicit root integration reservation recorded in the ownership
  file before the amendment. The accepted route-wiring amendment is the
  precedent.
- The two new component paths and two new focused-test paths are disjoint from
  every other card, including the sibling skeleton card, which names its own
  file. Existing focused suites remain unchanged.
- The tone vocabulary and the rule that a tone may only follow a distinction a
  component already makes are fixed in the manifest before code, so the slice
  cannot grow a new outcome branch.

## Verification

- A durable RED commit creates only `apps/web/tests/status.test.mjs` and
  `apps/web/tests/state-panel.test.mjs` before any source change. Run
  `node --test apps/web/tests/status.test.mjs apps/web/tests/state-panel.test.mjs`
  under the repository's selected Node 22 runtime. It must exit nonzero only
  because the two declared UI source modules do not exist; it must not amend or
  probe an existing outcome component in RED. Re-run that exact command after
  GREEN and require zero failures.
- Focused tests prove the closed tone vocabulary, that no amended component
  gains an outcome branch, that live regions and wording are preserved, and
  that tone is never carried by colour alone.
- The contrast check reproduces the ratio the manifest records for each token
  pair; the source material's solid coral is not adopted as a text pair because
  it fails AA.
- Every amended component's existing focused suite passes unchanged. Run
  `node --test apps/web/tests/riskscan-request-state.test.mjs apps/web/tests/riskscan-try.test.mjs apps/web/tests/riskscan-tool-loop.test.mjs apps/web/tests/riskscan-directory-discovery.test.mjs apps/web/tests/riskscan-native-quote-compatibility.test.mjs apps/web/tests/riskscan-quick-preflight.test.mjs`
  after GREEN; none of those files is an S13 amendment target.
- `npm run typecheck --workspace @tool402/web`, `npm run test --workspace @tool402/web`,
  `npm run build --workspace @tool402/web`, root `npm run typecheck`,
  `npm run test`, `npm run lint`, `npm run queue:check`, and the enabled
  local-reference guard all pass.
- Independent task review and a fresh module-review generation report no
  Critical finding.

## Boundary

This card changes presentation of state the accepted components already
compute. Its exclusions are the manifest's truthfulness and authority boundary,
which governs; this card does not restate them.
