# M12-T010 — RiskScan native quote eligibility

## State

- Tier: CORE_P0
- Queue state: 00-inbox
- Dependencies: M06-T010 accepted; M10-T010 accepted
- Owner: `packages/core/src/riskscan-native-quote-eligibility.ts`,
  `packages/core/src/index.ts`,
  `packages/core/test/riskscan-native-quote-eligibility.test.mjs`, and
  `packages/core/test/riskscan-native-quote-eligibility.types.ts` are this
  card's implementation and public compile-time-contract paths. The root owns
  this card, local specification record, plan, queue state, catalog,
  ownership, decisions, reviews, integration evidence, and pushes.
- Human actions: none for this pure local evaluator. HA-X402-HEDERA-001
  remains required for a later payment client or live path and does not grant
  authority here.

## Scope

Create one pure evaluator that decides whether an untrusted native RiskScan
quote is within an explicit caller-provided local policy. The policy names
only the accepted native test network, canonical asset, and exact maximum
atomic amount. The result is either a canonical eligible quote or a bounded
decline reason.

The evaluator does not choose a cap, recipient, facilitator, fee payer,
economic allocation, account, wallet, signer, payment request, header,
client, request, transaction, settlement, persistence, network lookup,
deployment, or live state. An eligible local decision is not authorization to
pay.

The local contract is [M12 native quote eligibility](../../../specs/m12-riskscan-native-quote-eligibility.md),
the local specification record is [specification import ledger](../../../imports/SPEC-IMPORT-LEDGER.md),
and execution is in the [M12 native quote eligibility plan](../../../superpowers/plans/2026-09-06-m12-riskscan-native-quote-eligibility.md).

## Candidate ready requirements

- The local contract, runtime-local ledger row, and implementation plan are
  committed before a RED test or code change.
- M06-T010 and M10-T010 remain accepted locally, and no active card owns the
  listed core paths.
- The card records the exact unknown-input, canonical-amount, no-default-cap,
  bounded-output, tier, human boundary, and concrete validation rules.

## Validation

- RED/GREEN tests prove canonical quote selection, exact amounts above
  JavaScript's safe integer range, and decline behavior for invalid policy,
  invalid quote, network mismatch, asset mismatch, and cap excess.
- Tests prove that malformed, inherited, accessor-backed, symbol-keyed, or
  extra-field policy/quote records fail closed without invoking accessors.
- Core/root quality, queue/reference/whitespace checks, enabled local guard,
  independent task review, and two fresh clean module-review generations pass
  before acceptance.

## Inbox transition

Recorded at 2026-09-06T12:08:39Z after a fresh post-M11 rescan found the
native testnet summary and exact-value boundary accepted, no active core owner,
and a remaining pure local consumer-decision prerequisite before any later
human-authorized payment client. This inbox card authorizes only its local
contract, record, and plan; it authorizes neither RED/code nor a payment,
signing, account, wallet, transaction, deployment, or live claim.
