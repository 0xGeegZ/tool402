# M30 authenticated external-prepare command normalizer

## Delivery boundary

This contract adds the smallest backend-only authenticated-command boundary
after accepted M25 claimed bytes, accepted M26 detached-payload syntax, and
the accepted HA-COMMAND-AUTHORITY-001 decision. It consumes one exact M25
claimed-body capability, decodes only one strict local JSON transport shape,
parses one M26 payload, reconstructs the fixed EIP-712 command, verifies and
recovers one canonical EOA signature, checks injected signer authority and
time, and returns one frozen normalized DTO.

It is neither a browser wallet implementation nor a durable command/replay
claim. It creates no `PREPARED` state, generic attempt, ATS intent, provider
call, funding intent, transaction, deployment, or external action. Browser
provider selection is recorded authority for a later explicitly scoped client
card; this server-side normalizer never discovers, selects, or invokes a
wallet provider.

## Internal API

`packages/backend/src/ingress/authenticated-external-prepare-normalizer.ts`
remains internal and is not exported from `@tool402/backend`.

```ts
export type CommandAuthorityRole = "ISSUER" | "BACKER";

export interface CommandAuthorityRecord {
  readonly principalPublicId: string;
  readonly canonicalSignerAddress: string;
  readonly chainId: 296;
  readonly role: CommandAuthorityRole;
  readonly ownedSubjectPublicIds: readonly string[];
  readonly authorityVersion: string;
  readonly enabled: boolean;
}

export type ResolveCommandAuthorities = (
  chainId: 296,
  canonicalSignerAddress: string,
) =>
  | readonly CommandAuthorityRecord[]
  | Promise<readonly CommandAuthorityRecord[]>;

export interface NormalizedExternalPrepareCommand {
  readonly version: 1;
  readonly type: "external.prepare";
  readonly chainId: 296;
  readonly canonicalSignerAddress: string;
  readonly nonce: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly payloadHash: string;
  readonly replayIdentity: string;
  readonly principalPublicId: string;
  readonly role: CommandAuthorityRole;
  readonly authorityVersion: string;
  readonly payload: ExternalPreparePayload;
}

export async function normalizeClaimedExternalPrepareCommand(
  claimedBody: unknown,
  serverNow: string,
  resolveCommandAuthorities: ResolveCommandAuthorities,
): Promise<NormalizedExternalPrepareCommand | null>;
```

The `serverNow` input must itself match exactly
`YYYY-MM-DDTHH:mm:ss.sssZ` and round-trip unchanged through
`new Date(value).toISOString()`. The same grammar and round-trip rule applies
to command `issuedAt` and command `expiresAt`; M26 independently applies
it to payload `expiresAt`. This module never calls `Date.now`, reads a
clock, configuration, environment, database, or network. The resolver is an
injected read boundary; this card does not create a Convex schema, query,
mutation, cache, claim, or durable record.

## Strict claimed-body transport

The input must first pass `isClaimedProtectedBody` and be read only through
`readClaimedProtectedBody` from M25. An arbitrary `Uint8Array`, string,
decoded object, structural copy, proxy, or forged capability must return
`null` before a byte decode, resolver access, or signature operation.

The exact UTF-8 body is a JSON object with exactly two keys:

```json
{
  "command": {
    "version": 1,
    "type": "external.prepare",
    "chainId": 296,
    "signer": "0x...",
    "nonce": "...",
    "issuedAt": "...",
    "expiresAt": "...",
    "payloadHash": "0x...",
    "signature": "0x..."
  },
  "payload": {
    "operationKind": "...",
    "subjectPublicId": "...",
    "network": "hedera:testnet",
    "chainId": 296,
    "expectedTarget": "...",
    "canonicalParametersHash": "...",
    "idempotencyKey": "...",
    "expiresAt": "..."
  }
}
```

This two-field wrapper is a local transport representation only. Its key order
and whitespace carry no authority. `payload` is not added to the EIP-712
message; only its independently recomputed digest is signed.

The decoder accepts JSON objects, strings, decimal integer literals, and JSON
whitespace only as needed for that closed shape. It rejects arrays, booleans,
null, decimal/floating/exponent numbers, string escape sequences, control
characters, invalid UTF-8, duplicate keys at any object level, unknown,
missing, inherited, accessor-backed, custom-prototype, or extra fields. Every
accepted wire string is already ASCII and canonical under its downstream
rule; the decoder never normalizes a noncanonical wire value.

## Command and payload validation sequence

The normalizer must execute this fail-closed sequence:

```text
M25 exact claimed capability
→ private byte snapshot from M25
→ strict UTF-8 / duplicate-key-safe JSON decode
→ closed command and M26 payload parse
→ exact payload expiry equality
→ canonical RFC8785-JCS payload digest recomputation
→ fixed EIP-712 signature grammar and low-s validation
→ fixed-domain signature recovery and signer equality
→ injected authority resolution and authorization predicate
→ nonce/clock-window validation
→ frozen normalized DTO
```

