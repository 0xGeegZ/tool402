# S15-T010 remediation review

## Scope

This review records the post-RED hardening required at committed, pushed
`729c351505b523cecbad17f89126e5c4a4bc5d6f`.

The original activation record allowed only the durable RED contract. An
incoming source merge placed the S15 implementation and its dependency pin on
`main` before a local RED-acceptance record existed. That source is therefore
present but **not accepted** as S15 GREEN. This review neither relabels the
historical merge nor grants any live capability.

## Hardened contract

The focused test amendment is derived from the accepted local command-authority
decision and requires all of the following:

- legacy `window.ethereum` is selected when no matching MetaMask EIP-6963
  candidate exists, even when unrelated or spoofed announcements exist;
- only the literal `external.prepare` type is permitted, before any provider,
  nonce, signature, or relay work;
- a returned signature is lower-case, low-s, 65 bytes, and has recovery suffix
  `00`, `01`, `1b`, or `1c`, while a valid wire suffix is not rewritten; and
- the public command-request helper derives and checks the canonical payload
  expiry instead of trusting an independent caller value.

An independent review required the forbidden-type case to assert zero provider
calls. That correction is included in the committed contract.

## Observed RED

Under Node 22.21.1, this focused command intentionally has 32 passing checks
and 7 failures against the currently unaccepted source:

```text
node --test apps/web/tests/metamask-provider.test.mjs \
  apps/web/tests/tool402-command.test.mjs \
  apps/web/tests/commands-api.test.mjs
```

The failures are limited to the four rules above. The run uses local fakes only;
it does not connect a wallet, read configuration, forward a relay request, or
perform an external action.

## Remediation boundary

After this review is committed, only these existing S15 files may change to
satisfy the hardened contract:

- `apps/web/src/lib/wallet/metamask-provider.ts`;
- `apps/web/src/lib/wallet/tool402-command.ts`; and
- `apps/web/src/lib/wallet/command-relay.ts`.

The pre-existing command-relay fixture ends in recovery byte `ab`, which the
hardened contract correctly rejects. One matching fixture-only correction in
`apps/web/tests/commands-api.test.mjs` is also permitted: it may replace that
test-only dummy with a lower-case, 65-byte, low-s signature ending in an
accepted recovery byte. It must not broaden the test's behavior or add a new
source path.

No component, route, dependency, lockfile, queue, provider configuration,
wallet interaction, network request, transaction, deployment, or live claim is
authorized. The existing S15 source and dependency pin remain unaccepted until
the focused suite is GREEN and receives fresh independent task and module
review.
