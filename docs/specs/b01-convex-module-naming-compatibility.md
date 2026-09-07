# B01 Convex module-naming compatibility contract

## Delivery boundary

This local compatibility correction makes the existing internal backend
function modules acceptable to the configured development-only Convex tooling.
It changes only five module filenames, the exact test imports that refer to
them, and current code-styled file-location literals in the accepted local M04
records. It does not alter an exported function name, handler body, validator,
schema, index, package dependency, generated API, route, runtime
configuration, or product behavior.

The correction follows a human-reported development publish blocker. The local
code contract is distinct from a configured deployment: Human Ops alone runs
the post-acceptance development-only publish using ignored local configuration
and records a redacted outcome.

## Canonical module mapping

The accepted source modules must have these exact Convex-safe names:

| Existing function module | Canonical filename | Required unchanged export |
| --- | --- | --- |
| M04-T070 reconciliation selector | `riskscan_pending_reconciliation_selector.ts` | `selectRiskScanPendingReconciliationAttempt` |
| M04-T060 pending-settlement reader | `riskscan_pending_settlement_reader.ts` | `readRiskScanPendingSettlementCandidate` |
| M04-T030 durable request writer | `riskscan_requests.ts` | `recordInitialRiskScanRequest` |
| M04-T040 settlement-attempt writer | `riskscan_settlement_attempts.ts` | `recordInitialRiskScanSettlementAttempt` |
| M04-T050 settlement-record writer | `riskscan_settlement_records.ts` | `recordInitialRiskScanSettlementRecord` |

Every direct TypeScript function-module filename under `packages/backend/convex/`
must use only ASCII letters, decimal digits, underscores, or periods. The
existing `convex.config.ts` and `schema.ts` names already satisfy this rule.

## Behavioral invariants

- Each five renamed module retains its exact single exported internal function
  name and current function metadata.
- The function bodies, validators, schema declaration, and all domain values
  remain byte-for-byte unchanged by this task; a 100%-rename audit proves that
  no source hunk is introduced.
- The local backend test suite imports the canonical module paths and proves
  their unchanged export names.
- A direct directory contract requires the five canonical filenames, rejects
  their legacy hyphenated names, and rejects any unsafe TypeScript module
  filename in the Convex function directory without freezing future safe
  modules.
- The five M04 specifications, five M04 plans, five accepted M04 cards, and
  `docs/work-queue/FILE-OWNERSHIP.md` update only their code-styled current
  module-path literals so every tracked local source-path reference resolves
  at the resulting commit. No historical acceptance outcome changes.
- The precondition for this address change is that, outside the five declared
  direct tests whose file URLs B01 updates, no tracked production or internal
  module-address consumer uses an old module address. The Human Ops diagnostic
  reports no prior publication. The development-only post-fix check remains
  pending Human Ops evidence.
- The correction is local code evidence only. Passing tests do not prove a
  configured store, published function, deployment, external action, payment,
  settlement, finality, ATS, funding, clearing, HCS, payout, or live result.

## Scope exclusions

Do not add a Convex deployment, run a publish command, read or commit ignored
configuration, create a key/account/wallet/signer, change a schema/table/index,
rename any function export, modify handler behavior, generate API output, add a
public function or HTTP route, change a package/lockfile, or touch M24 or its
future protected-replay work. Do not reopen or alter the accepted RiskScan
domain contracts beyond exact source-location and current documented-path
compatibility amendments.

## Acceptance evidence

- A test-only RED contract precedes the rename and fails because the five
  canonical module paths are absent or a disallowed legacy filename remains.
- GREEN evidence proves the five canonical paths and unchanged exports, while
  allowing additional safe Convex TypeScript modules. The five existing module
  tests import their canonical paths and the bounded documentation check finds
  no legacy module pathname.
- A 100%-rename diff summary shows exactly the five source moves with no source
  hunk; tracked-code search finds no unlisted production or internal-address
  consumer of a legacy module.
- Backend/root typecheck, test, lint, queue/reference/whitespace checks, the
  enabled local guard, and independent task review pass before local code
  acceptance.
- Human Ops performs the separately recorded development-only publish check;
  its redacted outcome is runtime evidence, not an agent deployment action.
