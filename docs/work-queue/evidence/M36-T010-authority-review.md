# M36-T010 Stage A authority review

## Review scope

- Reviewed at: 2026-09-08T12:44:52Z
- Reviewed head: `1d8f78c339f8fd6e085ede00eec9d70cdce0eff4`
- Reviewed records:
  - [completed Stage A decision](HA-ATS-LIVE-AUTHORITY-001-decision.md)
  - [historical recommended packet](HA-ATS-LIVE-AUTHORITY-001-recommended-decision.md)
  - [M36 control card](../queue/60-done/M36-T010-ats-live-authority-intake.md)
  - [M35 local unsigned configuration contract](../../specs/m35-local-unsigned-ats-create-configuration.md)
  - [M32 durable admission contract](../../specs/m32-durable-external-prepare-admission.md)
  - [M33 ATS prepare-authority contract](../../specs/m33-ats-prepare-authority-gate.md)

## Independent checks

- The approved issuer is canonical lowercase `0x` plus 40 hexadecimal
  characters and exactly equals the approved `parameters.diamondOwnerAccount`.
- An independent local RFC8785-JCS and `viem` Keccak-256 recomputation produced
  `d4eccfb1dbb76c77bf8395aa91377252e6f1a76f3926ec1632eeab909e667250`.
  The prior M35 synthetic digest
  `eae8bbe6d5ff6a5d8b1024abb378753ac7aadfb856db19edc22d93b171164a8f`
  is not reused.
- In the exact eleven-field M33 hashed preimage, only
  `parameters.diamondOwnerAccount` changes from the accepted M35 projection.
  M35's outer synthetic principal/version fields intentionally remain outside
  that preimage and are not claimed to be equal to the future authority tuple.
- The real issuer appears only in secret-free queue/control Markdown. No
  runtime source, key, authority row, provider, SDK, wallet, network,
  transaction, asset, deployment, or execution capability was changed.
- M33's production manifest remains zero-enabled. M33 receives only the
  external-prepare payload, while M32 has no `diamondOwnerAccount` field or
  recovered-signer-to-owner comparison. Leaving M33 zero-enabled and M32
  unchanged is therefore necessary within this Stage A authority.
- The Stage A exception is explicitly limited to source-integrity facts. The
  recorded HI-001 cut continues to exclude funding, allocation, clearing, ATS
  execution, and Stage B behavior. All direct local Markdown references in the
  reviewed M32, M33, M35, and M36 records resolve at the reviewed head.

## Verdict

No Critical, Important, or Minor finding remains for accepting M36-T010 as a
control intake. It authorizes no runtime enforcement or external behavior.
The only safe successor is a separately specified, private source-only
projection with focused tests that freeze the approved tuple, recompute the
new digest, and assert signer/owner equality as data. It must leave M35 intact,
M33 zero-enabled, M32 and the Convex schema unchanged, and create no
`commandAuthorities` row. Any enabled mapping later requires a separately
reviewed M32/M33 amendment that runtime-binds recovered signer to
`diamondOwnerAccount`, followed by a distinct Human Ops Stage B GO.
