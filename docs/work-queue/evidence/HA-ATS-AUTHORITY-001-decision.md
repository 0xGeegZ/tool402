# HA-ATS-AUTHORITY-001 — ATS prepare-authority decision

## Decision

- Decision owner: `0xGeegZ`
- Decision timestamp: `2026-09-08T06:24:09Z`
- Human approval: `Aller c'est approuver continue maintenant`
- Scope: a secret-free, server-owned, non-executable ATS prepare-authority
  gate only.

The approval authorizes M33-T010 to add the smallest local admission predicate
for `ATS_*` external-prepare commands. It does not authorize a wallet,
provider, ATS SDK, account, funding, configuration provisioning, transaction,
deployment, or any other external action.

## Authoritative source and lookup

M33 owns one immutable, compiled, server-only manifest in an internal Convex
module. It has no environment, URL, browser, signer, provider, network
discovery, database writer, or dynamic configuration input. Only a future
explicit human decision and reviewed replacement revision may add an enabled
entry.

For an `ATS_*` payload, the resolver finds its authority only by the exact
tuple:

```text
(network = hedera:testnet, chainId = 296, subjectPublicId, operationKind)
```

It must never use the candidate `expectedTarget`, candidate
`canonicalParametersHash`, browser data, signer claims, or role claims as a
lookup key or source of authority. A missing, duplicate, disabled, malformed,
or mismatched matching entry fails closed.

The initial manifest contains no enabled entry. Therefore every current
`ATS_CREATE`, `ATS_CONTROL_LIST`, `ATS_ISSUE`, `ATS_TRANSFER`, and
`ATS_COUPON` command fails closed. `HEDERA_FUNDING` is outside this manifest
and retains its separately accepted BACKER identity predicate.

## Future enabled-entry rule

Any future enabled entry must bind one immutable subject/version/operation and
contain exactly:

```text
schemaVersion = 1
network = hedera:testnet
chainId = 296
subjectPublicId
offeringVersion
registryRevision
operationKind
targetKind
expectedTarget
operationDescriptor
parameters
enabled = true
```

`targetKind` is either a canonical Hedera account identifier or a lowercase
EVM address. No equivalent representation, case conversion, latest-version
selection, wildcard, or target fallback is allowed.

The resolver reconstructs this exact closed object before comparing the signed
payload:

```text
{
  protocol: "tool402:ats-parameters:v1",
  network,
  chainId,
  subjectPublicId,
  offeringVersion,
  registryRevision,
  operationKind,
  targetKind,
  expectedTarget,
  operationDescriptor,
  parameters
}
```

It RFC8785-JCS canonicalizes the object, Keccak-256 hashes its UTF-8 bytes,
and removes the `0x` prefix. The resulting value must be exactly the M26
lowercase 64-hex `canonicalParametersHash`; `expectedTarget` must also match
byte-for-byte. The M17 requirements digest and M30 outer payload hash are not
substitutes.

Before a future entry can be enabled, a separate authority decision must fix
the real interface version and the complete operation-specific descriptor and
parameters:

- `ATS_CREATE`: instrument type, creation target, and all creation arguments;
- `ATS_CONTROL_LIST`: list model, action, target, affected subjects, and all
  arguments;
- `ATS_ISSUE`: asset/partition, recipient, quantity/unit policy, target, and
  all arguments;
- `ATS_TRANSFER`: source, recipient, asset/partition, quantity/unit policy,
  target, and all arguments;
- `ATS_COUPON`: instrument kind, schedule/record/payment semantics, target,
  and all arguments.

One enabled parameter set per immutable
`(subjectPublicId, offeringVersion, operationKind)` is allowed. Dynamic
recipient, amount, list, coupon, or operation-instance selection requires a
later separately approved trusted-intent design.

## Required durable ordering

For an accepted serialized command, M33 narrows M32's internal mutation order
to:

```text
M26/JCS/time rebinding
→ current signer authority revalidation
→ ATS prepare-authority resolution and exact comparison
→ replay lookup
→ idempotency lookup
→ durable claim/attempt write
```

An ATS rejection must make no replay or idempotency lookup and no write. The
new gate does not turn `PREPARED` into execution authority.

## Explicit exclusions

M33 adds no Convex schema, writer, public function, generated API, HTTP/BFF
adapter, browser/provider code, signing, wallet/account action, ATS SDK,
configuration provisioning, funding, payment, transaction, settlement,
clearing, HCS, payout, deployment, or live evidence. It does not reopen M04
RiskScan persistence/reconciliation or M26/M30/M31 behavior.

## Standing continuation

The root may create and execute the smallest dependency-correct local M33
card through the normal specification, RED, GREEN, independent review,
verification, commit, and push cycle. A later live/configuration decision is
still required before any ATS entry is enabled.
