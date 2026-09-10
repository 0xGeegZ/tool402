# M46-T030 RED contract review

## Scope

Independent review at clean pushed
`133901baa3b1cfa066c924fc0c708999e88a7f11` covered only the declared M46
durable RED fixture, its committed card/specification, and the narrow
RiskScan-preservation reservation.

## Verification

Under Node 22.21.1, `apps/web/tests/entitycheck-api.test.mjs` has exactly one
intentional failure: the absent shared protected-route factory, EntityCheck
handler, and EntityCheck POST route. Nine behavior assertions skip until all
three declared modules exist. The static route assertion allows only `POST` and
keeps ambient environment access at the route boundary. No accepted RiskScan
test or source file changed.

## Verdict

CLEAR. Only these local GREEN targets are authorized:

- `apps/web/src/lib/x402-protected-route.ts`;
- `apps/web/src/lib/entity-check-x402.ts`;
- `apps/web/src/app/api/entitycheck/route.ts`;
- the root-reserved behavior-preserving extraction in
  `apps/web/src/lib/riskscan-x402.ts`.

`apps/web/tests/riskscan-api.test.mjs` remains unchanged. No package, lockfile,
configuration value, live facilitator/source read, payment, wallet/provider,
transaction, deployment, or live behavior is authorized.
