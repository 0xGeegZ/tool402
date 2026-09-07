# HA-COMMAND-AUTHORITY-001 — Accepted human decision

## Status and scope

**ACCEPTED as bounded D-Day architecture authority.**

Decision owner: `0xGeegZ`
Decision timestamp: `2026-09-07T18:25:00Z`

This decision authorizes only a local authenticated `external.prepare`
normalization and signature-verification boundary. It authorizes no wallet
call, account setup, funding, payment, provider invocation, transaction,
deployment, or other external action. Every unspecified value fails closed.

## Command and typed-data vocabulary

- Command type is exactly `external.prepare`.
- Command version is exactly integer `1`.
- The wire command has exactly `version`, `type`, `chainId`, `signer`,
  `nonce`, `issuedAt`, `expiresAt`, `payloadHash`, and `signature` fields.
- The fixed EIP-712 domain is `{ name: "Tool402", version: "1", chainId:
  296 }`; no alternate domain or chain is accepted.
- The primary type is `Tool402Command`. Its message fields, in this exact
  order, are `version:uint8`, `type:string`, `signer:address`, `nonce:string`,
  `issuedAt:string`, `expiresAt:string`, and `payloadHash:bytes32`.
- The digest is `keccak256(0x1901 || domainSeparator || hashStruct)` using
  that exact domain and message. Raw JSON ordering has no authority.

The normalizer accepts only decimal integer `1`, literal
`external.prepare`, decimal integer `296`, and a 22-character canonical
unpadded base64url nonce encoding 16 bytes. Its first 21 characters must use
`[A-Za-z0-9_-]`, and its final character must be exactly one of `A`, `Q`,
`g`, or `w`. Every command timestamp must match exactly
`YYYY-MM-DDTHH:mm:ss.sssZ` and round-trip unchanged through
`new Date(value).toISOString()`; payload expiry independently follows the
same canonical rule. It also accepts only a lower-case `0x`-prefixed 32-byte
payload hash. Unknown, missing, duplicate, accessor-backed, inherited,
custom-prototype, or non-canonical values fail closed.

## Signature, signer, and wallet boundary

- The submitted signer must already be `0x` plus exactly 40 lower-case
  hexadecimal characters. It is never silently lower-cased on input.
- The signature is `0x` plus exactly 130 lower-case hexadecimal characters,
  represents one low-s 65-byte recoverable secp256k1 EOA signature, and uses
  only recovery suffix `00`, `01`, `1b`, or `1c`.
- Before verification only, `00` becomes `1b` and `01` becomes `1c`; `1b`
  and `1c` remain unchanged. The normalizer neither mutates caller input nor
  returns or persists the raw signature.
- Verification uses only the approved EIP-712 verifier implementation and an
  unambiguous recovered EOA. The recovered lower-case address must equal the
  submitted canonical signer before authority lookup.
- The browser path, when a later explicitly scoped client card needs it, may
  select exactly one EIP-6963 candidate with `info.rdns === "io.metamask"`
  and `provider.isMetaMask === true`. With no such candidate, legacy
  `window.ethereum` is permitted only when `isMetaMask === true`. Zero or
  multiple candidates fail closed; no generic injected, WalletConnect,
  Coinbase, server-key, or other fallback is permitted. The selected provider
  must report `eth_chainId === 0x128` before `eth_signTypedData_v4`.

## Signer authority

The future runtime authority source is a server-side durable
`commandAuthorities` record keyed by `(chainId = 296, canonicalSignerAddress)`
and carrying only `principalPublicId`, `canonicalSignerAddress`, `chainId`,
`role`, `ownedSubjectPublicIds`, `authorityVersion`, and `enabled`.

Only one enabled matching record is acceptable. `ATS_*` payload kinds require
an `ISSUER` role and membership of `subjectPublicId` in
`ownedSubjectPublicIds`. `HEDERA_FUNDING` requires a `BACKER` role. Browser
claims never grant role, principal, or ownership authority. The normalized
command carries the exact read `authorityVersion`; a changed, disabled, or
superseded record invalidates a command that has not already been durably
accepted.

## Time, replay, and idempotency semantics

`command.expiresAt` and `payload.expiresAt` must be byte-for-byte identical.
Both must be independently canonical timestamps. The server-clock rules are:

```text
expiresAt > issuedAt
expiresAt - issuedAt <= 300 seconds
issuedAt <= serverNow + 60 seconds
serverNow <= expiresAt
```

Any one-millisecond mismatch fails before signature-authorized normalization;
there is no alternative precedence or longer-lived payload capability.

The wallet-command replay identity is exactly:

```text
tool402:wallet-command:v1:296:<canonicalSigner>:<nonce>
```

At a later durable boundary, an already claimed exact replay identity produces
`COMMAND_REPLAYED` before idempotency handling. A fresh nonce may retrieve an
existing attempt only when the detached payload's idempotency key and
payload hash match and this exact command-context tuple matches:

```text
(version, type, chainId, canonicalSigner, principalPublicId, role,
 authorityVersion, payloadHash)
```

The nonce is intentionally outside that tuple; the idempotency key is the
separate lookup identity and is already bound by `payloadHash`. A changed
payload hash or command context is `IDEMPOTENCY_CONFLICT`. No future repeat
may create a second attempt, reopen a completed attempt, invoke a provider,
or submit an external operation.

## Detached payload binding and explicit deferral

The detached value is exactly one M26 `ExternalPreparePayload`. Its command
binding digest is the lower-case `0x`-prefixed Keccak-256 digest of the UTF-8
RFC8785 JCS representation of the frozen eight-field M26 value:

```text
operationKind
subjectPublicId
network
chainId
expectedTarget
canonicalParametersHash
idempotencyKey
expiresAt
```

The normalizer must independently parse the payload through M26, recompute the
digest, and require exact equality with the signed `payloadHash`. Any changed
field, changed target, idempotency key, expiry, canonicalization, absent
payload, or parse failure fails closed.

The immediate successor is expressly limited to authenticated command parsing,
EIP-712 serialization and verification, signer recovery, injected
signer/principal/role mapping, nonce/expiry validation, M26 payload-hash
verification, replay-identity derivation, and a normalized command DTO.
It must not create `PREPARED`, a durable attempt, an ATS intent or SDK call,
asset/configuration state, funding intent, provider invocation, wallet
transaction, Hedera transaction, or other external behavior.

For every `ATS_*` kind, `expectedTarget`, `canonicalParametersHash`, and
operation-to-target authority remain deliberately unresolved. A later separate
authority card must define their server-side source and independent equality
checks; neither a browser nor signer may self-authorize them.

## Human declaration

The decision owner approves every concrete rule in this record, rejects all
implicit defaults, and authorizes the root to create and execute the minimum
dependency-correct local successor cards without another general approval.
This declaration does not authorize credentials, keys, signing, wallets,
accounts, funding, transactions, deployments, or mainnet behavior.
