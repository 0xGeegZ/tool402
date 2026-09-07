# M22 closed ingress envelope and replay-identity contract

## Delivery boundary

This contract adds the smallest pure Core boundary needed before a later
server-only ingress verifier can safely consume a claimed internal request.
It accepts one untrusted, closed envelope record, detaches and freezes its
bounded fields, derives the fixed canonical signing input, and creates a
non-authoritative replay identity.

It does not authenticate a request. In particular, it does not hash raw body
bytes, select a key, verify a signature, compare signatures, read a clock,
apply a skew window, claim a nonce, parse a command, persist an attempt, or
invoke a backend mutation. The fixed method/path pair below is protocol
vocabulary only; it does not assert that an HTTP route exists.

## Public API

`packages/core/src/ingress-envelope.ts` exports this public surface through
`@tool402/core`:

```ts
export interface IngressEnvelope {
  readonly keyId: string;
  readonly timestampUnixSeconds: bigint;
  readonly requestNonce: string;
  readonly bodySha256: string;
  readonly signature: string;
  readonly method: "POST";
  readonly path: "/internal/commands";
  readonly signingInput: string;
  readonly replayIdentity: string;
}

export function parseIngressEnvelope(input: unknown): IngressEnvelope;
```

The input is an untrusted normalized representation of five transport fields;
the parser does not accept a caller-defined method or path. It requires one
ordinary `Object.prototype` record with exactly these own enumerable data
fields and no others:

```text
keyId
timestampUnixSeconds
requestNonce
bodySha256
signature
```

Each input value is a primitive string. `keyId` is an ASCII identifier of
1–64 characters using only letters, digits, `_`, and `-`.
`timestampUnixSeconds` is a canonical nonnegative decimal integer with no
leading zero except `"0"`, and is no greater than signed 64-bit maximum.
`requestNonce` is exactly 22 canonical unpadded base64url characters encoding
16 bytes: its first 21 characters use `[A-Za-z0-9_-]` and its final character
is one of `A`, `Q`, `g`, or `w`. `bodySha256` is exactly 64 lower-case
hexadecimal characters. `signature` is exactly 43 canonical unpadded
base64url characters encoding 32 bytes: its first 42 characters use
`[A-Za-z0-9_-]` and its final character is one of `A`, `E`, `I`, `M`, `Q`,
`U`, `Y`, `c`, `g`, `k`, `o`, `s`, `w`, `0`, `4`, or `8`. It is the lexical
form of a SHA-256 MAC. Lexical acceptance of either digest or signature is
never cryptographic verification.

## Canonical detached output

The parser captures descriptor values without normal caller-property reads and
returns a frozen ordinary object with exactly the documented fields. It derives
the following fixed signing input from the captured values:

```text
POST
/internal/commands
<timestampUnixSeconds>
<requestNonce>
<bodySha256>
```

The newlines are literal `\n` separators and there is no trailing newline.
The replay identity is exactly `<keyId>:<requestNonce>`. The lexical rules
exclude `:` from both components and require the nonce's canonical base64url
tail, so this representation is injective for the accepted values and does not
admit alternate text encodings of one 16-byte nonce. It is correlation data
only: it neither determines that a request is fresh nor records that a nonce
has been claimed.

Accessor-backed, inherited, missing, extra, nonenumerable, symbol-keyed,
custom-prototype, malformed, and reflection-throwing input must fail closed
without invoking a caller accessor. Portable reflection cannot prove that a
valid record was never a transparent proxy; the result is therefore detached
and never retains the caller record.

## Downstream boundary

A later server-only verifier must separately establish all of the following
before an envelope can be described as authenticated:

- compare `bodySha256` against the exact received raw body;
- choose an approved server-side key from `keyId` without exposing it;
- calculate and constant-time compare the claimed signature over
  `signingInput`;
- compare the timestamp against an explicit bounded-skew policy; and
- durably claim `replayIdentity` before any command is parsed or state can
  change.

That future work also owns key transport/rotation, HTTP handling, replay
storage, command unions, generic external attempts, and all side effects.
This parser does not make any of those capabilities, an ATS boundary, a
holder-distribution lifecycle, or a live financial flow eligible.

## Explicit exclusions

This module has no secret, HMAC implementation, key lookup, raw body,
environment/configuration read, clock, storage, network, route handler,
Convex function, command, account, wallet, signer, asset, payment, funding,
allocation, transfer, transaction, settlement, receipt, clearing, HCS,
payout, deployment, or live claim. It creates no authenticated state and no
proof of replay prevention.

## Acceptance evidence

- A test-only RED commit precedes every production source or barrel-export
  commit for this card and observes the absent public parser/types.
- Focused tests prove the exact frozen detached output, canonical signing
  input, collision-safe replay identity, full closed-shape policy, lexical
  limits, invalid numeric forms, and hostile descriptor/reflection behavior
  without invoking caller getters.
- A compile-time fixture proves the public parsed timestamp is `bigint`, the
  fixed method/path literals remain exact, and the envelope is readonly.
- Core/root typecheck, test, lint, clean-install dry run, queue/reference/
  whitespace checks, enabled local guard, independent task review, and two
  fresh clean module-review generations pass before acceptance.
