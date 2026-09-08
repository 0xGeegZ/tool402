# HA-ATS-CONFIGURATION-001 — Accepted local unsigned ATS configuration

## Status and scope

**ACCEPTED as one secret-free, local, unsigned `ATS_CREATE` configuration
authority.**

- Decision owner: `0xGeegZ`
- Original decision timestamp: `2026-09-08T10:17:00Z`
- Validation amendment timestamp: `2026-09-08T10:53:22Z`

The human selected `REG_S / NONE` for the configuration amendment after the
root found that the initial `NONE / NONE` pair was incompatible with the
approved SDK request validator. The exact amended values are
`regulationType: 1` and `regulationSubType: 0`.

This authority creates no executable issuer, `commandAuthorities` row, M32
durable-admission path, enabled M33 entry, SDK import, SDK initialization,
wallet/provider interaction, transaction, asset, account action, funding,
payment, deployment, or live claim. It is a deterministic Tool402-owned
projection only. A later live gate must replace the synthetic issuer with a
real human-controlled issuer and separately authorize every executable step.

## Approved SDK contract surface

The selected SDK identity is exactly:

```text
@hashgraph/asset-tokenization-sdk@8.0.0
sha512-V5Tg6IrWhMwxEWzzvv7fZWu4a8zXDj8vAk5OCO9W0dtact32hljstahPIY5dLvlpyNWwNXaepzpvDj77DoccsA==
```

The one selected creation family is `STANDARD_BOND`. The eventual execution
surface is exactly the `CreateBondRequest` named-object constructor and
`Bond.create(request)` overload that resolves to a security view model and a
transaction identifier. This decision authorizes neither construction nor
invocation of either symbol. `complianceId` and `identityRegistryId` are
explicitly omitted; no environment, SDK, or provider default may supply them.

## Synthetic issuer and ownership boundary

```text
canonicalIssuerEvmAddress = 0x0000000000000000000000000000000000000402
principalPublicId          = tool402_ats_issuer_demo
role                       = ISSUER
authorityVersion           = ats_issuer_demo_v1
subjectPublicId            = riskscan_revenue_note_demo
offeringVersion            = ats_demo_v1
registryRevision           = ats_sdk_8_0_0_testnet_v1
```

The synthetic address is non-executable. The local projection accepts only
the declared principal, role, authority version, and subject together; any
mismatch fails closed. It does not establish a runtime authority record.

## Fixed network, target, and operation descriptor

```text
network                    = hedera:testnet
chainId                    = 296
mirrorNodeBaseUrl          = https://testnet.mirrornode.hedera.com/api/v1/
rpcNodeBaseUrl             = https://testnet.hashio.io/api
resolverHederaId           = 0.0.7707874
resolverEvmAddress         = 0xefef4cae9642631cfc6d997d6207ee48fa78fe42
factoryHederaId            = 0.0.7708432
expectedTarget             = 0x5fa65ca30d1984701f10476664327f97c864a9d3
targetKind                 = EVM_ADDRESS
targetContractRole         = FACTORY_PROXY
operationKind              = ATS_CREATE
```

The local configuration consumes and implies none of the accepted M20
economics. It is a testnet structural-compatibility contract, not a funding,
allocation, clearing, holder, payout, or return claim.

Its closed operation descriptor is:

```json
{
  "sdkPackage": "@hashgraph/asset-tokenization-sdk",
  "sdkVersion": "8.0.0",
  "creationFamily": "BOND_STANDARD",
  "requestExport": "CreateBondRequest",
  "requestConstructor": "new CreateBondRequest",
  "methodExport": "Bond",
  "method": "create",
  "targetContractRole": "FACTORY_PROXY",
  "factoryHederaId": "0.0.7708432",
  "resolverHederaId": "0.0.7707874",
  "mirrorNodeBaseUrl": "https://testnet.mirrornode.hedera.com/api/v1/",
  "rpcNodeBaseUrl": "https://testnet.hashio.io/api",
  "configId": "0x0000000000000000000000000000000000000000000000000000000000000002",
  "configVersion": 1,
  "omittedOptionalFields": [
    "complianceId",
    "identityRegistryId"
  ]
}
```

## Fixed unsigned parameters and hash binding

```json
{
  "name": "Tool402 RiskScan Revenue Note Demo",
  "symbol": "T402RN",
  "isin": "XS402RISKN02",
  "decimals": 0,
  "isWhiteList": true,
  "erc20VotesActivated": false,
  "isControllable": false,
  "arePartitionsProtected": false,
  "isMultiPartition": false,
  "clearingActive": false,
  "internalKycActivated": false,
  "externalPausesIds": [],
  "externalControlListsIds": [],
  "externalKycListsIds": [],
  "diamondOwnerAccount": "0x0000000000000000000000000000000000000402",
  "currency": "0x555344",
  "numberOfUnits": "1000",
  "nominalValue": "1",
  "nominalValueDecimals": 0,
  "startingDate": "1789430400",
  "maturityDate": "1798675200",
  "regulationType": 1,
  "regulationSubType": 0,
  "isCountryControlListWhiteList": false,
  "countries": "",
  "info": "Tool402 testnet demo revenue note; no real-world investment or return claim.",
  "configId": "0x0000000000000000000000000000000000000000000000000000000000000002",
  "configVersion": 1,
  "proceedRecipientsIds": [],
  "proceedRecipientsData": []
}
```

The exact M33 canonical preimage is the closed object with:

```text
protocol          = tool402:ats-parameters:v1
network           = hedera:testnet
chainId           = 296
subjectPublicId   = riskscan_revenue_note_demo
offeringVersion   = ats_demo_v1
registryRevision  = ats_sdk_8_0_0_testnet_v1
operationKind     = ATS_CREATE
targetKind        = EVM_ADDRESS
expectedTarget    = 0x5fa65ca30d1984701f10476664327f97c864a9d3
operationDescriptor and parameters = the exact objects above
```

The RFC8785-JCS UTF-8 Keccak-256 result, without `0x`, is exactly:

```text
eae8bbe6d5ff6a5d8b1024abb378753ac7aadfb856db19edc22d93b171164a8f
```

No recipient, payment amount, holder, external-list member, coupon,
transaction identifier, or operation-instance value is dynamically selected.

## Future gates

`ATS_CONTROL_LIST`, `ATS_ISSUE`, `ATS_TRANSFER`, and `ATS_COUPON` remain
unauthorized. Before any executable `ATS_CREATE` action, a later explicit
human gate must authorize the actual issuer, a current authority record, a
reviewed enabled M33 mapping, SDK initialization, MetaMask/provider use,
execution, and receipt/finality verification.
