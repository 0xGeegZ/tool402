# M23 protected ingress verifier contract

## Delivery boundary

This contract adds the smallest server-side cryptographic verification boundary
after the accepted M22 closed ingress envelope. It accepts exact raw request
bytes and an untrusted five-field envelope, verifies their binding with one
injected HMAC verification key, applies the fixed bounded timestamp rule, and
returns only a short-lived in-process capability for the next replay-claim
adapter.

It is not an HTTP handler, a configuration loader, a durable replay guard, a
command parser, or an external-attempt workflow. It reads no environment,
secret store, clock, network, database, or filesystem. It does not make a
payment, ATS, funding, allocation, clearing, HCS, payout, deployment, or live
flow eligible.

## Internal API

`packages/backend/src/ingress/protected-ingress-verifier.ts` exposes an
internal-only module surface; it is not re-exported from `@tool402/backend`.

```ts
export interface VerifiedProtectedIngress {
  readonly keyId: string;
  readonly requestNonce: string;
  readonly replayIdentity: string;
  readonly verifiedAtUnixSeconds: bigint;
}

export type ResolveProtectedIngressKey =
  (keyId: string) => CryptoKey | undefined;

export async function verifyProtectedIngress(
  envelope: unknown,
  rawBody: Uint8Array,
  nowUnixSeconds: bigint,
  resolveKey: ResolveProtectedIngressKey,
): Promise<VerifiedProtectedIngress | null>;

export function isVerifiedProtectedIngress(
  value: unknown,
): value is VerifiedProtectedIngress;
```

`resolveKey` is an injected server-side dependency. A usable value is a
non-extractable secret `CryptoKey` for HMAC SHA-256 with `verify` usage. This
module never reads an environment variable or turns a configured credential
into a key. A public fixed test vector is not a runtime credential.

The successful result is a detached, frozen ordinary object with exactly
`keyId`, `requestNonce`, `replayIdentity`, and `verifiedAtUnixSeconds`. It is
registered in a module-private `WeakSet`; a structural copy or cast is not a
verified result. The membership check is an internal same-process integrity
guard, not a durable or cross-process authority.

`nowUnixSeconds` is a runtime input even though its TypeScript parameter is a
`bigint`: it must be a nonnegative `bigint` at runtime. On success,
`verifiedAtUnixSeconds` is exactly that accepted `nowUnixSeconds` value; it is
not a wall-clock read, parsed timestamp, or derived value.

## Verification sequence

The function must fail closed, return no reason to an untrusted caller, and
perform this exact order:

```text
raw bytes
→ closed-envelope parse
→ SHA-256 raw-body comparison
→ injected key resolution
→ native HMAC-SHA-256 verification
→ inclusive ±60-second timestamp check
→ verified in-process capability
```

The envelope is parsed through the accepted
[M22 ingress-envelope contract](m22-ingress-envelope.md). The exact M22
canonical signing input is therefore preserved: `POST`,
`/internal/commands`, canonical Unix seconds, request nonce, and lower-case
raw-body SHA-256, separated by literal line feeds and without a trailing line
feed.

The raw body is copied before asynchronous cryptography. Its SHA-256 digest is
compared against the canonical envelope digest before key resolution. The
claimed canonical base64url signature is decoded to exactly 32 bytes. Native
Web Crypto HMAC verification performs the MAC comparison without a
JavaScript-level early-exit comparison. `abs(nowUnixSeconds -
timestampUnixSeconds) <= 60n` is accepted; `61n` or more in either direction
is rejected only after a valid MAC verification. The bounded-skew step rejects
a non-`bigint` or negative `nowUnixSeconds` before calculating the difference.

Malformed envelopes, invalid bytes, unknown or unusable keys, digest mismatch,
signature mismatch, cryptographic failure, and invalid clock input all return
`null`. No `JSON.parse` or command field read may happen in this module.

## Boundaries and exclusions

M22 supplies the closed lexical envelope and correlation-only replay identity;
this card supplies cryptographic authentication only. It does not claim a nonce
or idempotency key. A later internal adapter must use the verified capability
to atomically claim replay data before parsing any command or changing state.

The verifier must not expose or retain a key, signature, signing input, body
digest, or raw body in its result. It must not add a Convex function, mutation,
action, HTTP route, public package export, configuration source, generic
persistence table, cleanup policy, command union, external attempt, or any
financial side effect.

The accepted bounded human x402 evidence is independent context only. It does
not supply a key, configuration value, external authority, or a license to
perform additional live operations.

## Acceptance evidence

- A test-only RED commit precedes the implementation commit and observes the
  absent internal verifier.
- A fixed public vector proves the exact body digest, canonical signing tuple,
  native HMAC verification, and frozen minimal capability.
- Tests reject body mismatch before resolver use, unknown/unusable key,
  wrong or malformed signature, invalid envelope, invalid clock, and all
  timestamps outside the inclusive ±60-second boundary. A cloned or forged
  value must fail internal verified-capability membership. The valid capability
  must retain exactly the accepted `nowUnixSeconds` value.
- Backend/root typecheck, test, lint, clean-install dry run,
  queue/reference/whitespace checks, the enabled local guard, independent task
  review, and two fresh clean module-review generations pass before acceptance.
