# UI-S15 wallet island and command relay manifest

## Delivery boundary

No accepted surface can reach a wallet. UI-S15 adds the browser half of the
approved
[campaign deploy flow](../superpowers/specs/2026-09-08-campaign-deploy-flow-design.md):
one hand-rolled MetaMask island, one EIP-712 command builder, one closed
signature dialog, and one server relay route carrying an already-signed command
to the backend ingress.

The island is the only place provider selection and the chain gate happen. It
implements the browser rule recorded in the
[HA-COMMAND-AUTHORITY-001 decision](../work-queue/evidence/HA-COMMAND-AUTHORITY-001-decision.md)
and produces the transport body the accepted server normalizer decodes. It
renders no offering, attempt, or directory state; composing it into a wizard or
a status route belongs to the cards that own those routes.

## Local targets

The slice may add, under `apps/web/src/lib/wallet/`, `metamask-provider.ts`
(EIP-6963 discovery and selection), `tool402-command.ts` (nonce, timestamps,
typed data, digest), `wallet-state.ts` (the closed connection outcome), and
`command-relay.ts` (the closed relay outcome); under
`apps/web/src/components/wallet/`, `wallet-connect.tsx` and
`signature-dialog.tsx`; the route handler
`apps/web/src/app/api/commands/route.ts`; and four focused tests.

It adds exactly one dependency, `viem` at 2.56.1, the version the backend
workspace already pins, used only for `keccak256` and byte encoding. That pin
amends `apps/web/package.json`, the root `package-lock.json`, and the dependency
assertion in `apps/web/tests/static-shell.test.mjs`, each under a root
integration reservation. No wallet connector library, wagmi, RainbowKit,
WalletConnect or Coinbase connector, toast library, icon package, or theme
library is added. Presentation reuses the accepted tokens and the accepted
`button`, `card`, and `badge` primitives, and adds no token or stylesheet
change.

## Required island behavior

Discovery runs when the connect control is activated, never at module load and
never on render: no `eip6963:announceProvider` listener exists until a click
requests one. Exactly one announced candidate with `info.rdns` equal to
`io.metamask` and `provider.isMetaMask` true is accepted. With no announced
matching candidate, legacy `window.ethereum` is accepted only when
`isMetaMask` is true. An unrelated or spoofed EIP-6963 announcement does not
block that legacy fallback. Zero matching candidates and several matching
candidates each fail closed with a retry control and no alternate wallet.

After `eth_requestAccounts`, `eth_chainId` must report `0x128`. Any other value
is a refusal that may offer one user-initiated `wallet_switchEthereumChain`
request, falling back to `wallet_addEthereumChain` for chain `0x128`. A
resolved switch request is not evidence: `eth_chainId` is read again and the
gate re-decides.

The connection outcome is a closed union of exactly seven kinds:

```text
disconnected | connecting | no_provider | multiple_providers
wrong_chain | not_issuer | connected
```

`not_issuer` is a local advisory comparison of the connected address against
the public approved issuer address for the subject, which the composing route
supplies as a prop. With no such prop the island never reaches `not_issuer`. It
is not an authority decision, and its absence never implies authorization: the
server re-reads the durable authority record and may still refuse.

## Required command and dialog behavior

The builder emits an EIP-712 request for the fixed domain
`{ name: "Tool402", version: "1", chainId: 296 }` and primary type
`Tool402Command` whose message fields are, in this exact order,
`version:uint8`, `type:string`, `signer:address`, `nonce:string`,
`issuedAt:string`, `expiresAt:string`, and `payloadHash:bytes32`. The nonce is
16 bytes from `crypto.getRandomValues` rendered as 22 unpadded base64url
characters whose final character is `A`, `Q`, `g`, or `w`. Timestamps are
`YYYY-MM-DDTHH:mm:ss.sssZ`, the lifetime is at most 300 seconds, and command
`expiresAt` is byte-for-byte identical to payload `expiresAt`. The signer
string is the lower-case `0x` and forty hexadecimal characters that is also
submitted; nothing is re-cased later. The transport `command` object carries
exactly nine own fields: the seven signed fields plus `chainId` integer `296`
and `signature`, the `0x` and 130 lower-case hexadecimal characters MetaMask
returns, submitted unaltered. The command type is one of the closed set
`external.prepare`, `offering.create`, `directory.publish`, and
`external.attachCandidate` that HA-COMMAND-AUTHORITY-002 admits; another type
is refused before provider, nonce, signature, or relay work. The signature must be a low-s recoverable secp256k1 signature
whose final byte is exactly `00`, `01`, `1b`, or `1c`; the browser preserves
that accepted lower-case wire form. The two-key `{ command, payload }` body admits no
extra, missing, or re-cased field, as HA-COMMAND-AUTHORITY-001 and the accepted
normalizer fix it.