No resolver call can occur before the recovered signer equals the submitted
canonical signer. No normalized DTO is issued until every prior step succeeds.

### Closed command fields

`command` has exactly these own fields: `version`, `type`, `chainId`,
`signer`, `nonce`, `issuedAt`, `expiresAt`, `payloadHash`, and `signature`.
It accepts only integer `1`, literal `external.prepare`, integer `296`, a
lower-case `0x` plus 40 hexadecimal signer, and a canonical 22-character
16-byte base64url nonce whose first 21 characters use `[A-Za-z0-9_-]` and
whose final character is exactly one of `A`, `Q`, `g`, or `w`. It also accepts
only real canonical UTC-millisecond command timestamps using the exact grammar
and round-trip rule above, a lower-case `0x` plus 64 hexadecimal payload
hash, and a lower-case `0x` plus 130 hexadecimal signature.

The signature must contain nonzero secp256k1 `r` and low, nonzero `s` in the
curve order. Its only accepted recovery suffixes are `00`, `01`, `1b`, and
`1c`; normalize `00` to `1b` and `01` to `1c` privately before verification.
All other forms fail closed. The raw signature is neither retained in the DTO
nor persisted by this module.

### Payload hash and EIP-712 verification

The decoded `payload` passes through `parseExternalPreparePayload`. Its
`expiresAt` must exactly equal the parsed command `expiresAt` before any
signature-authorized DTO is issued.

For this frozen M26 shape, RFC8785 JCS bytes are exactly the UTF-8 bytes of:

```text
{"canonicalParametersHash":"<value>","chainId":296,"expectedTarget":"<value>","expiresAt":"<value>","idempotencyKey":"<value>","network":"hedera:testnet","operationKind":"<value>","subjectPublicId":"<value>"}
```

The eight accepted M26 values contain only JSON-safe ASCII characters, so this
fixed lexicographic property order is the exact JCS representation and no
general-purpose serializer is trusted. Its Keccak-256 digest must equal the
command `payloadHash` byte-for-byte.

The fixed EIP-712 domain is `{ name: "Tool402", version: "1", chainId: 296
}`. The `Tool402Command` field order is `version:uint8`, `type:string`,
`signer:address`, `nonce:string`, `issuedAt:string`, `expiresAt:string`, and
`payloadHash:bytes32`. Use only a direct exact `viem` `2.56.1` dependency to
recover the EOA. The recovered lower-case address must equal the wire signer.

### Authority, time, and output

The resolver may return only one enabled valid record for the recovered
signer/chain pair. It must return `null` through this module for zero,
multiple, malformed, disabled, conflicting, or mismatched records. For every
`ATS_*` payload kind, the record must have role `ISSUER` and own the payload's
`subjectPublicId`; `HEDERA_FUNDING` requires role `BACKER`. This is identity
and subject authorization only; it never authorizes a target, parameters,
provider, or ATS action.

`expiresAt` must be after `issuedAt`, differ by at most 300 seconds,
`issuedAt` must be no more than 60 seconds after `serverNow`, and `serverNow`
must be no later than `expiresAt`. The returned replay identity is exactly:

```text
tool402:wallet-command:v1:296:<canonicalSignerAddress>:<nonce>
```

The DTO snapshots only the normalized command data, authority fields, and
frozen M26 payload. It excludes the raw body, raw signature, provider,
recovery byte, resolver record, target authorization, and every durable or
external capability.

## Explicit exclusions

Do not add browser UI, wagmi, EIP-6963 discovery, `window.ethereum`, wallet
calls, account setup, environment/configuration reads, Convex schema/query/
mutation/action, cache, replay claim, idempotency claim, durable attempt,
`PREPARED`, ATS/provider SDK, funding, payment, transaction, deployment,
settlement, clearing, HCS, payout, or live evidence. Do not reopen M04
RiskScan persistence or reconciliation.

## Acceptance evidence

- A test-only RED commit precedes all package, lockfile, source, or export
  changes and observes the absent internal normalizer.
- Focused tests prove M25-only byte access, strict root/command/payload shape,
  duplicate-key rejection, invalid UTF-8 and escapes, M26 reuse, exact JCS
  digest, fixed typed-data fields/domain, low-s and recovery normalization,
  signer mismatch, resolver ordering, authority role/ownership predicates,
  expiry equality/window, deterministic replay identity, frozen DTO shape,
  and every prohibited side effect.
- Backend/root typecheck, test, lint, clean-install dry run,
  queue/reference/whitespace checks, enabled local guard, independent task
  review, and two fresh clean module-review generations pass before
  acceptance.
