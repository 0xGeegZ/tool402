# M32-T010 — Durable external-prepare admission

## State

- Tier: CORE_P0
- Queue state: 60-done
- Dependencies: M01-T030 accepted; M04-T010 accepted; B01-T010 accepted;
  M26-T010 accepted; M30-T010 accepted; M31-T010 accepted
- Owner: This root-owned accepted card owns the M32 specification and plan, its card,
  the additive generic Convex schema and internal module paths, the narrow M04
  shared-schema compatibility amendment, the narrow M31 durable-replay
  clarification, focused backend tests, and root-integrator queue records. The
  root owns state, catalog, ownership, decisions, reviews, commits, and pushes.
- Human actions: No new human action is required for deterministic local
  schema/function work. The accepted command-authority decision supplies
  bounded replay/idempotency rules only. It does not authorize authority-record
  provisioning, a Convex publication, configuration access, ATS target or
  parameter resolution, provider use, wallet/signature work, funding, payment,
  transaction, deployment, or live behavior.

## Scope

Create the smallest internal Convex data plane that can later durably admit one
already authenticated external-prepare command. It adds a server-side
`commandAuthorities` record shape, one replay-claim table, one generic
`PREPARED` attempt table, an internal atomic admission mutation, and an
internal exact-context recovery query.

The local contract is the [M32 durable external-prepare admission](../../../specs/m32-durable-external-prepare-admission.md), and execution is constrained by the
[M32 implementation plan](../../../superpowers/plans/2026-09-08-m32-durable-external-prepare-admission.md).

M32 is not an end-to-end BFF adapter. A process-local M25/M31 capability cannot
truthfully cross a serialized asynchronous Convex invocation. This card accepts
only a serialized M31-shaped data record from a future separately scoped trusted
adapter; that adapter must re-establish authenticated provenance and own any
branded asynchronous completion, timeout, and recovery protocol. M32 itself
makes no claim that an arbitrary caller supplied an M25/M31 capability.

The M04 shared-schema compatibility amendment preserves every accepted RiskScan
table, field, and index exactly, while changing its focused test from a whole
global-schema assertion to an exact RiskScan-subset assertion. M32 separately
owns the exact additive generic-table assertion. This is not a reopening of
RiskScan persistence or reconciliation.

The accepted M31 source remains unchanged. M32 owns a narrow post-acceptance
clarification in the M31 specification, card, and plan: only `NEW` creates an
attempt, while every fully valid fresh nonce is atomically claimed so it cannot
later be reused for another command.

## Candidate ready requirements

- The local specification, neutral import-ledger row, plan, card, catalog,
  ownership, decisions, human-action clarification, and M04 shared-schema
  compatibility amendment are committed before RED or implementation work.
- M01-T030, M04-T010, B01-T010, M26-T010, M30-T010, and M31-T010 remain
  accepted locally.
- The only candidate runtime paths are `packages/backend/convex/schema.ts`,
  `packages/backend/convex/external_prepare_command_admission.ts`,
  `packages/backend/convex/external_prepare_command_recovery.ts`, and their
  focused tests plus the narrow RiskScan-schema test amendment. All Convex
  filenames must be underscore-safe.
- Before any authority/database access, the mutation must independently parse
  M26, recompute the exact JCS/Keccak payload hash, require equal canonical
  command/payload expiries, derive the exact replay identity, and enforce every
  approved durable-clock rule. It cannot treat serialized M25/M31 provenance
  as an input capability.
- The mutation must then re-read exactly one current enabled authority row
  inside its transaction; require exact signer, principal, role, ownership, and
  authority-version equality; and evaluate replay identity before idempotency.
- Every fully valid fresh replay identity must be atomically claimed: `NEW`
  creates the one linked `PREPARED` attempt, exact idempotency replay creates a
  claim linked to the existing attempt, and conflict creates an unlinked claim.
  Any later reuse returns `COMMAND_REPLAYED`; no status permits external
  behavior.
- The M31/M32 post-acceptance durable-replay clarification, the M04 card/plan
  compatibility clarification, and all M32 authority records are committed
  before RED or implementation work.
- An independent design review of the committed authority is clean: no Critical,
  Important, or Minor finding remains.