The builder owns no payload schema and no canonicalizer. It independently reads
the detached payload's canonical `expiresAt` and requires it to equal the
command expiry byte for byte before signing. `payloadHash` is the
lower-case `0x` Keccak-256 of canonical UTF-8 payload bytes handed in by the
caller that owns that command type, so no second canonicalization can drift
from the accepted one. Signing uses `eth_signTypedData_v4` only.

The signer address and `eth_chainId` are read again immediately before each
signature request, not taken from stored connection state, and every signature
request generates a fresh nonce; no nonce is reused across attempts. No relay
call is made until a signature exists, so the rejected phase's statement that
nothing was recorded is true.

The dialog phase is a closed union of exactly seven kinds:

```text
idle | waiting | checking | rejected | failed | complete | unknown
```

Refusals named in the approved design, including an unauthorized issuer, an
expired command, and a replayed idempotency key, are messages carried by
`failed` or `complete`, not additional phases; no phase may be added later.

## Required relay behavior

`POST /api/commands` reads the request body once as bytes, computes its
SHA-256, and builds the accepted five-field ingress envelope (`keyId`,
`timestampUnixSeconds`, `requestNonce`, `bodySha256`, `signature`) whose
signing input fixes `POST` and `/internal/commands`, using
`TOOL402_INGRESS_KEY_ID` and `TOOL402_INGRESS_SECRET` for the MAC and
`TOOL402_CONVEX_SITE_URL` as the base of the `POST <site>/internal/commands`
forward, all read server-side only. The MAC signature field is 43 unpadded
base64url characters, not hexadecimal. The exact bytes that were hashed are the
bytes forwarded; the body is never parsed and re-serialized, because that would
break the digest. The forward is bounded by an explicit timeout and a maximum
response size and goes only to that fixed base URL; exceeding either bound is
`transport_failure`, and nothing is retried.

The relay outcome is a closed union: the backend outcomes `ACCEPTED`,
`REPLAYED`, `CONFLICT`, `REJECTED`, and `UNSUPPORTED_TYPE`, plus the relay's
own `not_configured`, `transport_failure`, and `unexpected_response`.
`UNSUPPORTED_TYPE` is transport-only, naming a command type with no enabled
dispatch entry; authority refusals arrive reason-free as `REJECTED`. With any
environment name absent the route answers `503` with `not_configured` and sends
nothing. No body, header, key, signature, or backend error text is logged,
echoed to the browser, or stored.

Neither the relay nor the dialog retries. A transport failure or an unexpected
response leaves the outcome unknown, because the command may already have been
admitted; recovery is a fresh operator-initiated signature with a new nonce,
never an automatic resend. Each forwarded request carries its own fresh ingress
`requestNonce`, distinct from the wallet command nonce.

## Truthfulness and authority boundary

A connected wallet is not an authority, a signature is not an accepted command,
and a relayed `ACCEPTED` is not an on-chain fact. The success tone may name
only the outcome the backend actually returned. No Hedera account id, balance,
or sample value is rendered: resolving those needs a Mirror Node read that this
slice does not own and that a later card must carry.

The slice sends no transaction, holds no key, seed, or secret in browser code,
creates no session, account, storage, or cookie, adds no analytics, reads no
environment value outside the route handler, and asserts no payment, receipt,
evidence, settlement, deployment, or live claim.

## Acceptance evidence

- Focused contracts cover the selection rule, the chain gate and its re-read,
  the closed unions, the exact domain, primary type, and field order, the nonce
  and timestamp grammars, the expiry equality, and the digest over
  caller-supplied bytes.
- A focused route contract covers the not-configured response with each
  environment name absent, the byte-exact hash-and-forward path, the closed
  outcome mapping, the absence of any automatic resend, and the absence of
  body, header, key, and signature disclosure.
- Web typecheck/test, production build with Cache Components, root quality,
  queue/reference checks, the enabled local guard, and independent review pass
  before acceptance.
