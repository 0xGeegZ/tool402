# S47 — World human check on the dashboard

## Purpose

Add a World Selfie Check to the signed dashboard as a browser-scoped
proof-of-personhood signal for the account that is already signed in. MetaMask
proves control of a Hedera Testnet account; the World check proves that a live
human holds it. The two together are the identity story the dashboard tells.

The check is a liveness and same-person signal of medium assurance. It is not
legal identity, not KYC, not a uniqueness guarantee, and not an authority. The
copy on the card says "verified human" and never says "unique human" or
"identity verified". Nothing in this slice gates a command, a relay call, a
wallet action, a transaction, or a durable record.

## Configuration

The server reads five private environment values. Every one of them must match
its accepted form or the whole feature fails closed before any request is
built, and the card renders its unavailable state.

| Name | Accepted form | Notes |
|---|---|---|
| `WORLD_APP_ID` | `app_` followed by 32 lowercase hexadecimal-range characters (`/^app_[a-z0-9]{32}$/`) | Public. Returned to the browser inside the request payload. |
| `WORLD_RP_ID` | `rp_` followed by 16 lowercase hexadecimal-range characters (`/^rp_[a-z0-9]{16}$/`) | Public. Also the path segment of the World verification URL. |
| `WORLD_RP_SIGNING_KEY` | 64 hexadecimal characters, with or without a `0x` prefix (`/^(?:0x)?[0-9a-fA-F]{64}$/`) | Secret. Never returned to the browser, never logged, never committed. Normalised to the `0x` form before signing. |
| `WORLD_ACTION` | 1 to 64 characters from `a-z`, `0-9` and `-` (`/^[a-z0-9-]{1,64}$/`) | The Developer Portal app currently uses `issuer-publish`. |
| `WORLD_ENVIRONMENT` | Exactly `sandbox` or exactly `production` | Forwarded to IDKit as its environment. |

The signing key is accepted with or without the `0x` prefix because both
reference SDKs strip an optional prefix before parsing, and the Developer
Portal's display format for the key is not documented. Rejecting a bare key
would be indistinguishable from the key being absent.

## Request and verification contract

Both World routes are for the signed-in browser only. Each one reads the
dashboard session cookie first and returns `401 unauthorized` when there is no
valid session, or when the session address is not the address in the body. The
signing key must never become a public signature oracle, and a verification
must belong to the account that is signed in. Each body is then read through
the shared bounded JSON reader, so an oversized or malformed body returns
`400 invalid_request` before anything is parsed or forwarded.

`POST /api/world/request` accepts a JSON object carrying one canonical
lowercase EVM `address`. It returns the public IDKit request values only: the
app id, the action, the environment, and a five-minute RP context whose
signature is produced from the signing key. A malformed body or address
returns `400 invalid_request`; unusable configuration returns
`503 world_not_configured` without building anything.

`POST /api/world/verify` accepts the same canonical address plus the complete,
unmodified IDKit result. Before contacting World, the route requires the result
to be a World ID 3.0 payload with a non-empty `responses` array in which every
entry carries `identifier` equal to `selfie` and `signal_hash` equal to the
hash of that exact canonical address. A result that fails this binding returns
`403 world_verification_failed` and makes no outbound call, because a proof
bound to a different address proves nothing about this session.

A result that passes the binding is forwarded byte-for-byte to
`https://developer.world.org/api/v4/verify/{rp_id}` with a ten-second timeout.
Response identifiers are never remapped. A transport failure returns
`502 world_unavailable`. World's answer is read as text and accepted only when
it parses as a JSON object whose top-level `success` is exactly `true`; a 2xx
that does not say so is a failure like any other. The per-result `success`
flags are deliberately not required, because no captured Selfie Check success
body exists to confirm that they are present. A rejected answer is parsed as
JSON where possible; the route returns `403` with a body of
`{ "error": "world_verification_failed", "code": "<code>" }`, where the code is
World's first per-result code, its top-level code, or `unknown`. The upstream
detail text is never returned. Neither the proof nor the nullifier is stored,
logged, or echoed anywhere.

## Cookie contract

On World success only, the verify route sets one cookie named
`tool402-world-human`: `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`, and a
`Max-Age` of 2592000 seconds (30 days). Its value is a base64url payload and a
base64url HMAC-SHA256 tag joined by a dot. The payload is
`{ "v": 1, "address": <canonical address>, "verifiedAt": <epoch ms>,
"expiresAt": <epoch ms> }` and the MAC key is derived by hashing
`tool402-world-human-v1:<signing key>` with SHA-256.

