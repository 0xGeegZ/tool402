# M53-T010 — Stage-B Factory receipt-log selection

## State

- Tier: CORE_P0
- Queue state: 60-done
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

## Acceptance

M53-T010 is accepted by the repository operator's ruling of 2026-09-12 on the
delivered work already merged on `main` at `07beeffe`. The minimal decoder
correction was delivered by commit `592e14dc`, "fix: Decode Factory event from
multi-log receipts", which was committed straight onto `main` on 2026-09-11
and sits on its first-parent chain after the RED commit `91564c21`. It carries
no pull request and no merge commit of its own. Both declared paths exist on
`main`: `apps/web/src/lib/ats/stage-b-browser-provider-bridge.ts` and
`apps/web/tests/stage-b-browser-provider-bridge.test.mjs`. The bridge now
scans an untrusted receipt log array, retains only logs emitted by the fixed
canonical Factory, and decodes only when exactly one such log is present and
valid; zero, malformed, missing, and ambiguous Factory-event cases remain
rejected. Verification is the merged-`main` state at `07beeffe`: the complete
Web suite passes 547 of 548 with no failure and one skip, Web typecheck is
clean, and the Web build renders 37 of 37 routes. The acceptance releases the
M53 bridge and test reservation, which B04-T010 had transferred for this
defect. It authorizes no UI, command, authority, transaction, receipt
attachment, backend, package, configuration, deployment, or live path.
