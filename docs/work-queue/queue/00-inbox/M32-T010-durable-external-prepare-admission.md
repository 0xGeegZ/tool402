# M32-T010 — Durable external-prepare admission

## State

- Tier: CORE_P0
- Queue state: 00-inbox
- Dependencies: M01-T030 accepted; B01-T010 accepted; M26-T010 accepted;
  M30-T010 accepted; M31-T010 accepted
- Owner: This root-owned card owns the M32 specification and plan, its card,
  the additive generic Convex schema and internal module paths, the narrow M04
  shared-schema compatibility amendment, focused backend tests, and
  root-integrator queue records. The root owns state, catalog, ownership,
  decisions, reviews, commits, and pushes.
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

## Candidate ready requirements

- The local specification, neutral import-ledger row, plan, card, catalog,
  ownership, decisions, human-action clarification, and M04 shared-schema
  compatibility amendment are committed before RED or implementation work.
- M01-T030, B01-T010, M26-T010, M30-T010, and M31-T010 remain accepted locally.
- The only candidate runtime paths are `packages/backend/convex/schema.ts`,
  `packages/backend/convex/external_prepare_command_admission.ts`,
  `packages/backend/convex/external_prepare_command_recovery.ts`, and their
  focused tests plus the narrow RiskScan-schema test amendment. All Convex
  filenames must be underscore-safe.
- The mutation must re-read exactly one current enabled authority row inside its
  transaction; require exact signer, principal, role, ownership, and authority
  version equality; reject an expired command at the durable server clock; then
  evaluate replay identity before idempotency.
- M31's accepted future-boundary rule remains binding: only `NEW` creates one
  replay claim and one `PREPARED` generic attempt. An exact idempotent replay
  returns the existing attempt without a new claim or attempt; a conflict writes
  neither. No external behavior may follow from any M32 status.
- An independent design review of the committed authority is clean: no Critical,
  Important, or Minor finding remains.

## Validation

- A test-only RED commit precedes all M32 schema or Convex-module production
  changes. It proves the absent additive data plane, preserves the exact M04
  RiskScan subset, and specifies current-authority, expiry, replay-first,
  idempotency/context, no-write, and recovery behavior through controlled
  internal-function contexts.
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

Recorded at 2026-09-08T00:30:00Z after a fresh post-M31 source-to-runtime
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