A read succeeds only when the MAC verifies, the payload version is 1, the
address equals the address the caller asked about, and the expiry is in the
future. Any other case reads as unverified. The cookie therefore binds the
verification to one browser and one account, and it carries no proof material.
The tag is checked with the Web Crypto HMAC verify operation rather than a
string comparison, so a wrong tag costs the same time as a right one.

## UI contract

`DashboardIdentity` is a server component mounted once on `/dashboard`,
between the page header and the campaign card. It reads the dashboard session
with the same cookie helpers the campaign card uses, and renders nothing when
there is no session. The address it shows is shortened to its first six
characters, a horizontal ellipsis, and its last four.

The card carries the eyebrow "Your identity", the heading "Signed in as" plus
the shortened address, and the sentence "MetaMask proves control of the account
on Hedera Testnet. World proves a human holds it." Its first row states that
MetaMask is signed in on Hedera Testnet (0x128) with a session valid for eight
hours. Its second row is the World row, separated by a top border, in exactly
one of three states:

- **Unverified.** An outline "Not verified" badge, the sentence "Prove a human
  holds this account with a Selfie Check in the World App. It confirms a live
  person, not your identity, and it is not KYC.", and the client component that
  renders the "Verify with World" button, the IDKit widget, and a polite status
  line. This is the only state that mounts the client component.
- **Verified.** A success "Verified human" badge with an inline check mark, the
  sentence recording the date the Selfie Check passed, that it stays on this
  browser for 30 days, and the account it is bound to, plus the micro text
  "Not identity · not KYC". No button.
- **Unavailable.** An outline "Unavailable" badge and the sentence "World
  verification is not configured on this host. Nothing was requested." No
  button. This is the state on a host without a usable `WORLD_RP_SIGNING_KEY`.

The client component is the only client code in the slice. It carries
`"use client"`, asks the request route for the public values, opens the IDKit
widget with the `selfieCheckLegacy` preset whose signal is the session address,
enables legacy proofs, posts the untouched result to the verify route, and
calls `router.refresh()` on success so the server card recomputes its state.
It never stores the proof, the result, or any derived value. Every status line
it renders is fixed copy in the shared `Status` primitive.

## Failure handling

| Condition | Surface | Status copy |
|---|---|---|
| Nothing started | No status line | none |
| Button clicked | Working | Preparing the World request. |
| Widget open, awaiting the phone | Working | Waiting for the World App. Scan the code, then take the selfie check on your phone. |
| Verify route returned success | Success | Verified. Refreshing your identity card. |
| Widget closed with no result | Warning | Verification did not complete. Try again when you are ready. |
| Verify route returned 403 | Error | World could not verify this selfie check. Nothing was stored. |
| Any other verify route answer, including 401, 502 and 503 | Error | World verification is not available on this host. |
| Request route answered anything but success | Error | World verification is not available on this host. |
| IDKit error `credential_unavailable` or `feature_unavailable` | Error | Selfie Check is not enabled for this World app yet. |
| Any other IDKit error | Error | World returned the error code, and nothing was stored. |

Only the 403 row claims that World judged the check. A 502 means World was
never reached and a 401 means the browser is no longer signed in, so neither
may borrow World's verdict.

The last two rows exist because the only runtime signal that Selfie Check is
not enabled for an app is an IDKit error code. Discarding that code would make
a disabled feature flag indistinguishable from a user who changed their mind.

## Verification and authority boundary

Contract tests cover configuration fail-closed behaviour across each of the
five names, canonical address validation, the signal binding, the cookie
round trip including expiry, wrong-address and tampering cases, the verify
route's forwarding and cookie emission, the shape of its 403 body, the
`401 unauthorized` answers for an absent, forged or foreign-address session,
the bounded body limit, the refusal of a 2xx that does not report success, and
source
scans of the client component, the server card, and the dashboard page. No test
asserts that a live World verification succeeds.

A World Sandbox end-to-end proof is recorded separately, against the recorded
human action, when the signing key and Selfie Check enablement are both in
place. It is not implied by source or unit tests, and this specification claims
no such proof.

This slice adds no command, relay, wallet, transaction, schema, Convex,
authority, allowlist, role, or payment behaviour. It unlocks nothing: every
route, control, and command available before the check remains exactly as
available after it. No proof, nullifier, or World identifier is stored anywhere,
in the browser or on the server.
