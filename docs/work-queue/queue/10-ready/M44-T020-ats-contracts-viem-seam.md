# M44-T020 — ATS Factory contracts + viem seam

## State

- Tier: CORE_P0
- Queue state: 10-ready
- Dependencies: M01-T040 accepted, M02-T020 accepted, M42-T010 accepted,
  S15-T010 accepted, S16-T010 accepted, HA-ATS-CONTRACTS-VIEM-001 accepted
- Owner: root owns queue state and integration. Future source paths are
  `apps/web/src/lib/ats/factory-deploy-bond.ts`,
  `apps/web/tests/factory-deploy-bond.test.mjs`,
  `apps/web/tests/ats-contracts-bundle-gate.test.mjs`, and the existing
  `apps/web/src/components/provider/deploy/ats-create-action.tsx`. The root
  reservation covers `apps/web/package.json`, `package-lock.json`,
  `apps/web/next.config.ts`, the existing static-shell dependency assertion,
  and the one existing stage-three mount only to remove the SDK experiment.
  Exact historical removals are `apps/web/src/lib/ats/create-bond-request.ts`,
  `apps/web/src/lib/ats/ats-client.ts`,
  `apps/web/src/lib/ats/browser/dotenv-mock.ts`,
  `apps/web/src/lib/ats/browser/winston-mock.ts`,
  `apps/web/tests/create-bond-request.test.mjs`,
  `apps/web/tests/ats-client.test.mjs`, and
  `apps/web/tests/ats-sdk-bundle-gate.test.mjs`; the bounded
  `next.config.ts` aliases, `serverExternalPackages`, package pin, strict
  static-shell assertion, and stage-three `ats-create-action.tsx` import are
  replaced, not extended.
- Human actions: HA-ATS-CONTRACTS-VIEM-001 is local architecture authority;
  HA-ATS-STAGE-B-001 remains pending and is the only execution authority.

## Scope

Replace M44-T010's browser-SDK fallback with the direct official Factory
artifact plus existing viem seam specified in
[M44 ATS Factory contracts + viem seam](../../../specs/m44-ats-issuer-client-seam.md).
The direct contracts package and Factory JSON artifact are mandatory; hand
written ABI, SDK root, mocks, aliases, BBS compatibility, polyfills and
Hardhat are prohibited.

The successor must first create a durable RED contract proving each exact tuple
field and the selected browser graph. Only after independent RED acceptance may
it pin the contracts package, implement the pure tuple/encode/event helpers,
replace the disabled browser control, and remove the SDK experiment sources,
pin, tests, aliases, and mocks. It must use the M42 input, never S16's display
literal, and document/test the upstream zero-address treatment for absent
compliance and identity-registry values.

## Verification and boundary

The focused contract, Web typecheck, Turbopack production build and client
graph inspection must prove the Factory artifact + viem route reaches
`/provider/deploy` without the rejected compatibility implementation. It must
prove the official `deployBond` selector `0x29002951`, exact field mappings,
`BondDeployed` decoding, and HI-007 mirror transaction-id normalization.

No source may invoke a wallet, provider, RPC, simulation, transaction,
`deployBond`, candidate attachment, Mirror endpoint, configuration source, or
durable write. A later separately reviewed Stage-B successor owns any actual
execution.

## Readiness review

The independent readiness review at `ea1fca1a7ea0c1f026d0217d7cc196d6e553342e`
is clear in
[M44-T020-ready-review](../../evidence/M44-T020-ready-review.md). The exact
direct source/test paths are absent and every predecessor is accepted. This
card moves to `10-ready` only. A fresh activation is required before its RED
test source may be created.