## Validation

- A test-only RED commit precedes all M32 schema or Convex-module production
  changes. It proves the absent additive data plane, preserves the exact M04
  RiskScan namespace, and specifies rebinding-before-database-access,
  current-authority, full durable-clock, replay-first, fresh-nonce claim,
  idempotency/context, and recovery behavior through controlled internal-
  function contexts.
- Focused commands run from the repository root under Node 22.21.1:

  ```bash
  node --test packages/backend/tests/external-prepare-command-durable-schema.test.mjs
  node --test packages/backend/tests/external-prepare-command-durable-admission.test.mjs
  node --test packages/backend/tests/external-prepare-command-recovery.test.mjs
  ```

- Backend/root typecheck, test, lint, clean-install dry run,
  queue/reference/whitespace checks, enabled local guard, independent task
  review, and two fresh clean module-review generations must pass before
  acceptance.

## Inbox transition

Recorded at 2026-09-07T22:30:00Z after a fresh post-M31 source-to-runtime
rescan found no active, ready, or existing inbox CORE_P0 card. M31 explicitly
leaves durable schema, transaction, records, and recovery to a later separately
reviewed persistence card. The accepted local authority distinguishes this
generic non-executable data plane from the later ATS target/parameter authority
gate.

This inbox state authorizes only committed local authority and independent
design review. It authorizes neither RED/code nor authority provisioning,
Convex publication, BFF/HTTP integration, asynchronous adapter, ATS target or
parameter resolution, provider/wallet action, funding, payment, transaction,
deployment, or live behavior.

## Ready transition

Ready at 2026-09-07T23:23:48Z after a fresh rescan at pushed
`98220b968f6d1d0a0fac54618f9905070b78bf51` confirmed M01-T030, M04-T010,
B01-T010, M26-T010, M30-T010, and M31-T010 accepted; no active lane or
ownership conflict; exact origin/main equality; an enabled local guard; and
two independent clean reviews of the corrected committed authority. This ready
state authorizes only root activation followed by the specified test-only RED.
It does not authorize authority provisioning, Convex publication, BFF/HTTP
integration, asynchronous adapter, ATS target/parameter resolution,
provider/wallet action, funding, payment, transaction, deployment, or live
behavior.

## Activation

Activated at 2026-09-07T23:25:55Z after a fresh rescan of pushed
`37d6ae238478cc0f94c56b6fab074fd3a292e7d5` confirmed M32-T010 as the sole
ready card, accepted dependencies, no active lane or ownership conflict, an
enabled guard, and no new human blocker. This activation authorizes only the
test-only RED contract from the committed plan. It does not authorize M32
schema/functions, Convex publication, authority provisioning, BFF/HTTP
integration, asynchronous adapter, ATS target/parameter resolution,
provider/wallet action, funding, payment, transaction, deployment, or live
behavior.

## Acceptance

Accepted at 2026-09-08T00:20:30Z after final verification against
`MODULE_BASE` `b7d00dd627a9104e54aaf3597e1caaba174482fe` and `MODULE_HEAD`
`288c678d9a16bcb40420f85b05e564286e68a8bb`, both pushed to `main`. The
durable test-only RED commits `25cae8dd6d029dc701ce257fe6f9dd1cb8b5a403` and
`dd90f5a08c2d1a108f7f46f29a9d1483fe47857b` precede the additive schema and
two internal Convex modules at `288c678d9a16bcb40420f85b05e564286e68a8bb`.

Focused M32 tests passed 20/20 and the full Backend suite passed 125/125. Root
typecheck, test, lint, clean-install dry run, queue/reference/whitespace
checks, and the enabled local guard passed under Node 22.21.1. The final
independent task review found and corrected one minor nonnegative persisted
timestamp guard before commit; both fresh Standards-and-Spec module-review
generations then found no Critical, Important, or Minor finding.

This acceptance covers only the internal generic durable admission/recovery
data plane: current authority revalidation, replay/idempotency records, one
generic `PREPARED` attempt, and exact-context recovery. It does not accept
authority provisioning, publication, BFF/HTTP integration, ATS target or
parameter authority, provider or wallet action, funding, payment, transaction,
deployment, or live behavior.
