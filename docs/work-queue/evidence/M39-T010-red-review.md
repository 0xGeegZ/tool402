# M39-T010 RED review

## Scope

Fresh independent read-only review at the durable M39 RED baseline of:

- the active [M39 control card](../queue/60-done/M39-T010-wallet-command-normalizer.md);
- the [M39 wallet-command normalizer specification](../../specs/m39-wallet-command-normalizer.md);
- the test-only M39 normalizer contract; and
- the accepted M30 normalizer and its focused contract.

## Observed RED

Under Node 22.21.1, the M39 focused command has one static-boundary pass, one
intentional failure solely because the declared source module is absent, and ten
source-dependent skips. The unchanged M30 focused command passes 10/10.

## Established contract

- M25 is the sole claimed-body capability before decode, and the future module
  has no external, provider, environment, storage, network, or durable
  capability.
- The static boundary rejects dynamic code construction, aliases, computed
  property access, constructor extraction, unsafe intrinsic reflection, and
  shadowed descriptor-field routes. It retains only the narrow descriptor-safe
  plain-record inspection required to reject custom-prototype and accessor
  authority records without invoking getters.
- The contract preserves M30 byte-for-byte for `external.prepare`, dispatches
  exactly one M38 payload parser for each admitted type, binds exact payload
  expiry and digest, validates every authority row, freezes only closed DTOs,
  and covers the inherited signed command clock edges.

## Verdict

CLEAR — the durable RED contract is accepted. It authorizes only
`packages/backend/src/ingress/authenticated-wallet-command-normalizer.ts` for
the minimal local GREEN cycle. It authorizes no caller rewrite, Convex schema,
route, wallet, provider, durable admission, ATS action, funding, payment,
transaction, deployment, publication, or live behavior.
