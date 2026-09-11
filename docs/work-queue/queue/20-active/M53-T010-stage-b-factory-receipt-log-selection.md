# M53-T010 — Stage-B Factory receipt-log selection

## State

- Tier: CORE_P0
- Queue state: 20-active
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

This task owns its card, specification, queue/review evidence, and only:

- `apps/web/tests/stage-b-browser-provider-bridge.test.mjs`; and
- `apps/web/src/lib/ats/stage-b-browser-provider-bridge.ts`.

No UI, command, authority, transaction, receipt attachment, backend, package,
configuration, or deployment path is in scope. The existing confirmed
transaction remains evidence for diagnosis only; this card cannot attach its
candidate or make any new live request.

## Local authority

The implementation contract is [M53 Stage-B Factory receipt-log selection](../../../specs/m53-stage-b-factory-receipt-log-selection.md). The root
readiness/activation record transfers the overlapping bridge/test reservation
from B04-T010 solely for this independent live-receipt defect.

## Activated durable RED surface

Only `apps/web/tests/stage-b-browser-provider-bridge.test.mjs` is authorized
for the durable RED contract. Production source remains prohibited pending the
focused RED result review.

## RED result and minimal GREEN scope

The injected-fake focused run has 380 passing tests and exactly one intended
failure: a receipt with two valid non-Factory logs and one valid Factory event
returns `submission_unknown` before any Mirror request. The failure proves the
strict whole-array condition without sending a provider request or reading an
external service.

Only these paths are authorized for the minimal correction:

- `apps/web/src/lib/ats/stage-b-browser-provider-bridge.ts`; and
- `apps/web/tests/stage-b-browser-provider-bridge.test.mjs`.

The source may select exactly one fixed-Factory event from a valid multi-log
array before the existing M44 decode boundary. All command, authority,
transaction, retry, attachment, and deployment exclusions remain fixed.
