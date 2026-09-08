# M37-T010 RED review

## Scope

Independent review of the restored, uncommitted RED contract:

- `packages/backend/tests/stage-a-real-issuer-ats-create-authority.test.mjs`
- [M37 control card](../queue/20-active/M37-T010-stage-a-real-issuer-ats-create-authority.md)
- [M37 local specification](../../specs/m37-stage-a-real-issuer-ats-create-authority.md)
- [M37 implementation plan](../../superpowers/plans/2026-09-08-m37-stage-a-real-issuer-ats-create-authority.md)

## Observed RED

Under Node 22.21.1, the focused command failed exactly once with
`ERR_MODULE_NOT_FOUND` for the declared absent private source:

`packages/backend/src/ats/stage-a-real-issuer-ats-create-authority.ts`

No secondary assertion or runtime failure occurred.

## Established contract

- The historical RED is restored with only its static evaluator-indirection
  check strengthened. It rejects dynamic `import()`, `import.meta`, and
  identifier or string-literal use of `eval` or `Function`.
- The contract fixes the exact closed authority/configuration shape,
  signer/owner equality, independent eleven-field JCS/Keccak recomputation,
  M35 owner-only preimage difference, absence of synthetic issuer/hash, and
  fresh deeply frozen detached output.
- It restricts source static imports to `@tool402/core` and `viem`; it
  rejects public-barrel, M32, M33, SDK, provider, wallet, storage, network,
  configuration, and execution capability expansion while retaining M33's
  zero-enabled manifest.

## Verdict

No Critical, Important, or Minor finding remains. The RED contract is accepted
and authorizes only the declared private source helper. It does not authorize
runtime authority, SDK/provider/wallet use, account action, transaction, asset
creation, deployment, or live ATS behavior.
