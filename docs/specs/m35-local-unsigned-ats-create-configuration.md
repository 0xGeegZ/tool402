# M35 local unsigned ATS_CREATE configuration projection

## Delivery boundary

M35 adds one private Backend projection of the exact configuration accepted in
[HA-ATS-CONFIGURATION-001](../work-queue/evidence/HA-ATS-CONFIGURATION-001-decision.md).
It returns fresh, detached, frozen data for exactly one testnet `ATS_CREATE`
configuration. It has no input and therefore accepts no browser, signer,
environment, network, configuration, database, or caller-selected value.

This is not an enabled M33 authority record. It does not make a command
admissible, durable, prepared, executable, paid, settled, or live. It is not
an ATS SDK adapter and must never initialize an SDK, construct a request,
connect a provider, prompt a wallet, or submit an operation.

## Private API

`packages/backend/src/ats/local-unsigned-ats-create-configuration.ts` exports
only this runtime function and its TypeScript-only result types. It is not
exported by `@tool402/backend`.

```ts
export function createLocalUnsignedAtsCreateConfiguration():
  LocalUnsignedAtsCreateConfiguration;
```

The returned root, descriptor, parameters, and every nested array are newly
allocated and frozen. A second call returns equal data but shares no mutable
object or array with the first call.

The root contains the following literal values:

```text
protocol                  = tool402:ats-parameters:v1
network                   = hedera:testnet
chainId                   = 296
subjectPublicId           = riskscan_revenue_note_demo
offeringVersion           = ats_demo_v1
registryRevision          = ats_sdk_8_0_0_testnet_v1
operationKind             = ATS_CREATE
targetKind                = EVM_ADDRESS
expectedTarget            = 0x5fa65ca30d1984701f10476664327f97c864a9d3
canonicalIssuerEvmAddress = 0x0000000000000000000000000000000000000402
principalPublicId         = tool402_ats_issuer_demo
role                      = ISSUER
authorityVersion          = ats_issuer_demo_v1
sdkPackage                = @hashgraph/asset-tokenization-sdk
sdkVersion                = 8.0.0
sdkIntegrity              = sha512-V5Tg6IrWhMwxEWzzvv7fZWu4a8zXDj8vAk5OCO9W0dtact32hljstahPIY5dLvlpyNWwNXaepzpvDj77DoccsA==
resolverHederaId          = 0.0.7707874
resolverEvmAddress        = 0xefef4cae9642631cfc6d997d6207ee48fa78fe42
m20EconomicsBinding       = NONE
```

`operationDescriptor` is exactly:

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

`parameters` is exactly:

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

## Canonical binding invariant

On every call, M35 creates the exact preimage below from its newly allocated
descriptor and parameters, serializes it with Core's accepted RFC8785-JCS
canonicalizer, Keccak-256 hashes the UTF-8 bytes with the already direct
Backend `viem` dependency, removes `0x`, and requires this exact result:

```text
eae8bbe6d5ff6a5d8b1024abb378753ac7aadfb856db19edc22d93b171164a8f
```

```text
protocol
network
chainId
subjectPublicId
offeringVersion
registryRevision
operationKind
targetKind
expectedTarget
operationDescriptor
parameters
```

Any source drift that changes this hash throws before a projection is returned.
No normalization, fallback, omitted field, provider value, environment value,
or runtime mutation can alter the configuration.

## Explicit exclusions

Do not alter M33's compiled zero-enabled manifest, M32 durable admission,
Convex schema/functions, existing ingress source, RiskScan persistence,
Backend public barrel, packages, lockfile, Web/UI, Agent, configuration,
environment, generated output, or any existing test.

Do not import the ATS SDK or any wallet/provider package. Do not call
`Network.init`, `Network.connect`, `new CreateBondRequest(...)`, or
`Bond.create(...)`. Do not access a wallet, browser provider, account, key,
clock, storage, network, HTTP, transaction, payment, funding, allocation,
clearing, HCS, payout, deployment, or live evidence.

`ATS_CONTROL_LIST`, `ATS_ISSUE`, `ATS_TRANSFER`, and `ATS_COUPON` remain
outside M35. A later explicit human execution gate and separately reviewed
enabled M33 mapping remain necessary for every executable ATS operation.

## Acceptance evidence

- A test-only RED commit precedes the projection source.
- Focused tests prove the exact literal projection, amended canonical hash,
  recomputed preimage/hash equality, full immutability, independent-call
  detachment, private-module surface, no public Backend export, no new SDK
  dependency, and no prohibited import/call/configuration capability.
- Backend/root typecheck, test, lint, clean-install dry run, queue/reference/
  whitespace checks, enabled local guard, independent task review, and two
  fresh clean module-review generations pass before acceptance.
