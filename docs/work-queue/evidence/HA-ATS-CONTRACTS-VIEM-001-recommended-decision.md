# HA-ATS-CONTRACTS-VIEM-001 — Recommended decision packet

## Status and owner

**PENDING — no implementation authority.** This packet is prefilled after the
bounded [M44 direct-contract spike](M44-T010-contracts-viem-spike.md). The
human operator must explicitly accept or decline it. The root may record that
choice, but may not implement this seam from the packet alone.

## Proposed ruling

Replace M44's future browser execution seam with the exact official
`@hashgraph/asset-tokenization-contracts@8.0.0` Factory artifact and existing
`viem@2.56.1`, rather than executing the browser-adapted SDK root.

The accepted scope would permit only:

1. pinning the official contracts package at `8.0.0` with the recorded
   integrity and importing only its published Factory artifact subpath;
2. constructing the artifact-defined `deployBond(BondData,
   FactoryRegulationData)` tuple from the already accepted Stage-B authority
   and M42 fixed configuration, reproducing upstream
   `deployBondFromFactory` without invented fields or defaults;
3. encoding and, only under a later existing execution authority, sending that
   call through the already accepted wallet boundary; and
4. decoding the official `BondDeployed` event into the existing candidate and
   M43 receipt boundary.

The implementation must add strict tests that compare every tuple field to the
accepted configuration and official ABI. It must not hand-write an ABI, import
the ATS SDK, Hardhat, dotenv, Winston, BBS code, a Node polyfill, or a general
compatibility alias.

## Boundaries retained

This packet does not itself authorize a wallet prompt, provider/RPC call,
simulation, transaction, account access, durable write, candidate attachment,
Mirror request, deployment, or live action. `HA-ATS-STAGE-B-001` remains the
sole execution gate; the M43 receipt boundary remains separate. It changes no
accepted M42 or M43 source until a fresh scoped local specification and RED
contract are accepted.

## Cost if declined

Keep the current SDK bundle proof only as the documented fallback. No on-chain
or account state was changed by the comparison.
