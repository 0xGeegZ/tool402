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
The published artifact defines `deployBond` and its ABI only. The Factory
target is the accepted M42 `expectedTarget`
`0xd1f118a40f3b02883d35909ef2517e7edd78379d`; M44 never duplicates or
transcribes the ABI.

## Local pure seam

`apps/web/src/lib/ats/factory-deploy-bond.ts` is the one local adapter. It
accepts a complete caller-supplied M42/Stage-B configuration and issuer EVM
address, rejects an incomplete, surplus, non-canonical, or drifted input, and
returns a detached artifact-shaped request. It has no environment, Backend,
S16 display-literal, storage, fetch, wallet, provider, RPC, signer,
simulation, transaction, or durable-write access.

The input is the complete accepted Stage-B issuer configuration: M42 frozen
values plus the accepted canonical issuer. The following closed table is the
complete mapping. Each left-hand path is an artifact tuple field and every
right-hand item is a required input or fixed upstream compatibility value; no
other field or implicit default is permitted.

| Artifact tuple path | Exact mapping |
|---|---|
| Factory `address` | `expectedTarget` (`0xd1f118a40f3b02883d35909ef2517e7edd78379d`) |
| `BondData.security.resolver` | `resolverEvmAddress` (`0xba2d5fc2083a0b8f164c50e65d782087fba18e0a`) |
| `BondData.security.maxSupply` | `parameters.numberOfUnits` |
| `BondData.security.resolverProxyConfiguration.key` | `parameters.configId` |
| `BondData.security.resolverProxyConfiguration.version` | `parameters.configVersion` |
| `BondData.security.erc20MetadataInfo.name` | `parameters.name` |
| `BondData.security.erc20MetadataInfo.symbol` | `parameters.symbol` |
| `BondData.security.erc20MetadataInfo.isin` | `parameters.isin` |
| `BondData.security.erc20MetadataInfo.decimals` | `parameters.decimals` |
| `BondData.security.rbacs[0].role` | upstream `DEFAULT_ADMIN_ROLE` (`0x0000000000000000000000000000000000000000000000000000000000000000`) |
| `BondData.security.rbacs[0].members` | one canonical issuer: `parameters.diamondOwnerAccount`, equal to the Stage-B signer |
| `BondData.security.externalPauses` | `parameters.externalPausesIds` |
| `BondData.security.externalControlLists` | `parameters.externalControlListsIds` |
| `BondData.security.externalKycLists` | `parameters.externalKycListsIds` |
| `BondData.security.compliance` | `0x0000000000000000000000000000000000000000` for omitted `complianceId` |
| `BondData.security.identityRegistry` | `0x0000000000000000000000000000000000000000` for omitted `identityRegistryId` |
| `BondData.security.arePartitionsProtected` | `parameters.arePartitionsProtected` |
| `BondData.security.isMultiPartition` | `parameters.isMultiPartition` |
| `BondData.security.isControllable` | `parameters.isControllable` |
| `BondData.security.isWhiteList` | `parameters.isWhiteList` |
| `BondData.security.clearingActive` | `parameters.clearingActive` |
| `BondData.security.internalKycActivated` | `parameters.internalKycActivated` |
| `BondData.security.erc20VotesActivated` | `parameters.erc20VotesActivated` |
| `BondData.bondDetails.currency` | `parameters.currency` |
| `BondData.bondDetails.nominalValue` | `parameters.nominalValue` |
| `BondData.bondDetails.nominalValueDecimals` | `parameters.nominalValueDecimals` |
| `BondData.bondDetails.startingDate` | `parameters.startingDate` |
| `BondData.bondDetails.maturityDate` | `parameters.maturityDate` |
| `BondData.proceedRecipients` | `parameters.proceedRecipientsIds` |
| `BondData.proceedRecipientsData` | `parameters.proceedRecipientsData` |
| `FactoryRegulationData.regulationType` | `parameters.regulationType` |
| `FactoryRegulationData.regulationSubType` | `parameters.regulationSubType` |
| `FactoryRegulationData.additionalSecurityData.countriesControlListType` | `parameters.isCountryControlListWhiteList` |
| `FactoryRegulationData.additionalSecurityData.listOfCountries` | `parameters.countries` |
| `FactoryRegulationData.additionalSecurityData.info` | `parameters.info` |

The two zero-address rows reproduce the official upstream
`deployBondFromFactory` compatibility mapping for ABI-required values deliberately
omitted by M42. They are not Tool402 economic or configuration defaults.

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
