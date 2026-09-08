# M39-T010 — Authenticated wallet command normalizer

## State

- Tier: CORE_P0
- Queue state: 00-inbox
- Dependencies: M25-T010 accepted, M26-T010 accepted, M30-T010 accepted,
  M31-T010 accepted, M38-T010 (this batch)
- Owner: The root owns queue state, catalog, ownership, decisions, reviews,
  commits, and pushes. Proposed implementation paths are exactly:
  `packages/backend/src/ingress/authenticated-wallet-command-normalizer.ts` and
  `packages/backend/tests/authenticated-wallet-command-normalizer.test.mjs`.
  No accepted file is amended: the accepted M30 source and its focused test
  stay byte-unchanged, and no root integration reservation is requested.
- Human actions: HA-COMMAND-AUTHORITY-002, requested by the
  [HI-002 intake card](HI-002-campaign-deploy-reinstatement.md), must be
  accepted before the RED commit. It amends the command authority to admit
  `offering.create`, `directory.publish`, and `external.attachCandidate` under
  the same domain and primary type. HA-COMMAND-AUTHORITY-002 must be recorded
  as requiring `ISSUER` ownership of the subject only where the payload carries
  a subject identifier (`offering.create`); `directory.publish` and
  `external.attachCandidate` carry none, so it requires the `ISSUER` role plus
  a deferred subject-ownership reference that the durable boundary resolves
  before any write. It authorizes no wallet, provider, account, funding,
  payment, transaction, publication, deployment, or live behavior.

## Scope

The accepted command vocabulary contains exactly one type. The
[approved campaign deploy design](../../../superpowers/specs/2026-09-08-campaign-deploy-flow-design.md)
needs four: the provider signs `offering.create`, then `external.prepare` with
kind `ATS_CREATE`, then `external.attachCandidate` for the receipt, then
`directory.publish`. Each must be authenticated by the same signature boundary
the repository already accepted, not by four ad hoc paths.

Add one internal backend normalizer that generalizes the accepted M30 boundary
over those four types. It reuses the M25 claimed body, the fixed EIP-712 domain
and primary type, the signature and time rules, the injected authority read, and
the replay identity without change; it adds only per-type payload dispatch, the
canonical digest for each payload, and a discriminated output DTO.

The local contract is the
[M39 wallet command normalizer specification](../../../specs/m39-wallet-command-normalizer.md).
Its accepted authority is
[HA-COMMAND-AUTHORITY-001](../../evidence/HA-COMMAND-AUTHORITY-001-decision.md),
the [M30 normalizer contract](../../../specs/m30-authenticated-external-prepare-normalizer.md),
and the [M31 admission handoff](../../../specs/m31-external-prepare-command-admission.md).

This card adds no Convex schema, table, query, mutation, action, or HTTP route,
no browser wallet, provider selection, or relay, no durable claim or attempt,
and no ATS, funding, payment, transaction, or deployment behavior. It replaces
no accepted caller: the M31 handoff remains M30's only caller, and the durable
M32 admission continues to revalidate the command context and payload digest in
its own internal mutation.

## Candidate ready requirements

- HA-COMMAND-AUTHORITY-002 is accepted and its evidence is committed. Until
  then the three additional command types have no authority and this card
  cannot leave the inbox.
- M25-T010, M26-T010, M30-T010, and M31-T010 remain accepted, and M38-T010 is
  accepted first: this card consumes M38's three payload parsers and their
  canonical byte builders and must not restate or re-implement them.
- The specification, card, catalog, ownership, and state records are committed
  before a RED test or source change.
- The two declared paths are new files and are disjoint from every other card
  in this batch. No accepted source, test, schema, package manifest, or
  lockfile is eligible.
- The specification fixes the closed DTO, the per-type authority predicate, the
  deferred subject-ownership reference for `directory.publish` and
  `external.attachCandidate`, the decoder's two bounded extensions, and the
  M30 equivalence obligation before any code exists.

## Verification

- A durable test-only RED commit precedes the source file. It fails only
  because
  `packages/backend/src/ingress/authenticated-wallet-command-normalizer.ts`
  does not exist.
- Focused Node commands from the repository root under Node 22.21.1:

  ```bash
  node --test packages/backend/tests/authenticated-wallet-command-normalizer.test.mjs
  node --test packages/backend/tests/authenticated-external-prepare-normalizer.test.mjs
  ```

- Shared vectors drive the accepted M30 normalizer and M39 over the same
  claimed bodies and prove that every accepted and every rejected
  `external.prepare` case agrees exactly, digest included. The accepted M30
  source and its focused test file remain byte-unchanged in the diff.
- Focused tests prove M25-only byte access, the closed transport and command
  shapes, the bounded nesting depth and string-only arrays, the decoded-byte
  bound, per-type dispatch with no other payload parser invoked, exact digest
  equality against the M38 builders, command-to-payload expiry equality,
  cross-type signature rejection, resolver ordering, every row of the authority
  table, the deferred ownership references, the window edges, the deterministic
  replay identity, the frozen DTO, and the absence of Convex, environment,
  provider, storage, network, and external behavior.
- `npm run typecheck`, `npm run test`, `npm run lint`, `npm run queue:check`,
  and the enabled local-reference guard pass.
- Independent task review and two fresh clean module-review generations report
  no Critical, Important, or Minor finding.

## Boundary

This card creates one local authentication predicate. It admits three
additional command types into a signature boundary and nothing else: it stores
nothing, publishes nothing, and calls nothing external. A command that this
normalizer accepts is still unadmitted, unrecorded, and unexecuted until the
separately reviewed durable and ingress cards accept it.

The `ISSUER` role is the only ownership fact this boundary can prove for
`directory.publish` and `external.attachCandidate`, because neither payload
carries a subject identifier. It returns the offering or attempt reference so
that the durable boundary owning those records enforces subject ownership
before any write. This card claims no such enforcement of its own.
