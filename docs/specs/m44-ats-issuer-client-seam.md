# M44 ATS issuer client seam

## Delivery boundary

Stage B of the [campaign deploy flow design](../superpowers/specs/2026-09-08-campaign-deploy-flow-design.md)
requires the human provider to create the revenue note in their own MetaMask
through the official Asset Tokenization Studio SDK. The accepted projections in
[M35](m35-local-unsigned-ats-create-configuration.md) and
[M37](m37-stage-a-real-issuer-ats-create-authority.md) are private Backend
sources forbidden from importing that SDK, so nothing can construct the request.
M44 adds that missing seam and stops there: it produces a transaction candidate,
never a verified record.

It adds one pure request builder, one injected-seam client, and one client
island in `@tool402/web`, plus exactly one web dependency,
`@hashgraph/asset-tokenization-sdk` `8.0.0`, with recorded integrity
`sha512-V5Tg6IrWhMwxEWzzvv7fZWu4a8zXDj8vAk5OCO9W0dtact32hljstahPIY5dLvlpyNWwNXaepzpvDj77DoccsA==`.
It imports no Backend module and the web workspace does not depend on
`@tool402/backend`. The ATS_CREATE configuration enters as a caller-supplied
value that M44 parses closed and descriptor-safe on every call: S16-T010
commits it as the frozen literal
`apps/web/src/components/provider/deploy/ats-create-configuration.ts`
transcribed from the M42-T010 projections, and M44 parses that literal. M44
signs nothing, never verifies a receipt, never advances an attempt past the
candidate it hands back, and never marks an offering `READY`; only the
M43-T010 mirror verification may do that.

The accepted M33 authority manifest is zero-enabled, so no `PREPARED`
`ATS_CREATE` attempt can exist before Stage B: until then the live path is
unreachable. The client fails closed before `Network.init`, connecting a
provider, or prompting a wallet, and returns `attempt_not_prepared` once the
wallet and signer gates pass.

## Dependency amendment and day-one bundle gate

`apps/web/package.json` gains exactly one `dependencies` entry, the root
`package-lock.json` records exactly that resolution and integrity, and the
deep-equal dependency assertion in `apps/web/tests/static-shell.test.mjs` gains
exactly the same one entry. The three files are one dependency fact and land
together under a root integration reservation.

Proving it usable precedes every other GREEN source change: with the SDK
imported from the client island, the web workspace typecheck and
`npm run build --workspace @tool402/web` must pass under Next 16.3.4 with
`cacheComponents` enabled as accepted in [M01](m01-web-workspace.md). If
either fails because of the SDK, the card stops and the failure is recorded
as evidence. Do not fork, patch, vendor, shim, alias, mock, or downgrade the
SDK, and do not disable or narrow `cacheComponents`.

## Pure request builder

`apps/web/src/lib/ats/create-bond-request.ts` exports one runtime function and
its TypeScript-only types. It imports no SDK, wallet package, or cryptography.

```ts
export function buildAtsCreateBondRequestInput(
  configuration: unknown,
  context: AtsCreateBondRequestContext,
): AtsCreateBondRequestInput;
```

`context` is exactly `{ issuerEvmAddress, preparedAttemptId,
canonicalParametersHash }`. The result is a newly allocated frozen plain object
whose own keys are exactly the accepted `CreateBondRequest` parameter set:

```text
name, symbol, isin, decimals, isWhiteList, erc20VotesActivated,
isControllable, arePartitionsProtected, isMultiPartition, clearingActive,
internalKycActivated, externalPausesIds, externalControlListsIds,
externalKycListsIds, diamondOwnerAccount, currency, numberOfUnits, nominalValue,
nominalValueDecimals, startingDate, maturityDate, regulationType,
regulationSubType, isCountryControlListWhiteList, countries, info, configId,
configVersion, proceedRecipientsIds, proceedRecipientsData
```

The thirty values are read verbatim from `configuration.parameters`. The
builder supplies no default, applies no coercion, renames no field, and adds
no field the configuration does not carry. A missing key, an extra key, an
accessor, a reflection-hostile facade, or a non-plain container throws before
a result exists, as does drift from:

```text
configuration root
  network            = hedera:testnet
  chainId            = 296
  operationKind      = ATS_CREATE
  targetKind         = EVM_ADDRESS
  registryRevision   = ats_sdk_8_0_0_testnet_v2
  expectedTarget     = 0xd1f118a40f3b02883d35909ef2517e7edd78379d
  resolverHederaId   = 0.0.9212226
  resolverEvmAddress = 0xba2d5fc2083a0b8f164c50e65d782087fba18e0a
operationDescriptor
  factoryHederaId    = 0.0.9213391
  resolverHederaId   = 0.0.9212226
```

`parameters.diamondOwnerAccount` must equal `context.issuerEvmAddress`, both
lowercase `0x` and forty hexadecimal characters, and the configuration's root
`canonicalParametersHash` field, sixty-four lowercase hexadecimal characters
with no `0x`, must equal `context.canonicalParametersHash` exactly. That field
is transcribed by M42-T010 from HA-ATS-RETARGET-001 and is not restated here;
M44 recomputes no digest and accepts no substitute.

## Client seam

`apps/web/src/lib/ats/ats-client.ts` exports one construction boundary. Every
SDK capability is injected, so no test and no non-island module loads the SDK:

```ts
createAtsIssuerClient({
  network, // { init, connect }
  bond, // { create }
  createRequest, // (input: AtsCreateBondRequestInput) => unknown
}).createRevenueNote({ configuration, wallet, preparedAttempt });
```

The production `createRequest` is the only place constructing
`new CreateBondRequest(...)`, and the production `network` and `bond` seams the
only places reaching `Network.init`, `Network.connect`, and `Bond.create`.
Construction validates every seam synchronously and rejects an absent or
malformed one before any other work: there is no default provider, no ambient
`window.ethereum` read, and no fallback wallet. `wallet` is the handle the
S15-T010 island already selected and gated and `preparedAttempt` is the record
S16-T010 already holds; the client re-checks both, in this order:

```text
parse configuration
→ require wallet.status connected, wallet.chainIdHex 0x128, and
  wallet.signerAddress equal to configuration.parameters.diamondOwnerAccount
→ require preparedAttempt.state PREPARED, operationKind ATS_CREATE, and
  expectedTarget and canonicalParametersHash equal to the configuration
→ Network.init with configuration values only, then Network.connect with
  SupportedWallets.METAMASK
→ createRequest(buildAtsCreateBondRequestInput(...))
→ Bond.create once, then normalize the response into a candidate
```

No caller-selected, environment, or alternative endpoint is accepted. The client
returns exactly one of:

```ts
| { kind: "configuration_invalid" }
| { kind: "attempt_not_prepared" }
| { kind: "wallet_not_ready" }
| { kind: "signer_not_issuer" }
| { kind: "initialization_failed" }
| { kind: "connect_failed" }
| { kind: "rejected" }
| { kind: "submission_unknown" }
| { kind: "candidate"; transactionId: string; evmAddress: string }
```

`candidate` is the only outcome carrying data. `transactionId` matches the
Hedera transaction id grammar `0.0.N@seconds.nanos` or `0.0.N-seconds-nanos` and
`evmAddress` is lowercase `0x` and forty hexadecimal characters; a response not
yielding both in those exact forms is `submission_unknown`. A candidate records
only that one transaction was submitted from the provider's wallet: M44 signs
nothing, the S16-T010 wizard signs `external.attachCandidate` with
`{ transactionId, evmAddress }` as the second sub-step of its stage 3, and
M43-T010 decides what it was.

At most one `Bond.create` runs per prepared attempt id. The client never
retries, never resubmits, never polls, and never reads the mirror node. No
outcome carries a caught error, SDK diagnostic, payload, or signature.

`apps/web/src/components/provider/deploy/ats-create-action.tsx` is the client
island around that call. It performs no work on mount, imports the SDK only
inside its own client module graph, exposes one user-initiated action, and
renders one state per outcome using the accepted UI-S00 tokens and primitives.
Before Stage B the action is disabled and reads as not yet authorized; a
candidate reads as submitted and unverified; no state claims a note exists or
was verified, issued, paid, deployed, or live.

## Explicit exclusions

Do not modify Backend, Core, Agent, Convex, M35, M37, ingress, or any accepted
web route, component, or test beyond the single declared dependency-pin
amendment. Do not add a second dependency, wagmi, RainbowKit, WalletConnect, a
toast or theme library, or a bundler override. Do not read an environment
variable, cookie, header, or storage entry; do not fetch; do not create, hold,
log, or persist key material; do not sign a command or payload; do not write a
durable record; do not use `eval`, `Function`, or equivalent source indirection.
`ATS_CONTROL_LIST`, `ATS_ISSUE`, `ATS_TRANSFER`, `ATS_COUPON`, and
`HEDERA_FUNDING` remain outside M44.

## Acceptance evidence

- Two durable test-only RED files precede every source and manifest change
  other than the dependency pin and the minimal island import that the bundle
  gate requires, and fail only because the declared modules do not exist.
- Focused tests load the `.ts` modules the way the accepted web tests do and
  prove every builder field by name and value, exact key-set equality, drift
  rejection per fixed value, issuer-to-owner equality, equality of the
  configuration's root `canonicalParametersHash` and the supplied context
  value, and result immutability and detachment.
- Client tests use fake seams and prove every outcome in the closed union, that
  a failed wallet, signer, or attempt check reaches no seam, that `Bond.create`
  runs at most once, and that no SDK, provider, or network module loads.
- The day-one bundle gate result is recorded before GREEN source lands, and
  `npm run typecheck`, `npm run test`, `npm run lint`, the web build,
  `npm run queue:check`, the enabled local-reference guard, independent task
  review, and fresh module-review generations report no finding.

## Human boundary

HA-ISSUER-ACCOUNT-001 and HA-ATS-STAGE-B-001 remain human-only and neither is
complete. Until both are accepted, no SDK call reaches a wallet, no transaction
is submitted, and the card delivers only local source, tests, and the
bundle-gate result. HA-ATS-RETARGET-001 gates M42-T010, whose output this seam
consumes. The browser wallet rule it relies on is accepted in
[HA-COMMAND-AUTHORITY-001](../work-queue/evidence/HA-COMMAND-AUTHORITY-001-decision.md),
and [HA-ATS-LIVE-AUTHORITY-001](../work-queue/evidence/HA-ATS-LIVE-AUTHORITY-001-decision.md)
authorizes no SDK call.
