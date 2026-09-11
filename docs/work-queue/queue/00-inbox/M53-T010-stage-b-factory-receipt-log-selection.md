# M53-T010 — Stage-B Factory receipt-log selection

## State

- Tier: CORE_P0
- Queue state: 00-inbox
- Dependencies: M43-T010 accepted, M44-T030 accepted, M47-T010 accepted, and M52-T010 accepted.
- Owner: root integrator owns queue/control records, reviews, integration, commits, and pushes.
- Human actions: none for local delivery. This card neither sends nor retries a wallet transaction, attaches a candidate, changes authority, or performs a live action.

## Purpose

The first confirmed ATS_CREATE testnet receipt contains the Factory's one
`BondDeployed` event together with logs emitted by the newly-created Bond. The
current bridge incorrectly accepts a receipt only when its complete log list
has one item, and therefore returns `submission_unknown` despite a valid
Factory event.

## Intended local contract

The bridge must scan an untrusted receipt log array, retain only logs emitted
by the fixed canonical Factory, and decode only when exactly one such log is
present and valid under the official Factory ABI. A valid decoded event address
is normalized by the existing M44 boundary. Zero, malformed, missing, and
ambiguous Factory-event cases remain rejected. Non-Factory receipt logs neither
authorize nor invalidate the one eligible Factory event.

## Candidate scope

After B04-T010 releases its overlapping active reservation, this task owns its
card, specification, queue/review evidence, and only:

- `apps/web/tests/stage-b-browser-provider-bridge.test.mjs`; and
- `apps/web/src/lib/ats/stage-b-browser-provider-bridge.ts`.

No UI, command, authority, transaction, receipt attachment, backend, package,
configuration, or deployment path is in scope. The existing confirmed
transaction remains evidence for diagnosis only; this card cannot attach its
candidate or make any new live request.

## Local authority

The implementation contract is [M53 Stage-B Factory receipt-log selection](../../../specs/m53-stage-b-factory-receipt-log-selection.md). A fresh
readiness review and a separate test-only RED activation are required before
any test changes; an independent RED review is required before source changes.
