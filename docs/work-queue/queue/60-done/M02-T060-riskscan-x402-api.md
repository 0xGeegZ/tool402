# M02-T060 — x402-protected RiskScan API

## State

- Tier: CORE_P0
- Queue state: 60-done
- Dependencies: M01-T040 accepted; M02-T050 accepted
- Integration evidence: D-M01-FOUND-001, D-M02-050-002, and D-M02-060-002 accepted
- Owner: implementation lane owns `apps/web/src/app/api/riskscan/route.ts`, `apps/web/src/lib/riskscan-x402.ts`, and `apps/web/tests/riskscan-api.test.mjs`; the root owns package metadata, the lockfile, this card, and queue records.
- Human actions: none for local implementation; live configuration and payment proof remain separate human-authorized work.

## Scope

Implement one configuration-aware x402 v2 API route that protects the accepted local RiskScan Quick assessment. It must fail explicitly when runtime configuration is absent or malformed, return a real unsigned payment challenge only with valid local configuration, and run Quick only after the payment wrapper authorizes the request. It must not commit a recipient, facilitator, wallet, key, account, payload, payment, transaction, receipt, evidence, or deployment.

The local contract is [M02 x402-protected RiskScan API contract](../../../specs/m02-riskscan-x402-api.md). The implementation plan is [x402-protected RiskScan API plan](../../../superpowers/plans/2026-09-04-m02-riskscan-x402-api.md).

## Validation

- Commit the local API specification before behavior.
- RED/GREEN tests cover unavailable configuration, unsigned challenge, valid Quick output, and malformed input without settlement.
- `npm run typecheck --workspace @tool402/web`
- `npm run test --workspace @tool402/web`
- Run a production webpack build.

## Completion transition

Active at 2026-09-04T22:42:18Z after the local contract, plan, accepted Quick dependency, and owned-path preflight. Accepted at 2026-09-05T07:02:44Z after configuration, unsigned-challenge, malformed-no-settlement, and facilitator-support RED/GREEN coverage; root typecheck/test, production webpack build, reproducible install check, queue validation, local-reference guard, and two fresh clean review generations. A testnet recipient, facilitator selection, payment signing/funding, deployment, and evidence remain separate human-authorized work.
