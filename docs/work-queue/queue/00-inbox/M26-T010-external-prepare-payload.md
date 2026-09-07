# M26-T010 — Closed external-prepare payload schema

## State

- Tier: CORE_P0
- Queue state: 00-inbox
- Dependencies: M01-T020 accepted; M10-T010 accepted
- Owner: packages/core/src/external-prepare-payload.ts,
  packages/core/src/index.ts,
  packages/core/test/external-prepare-payload.test.mjs, and
  packages/core/test/external-prepare-payload.types.ts are proposed
  implementation paths. The root owns this card, local specification, import
  record, plan, queue state, catalog, ownership, decisions, reviews,
  integration evidence, commits, and pushes.
- Human actions: none for this deterministic local parser. Authenticated
  command handling, durable attempts, configuration, provider calls, and live
  proof remain separately authorized future boundaries.

## Scope

Create the smallest pure Core parser for an external-prepare payload after a
fresh source-to-runtime rescan. It accepts only the eight declared payload
fields, returns a frozen detached value, and rejects every shape or lexical
form outside the local contract.

The local contract is the [M26 external-prepare payload](../../../specs/m26-external-prepare-payload.md),
the neutral source record is the [specification import ledger](../../../imports/SPEC-IMPORT-LEDGER.md),
and execution is in the [M26 external-prepare payload plan](../../../superpowers/plans/2026-09-07-m26-external-prepare-payload.md).

This parser is deliberately not a signed command. It does not consume the
accepted protected-body capability, parse an envelope, verify a signer or
role, resolve a target, calculate a hash, make an idempotency or replay claim,
or create a durable attempt.

## Candidate ready requirements

- The local contract, neutral import-ledger row, plan, card, catalog,
  ownership, decision, and state records are committed before a RED test or
  source change.
- M01-T020 and M10-T010 remain accepted locally. M10 is the sole target
  syntax dependency; accepted economics, ingress, and byte-binding records
  are sequencing context, not functional inputs to this pure parser.
- The only proposed implementation paths are the new Core parser, its focused
  runtime/type tests, and the explicit Core public-barrel amendment. No
  existing lifecycle, backend, Convex, Agent, Web/UI, package, or lockfile
  path is owned.
- The contract remains an exact eight-field payload with closed operation
  kinds, fixed local network/chain vocabulary, lexical-only target forms,
  algorithm-neutral canonical-parameters hash, non-claiming idempotency key,
  and declared-only expiry.
- An independent review of the committed authority is clean: no Critical,
  Important, or Minor finding remains.

## Validation

- A test-only RED contract precedes source and proves the absent public parser,
  exact payload shape/immutability, closed literals, both target forms,
  lexical rejections, reflection safety, no-invoked-accessor behavior, no
  replay/idempotency side effect, and no prohibited boundary expansion.
- The focused command is
  node --test packages/core/test/external-prepare-payload.test.mjs from the
  repository root under Node 22.21.1.
- Core/root typecheck, test, lint, clean-install dry run, queue/reference/
  whitespace checks, enabled local guard, independent task review, and two
  fresh clean module-review generations must pass before acceptance.

## Inbox transition

Recorded at 2026-09-07T11:10:12Z after a fresh source-to-runtime rescan found
no accepted closed payload boundary for an external prepare operation. This
inbox state authorizes only committed local authority and independent design
review. It authorizes neither RED/code nor a signed command, storage,
configuration, Convex, HTTP, generic attempts, ATS, payment, funding,
allocation, clearing, HCS, account, wallet, signer, transaction, deployment,
or live behavior.
