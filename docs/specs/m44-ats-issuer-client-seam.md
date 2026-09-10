# M44 ATS Factory contracts + viem seam

## Delivery boundary

M44 uses the published Factory artifact from
`@hashgraph/asset-tokenization-contracts@8.0.0` and the existing
`viem@2.56.1` to prepare the official `deployBond(BondData,
FactoryRegulationData)` calldata. It replaces the rejected browser SDK path:
no `@hashgraph/asset-tokenization-sdk`, dotenv/Winston adapter, BBS alias,
Node polyfill, Hardhat, custom ABI, or `serverExternalPackages` setting belongs
to this selected seam.

The only ABI is imported from:

```text
@hashgraph/asset-tokenization-contracts/artifacts/contracts/factory/Factory.sol/Factory.json
```

The package is pinned exactly to `8.0.0` with integrity
`sha512-OGxFWfb0FTaQtRSqETDGBPdxakYt0L/L2A5OgVlBtBCqs/Pz74NTLpqzPw/QOnOnhWiLLo9wYCKNze7sz5B8iQ==`.
The published artifact defines the Factory target and its `deployBond` ABI;
M44 never duplicates or transcribes that ABI.

## Local pure seam

`apps/web/src/lib/ats/factory-deploy-bond.ts` is the one local adapter. It
accepts a complete caller-supplied M42/Stage-B configuration and issuer EVM
address, rejects an incomplete, surplus, non-canonical, or drifted input, and
returns a detached artifact-shaped request. It has no environment, Backend,
S16 display-literal, storage, fetch, wallet, provider, RPC, signer,
simulation, transaction, or durable-write access.

The request fixes all data only from accepted M42 configuration:

- Factory target `0xd1f118a40f3b02883d35909ef2517e7edd78379d`, resolver
  `0xba2d5fc2083a0b8f164c50e65d782087fba18e0a`, configuration key/version,
  issuer, `DEFAULT_ADMIN_ROLE`, canonical issuer membership, supply and ERC20
  metadata.
- `BondData.security`, `bondDetails`, all external list arrays, proceeds, bond
  currency, nominal value, dates, regulation type and subtype.
- The M42-omitted `complianceId` and `identityRegistryId` are ABI-required
  `0x0000000000000000000000000000000000000000`. This is the upstream
  `deployBondFromFactory` compatibility mapping, not a Tool402 default.

`encodeFactoryDeployBond` calls `viem.encodeFunctionData` with the imported
artifact's `abi`, `functionName: "deployBond"`, and the two exact tuples. Its
calldata selector is therefore the official `0x29002951`. `decodeBondDeployed`
uses that same artifact to decode `BondDeployed` and returns only the canonical
lowercase EVM bond address. No function sends the encoded data.

`normalizeHederaCandidateTransactionId` implements accepted HI-007: either a
valid SDK `0.0.N@seconds.nanos` or mirror form becomes exactly
`0.0.N-seconds-NNNNNNNNN`; anything else is rejected so a future caller can
return `submission_unknown`. M38, M43, and S21 remain unchanged.

## UI and browser proof

The existing stage-three unavailable control may statically import the official
Factory artifact once, render a disabled control only, and expose an observable
`data-ats-contracts-bundle` result. It must not call `encodeFunctionData`,
construct a tuple, prompt MetaMask, access a provider, or execute `deployBond`.
The Turbopack production build, emitted client graph, and `/provider/deploy`
browser evaluation must prove that the artifact + viem route loads without the
rejected SDK compatibility machinery.

## Explicit exclusions and execution gate

`HA-ATS-STAGE-B-001` remains the sole authority for any provider interaction,
signing, simulation, `deployBond` call, transaction, candidate attachment,
Mirror verification, or testnet action. M44 only builds, encodes, decodes, and
renders unavailable local state. M43 remains the receipt boundary and decides
no positive result here.

## Acceptance evidence

Focused tests must prove the official artifact version and integrity, exact ABI
usage, M42 Factory target, every `BondData` and `FactoryRegulationData` field,
role mapping, zero-address compatibility fields, selector, absence of invented
tuple defaults, `BondDeployed` decoding, HI-007 normalization, and rejected
environment/wallet/provider/SDK imports. Browser/build proof must show that
the official artifact and viem reach `/provider/deploy` with none of the
rejected SDK compatibility dependencies.
