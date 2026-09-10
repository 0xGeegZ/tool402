# M44-T010 official contracts + viem spike

## Scope

This is a bounded architecture comparison requested before merging the SDK
bundle fallback. It evaluated only the published
`@hashgraph/asset-tokenization-contracts@8.0.0` Factory artifact and local
`viem@2.56.1` encoding. It did not add a tracked dependency or source file,
call a wallet or provider, make an RPC request or simulation, or submit a
transaction.

## Official package evidence

On 2026-09-10, npm returned this exact official package identity:

```text
@hashgraph/asset-tokenization-contracts@8.0.0
sha512-OGxFWfb0FTaQtRSqETDGBPdxakYt0L/L2A5OgVlBtBCqs/Pz74NTLpqzPw/QOnOnhWiLLo9wYCKNze7sz5B8iQ==
```

Its published `package.json` exposes `./artifacts/*`. The exact consumed
subpath is:

```text
@hashgraph/asset-tokenization-contracts/artifacts/contracts/factory/Factory.sol/Factory.json
```

That artifact is 51,751 bytes and contains the ABI entries for both
`deployBond(BondData, FactoryRegulationData)` and `BondDeployed`.

## Exact local encoding probe

The artifact entered a temporary client island in the existing
`/provider/deploy` Turbopack route with no `dotenv`, Winston, BBS, Node
polyfill, or `serverExternalPackages` setting. The disabled Stage 3 control
rendered in the browser, proving the artifact evaluates in the client graph.
The full production command again reached only the pre-existing local CSS
worker port restriction; it produced no artifact or Node-module diagnostic.

Using viem's `encodeFunctionData` and the artifact's ABI, the Stage-B value
shape encoded an exact `deployBond` call with selector `0x29002951` and 1,956
calldata bytes. The tuple follows upstream `deployBondFromFactory` exactly:

```text
BondData.security
  resolver
  maxSupply
  resolverProxyConfiguration { key, version }
  erc20MetadataInfo { name, symbol, isin, decimals }
  rbacs (DEFAULT_ADMIN_ROLE + canonical issuer)
  external pauses/control lists/KYC lists
  compliance, identityRegistry
  fixed M42 booleans
BondData.bondDetails
  currency, nominalValue, nominalValueDecimals, startingDate, maturityDate
BondData.proceedRecipients / proceedRecipientsData
FactoryRegulationData
  regulationType, regulationSubType, additionalSecurityData
```

The accepted M42 configuration omits `complianceId` and `identityRegistryId`.
The official SDK's own `CreateBondCommandHandler` maps precisely those absent
optional fields to `EVM_ZERO_ADDRESS`; the probe uses that same ABI-required
zero address, not a Tool402-specific default.

The artifact declares `BondDeployed` with indexed `deployer` and the emitted
`bondAddress`, so a later accepted receipt seam can decode it from the official
ABI. This spike does not perform that receipt action.

## Result

The direct-contract route is materially cleaner than browser-adapting the SDK:
the only client dependencies are the official Factory artifact and existing
viem. It is technically viable, but an accepted decision is still required
before changing M42's SDK-labelled configuration descriptor, adding the
package, writing the builder/client, or changing the M43 candidate/receipt
boundary.
